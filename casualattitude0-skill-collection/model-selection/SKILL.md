---
name: model-selection
description: Model selection guide for subagents and workflows. Use whenever spawning subagents via the Agent tool or authoring Workflow scripts, to pick the right model and effort level per task type.
---

# Model Selection (subagents, workflows)

| Scenario | Use |
|---|---|
| Planning, orchestration, main loop | fable-5. Main agent only; don't spawn it as a subagent |
| Bulk/mechanical: clear-spec implementation, data analysis, migrations | sonnet-5, effort medium |
| Light subagent work: search, exploration, small scoped edits | sonnet-5, effort medium |
| Hard tasks: complex implementation, debugging, long-running work | opus-4.8, effort xhigh. High is the minimum for serious coding |
| User-facing work: UI/UX, copy, API design | opus-4.8, effort high |
| Technical review (correctness, architecture, security) | opus-4.8, effort xhigh |
| Taste review (UI/UX, API design, copy) | opus-4.8, effort high |

Rules:
- If output misses the bar, escalate without asking: sonnet-5 -> opus-4.8 -> fable-5.
- Run models via the Agent/Workflow model and effort parameters.
- Gotchas: sonnet-5 wastes money on long complex tasks; never use Haiku.
