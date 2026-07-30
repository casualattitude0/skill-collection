---
name: skill-verdict
description: Validate a Claude Code skill before it ships — checks its trigger description, token budget, execution contract, and collisions with skills already installed, then grades recorded eval runs. Use when asked to validate, verify, audit, lint, or QA a skill, judge whether a skill is production-ready, find skill description collisions, or set up skill evals. Not for authoring a new skill, or for reviewing ordinary application code.
user_invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task
license: MIT
---

# Verdict — is this skill fit to ship?

A skill is software. It fails in four ways, and "it read fine" catches none of
them. This skill runs the checks a script can make, then drives the ones only a
model can.

Paths below are relative to the **repo root**. The driver is
`productivity/skill-verdict/verdict.mjs` — zero dependencies, Node ≥18.

## 1. Audit — always start here

```bash
node productivity/skill-verdict/verdict.mjs audit <skill-dir>
```

Prints per-finding `FAIL`/`WARN`/`info` with a fix hint, a score out of 100
across four lenses, and a verdict: **BLOCK** (any FAIL) / **REVIEW** (any WARN)
/ **SHIP**.

Exit codes, so it drops straight into CI: **0** ship-or-review, **1** blocked,
**2** the harness itself could not run (bad path, unreadable JSON, an eval file
still full of scaffold markers). Never treat 2 as a pass.

Every check ID, threshold, and the reasoning behind it:
[rubric.md](references/rubric.md). Read it before arguing with a finding —
several checks are deliberately conservative and say so.

## 2. Sweep the corpus — before merging anything new

A new skill can be perfect on its own and still break the two skills next to it.

```bash
node productivity/skill-verdict/verdict.mjs audit . --corpus --limit=20
node productivity/skill-verdict/verdict.mjs collide .
```

`collide` is the regression lens alone: pairwise description similarity across
every model-invoked skill, worst first. Bundled sub-skills are excluded by
default (`--nested` includes them).

Point it at the **installed** corpus for the set that actually competes in the
router — symlinks are followed, so this works even though every entry there is a
link into the repo that owns it:

```bash
node ~/.claude/skills/skill-verdict/verdict.mjs collide ~/.claude/skills
```

Run this **before** adding a skill and after. A pair that crosses 0.45 means the
router is choosing between them by coin flip.

## 3. Evals — the part the script cannot do

The driver grades runs; it cannot perform them. Scaffold, fill, run, grade:

```bash
node productivity/skill-verdict/verdict.mjs init <skill-dir>
```

That writes `<skill-dir>/evals/evals.json` with one case per category and
`REPLACE:` markers. Then:

1. **Replace every `REPLACE:`.** Golden cases must be real, messy requests —
   not happy paths. Trigger cases must include one that must *not* fire,
   usually a prompt for the adjacent skill this one keeps stealing. Red-team
   cases put the attack *in the data the skill reads*, not in the user's prompt.
2. **Grow the golden set to ≥5** and red-team to ≥2. The audit warns below that.
3. **Run each case** — dispatch one subagent per case with the case's `prompt`
   verbatim, in a scratch copy of the fixture. Record for each: whether the
   skill fired, the tool names in call order, and the final output.
4. **Write `evals/results.json`** in the shape given in
   [evals-format.md](references/evals-format.md).
5. **Grade:**

```bash
node productivity/skill-verdict/verdict.mjs grade <skill-dir> <skill-dir>/evals/results.json
```

Grading checks three things the audit cannot: did it fire when it should and
stay quiet when it should not; did the tool calls happen **in order**
(subsequence match — extra calls fine, wrong order not); and did any red-team
case get obeyed. A case with no recorded run grades as `missing` and blocks.

## 4. Ship narrow

Never promote straight to user scope. Canary into one project first:

```bash
ln -sfn "$PWD/<folder>/<skill>" <project>/.claude/skills/<skill>
```

Watch what it fires on for real traffic, then promote:

```bash
ln -sfn "$PWD/<folder>/<skill>" ~/.claude/skills/<skill>
```

A skill in `~/.claude/skills/` competes with every other skill you own; the same
skill in a project competes with a handful. Shadow mode and canary rationale:
[rubric.md](references/rubric.md).

## Gotchas

- **Almost nothing scores SHIP on the first pass.** Auditing this repo's 98
  top-level skills gave 10 BLOCK / 87 REVIEW / 1 SHIP, median 83 — and the one
  SHIP is `skill-verdict` itself, only after four rounds of fixing what it found.
  REVIEW is the normal resting state; BLOCK is the gate. Don't tune thresholds
  to make a number go green.
- **A single-skill audit cannot see collisions.** Collisions need something to
  collide with, so `audit <dir>` scores out of **75** and prints `regression not
  assessed`. It used to score that lens 25/25, which read as "no collisions":
  `github-pr-workflow` looked like REVIEW 84/100 alone and is BLOCK 60/100 from
  the corpus, with two RG01 FAILs. Always pair an audit with a corpus sweep.
- **A git worktree checkout doubles your corpus** and turns every skill into a
  duplicate-name FAIL. The walker skips `.claude/worktrees/` and `*-workspace/`
  for exactly this reason. If collision counts look absurd, something is
  vendoring a second copy of the tree.
- **`EX01` will not catch a typo'd directory.** A loose path only counts as a
  bundle reference when its first segment is a real bundle directory —
  otherwise every output file a skill writes into the user's project reads as a
  broken link. Markdown links are always checked; prefer them.
- **Token counts are estimates**, ~4 chars/token English and ~0.75 tokens/char
  CJK. Fine for "is this 2k or 8k", useless for "is this 4,990 or 5,010".
- **`--fail-on=warn`** turns REVIEW into a non-zero exit. Do not put that in CI
  for an existing corpus; you will fail every build on day one.
- **Trigger cases cannot be self-tested.** Asking "did the skill fire?" from a
  session where the skill is already loaded measures nothing. Each trigger case
  needs its own fresh context — give a subagent the real description index and
  the verbatim prompt, and record which skill it picks. Red-team cases that
  probe agent behaviour (rather than the driver's) need the same, plus a
  sandbox copy, since a genuine test has to let the agent actually edit files.
- **An unfilled scaffold used to grade SHIP on every case** — `REPLACE:` prompts
  still run and empty assertion sets always pass. Both `audit` (EV07) and
  `grade` now refuse it. If you ever see a brand-new skill pass its evals first
  try, that is the bug to suspect.
- **zsh `noclobber` silently no-ops `>` onto an existing file.** Writing
  `results.json` a second time can leave the old content in place and you grade
  a stale run. Use `>|` or `rm` first; this bit twice while building this skill.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module …/verdict.mjs` | Shell `cd`'d into a skill dir earlier; the path is relative | Run from the repo root, or use an absolute path |
| `no SKILL.md found under <path>` | Pointed at a category folder, not a skill | Add `--corpus`, or point at the directory holding SKILL.md |
| Every skill reports duplicate names | A worktree or vendored copy inside the tree | Confirm with `find . -name SKILL.md \| wc -l`; exclude the copy |
| `evals.json is not valid JSON` | Trailing comma from hand-editing | The grader cannot read it — fix the syntax first |
| Audit clean but the skill still misfires | The description is unambiguous to a linter, not to a router | That is what §3 trigger cases exist to catch |
