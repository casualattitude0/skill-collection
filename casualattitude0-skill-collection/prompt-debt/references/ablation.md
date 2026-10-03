# Inventory, verification, and the ablation protocol

Machinery shared by the three scopes. Read before running any test.

## Inventory — run first, it decides where effort goes

Cost differs by load frequency, not line count:

| Surface | Loads | Priority |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | **every turn** | highest — a wasted line is taxed forever |
| Skill `description` frontmatter | every turn, all enabled skills | high |
| `SKILL.md` body | only when triggered | medium — long is fine if it earns it on trigger |
| Hooks | every matching event | medium, but they *act*, so mis-fires cost more than tokens |

```bash
wc -l ~/.claude/CLAUDE.md ./CLAUDE.md ./AGENTS.md 2>/dev/null
find ~/.claude/skills -name SKILL.md -exec wc -l {} + | sort -rn | head -20
```

Lines are a proxy. If a number is close to a decision, count tokens properly.

## The verification gate — clear this before any ablation

Most effort goes into wording rules; the actual failure is in verification. **A
criterion the model cannot check itself is not a criterion.**

- Require a working link → it must actually open the link.
- Require tests to pass → it must actually run them.
- Require sourced citations → it must actually fetch the source.

Subjective properties (tone, argument quality) get a fixed written rubric or
explicit human review — say which. **If you cannot score the task, stop and build
the scorer. Do not ablate blind.**

## The ablation protocol — Scope 2 only

1. **Baseline.** 3–5 tasks you actually run weekly, **≥3 runs each** on current
   settings. Record failures, missing fields, human fixes, time to acceptable.
2. **Ablated arm.** In a clean session or isolated environment, remove one class
   of Scope 2 rules. Scope 1 and 3 stay intact. Same tasks, same scorer, ≥3 runs.
3. **Compare distributions, not champions.** Output is stochastic — judge mean,
   failure rate, and variance. Each arm's single best run tells you nothing.
4. **Add back by class, then bisect.** Restore the whole class wherever the
   ablated arm repeatedly fails; if that helps, split it and re-test to find the
   rule actually carrying the weight.
5. **Verdict.** No worse — or better — without it? Delete it.

Never report a result from fewer than 3 runs per arm. If only one run per arm was
possible, label the result provisional and say so.

## Ordering, when the budget is small

Ablation is the expensive part. Spend it in this order:

1. Always-on surfaces before on-demand ones — same rule, higher rent.
2. Whole classes before single rules — one test can retire a dozen lines.
3. Rules the two free questions could not settle — everything else was free.

## The scorer expires too

Evals rot faster than people expect — roughly one to three model generations.
Once a new model scores full marks, the eval no longer separates good from bad
and has to be rewritten around wherever the model *now* fails. A stable perfect
score is a signal to replace the eval, not to celebrate.

Prompt debt slows you down. A saturated eval is worse — it tells you nothing is
wrong.
