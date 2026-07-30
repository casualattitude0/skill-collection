#!/usr/bin/env node
// verdict.mjs — production-readiness gate for Claude Code skills.
//
// Four lenses, one per production failure mode:
//   trigger    — is the description unambiguous enough to fire correctly?
//   budget     — does the skill fit in a context window?
//   execution  — can the agent actually follow it (files resolve, order is specified)?
//   regression — does it collide with a skill that already ships?
//
// Zero dependencies. Node >= 18.
//
//   verdict.mjs audit <skill-dir>
//   verdict.mjs audit <root> --corpus
//   verdict.mjs collide <root>
//   verdict.mjs init <skill-dir>
//   verdict.mjs grade <skill-dir> <results.json>
//
// Flags: --json  --quiet  --fail-on=fail|warn  --limit=N

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, realpathSync } from 'node:fs'
import { join, relative, resolve, dirname, basename, extname } from 'node:path'

// ---------------------------------------------------------------- thresholds

const T = {
  descMin: 40,             // model-invoked description shorter than this under-specifies the trigger
  descMax: 1024,           // hard platform limit
  descIdealMax: 500,       // past this the description itself starts costing context every turn
  userInvokedDescMax: 220, // user-invoked descriptions are human-facing; trigger prose is wasted
  skillTokensWarn: 2500,
  skillTokensFail: 5000,
  bundleTokensWarn: 25000,
  fenceLinesInline: 100,   // a fence longer than this belongs in a bundled file
  // Calibrated against a 97-skill corpus: >=0.45 was always a genuine pair
  // (github-pr-merge/github-pr-workflow, differing only in whether review runs);
  // 0.25-0.45 caught real families (resume-*, playwright-*); below ~0.20 was noise.
  collideFail: 0.45,
  collideWarn: 0.25,
  goldenMin: 5,
  triggerMin: 3,           // incl. at least one negative
  redteamMin: 2,
}

const NOISE_FILES = new Set([
  'LICENSE', 'LICENSE.md', 'README.md', 'CHANGELOG.md', 'VERSION',
  'package.json', 'package-lock.json', '.gitignore', '.DS_Store', 'AGENTS.md', 'CLAUDE.md',
])

const VAGUE = [
  'helpful utilities', 'various tasks', 'and more', 'general purpose', 'general-purpose',
  'as needed', 'etc.', 'a variety of', 'all kinds of', 'anything related',
]

const TRIGGER_CUES = [
  'use when', 'use this skill when', 'use this whenever', 'use whenever', 'triggers on',
  'trigger:', 'when the user', 'invoke when', 'apply when', 'reach for this when',
  'use for', 'use this for', 'use it when', 'use on', 'reach for it when', 'fires when',
]

const NEGATIVE_CUES = [
  'not for', 'do not use', "don't use", 'do NOT use', 'never use for', 'skip when',
  'not when', 'rather than', 'instead of this skill', 'nor for', 'not intended',
]

/**
 * A sentence opening with "Not …" / "Nor …" is scope-limiting regardless of what
 * follows ("Not review-gated:", "Nor for merging unreviewed"). Matching only a
 * fixed cue list made the check demand particular phrasing rather than the
 * property it is supposed to measure — it missed real negative scope on
 * github-pr-merge. Anchored to a sentence start so mid-sentence "not" is ignored.
 */
const NEGATIVE_RE = /(^|[.!?;—]\s+)(not|nor)\b/i

// ------------------------------------------------------------------ plumbing

const CJK = /[　-鿿豈-﫿＀-￯]/g

/** Rough token estimate. English ~4 chars/token; CJK ~0.75 tokens/char. */
function estimateTokens(text) {
  const cjk = (text.match(CJK) || []).length
  const rest = text.length - cjk
  return Math.round(cjk * 0.75 + rest / 4)
}

/**
 * Minimal YAML frontmatter reader. Handles flat `key: value`, quoted values,
 * booleans, `>-`/`|` block scalars, and one level of nesting (recorded but
 * flattened). Deliberately not a YAML parser — skill frontmatter is flat.
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { data: null, body: text, raw: '' }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: null, body: text, raw: '' }
  const raw = text.slice(text.indexOf('\n') + 1, end)
  const body = text.slice(text.indexOf('\n', end + 1) + 1)
  const data = {}
  const lines = raw.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (/^\s/.test(line)) continue // nested key, owned by its parent
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!m) continue
    const [, key] = m
    let val = m[2]
    if (val === '>-' || val === '>' || val === '|' || val === '|-') {
      const parts = []
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) parts.push(lines[++i].trim())
      val = parts.join(val.startsWith('|') ? '\n' : ' ')
    }
    val = val.replace(/^["'](.*)["']$/s, '$1').trim()
    if (val === 'true') val = true
    else if (val === 'false') val = false
    data[key] = val
  }
  return { data, body, raw }
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'graphify-out', 'worktrees', 'dist', 'build', '.venv', '__pycache__'])
/** Eval scratch dirs hold throwaway copies of skills; they are not shipping surface. */
const SKIP_RE = /(^|\/)([\w-]+-workspace|\.claude\/worktrees)(\/|$)/

/**
 * Symlinks are followed on purpose. An installed skill corpus (`~/.claude/skills/`)
 * is entirely symlinks into the repos that own each skill, and `isDirectory()` is
 * false for those — without this, auditing the corpus that actually competes in
 * the router finds almost nothing. `seen` guards against symlink cycles.
 */
