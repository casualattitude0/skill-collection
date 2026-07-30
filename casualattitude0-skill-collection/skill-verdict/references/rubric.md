# The rubric

Four failure modes kill skills in production. Each gets a lens in `verdict.mjs`
and a defense that a script alone cannot supply.

| Failure | Lens (mechanical) | Defense (judgment) |
|---|---|---|
| Trigger — vague description, so the skill misfires or stays silent | `trigger` | trigger cases, incl. negatives |
| Token budget — everything crammed into one file | `budget` | progressive disclosure |
| Execution — wrong output, or right output via the wrong tool order | `execution` | golden dataset + trajectory assertions |
| Regression — a new description collides with one already shipping | `regression` | corpus collision sweep before merge |

Scoring: each lens starts at 25. A `FAIL` costs 12, a `WARN` 5, an `info` 1,
floored at 0. Any FAIL → **BLOCK**. Any WARN → **REVIEW**. Otherwise **SHIP**.
Nothing in a fresh corpus scores SHIP on the first pass; that is the point.

## Lens 1 — trigger

The description is the only thing the router sees. It is not documentation.

| ID | Level | Fires when |
|---|---|---|
| TR01 | FAIL | No YAML frontmatter — the skill can never be indexed |
| TR02 | FAIL | No `name` |
| TR03 | WARN | `name` ≠ directory name |
| TR04 | FAIL | `name` is not kebab-case |
| TR05 | FAIL | No `description` — the model can never fire it autonomously |
| TR06 | WARN | User-invoked skill carries a >220-char description |
| TR07 | WARN | User-invoked skill writes model-facing trigger prose |
| TR08 | FAIL | Description <40 chars — too thin to discriminate |
| TR09 | FAIL | Description >1024 chars — platform limit |
| TR10 | WARN | Description >500 chars — it costs context every single turn |
| TR11 | WARN | No trigger clause ("Use when…") |
| TR12 | WARN | No negative scope ("Not for…") |
| TR13 | WARN | Vague filler ("helpful utilities", "and more") |
| TR14 | info | Description is a fragment, not a sentence |

TR03 is a WARN, not a FAIL: the harness indexes by frontmatter `name`, so a
mismatch still loads. It is how a skill gets edited in one place and invoked
from another.

TR12 exists because over-firing costs as much as under-firing, and only a
negative clause bounds a skill from above.

## Lens 2 — budget

Token counts are estimates: ~4 chars/token for English, ~0.75 tokens/char for
CJK. Treat them as ±15%, not as a tokenizer.

| ID | Level | Fires when |
|---|---|---|
| TB01 | FAIL | SKILL.md >5000 tokens |
| TB02 | WARN | SKILL.md >2500 tokens |
| TB03 | WARN | Bundle >25000 tokens in a single file |
| TB04 | WARN | A code fence runs >100 lines inline |

The fix is always the same: make SKILL.md a router and push detail into
`references/*.md`, which the agent loads only on demand.

## Lens 3 — execution

Whether the agent can actually follow the thing.

| ID | Level | Fires when |
|---|---|---|
| EX01 | FAIL | SKILL.md references a bundle file that does not exist |
| EX02 | WARN | A bundled file is never referenced from SKILL.md |
| EX03 | info | Shell commands issued but no `allowed-tools` declared |
| EX04 | WARN | No ordered procedure in a skill over 2000 chars |
| EX05 | WARN | No `evals/evals.json` — never tested |
| EX06 | FAIL | `evals.json` is not valid JSON |
| EX07 | info | Code fences with no language tag |
| EV01 | WARN | Fewer than 5 golden cases |
| EV02 | WARN | Fewer than 3 trigger cases |
| EV03 | WARN | No negative trigger case |
| EV04 | WARN | Fewer than 2 red-team cases |
| EV05 | FAIL | An eval case has no `prompt` |
| EV06 | WARN | An eval case asserts nothing |
| EV07 | FAIL | Eval cases still contain `REPLACE:` scaffold markers |

EV07 exists because an unfilled scaffold grades SHIP on every case: `REPLACE:`
prompts still run, and empty assertion sets always pass. Verification of this
skill hit exactly that — five untouched template cases reported 5 pass, 0 fail.

**EX01 is deliberately conservative.** A loose path like `docs/OUTPUT.md` counts
as a bundle reference only when its first segment is a real directory in the
bundle — otherwise every file a skill *writes into the user's project* reads as
a broken link. Markdown link targets are always checked, since those are
unambiguous. Templated paths (`adapters/<stack>.md`, `skills/*/SKILL.md`) are
never "broken"; they only vouch for their directory.

**EX02 respects nesting.** A subdirectory with its own `SKILL.md` is a bundled
sub-skill: it owns its files and is audited in its own right, so the parent
never calls them dead. `evals/` and `fixtures/` are exempt too — that payload is
reached from the eval file, never from SKILL.md.

**A path in a "write" sentence is an output, not a reference.** "Write
`evals/results.json`" names a file the skill *produces*. The check looks only at
the current line: a lookback that crossed newlines matched a distant heading
("Scaffold, fill, run, grade:") and suppressed the code fence three lines below.

EX04 is the trajectory check a static tool can actually make. The real
trajectory assertion lives in the eval file.

## Lens 4 — regression

Two skills whose descriptions overlap make the router pick by coin flip.

Similarity is an **overlap coefficient** (intersection over the *smaller* set),
weighted 0.4 unigram / 0.6 bigram. Jaccard was wrong here: it divides by the
union, so a long specific description scores low against a short generic one no
matter how completely the generic one swallows its trigger space — which is the
collision that matters.

| ID | Level | Fires when |
|---|---|---|
| RG01 | FAIL | Similarity ≥0.45 to another shipping description |
| RG01 | WARN | Similarity ≥0.25 |
| RG02 | FAIL | Duplicate skill `name` in the corpus |

Thresholds were calibrated against a 97-skill corpus, not chosen a priori.
Every pair ≥0.45 was genuinely confusable — the top hit, `github-pr-merge` vs
`github-pr-workflow`, differs only in whether a review step runs. Between 0.25
and 0.45 sat real families (`resume-*`, `playwright-*`). Below ~0.20 was noise.

Bundled copies of a skill are excluded by default: they ship as payload of a
parent pack and only load when that pack is active, so comparing them against
their originals yields one collision per vendored file and drowns the signal.
Pass `--nested` to include them.

**Symlinks are followed.** An installed corpus (`~/.claude/skills/`) is entirely
symlinks into the repos that own each skill, and `isDirectory()` returns false
for a symlink — before this was handled, auditing 99 installed skills found 6.
A `seen` set of resolved real paths guards against cycles. The installed corpus
is the one worth sweeping: it is what competes in the router.

## The two defenses that are not in the script

**Shadow mode.** Install the skill, but run it with its side effects disabled —
have it report what it *would* write rather than writing. Real prompts, real
routing, no blast radius. What you are watching for is not output quality but
whether it fires on traffic you did not predict.

**Canary.** Project scope before user scope. A skill symlinked into a single
project's `.claude/skills/` competes only with that project's router; the same
skill in `~/.claude/skills/` competes with everything. Ship narrow, widen once
the trigger behaviour holds.

```bash
# canary — one project only
ln -sfn "$PWD/productivity/skill-verdict" <project>/.claude/skills/skill-verdict

# promote — every project
ln -sfn "$PWD/productivity/skill-verdict" ~/.claude/skills/skill-verdict
```
