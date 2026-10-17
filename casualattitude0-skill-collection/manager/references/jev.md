# jev reference

Disclosed from [`SKILL.md`](../SKILL.md). Read when a call misbehaves, a
question needs tuning, or you want a judgment the two subcommands do not cover.

## What jev is

TypeSafe's System One model (`jev-latest`, resolved to a pinned version in
every response). Input: a **state** (string or JSON object) and a map of
**questions**. Output: one typed answer per question with probabilities.
It is not generative: no text, no reasoning. Latency is a few hundred ms.

| Primitive | Returns | Use for |
|---|---|---|
| choice | `choice`, `probabilities` (sum to 1), `confidence` | one option from a closed list, up to 255 options |
| score | `score`, `probabilities`, `confidence`, `legend` | position on ordered levels |
| noul | `noul` (0–1) | whether a statement holds; no separate confidence |

Endpoint `POST https://api.typesafe.ai/v1/systemone`, header
`Authorization: Bearer $TYPESAFE_API_KEY`. The script reads the env var, then
`~/.config/typesafe/api_key` (chmod 600). The key stays out of the repo.

## How the script uses it

[`scripts/jev`](../scripts/jev) keeps every question and threshold in the
block marked *review surface*. That block is what a human reviews when a
routing decision looks wrong.

- `route` asks one choice (tier: light / standard / hard) and two nouls
  (follow-up, codex) over `{task, context}` in a single call. Independent
  questions over the same state ride together at no latency cost.
- The `codex` noul asks whether the brief belongs with a second model family:
  the user named GPT, Codex or OpenAI, or the task is an independent second
  opinion or cross-check of work Claude produced. Its instruction excludes
  ordinary review any model could do and briefs that merely contain the word
  codex as a path. It reports a bare probability, read at the same 0.70 /
  0.50 lines as the bands. On four test briefs (jev-1.13.0) it returned 0.09
  for a read-only search, 0.96 for a user-requested GPT review, 0.49 for an
  unaddressed "second opinion", and 0.07 for renaming a `src/codex/` directory.
- `pick` asks one choice over `{name: description}` plus a `none` catch-all.
  Question IDs never reach the model; option names and descriptions do, so a
  candidate's description is what it is judged by.
- `ask` is the raw passthrough for a new judgment: write the state and
  questions as JSON files.

### Bands

`confidence` measures how far the top option sits above an even split. The
script maps it to three bands (docs/confidence): act ≥ 0.70, consider ≥ 0.50,
ignore below. Dispatch is reversible, so the bands sit at the low end;
raise `ACT_AT` for a judgment that gates something expensive.

A noul near 0.5 means yes and no are equally likely, not "medium".

### Limits

- 255 options per choice. The deferred MCP tool list exceeds this: pick the
  server first, then the tool within it.
- English is the primary training language; CJK state is accepted with
  lower accuracy. Write briefs in English when routing matters.
- Three tiers, not four: on prompt text alone jev separates *hard* from a
  hypothetical *frontier* poorly, and over-provisioning effort is the costly
  mistake. For the same reason GPT is not a tier: the tier question judges
  difficulty, and model family is a different question, so it is the
  separate `codex` noul. The tier is still answered and serves as the Claude
  fallback rung.
- Fail-open: timeout (4 s), bad key, network or schema error all return
  `ok: false`, and the manager decides alone.

## Tuning

Label about thirty real briefs with the rung you would have chosen, run
`route` over them, and compare. Confusion between two tiers means their
criteria overlap: sharpen the `covers` / `excludes` fields rather than
adding tiers. Pin `MODEL` to the resolved version once the numbers are
acceptable so a model update cannot move them silently.

## Sources

- https://docs.typesafe.ai/llms.txt — index; append `.md` to any page path
- https://docs.typesafe.ai/primitives/choice.md, `/confidence.md`, `/concepts/state.md`
- Official agent skill for *building* integrations: `claude plugin marketplace add typesafe-ai/skills`