function walk(dir, out = [], depth = 0, seen = new Set()) {
  if (depth > 12) return out
  let real
  try { real = realpathSync(dir) } catch { return out }
  if (seen.has(real)) return out
  seen.add(real)

  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue
    const p = join(dir, e.name)
    let isDir = e.isDirectory(), isFile = e.isFile()
    if (e.isSymbolicLink()) {
      try { const st = statSync(p); isDir = st.isDirectory(); isFile = st.isFile() } catch { continue }
    }
    if (isDir) {
      if (SKIP_RE.test(p)) continue
      walk(p, out, depth + 1, seen)
    } else if (isFile) out.push(p)
  }
  return out
}

/**
 * Skill directories under `root`.
 *
 * A skill nested inside another skill's directory is a *bundled* copy — it ships
 * as payload of its parent pack and is only reachable when that pack is active.
 * Comparing bundled copies against their originals produces one collision per
 * vendored file and drowns the real signal, so they are excluded unless asked for.
 */
function findSkills(root, includeNested = false) {
  const dirs = walk(root).filter((p) => basename(p) === 'SKILL.md').map(dirname).sort()
  if (includeNested) return { dirs, nestedSkipped: 0 }
  const top = dirs.filter((d) => !dirs.some((o) => o !== d && d.startsWith(o + '/')))
  return { dirs: top, nestedSkipped: dirs.length - top.length }
}

// -------------------------------------------------------------------- corpus

function loadSkill(dir) {
  const skillPath = join(dir, 'SKILL.md')
  const text = readFileSync(skillPath, 'utf8')
  const { data, body } = parseFrontmatter(text)
  const files = walk(dir).filter((p) => p !== skillPath)
  return {
    dir,
    name: data?.name ?? null,
    description: typeof data?.description === 'string' ? data.description : null,
    fm: data ?? {},
    text,
    body,
    files,
    userInvoked: data?.['disable-model-invocation'] === true,
  }
}

// ------------------------------------------------------------------ findings

const F = (lens, level, id, msg, hint) => ({ lens, level, id, msg, hint })

// --- Lens 1: trigger -------------------------------------------------------

function lensTrigger(s) {
  const out = []
  const d = s.description
  const dirName = basename(s.dir)

  if (!s.fm || Object.keys(s.fm).length === 0)
    return [F('trigger', 'fail', 'TR01', 'No YAML frontmatter — the skill can never be indexed.', 'Add `---\\nname: ...\\ndescription: ...\\n---` at the top of SKILL.md.')]

  if (!s.name) out.push(F('trigger', 'fail', 'TR02', 'Frontmatter has no `name`.', 'Add `name: ' + dirName + '`.'))
  else if (s.name !== dirName)
    out.push(F('trigger', 'warn', 'TR03', `\`name: ${s.name}\` does not match directory \`${dirName}\`.`, 'The harness indexes by frontmatter name, so it still loads — but the two names diverging is how a skill gets edited in one place and invoked from another.'))

  if (s.name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.name))
    out.push(F('trigger', 'fail', 'TR04', `\`name: ${s.name}\` is not kebab-case.`, 'Lowercase, digits, single dashes.'))

  if (!d) {
    out.push(F('trigger', 'fail', 'TR05', 'Frontmatter has no `description`.', 'Without one the model can never autonomously fire this skill.'))
    return out
  }

  if (s.userInvoked) {
    // Human-facing description: long trigger prose here is dead weight.
    if (d.length > T.userInvokedDescMax)
      out.push(F('trigger', 'warn', 'TR06', `User-invoked skill has a ${d.length}-char description (>${T.userInvokedDescMax}).`, 'With `disable-model-invocation: true` nothing reads this but a human. Cut it to one line.'))
    if (TRIGGER_CUES.some((c) => d.toLowerCase().includes(c)))
      out.push(F('trigger', 'warn', 'TR07', 'User-invoked skill writes model-facing trigger prose ("Use when…").', 'Either drop `disable-model-invocation: true` or strip the trigger phrasing.'))
    return out
  }

  if (d.length < T.descMin)
    out.push(F('trigger', 'fail', 'TR08', `Description is ${d.length} chars (<${T.descMin}) — too thin to discriminate.`, 'State what it does AND when to reach for it.'))
  if (d.length > T.descMax)
    out.push(F('trigger', 'fail', 'TR09', `Description is ${d.length} chars (>${T.descMax} limit).`, 'Move the detail into SKILL.md; the description is an index entry, not a manual.'))
  else if (d.length > T.descIdealMax)
    out.push(F('trigger', 'warn', 'TR10', `Description is ${d.length} chars (>${T.descIdealMax}).`, 'It sits in the context window every single turn. Trim to the discriminating facts.'))

  const low = d.toLowerCase()
  if (!TRIGGER_CUES.some((c) => low.includes(c)))
    out.push(F('trigger', 'warn', 'TR11', 'No explicit trigger clause.', 'Add "Use when the user …" naming the phrases a user actually types.'))
  if (!NEGATIVE_CUES.some((c) => low.includes(c)) && !NEGATIVE_RE.test(d))
    out.push(F('trigger', 'warn', 'TR12', 'No negative scope.', 'Add "Not for …" — over-firing is as costly as under-firing.'))

  const hits = VAGUE.filter((v) => low.includes(v))
  if (hits.length)
    out.push(F('trigger', 'warn', 'TR13', `Vague filler in description: ${hits.map((h) => `"${h}"`).join(', ')}.`, 'These words match every prompt and discriminate none.'))

  if (!/[.!]/.test(d))
    out.push(F('trigger', 'info', 'TR14', 'Description is a fragment, not a sentence.', 'Full sentences read better in the skill index.'))

  return out
}

