#!/usr/bin/env node
/**
 * Adapt copied gstack-game skills into self-contained whereto/skills/.
 * - Strip ~/.gstack, gstack-config, telemetry, redact bin deps
 * - Point artifacts at docs/whereto-artifacts (or whereto-artifacts)
 * - Rewrite skill routing to skills/<name> relative to this pack
 * - Soften AUTO-GENERATED / bun build requirements
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.resolve(__dirname, "../skills");

const SKILL_NAMES = [
  "asset-review",
  "balance-review",
  "build-playability-review",
  "careful",
  "feel-pass",
  "game-codex",
  "game-debug",
  "game-direction",
  "game-docs",
  "game-eng-review",
  "game-ideation",
  "game-import",
  "game-qa",
  "game-retro",
  "game-review",
  "game-ship",
  "game-ux-review",
  "game-visual-qa",
  "gameplay-implementation-review",
  "guard",
  "implementation-handoff",
  "pitch-review",
  "plan-design-review",
  "player-experience",
  "playtest",
  "prototype-slice-plan",
  "spark-lens",
  "triage",
  "unfreeze",
];

const NEW_PREAMBLE_BASH = `setopt +o nomatch 2>/dev/null || true  # zsh compat
_WT_VERSION="1.0.0"
_SLUG=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_USER=$(whoami 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"

if [ -d docs ]; then
  _PROJECTS_DIR="docs/whereto-artifacts"
else
  _PROJECTS_DIR="whereto-artifacts"
fi
mkdir -p "$_PROJECTS_DIR"

echo "SLUG: $_SLUG"
echo "BRANCH: $_BRANCH"
echo "PROJECTS_DIR: $_PROJECTS_DIR"
echo "WT_VERSION: $_WT_VERSION"

_ARTIFACT_COUNT=$(ls "$_PROJECTS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$_ARTIFACT_COUNT" -gt 0 ] && echo "Artifacts: $_ARTIFACT_COUNT files in $_PROJECTS_DIR" && ls -t "$_PROJECTS_DIR"/*.md 2>/dev/null | head -5 | while read f; do echo "  $(basename "$f")"; done`;

function replacePreambleBash(text) {
  // Replace the first large bash block that looks like the gstack preamble
  return text.replace(
    /```bash\nsetopt \+o nomatch[\s\S]*?while read f; do echo "  \$\(basename "\$f"\)"; done\n```/,
    "```bash\n" + NEW_PREAMBLE_BASH + "\n```"
  );
}

function stripGstackProse(text) {
  let out = text;

  out = out.replace(
    /\*\*Shared artifact directory:\*\*[^\n]*\n(?:- [^\n]+\n)*\nAll skills read from this directory[^\n]*\n\nIf `PROACTIVE` is `"false"`, do not proactively suggest gstack-game skills\.\n?/g,
    `**Shared artifact directory:** \`$_PROJECTS_DIR\` (\`docs/whereto-artifacts/\` or \`whereto-artifacts/\` in the target project) stores skill outputs for downstream skills in this pack.\n\n`
  );

  // Broader shared-artifact prose variants
  out = out.replace(
    /\*\*Shared artifact directory:\*\*[^\n]*`~\/\.gstack\/projects\/\{slug\}\/`[^\n]*\n(?:- [^\n]+\n)*/g,
    `**Shared artifact directory:** \`$_PROJECTS_DIR\` (\`docs/whereto-artifacts/\` or \`whereto-artifacts/\` in the target project).\n`
  );

  out = out.replace(
    /If `PROACTIVE` is `"false"`, do not proactively suggest gstack-game skills\.\n*/g,
    ""
  );

  // Public Output Redaction Lite → care note (no bin)
  out = out.replace(
    /## Public Output Redaction Lite\n\n[\s\S]*?(?=## Completion Status Protocol)/,
    `## Public Output Care\n\nBefore writing PR bodies, store submission text, or other public output: strip secrets, player PII, NDA wording, unreleased dates, and named community reports. If unsure, ask the user before publishing.\n\n`
  );

  // Telemetry blocks
  out = out.replace(/## Telemetry \(run last\)\n\n```bash\n[\s\S]*?```\n*/g, "");

  // Review log that calls gstack-review-log
  out = out.replace(
    /## Review Log\n\n```bash\n\[ -n "\$_GG_BIN" \] && "\$_GG_BIN\/gstack-review-log"[\s\S]*?```\n*/g,
    ""
  );

  // AUTO-GENERATED headers
  out = out.replace(
    /<!-- AUTO-GENERATED from SKILL\.md\.tmpl — do not edit directly -->\n<!-- Regenerate: bun scripts\/gen-skill-docs\.ts -->\n+/g,
    "<!-- Bundled into whereto from gstack-game; edit this file directly (no outer build step). -->\n"
  );
  out = out.replace(
    /<!-- AUTO-GENERATED from SKILL\.md\.tmpl — do not edit directly -->\n<!-- Regenerate: bun run build -->\n+/g,
    "<!-- Bundled into whereto from gstack-game; edit this file directly (no outer build step). -->\n"
  );

  // gstack-game branding
  out = out.replace(/gstack-game/g, "whereto");
  out = out.replace(/~\/\.gstack/g, "docs/whereto-artifacts");
  out = out.replace(/_GG_BIN/g, "_WT_UNUSED");
  out = out.replace(/_GD_VERSION/g, "_WT_VERSION");

  // Warn lines about missing bin
  out = out.replace(
    /\[ -z "\$_WT_UNUSED" \] && echo "WARN: whereto bin\/ not found, some features disabled"\n?/g,
    ""
  );

  return out;
}

