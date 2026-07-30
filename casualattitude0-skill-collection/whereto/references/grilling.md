# Grilling — stress-test a plan before building

Use during whereto Stage 4 (or any time a roadmap/slice needs pressure-testing). Distilled from the productivity `grilling` skill; lives in-pack so whereto has no outer reference.

## Protocol

Interview the user relentlessly about every aspect of the plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

**Rules:**
1. Ask **one question at a time**. Wait for feedback before continuing. Multiple questions at once is bewildering.
2. If a question can be answered by exploring the codebase, **explore the codebase instead** of asking.
3. Lead with a recommendation: `RECOMMENDATION: [X] because [one-line reason]`.
4. Stop when decisions are pinned enough to write artifacts — don't grill forever.

## When to grill in whereto

| Moment | What to pressure-test |
|--------|----------------------|
| Stage 4b destination | Portfolio vs commercial vs live-ops vs jam |
| Stage 4c phase sequence | Order, exit criteria, scope cuts vs timeline |
| Stage 6 slice pick | Riskiest assumption, failure condition, fake vs real |
| After roadmap, before handoff | Soul of the slice, MUST budget, tempting shortcuts |

## When NOT to grill

- Disk evidence already settles the answer (AUTO)
- User already confirmed and wants artifacts written
- Question is pure implementation detail (belongs in build, not planning)

## Relationship to bundled tools

- Parent whereto Stage 4 Ask format already uses re-ground → recommend → options — grilling is the *intensity* mode when stakes are high.
- For Game design ambiguity, prefer the Ask format in bundled game skills (`skills/game-review`, etc.).
- For domain language fights during APP/WEB design, pair with `skills/domain-modeling`.