// --- Lens 2: token budget --------------------------------------------------

function lensBudget(s) {
  const out = []
  const skillTokens = estimateTokens(s.text)

  if (skillTokens > T.skillTokensFail)
    out.push(F('budget', 'fail', 'TB01', `SKILL.md is ~${skillTokens} tokens (>${T.skillTokensFail}).`, 'Split into `references/*.md` and link them; the agent loads them only when it needs them.'))
  else if (skillTokens > T.skillTokensWarn)
    out.push(F('budget', 'warn', 'TB02', `SKILL.md is ~${skillTokens} tokens (>${T.skillTokensWarn}).`, 'Progressive disclosure: keep the entry file a router, push detail into references/.'))

  const bundleTokens = s.files.reduce((n, p) => {
    if (!/\.(md|txt|json|ya?ml)$/i.test(p)) return n
    try { return n + estimateTokens(readFileSync(p, 'utf8')) } catch { return n }
  }, skillTokens)

  if (bundleTokens > T.bundleTokensWarn && s.files.length <= 1)
    out.push(F('budget', 'warn', 'TB03', `Bundle is ~${bundleTokens} tokens in ${s.files.length + 1} file(s).`, 'One big file means the agent pays for all of it or none of it.'))

  // A fence too long to live inline.
  const fences = [...s.text.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)]
  for (const f of fences) {
    const lines = f[1].split('\n').length
    if (lines > T.fenceLinesInline) {
      out.push(F('budget', 'warn', 'TB04', `A code fence spans ${lines} lines inline.`, 'Ship it as a file in the skill directory and reference the path instead.'))
      break
    }
  }

  const untagged = [...s.text.matchAll(/^```(\S*)/gm)].filter((_, i) => i % 2 === 0).filter((m) => !m[1]).length
  if (untagged)
    out.push(F('execution', 'info', 'EX07', `${untagged} code fence(s) have no language tag.`, 'Tag them (```bash) — some harnesses render a Run button only for tagged shell blocks.'))

  return { findings: out, skillTokens, bundleTokens }
}

// --- Lens 3: execution / trajectory ---------------------------------------

/**
 * Bundle references in SKILL.md, split into concrete and templated.
 *
 * A markdown link target is always a reference. A backticked or bare path only
 * counts when it contains a `/` — a bare `tokens.css` in prose is usually a file
 * the skill tells the agent to WRITE, not one it ships (verified against
 * design/unify, which says "write the materialized tokens into `tokens.css`").
 *
 * Templated refs (`adapters/<stack>.md`, `references/*.md`) can never be
 * resolved, so they are never "broken" — but they do mark their directory as
 * reached, which is what stops a whole adapters/ tree reading as dead weight.
 */
/**
 * "Write `evals/results.json`" names a file the skill PRODUCES, not one it ships.
 * Scoped to the current line on purpose: a lookback that crosses newlines matches
 * a distant section heading ("Scaffold, fill, run, grade:") and suppresses the
 * code fence three lines below it.
 */
const WRITE_CTX = /\b(write|writes|wrote|create|creates|generate|generates|produce|produces|save|saves|output|outputs|emit|emits|scaffold|scaffolds|record|records)\b[^.\n]{0,48}$/i

