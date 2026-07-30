# Productivity

General workflow tools, not code-specific.

## User-invoked

Reachable only when you type them (Claude Code: `disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`).

- **[grill-me](./grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[handoff](./handoff/SKILL.md)** — Compact the current conversation into a handoff document so another agent can continue the work.
- **[teach](./teach/SKILL.md)** — Teach the user a new skill or concept over multiple sessions, using the current directory as a stateful teaching workspace.
- **[writing-great-skills](./writing-great-skills/SKILL.md)** — Reference for writing and editing skills well: the vocabulary and principles that make a skill predictable.
- **[skill-verdict](../casualattitude0-skill-collection/skill-verdict/SKILL.md)** — Validate a skill before it ships: audits trigger, token budget, execution contract and collisions against the installed corpus, then grades recorded eval runs. The counterpart to `writing-great-skills` — that one tells you how to write it, this one tells you whether it holds up.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[grilling](./grilling/SKILL.md)** — Interview the user relentlessly about a plan, decision, or idea until every branch of the decision tree is resolved.
- **[local-transcribe](../casualattitude0-skill-collection/local-transcribe/SKILL.md)** — Whisper on the user's own hardware: any video, podcast, or recording → transcript, no API key and no upload. Backend picked per platform (MLX on Apple Silicon, CTranslate2 elsewhere), so it survives a device switch — see [INSTALL.md](../casualattitude0-skill-collection/local-transcribe/INSTALL.md).
