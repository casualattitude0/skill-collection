# Whereto — Gotchas & Forcing Questions

## What Claude gets wrong doing THIS task

| Mistake | Why it happens | Fix |
|---------|------------------|-----|
| Accepts README phase labels at face value | READMEs are aspirational; users write "beta" when they mean "hopeful" | Always run the phase-scoring checklist. Name the gap: "README says X, evidence says Y." |
| Produces generic best-practice roadmaps | Training data has a default "MVP → beta → launch" template | Every phase bullet must cite something found in the project. If you can't cite evidence, cut it. |
| Skips conversation and writes artifacts immediately | User asked for a plan; agent optimizes for output | Stages 4 STOP gates are mandatory. No `PROJECT_PHASE.md` until phase, destination, and phase sequence are confirmed. |
| Presents three equal slice options | Avoids commitment; feels helpful | Score 3 candidates, recommend ONE. Rejected alternatives must say why. |
| Writes code in the handoff | Handoff feels more "complete" with snippets | Handoff is experience/requirements only. No code blocks, no file paths to edit, no implementation steps. |
| Over-scopes the next slice | Wants to "solve everything" in one pass | Next slice must pass scope-discipline axis (≤2 weeks, can't remove anything without losing signal). |
| Ignores git momentum | Snapshot analysis is easier than trajectory | If git shows 6-month gap or bursty WIP, the roadmap must reflect consolidation vs ambition. |
| Treats all project types the same | Shared template is faster | Game/APP/WEB playbooks define different phase signals. Wrong playbook = wrong phase. |
| Ends at roadmap without slice + handoff | Old skill stopped at stage 5 | Stages 6–7 are required. Roadmap alone is not "done." |
| Manufactures questions | Feels interactive | Only ASK where evidence is genuinely ambiguous (destination, scope appetite). AUTO everything the disk settles. |
| Writes pitch-deck artifacts | Default LLM prose | Follow [artifact-voice.md](artifact-voice.md). Cut robust/seamless/leverage/delve. No em dashes in body sentences. Soul and exits must be observable. |
| Pads handoff with "engaging / immersive / solid foundation" | Sounds complete without saying anything | Replace with timing, counts, or a failure you can watch. |

## Anti-sycophancy — forbidden postures

Never use these without immediately following with evidence:

- "That's an interesting project" → state what phase it is and why.
- "You're making great progress" → cite what exists vs what's missing.
- "There are many valid next steps" → pick one slice and defend it.
- "You might want to consider…" → "Do X first because Y blocks Z."
- "It depends on your goals" → if goals are ambiguous, ask ONE destination question, then recommend.

## Forcing questions (use when stuck)

**Destination ambiguity:**
> "This prototype could finish as a portfolio piece (vertical slice + polish) or a commercial launch (full production). Which finish line are you aiming at? I recommend [X] because [evidence from git/docs]."

**Scope vs momentum mismatch:**
> "The GDD describes [N levels / features] but git shows [cadence]. At current pace that's [estimate]. Do we cut scope, extend timeline, or change destination?"

**Phase disagreement:**
> "You said it's beta. I found: no save system, placeholder art on 80% of assets, no deploy config. I'd place it at late prototype. Which read should the roadmap use?"

**Slice selection:**
> "Candidate A tests the riskiest unknown ([X]). Candidate B is safer but won't tell us if [Y] works. I recommend A — agree, or tell me what risk matters more."

## Recovery / interrupt handling

If the user returns mid-session or says "continue":

1. Check if `PROJECT_PHASE.md` or `IMPLEMENTATION_HANDOFF.md` already exists in the target project.
2. If roadmap exists but no next-slice section → resume at Stage 6.
3. If next-slice exists but no handoff → resume at Stage 7.
4. If nothing exists → resume from Stage 4 conversation (don't re-research unless user says the project changed).

## Adjacent skills — when NOT to use the parent chain

All of these live **inside this pack** under `skills/` (or `references/grilling.md`). Never leave the pack.

| User need | Route to |
|-----------|----------|
| Don't know which **game** tool | `skills/triage` |
| Stress-test plan / destination / slice | [grilling.md](grilling.md) |
| Artifacts sound like AI / pitch deck | [artifact-voice.md](artifact-voice.md) or `skills/avoid-ai-writing` |
| Single feature requirements doc | `skills/prd` |
| Throwaway logic/UI experiment | `skills/prototype` |
| Domain glossary / ADRs | `skills/domain-modeling` |
| Module / seam design | `skills/codebase-design` |
| Test-first implementation | `skills/tdd` |
| Hard bug / perf diagnosis | `skills/diagnosing-bugs` |
| APP/WEB UI/UX/a11y principles | `skills/typeui-fundamentals` |
| Game GDD design review | `skills/game-review` |
| Pick what game slice to build after design review | `skills/prototype-slice-plan` |
| Already have a slice plan, need build package only | `skills/implementation-handoff` |
| Asset pipeline / naming / budgets audit | `skills/asset-review` |
| Mechanic feel after a playable build | `skills/feel-pass` |
| Is this build worth playing? | `skills/build-playability-review` |
| Economy / balance | `skills/balance-review` |
| Player persona walkthrough | `skills/player-experience` |
| Game-specific bug (desync/feel/physics) | `skills/game-debug` |
| "Just commit my changes" | `git-commit` (outside this pack) |

Full catalog: [skills/README.md](../skills/README.md).

## Multi-IDE installation

Whereto is harness-agnostic (agentskills.io `SKILL.md`). Install once per IDE via [INSTALL.md](../INSTALL.md) or `product-planning/bin/install.sh`. Artifacts (`PROJECT_PHASE.md`, `IMPLEMENTATION_HANDOFF.md`, `whereto-artifacts/`) always write to the **target project**, never to the skills install path. The entire `skills/` tree installs with the pack — no separate game skill install.