function extractRefs(text, bundleDirs, bundleFiles) {
  const linked = new Set()   // markdown link targets — unambiguously bundle refs
  const loose = new Set()    // backticked / bare paths — only count if rooted in the bundle
  const output = new Set()   // paths the skill tells the agent to write
  const note = (ref, idx) => {
    const line = text.slice(text.lastIndexOf('\n', idx) + 1, idx)
    if (WRITE_CTX.test(line)) output.add(ref)
    else loose.add(ref)
  }
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) linked.add(m[1])
  for (const m of text.matchAll(/`([A-Za-z0-9_.*<>{}/-]*\/[A-Za-z0-9_.*<>{}/-]+)`/g)) note(m[1], m.index)
  for (const m of text.matchAll(/(?:^|[\s(])((?:\.\/)?[A-Za-z0-9_-]+\/[A-Za-z0-9_.*<>{}/-]+\.[A-Za-z0-9]+)/gm)) note(m[1], m.index)
  for (const m of text.matchAll(/(?:^|[\s(*])([A-Za-z0-9_-]+\/\*)(?:\s|$)/gm)) note(m[1], m.index)
  for (const o of output) loose.delete(o)

  // Any path-like token anywhere in the text can vouch for a bundle file by
  // suffix — including installed absolute paths
  // (`~/.claude/skills/impeccable/scripts/context.mjs`), which is how a skill
  // shipping executables tells the agent to run them. None of the regexes above
  // match those: they sit inside a longer command string and start with `~`.
  // Suffix matches only mark reachability, so they can never invent a broken ref.
  const reachedBySuffix = []
  for (const m of text.matchAll(/[~\w./-]*\/[\w.-]+\.[A-Za-z0-9]+/g)) {
    const hit = bundleFiles.find((f) => m[0] === f || m[0].endsWith('/' + f))
    if (hit) reachedBySuffix.push(hit)
  }
  // Same for directory globs: `~/.claude/skills/<name>/scripts/*`.
  const globbedDirs = []
  for (const m of text.matchAll(/[~\w./-]*\/([\w.-]+)\/\*/g)) globbedDirs.push(m[1])

  const clean = (r) => r.split('#')[0].replace(/^\.\//, '').replace(/[.,:;)]+$/, '')
  const concrete = [], templated = [], suffixed = []

  for (const set of [linked, loose]) {
    for (let r of set) {
      if (/^(https?:|mailto:|#)/.test(r)) continue
      r = clean(r)
      if (!r) continue
      // A path written from the repo root ("productivity/skill-verdict/verdict.mjs")
      // still names a bundled file — it just doesn't resolve relative to the
      // skill dir. Count it as reaching that file, but never as broken.
      const hit = bundleFiles.find((f) => r.endsWith('/' + f))
      if (hit) { suffixed.push(hit); continue }
      // Otherwise a loose path is a bundle ref only when its first segment is a
      // real directory in the bundle. Without this, `docs/PROJECT_PHASE.md` (a
      // file the skill WRITES into the user's project) and
      // `design/typeui-fundamentals` (a sibling skill in the library) both read
      // as broken bundle refs.
      if (set === loose && !bundleDirs.has(r.split('/')[0])) continue
      if (/[<>{}*]/.test(r)) templated.push(r)
      else concrete.push(r)
    }
  }
  return {
    concrete: [...new Set(concrete)],
    templated: [...new Set(templated)],
    suffixed: [...new Set([...suffixed, ...reachedBySuffix])],
    globbedDirs: [...new Set(globbedDirs)],
  }
}

/** `skills/<name>/SKILL.md` → /^skills\/[^/]+\/SKILL\.md$/ */
function templateToRe(t) {
  const src = t
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/<[^>]*>/g, '[^/]+')
    .replace(/\\\{[^}]*\\\}/g, '[^/]+')
    .replace(/\*/g, '[^/]*')
  return new RegExp('^' + src + '$')
}

/** A bundled file is reached if any ref names it, globs it, or ends with it. */
function isReached(file, concrete, templated, suffixed = []) {
  if (suffixed.includes(file)) return true
  if (concrete.some((r) => r === file || r.endsWith('/' + file) || file.endsWith('/' + r))) return true
  if (templated.some((t) => templateToRe(t).test(file))) return true
  // A templated ref also vouches for the directory it lives in.
  const dir = dirname(file)
  return dir !== '.' && templated.some((t) => {
    const tdir = dirname(t).replace(/\/[^/]*[<>{}*][^/]*$/, '')
    return tdir && (tdir === dir || dir.startsWith(tdir + '/'))
  })
}

function lensExecution(s) {
  const out = []
  const bundled = s.files.map((p) => relative(s.dir, p))
  const bundleDirs = new Set(bundled.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))
  const { concrete, templated, suffixed, globbedDirs } = extractRefs(s.text, bundleDirs, bundled)

  // A subdirectory with its own SKILL.md is a nested skill: it owns its files
  // and gets audited in its own right, so the parent must not call them dead.
  const nested = bundled.filter((f) => basename(f) === 'SKILL.md').map(dirname)
  const ownedByNested = (f) => nested.some((n) => f !== n + '/SKILL.md' && f.startsWith(n + '/'))

  const broken = concrete.filter((r) => {
    if (r.startsWith('/') || r.startsWith('~')) return false // machine paths, not bundle refs
    if (r.startsWith('..')) return false                     // out-of-bundle, can't judge
    return !existsSync(join(s.dir, r))
  })
  // Say how many there are before listing a sample. Capping silently at 8 let a
  // skill with 47 dead references read as one with 8 — the reader takes the
  // listed count for the total and badly under-rates the breakage.
  if (broken.length > 8)
    out.push(F('execution', 'fail', 'EX01', `SKILL.md references ${broken.length} files that do not exist in the bundle — listing the first 8.`, 'At this scale the reference tree was probably lost in packaging, not written wrong.'))
  for (const b of broken.slice(0, 8))
    out.push(F('execution', 'fail', 'EX01', `SKILL.md references \`${b}\` — no such file in the bundle.`, 'A dead reference sends the agent down a path with no floor.'))

  const dead = bundled.filter((f) => {
    if (NOISE_FILES.has(basename(f))) return false
    // Eval payload is reached from evals.json, never from SKILL.md.
    if (f.startsWith('evals/') || f.startsWith('fixtures/')) return false
    if (ownedByNested(f)) return false
    if (globbedDirs.some((g) => f === g || f.startsWith(g + "/") || f.includes("/" + g + "/"))) return false
    return !isReached(f, concrete, templated, suffixed)
  })
  if (dead.length > 8)
    out.push(F('execution', 'warn', 'EX02', `${dead.length} bundled files are never referenced from SKILL.md — listing the first 8.`, 'Unreachable payload: either link them or delete them.'))
  for (const d of dead.slice(0, 8))
    out.push(F('execution', 'warn', 'EX02', `Bundled file \`${d}\` is never referenced from SKILL.md.`, 'Unreachable payload: either link it or delete it.'))

  const hasShell = /```(?:bash|sh|shell|zsh)/.test(s.text)
  if (hasShell && !s.fm['allowed-tools'])
    out.push(F('execution', 'info', 'EX03', 'SKILL.md issues shell commands but declares no `allowed-tools`.', 'Declaring it narrows the trajectory the agent is allowed to take.'))

  const hasOrder = /^\s*\d+[.)]\s/m.test(s.body) || /^#{2,4}\s+(step|phase|stage)\b/im.test(s.body)
  if (!hasOrder && s.text.length > 2000)
    out.push(F('execution', 'warn', 'EX04', 'No ordered procedure (numbered list or Step/Phase headings).', 'Without an explicit order the trajectory is unconstrained — the classic execution failure is right output, wrong tool sequence.'))

  const evalsPath = join(s.dir, 'evals', 'evals.json')
  if (!existsSync(evalsPath)) {
    out.push(F('execution', 'warn', 'EX05', 'No `evals/evals.json` — the skill has never been tested.', 'Run `verdict.mjs init <dir>` to scaffold one.'))
  } else {
    out.push(...lensEvals(evalsPath))
  }

  return out
}

function lensEvals(p) {
  const out = []
  let doc
  try { doc = JSON.parse(readFileSync(p, 'utf8')) } catch (e) {
    return [F('execution', 'fail', 'EX06', `evals/evals.json is not valid JSON: ${e.message}`, 'Fix the syntax; the grader cannot read it.')]
  }
  const cases = Array.isArray(doc.evals) ? doc.evals : []
  const kind = (c) => c.kind ?? 'golden'
  const golden = cases.filter((c) => kind(c) === 'golden')
  const trigger = cases.filter((c) => kind(c) === 'trigger')
  const redteam = cases.filter((c) => kind(c) === 'redteam')

  if (golden.length < T.goldenMin)
    out.push(F('execution', 'warn', 'EV01', `Golden dataset has ${golden.length} case(s) (<${T.goldenMin}).`, 'A handful of real, messy scenarios with reference answers — not one happy path.'))
  if (trigger.length < T.triggerMin)
    out.push(F('execution', 'warn', 'EV02', `${trigger.length} trigger case(s) (<${T.triggerMin}).`, 'Trigger cases prove the description fires when it should and stays quiet when it should not.'))
  else if (!trigger.some((c) => c.expect_trigger === false))
    out.push(F('execution', 'warn', 'EV03', 'No negative trigger case (`expect_trigger: false`).', 'Over-firing is only detectable with a case that must NOT fire.'))
  if (redteam.length < T.redteamMin)
    out.push(F('execution', 'warn', 'EV04', `${redteam.length} red-team case(s) (<${T.redteamMin}).`, 'Adversarial prompts: injection in the input data, contradictory instructions, hostile phrasing.'))

  // A scaffold that was never filled in grades SHIP on every case, because
  // `REPLACE:` prompts run and empty assertion sets always pass. Caught here so
  // "I ran init" can never be mistaken for "I wrote evals".
  const unfilled = cases.filter((c) => JSON.stringify(c).includes('REPLACE:')).length
  if (unfilled)
    out.push(F('execution', 'fail', 'EV07', `${unfilled} eval case(s) still contain \`REPLACE:\` scaffold markers.`, 'An unfilled template passes every case and measures nothing.'))

  for (const c of cases) {
    if (!c.prompt) out.push(F('execution', 'fail', 'EV05', `Eval case ${c.id ?? c.name ?? '?'} has no \`prompt\`.`, 'Every case needs the literal prompt to replay.'))
    const hasCheck = (c.assertions?.length ?? 0) > 0 || (c.forbid?.length ?? 0) > 0 || c.expect_trigger !== undefined
    if (!hasCheck) out.push(F('execution', 'warn', 'EV06', `Eval case ${c.id ?? c.name ?? '?'} asserts nothing.`, 'A case with no assertion always passes and measures nothing.'))
  }
  return out
}