function rewriteSkillRoutes(text) {
  let out = text;
  // Prefer skills/<name> paths for load instructions; keep /name as invoke shorthand
  for (const name of SKILL_NAMES) {
    // "run /foo first" stays as slash invoke (agent reads skills/foo)
    // Reference discovery paths that pointed at .claude/skills
    out = out.replaceAll(
      `.claude/skills/${name}`,
      `skills/${name}`
    );
    out = out.replaceAll(
      `~/.claude/skills/${name}`,
      `skills/${name}`
    );
  }

  // Reference finder bash that searched .claude — point at pack-relative skills
  out = out.replace(
    /SKILL_DIR="\$\(find \. -path '\*skills\/([^/]+)\/references' -type d 2>\/dev\/null \| head -1\)"\n\[ -z "\$SKILL_DIR" \] && SKILL_DIR="\$\(find ~\/\.claude -path '\*skills\/\1\/references' -type d 2>\/dev\/null \| head -1\)"/g,
    `SKILL_DIR="$(find . -path '*whereto/skills/$1/references' -type d 2>/dev/null | head -1)"
[ -z "$SKILL_DIR" ] && SKILL_DIR="$(find . -path '*/skills/$1/references' -type d 2>/dev/null | head -1)"
# Prefer pack-relative path when this skill lives under product-planning/whereto/skills/$1
[ -d "references" ] && SKILL_DIR="references"`
  );

  // Simpler: any find ~/.claude for references
  out = out.replace(
    /\[ -z "\$SKILL_DIR" \] && SKILL_DIR="\$\(find ~\/\.claude -path '\*skills\/[^']+' -type d 2>\/dev\/null \| head -1\)"\n/g,
    `[ -z "$SKILL_DIR" ] && [ -d "references" ] && SKILL_DIR="references"\n`
  );

  // Next Step / routing: clarify slash names resolve inside this pack
  out = out.replace(
    /### Workflow Pipeline\n/,
    `### Workflow Pipeline\n\nSlash names below resolve to \`skills/<name>/SKILL.md\` inside this whereto pack. Do not look outside the pack.\n\n`
  );

  return out;
}

function adaptFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  let next = raw;
  next = replacePreambleBash(next);
  next = stripGstackProse(next);
  next = rewriteSkillRoutes(next);

  // Frontmatter: mark as bundled
  if (next.startsWith("---") && !next.includes("bundled_into:")) {
    next = next.replace(
      /^---\n/,
      "---\nbundled_into: whereto\n"
    );
  }

  if (next !== raw) {
    fs.writeFileSync(filePath, next);
    return true;
  }
  return false;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".md") || ent.name.endsWith(".tmpl")) acc.push(p);
  }
  return acc;
}

const files = walk(skillsRoot).filter(
  (f) => !f.includes(`${path.sep}shared${path.sep}`) || f.endsWith("preamble-telemetry.md") || f.endsWith("preamble-expert.md") || f.endsWith("preamble-standard.md")
);

let changed = 0;
for (const f of files) {
  // Skip our already-rewritten preamble-core
  if (f.endsWith(`${path.sep}preamble-core.md`)) continue;
  if (adaptFile(f)) {
    changed++;
    console.log("adapted:", path.relative(skillsRoot, f));
  }
}

// Telemetry preamble becomes a no-op note
const telPath = path.join(skillsRoot, "shared/preamble-telemetry.md");
fs.writeFileSync(
  telPath,
  `## Session end\n\nNo external telemetry. Optionally note duration and outcome in the Completion Summary only.\n`
);
console.log("rewrote shared/preamble-telemetry.md");

console.log(`\nDone. ${changed} files adapted under skills/`);