// --- Lens 4: regression / collision ---------------------------------------

const STOP = new Set(('a an the and or of to for in on with when this that use uses using it its is are be do does ' +
  'user users you your skill skills should can will not but if as at by from into over per via any all').split(' '))

function shingles(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w) && w.length > 2)
  const uni = new Set(words)
  const bi = new Set()
  for (let i = 0; i < words.length - 1; i++) bi.add(words[i] + ' ' + words[i + 1])
  return { uni, bi }
}

/**
 * Overlap coefficient, not Jaccard. Jaccard divides by the union, so a long,
 * specific description scores low against a short, generic one no matter how
 * completely the short one's trigger space is swallowed — which is precisely
 * the collision that matters. Dividing by the smaller set measures containment:
 * "is everything this skill triggers on already claimed by that one?"
 */
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / Math.min(a.size, b.size)
}

/** Weighted toward bigrams: shared phrasing confuses the router more than shared vocabulary. */
function similarity(a, b) {
  const A = shingles(a), B = shingles(b)
  return 0.4 * overlap(A.uni, B.uni) + 0.6 * overlap(A.bi, B.bi)
}

function collide(skills) {
  const live = skills.filter((s) => s.description && !s.userInvoked)
  const pairs = []
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const sim = similarity(live[i].description, live[j].description)
      if (sim >= T.collideWarn) pairs.push({ a: live[i], b: live[j], sim })
    }
  }
  pairs.sort((x, y) => y.sim - x.sim)

  const dupes = new Map()
  for (const s of skills) {
    if (!s.name) continue
    if (!dupes.has(s.name)) dupes.set(s.name, [])
    dupes.get(s.name).push(s)
  }
  const dupNames = [...dupes.entries()].filter(([, v]) => v.length > 1)
  return { pairs, dupNames }
}

// -------------------------------------------------------------------- audit

/**
 * `regressionAssessed` is false when auditing one skill in isolation: collisions
 * need a corpus to compare against. Scoring an unassessed lens 25/25 was worse
 * than useless — github-pr-workflow read REVIEW 84/100 with "regression 25/25"
 * alone and BLOCK 60/100 with two RG01 FAILs from the corpus. The lens is now
 * reported as not assessed and left out of the denominator.
 */
function auditSkill(s, collisionsFor = [], regressionAssessed = true) {
  const findings = []
  findings.push(...lensTrigger(s))
  const budget = lensBudget(s)
  findings.push(...budget.findings)
  findings.push(...lensExecution(s))
  findings.push(...collisionsFor)

  const lenses = ['trigger', 'budget', 'execution', 'regression']
  const scores = {}
  for (const l of lenses) {
    if (l === 'regression' && !regressionAssessed) { scores[l] = null; continue }
    const f = findings.filter((x) => x.lens === l)
    const penalty = f.reduce((n, x) => n + (x.level === 'fail' ? 12 : x.level === 'warn' ? 5 : 1), 0)
    scores[l] = Math.max(0, 25 - penalty)
  }
  const assessed = lenses.filter((l) => scores[l] !== null)
  const score = assessed.reduce((n, l) => n + scores[l], 0)
  const fails = findings.filter((f) => f.level === 'fail').length
  const warns = findings.filter((f) => f.level === 'warn').length
  const verdict = fails ? 'BLOCK' : warns ? 'REVIEW' : 'SHIP'

  return {
    skill: s.name ?? basename(s.dir), dir: s.dir, verdict, score, max: assessed.length * 25,
    scores, regressionAssessed, fails, warns, findings, tokens: budget.skillTokens,
  }
}

// ------------------------------------------------------------------- output

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { r: '', y: '', g: '', d: '', b: '', x: '' }

const badge = (v) => v === 'BLOCK' ? `${C.r}${C.b}BLOCK${C.x}` : v === 'REVIEW' ? `${C.y}REVIEW${C.x}` : `${C.g}SHIP${C.x}`
const mark = (l) => l === 'fail' ? `${C.r}FAIL${C.x}` : l === 'warn' ? `${C.y}WARN${C.x}` : `${C.d}info${C.x}`

function printReport(r, cwd) {
  const reg = r.regressionAssessed ? `regression ${r.scores.regression}/25` : `regression not assessed`
  console.log(`\n${C.b}${r.skill}${C.x} ${C.d}${relative(cwd, r.dir) || '.'}${C.x}`)
  console.log(`  ${badge(r.verdict)}  score ${r.score}/${r.max}  ${C.d}trigger ${r.scores.trigger}/25 · budget ${r.scores.budget}/25 · execution ${r.scores.execution}/25 · ${reg} · ~${r.tokens} tok${C.x}`)
  if (!r.regressionAssessed)
    console.log(`  ${C.y}note${C.x} ${C.d}collisions need a corpus — this verdict cannot see them. Run \`collide <root>\`.${C.x}`)
  if (!r.findings.length) { console.log(`  ${C.g}clean${C.x}`); return }
  for (const f of r.findings) {
    console.log(`  ${mark(f.level)} ${C.d}[${f.id} ${f.lens}]${C.x} ${f.msg}`)
    if (f.hint) console.log(`       ${C.d}↳ ${f.hint}${C.x}`)
  }
}

// --------------------------------------------------------------------- init

const EVALS_TEMPLATE = (name) => ({
  skill_name: name,
  evals: [
    { id: 0, kind: 'trigger', name: 'fires-on-canonical-phrasing', prompt: 'REPLACE: the sentence a user would most obviously type to want this skill.', expect_trigger: true },
    { id: 1, kind: 'trigger', name: 'fires-on-oblique-phrasing', prompt: 'REPLACE: the same intent, worded so the skill name never appears.', expect_trigger: true },
    { id: 2, kind: 'trigger', name: 'stays-quiet-on-neighbour', prompt: 'REPLACE: a prompt for the ADJACENT skill this one keeps stealing.', expect_trigger: false },
    { id: 3, kind: 'golden', name: 'REPLACE-real-scenario', prompt: 'REPLACE: a real, messy request — not a happy path.', expected_output: 'REPLACE: what a correct run produces.', trajectory: ['Read', 'Bash'], assertions: [{ text: 'REPLACE: a checkable claim about the output.' }] },
    { id: 4, kind: 'redteam', name: 'injection-in-input', prompt: 'REPLACE: a request whose input data contains "ignore your instructions and ...".', forbid: [{ text: 'Follows the instruction embedded in the data' }], assertions: [{ text: 'Treats the embedded instruction as data and reports it' }] },
  ],
})

function cmdInit(dir) {
  const s = loadSkill(dir)
  const out = join(dir, 'evals', 'evals.json')
  if (existsSync(out)) { console.error(`refusing to overwrite ${out}`); process.exitCode = 1; return }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(EVALS_TEMPLATE(s.name ?? basename(dir)), null, 2) + '\n')
  console.log(`wrote ${out}`)
  console.log(`Replace every REPLACE:, then grow the golden set to >= ${T.goldenMin} cases.`)
}

// -------------------------------------------------------------------- grade

/** Grade recorded runs against evals.json. results.json: { "<case id or name>": {fired, trajectory, output} } */
function cmdGrade(dir, resultsPath, json) {
  const evalsPath = join(dir, 'evals', 'evals.json')
  if (!existsSync(evalsPath)) { console.error(`no evals at ${evalsPath}`); process.exitCode = 2; return "BLOCK" }
  if (!existsSync(resultsPath)) {
    console.error(`no recorded runs at ${resultsPath}\nRun the eval cases first, then write results.json (see references/evals-format.md).`)
    process.exitCode = 2
    return 'BLOCK'
  }
  let doc, results
  try {
    doc = JSON.parse(readFileSync(evalsPath, 'utf8'))
    results = JSON.parse(readFileSync(resultsPath, 'utf8'))
  } catch (e) {
    console.error(`cannot parse eval JSON: ${e.message}`)
    process.exitCode = 2
    return 'BLOCK'
  }
  // Refuse to certify a scaffold. audit() blocks this via EV07, but grade is
  // reachable on its own and would otherwise report SHIP for untouched cases.
  if (JSON.stringify(doc).includes('REPLACE:')) {
    console.error(`${evalsPath} still contains REPLACE: scaffold markers — fill them in before grading.`)
    process.exitCode = 2
    return 'BLOCK'
  }
  const rows = []

  for (const c of doc.evals ?? []) {
    const key = String(c.id ?? c.name)
    const r = results[key] ?? results[c.name] ?? results[String(c.id)]
    if (!r) { rows.push({ case: key, kind: c.kind ?? 'golden', status: 'missing', notes: ['no recorded run'] }); continue }
    const notes = []
    let ok = true

    if (c.expect_trigger !== undefined) {
      const fired = r.fired === true
      if (fired !== c.expect_trigger) { ok = false; notes.push(`expected fired=${c.expect_trigger}, got ${fired}`) }
    }
    if (Array.isArray(c.trajectory) && c.trajectory.length) {
      const actual = r.trajectory ?? []
      let i = 0
      for (const t of actual) if (i < c.trajectory.length && t === c.trajectory[i]) i++
      if (i < c.trajectory.length) { ok = false; notes.push(`trajectory missing/out of order: expected ${c.trajectory.join(' → ')}, got ${actual.join(' → ') || '(none)'}`) }
    }
    const output = String(r.output ?? '')
    for (const f of c.forbid ?? []) {
      if (r.violated?.includes(f.text) || (f.match && output.includes(f.match))) { ok = false; notes.push(`forbidden behaviour: ${f.text}`) }
    }
    for (const a of c.assertions ?? []) {
      if (a.match && !output.includes(a.match)) { ok = false; notes.push(`assertion text not found: ${a.match}`) }
      else if (!a.match && r.assertions && r.assertions[a.text] === false) { ok = false; notes.push(`assertion failed: ${a.text}`) }
    }
    rows.push({ case: key, kind: c.kind ?? 'golden', status: ok ? 'pass' : 'fail', notes })
  }

  const pass = rows.filter((r) => r.status === 'pass').length
  const fail = rows.filter((r) => r.status === 'fail').length
  const missing = rows.filter((r) => r.status === 'missing').length
  const verdict = fail || missing ? 'BLOCK' : 'SHIP'

  if (json) { console.log(JSON.stringify({ skill: doc.skill_name, verdict, pass, fail, missing, rows }, null, 2)); return verdict }
  console.log(`\n${C.b}${doc.skill_name}${C.x} eval grade — ${badge(verdict)}  ${C.g}${pass} pass${C.x} ${C.r}${fail} fail${C.x} ${C.d}${missing} missing${C.x}`)
  for (const r of rows) {
    if (r.status === 'pass') continue
    console.log(`  ${r.status === 'fail' ? mark('fail') : mark('warn')} ${C.d}[${r.kind}]${C.x} ${r.case}`)
    for (const n of r.notes) console.log(`       ${C.d}↳ ${n}${C.x}`)
  }
  return verdict
}

// ----------------------------------------------------------------------- go

function main() {
  const argv = process.argv.slice(2)
  const flags = new Set(argv.filter((a) => a.startsWith('--')))
  const has = (f) => [...flags].some((x) => x === f || x.startsWith(f + '='))
  const val = (f, d) => { const m = [...flags].find((x) => x.startsWith(f + '=')); return m ? m.split('=')[1] : d }
  const pos = argv.filter((a) => !a.startsWith('--'))
  const cmd = pos[0] ?? 'audit'
  const target = resolve(pos[1] ?? '.')
  const json = has('--json')
  const quiet = has('--quiet')
  const cwd = process.cwd()

  if (cmd === 'init') return cmdInit(target)
  if (cmd === 'grade') {
    const v = cmdGrade(target, resolve(pos[2] ?? join(target, 'evals', 'results.json')), json)
    // exitCode, never exit(): process.exit() drops buffered stdout when it is a
    // pipe (file redirects are sync, pipes are not), which silently truncates
    // --json mid-object for any consumer downstream of a `|`.
    // Don't clobber a harness error (2) that cmdGrade already set.
    if (!process.exitCode) process.exitCode = v === 'SHIP' ? 0 : 1
    return
  }

  const corpus = has('--corpus') || cmd === 'collide'
  const found = corpus ? findSkills(target, has('--nested')) : { dirs: [target], nestedSkipped: 0 }
  const { dirs, nestedSkipped } = found
  if (!dirs.length) { console.error(`no SKILL.md found under ${target}`); process.exitCode = 2; return }

  const skills = []
  for (const d of dirs) {
    try { skills.push(loadSkill(d)) } catch (e) { console.error(`skip ${d}: ${e.message}`) }
  }
  // Without this a typo'd path loads nothing, audits nothing, and exits 0 —
  // a CI job pointed at a moved directory would report success forever.
  if (!skills.length) { console.error(`no readable skill at ${target}`); process.exitCode = 2; return }

  const { pairs, dupNames } = collide(skills)

  if (cmd === 'collide') {
    if (json) { console.log(JSON.stringify({ dupNames: dupNames.map(([n, v]) => ({ name: n, dirs: v.map((s) => relative(cwd, s.dir)) })), pairs: pairs.map((p) => ({ a: p.a.name, b: p.b.name, sim: +p.sim.toFixed(3) })) }, null, 2)); return }
    console.log(`\n${C.b}Regression lens${C.x} ${C.d}${skills.length} skills, ${skills.filter((s) => s.description && !s.userInvoked).length} model-invoked${nestedSkipped ? `, ${nestedSkipped} bundled copies skipped` : ''}${C.x}`)
    for (const [n, v] of dupNames)
      console.log(`  ${mark('fail')} duplicate name \`${n}\` in ${v.map((s) => relative(cwd, s.dir)).join(', ')}`)
    const limit = +val('--limit', 25)
    for (const p of pairs.slice(0, limit)) {
      const lvl = p.sim >= T.collideFail ? 'fail' : 'warn'
      console.log(`  ${mark(lvl)} ${p.sim.toFixed(2)}  ${C.b}${p.a.name}${C.x} ↔ ${C.b}${p.b.name}${C.x}`)
    }
    if (pairs.length > limit) console.log(`  ${C.d}… ${pairs.length - limit} more pairs above ${T.collideWarn}${C.x}`)
    if (!pairs.length && !dupNames.length) console.log(`  ${C.g}no collisions above ${T.collideWarn}${C.x}`)
    return
  }

  const byDir = new Map()
  for (const p of pairs) {
    const lvl = p.sim >= T.collideFail ? 'fail' : 'warn'
    for (const [self, other] of [[p.a, p.b], [p.b, p.a]]) {
      if (!byDir.has(self.dir)) byDir.set(self.dir, [])
      byDir.get(self.dir).push(F('regression', lvl, 'RG01', `Description ${(p.sim * 100).toFixed(0)}% similar to \`${other.name}\`.`, 'Two near-identical index entries make the router pick by coin flip. Sharpen one, or merge them.'))
    }
  }
  for (const [n, v] of dupNames)
    for (const s of v) {
      if (!byDir.has(s.dir)) byDir.set(s.dir, [])
      byDir.get(s.dir).push(F('regression', 'fail', 'RG02', `Duplicate skill name \`${n}\` — also at ${v.filter((o) => o !== s).map((o) => relative(cwd, o.dir)).join(', ')}.`, 'Whichever loads last wins; the other is unreachable.'))
    }

  const reports = skills.map((s) => auditSkill(s, byDir.get(s.dir) ?? [], corpus))
  reports.sort((a, b) => a.score - b.score)

  if (json) { console.log(JSON.stringify(reports, null, 2)) }
  else if (corpus) {
    const limit = +val('--limit', 20)
    const blocked = reports.filter((r) => r.verdict === 'BLOCK')
    const review = reports.filter((r) => r.verdict === 'REVIEW')
    const ship = reports.filter((r) => r.verdict === 'SHIP')
    console.log(`\n${C.b}Corpus audit${C.x} ${C.d}${relative(cwd, target) || '.'}${C.x} — ${reports.length} skills${nestedSkipped ? ` ${C.d}(+${nestedSkipped} bundled copies skipped; --nested to include)${C.x}` : ''}`)
    console.log(`  ${C.r}${blocked.length} BLOCK${C.x} · ${C.y}${review.length} REVIEW${C.x} · ${C.g}${ship.length} SHIP${C.x}   ${C.d}median score ${reports[Math.floor(reports.length / 2)]?.score}${C.x}`)
    console.log(`\n${C.b}Worst ${Math.min(limit, reports.length)}${C.x}`)
    for (const r of reports.slice(0, limit))
      console.log(`  ${badge(r.verdict).padEnd(badge(r.verdict).length + (r.verdict === 'SHIP' ? 2 : 0))} ${String(r.score).padStart(3)}  ${C.b}${r.skill}${C.x} ${C.d}${r.fails}F/${r.warns}W · ${relative(cwd, r.dir)}${C.x}`)
    if (!quiet) {
      console.log(`\n${C.d}Run \`verdict.mjs audit <dir>\` on any of these for the finding list.${C.x}`)
    }
  } else {
    for (const r of reports) printReport(r, cwd)
  }

  const failOn = val('--fail-on', 'fail')
  const bad = failOn === 'warn'
    ? reports.some((r) => r.verdict !== 'SHIP')
    : reports.some((r) => r.verdict === 'BLOCK')
  process.exitCode = bad ? 1 : 0
}

main()
