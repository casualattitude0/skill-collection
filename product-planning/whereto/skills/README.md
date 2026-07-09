# Bundled skills (self-contained)

All tools under `skills/` live **inside this pack**. Slash names resolve to `skills/<name>/SKILL.md` only — do not look outside `product-planning/whereto/`.

Sources (copied + adapted):
- Game deep tools — from gstack-game
- Engineering / PRD / UI fundamentals — from this Skills repo (`engineering/`, `product-planning/prd`, `design/typeui-fundamentals`)

## How to load

When the parent `SKILL.md` (or a Next Step) names a tool, read:

```
skills/<name>/SKILL.md
```

Then read that skill's local refs (`references/`, sibling `.md` files) as instructed.

## Catalog

### Orchestration / entry
| Skill | Use when |
|-------|----------|
| `triage` | Don't know which game tool to run; route only |
| *(parent)* `whereto` | Phase + roadmap + next slice + handoff chain |

### Engineering (APP / WEB / any stack)
| Skill | Use when |
|-------|----------|
| `prd` | Single-feature / system PRD (not a build slice) |
| `prototype` | Throwaway code to answer a logic or UI question |
| `domain-modeling` | Sharpen glossary (`CONTEXT.md`) + ADRs |
| `codebase-design` | Deep-module / seam design vocabulary |
| `tdd` | Build or fix test-first (red-green-refactor) |
| `diagnosing-bugs` | Hard bugs / perf — feedback-loop diagnosis |
| `typeui-fundamentals` | UI/UX/a11y principles for APP/WEB surfaces |

Also: [references/grilling.md](../references/grilling.md) — stress-test a plan one question at a time (Stage 4).

### Design (Game — Layer A)
| Skill | Use when |
|-------|----------|
| `spark-lens` | Fragile mood/image/mechanic fragment — sparks, not critique |
| `game-ideation` | Brainstorm a game concept |
| `game-import` | Turn PDF/docs/notes into a GDD |
| `game-direction` | Strategy / direction review |
| `game-review` | GDD design review |
| `pitch-review` | Pitch / proposal evaluation |
| `plan-design-review` | Pre-implementation design plan review |
| `game-ux-review` | Game UI/UX review |
| `player-experience` | Persona walkthrough / churn friction |
| `balance-review` | Economy / balance review |
| `game-eng-review` | Technical architecture review |
| `game-codex` | Adversarial second opinion |

### Production (Game — Layer B)
| Skill | Use when |
|-------|----------|
| `prototype-slice-plan` | What to build first (hypothesis + fake/real) |
| `implementation-handoff` | Design intent → build package (no code) |
| `feel-pass` | Playable build — is the mechanic alive? |
| `gameplay-implementation-review` | Code/PR review vs design intent |
| `asset-review` | Asset pipeline QA (naming, budgets, pipeline) |

### Validation (Game — Layer C)
| Skill | Use when |
|-------|----------|
| `build-playability-review` | Is this worth playing? |
| `playtest` | Design a playtest protocol |
| `game-qa` | QA testing |
| `game-visual-qa` | Visual quality audit |
| `game-ship` | Ready to ship / release process |
| `game-docs` | Post-release doc updates |
| `game-retro` | Sprint / milestone retrospective |
| `game-debug` | Debugging a **game** bug (desync, feel, physics) |

### Safety
| Skill | Use when |
|-------|----------|
| `careful` | Warn before destructive commands |
| `guard` | Restrict edits to one directory |
| `unfreeze` | Remove guard restrictions |

## Artifacts

- Parent chain: `PROJECT_PHASE.md`, `IMPLEMENTATION_HANDOFF.md` (project root or `docs/`)
- Game bundled skills: `docs/whereto-artifacts/` or `whereto-artifacts/`
- `domain-modeling`: `CONTEXT.md` + `docs/adr/` in the **target** project
- `prd`: PRD doc in the target project (path agreed with user)

## Pipeline (Game)

```
spark-lens / game-ideation / game-import
        → game-review → plan-design-review → prototype-slice-plan
        → implementation-handoff → [build]
        → feel-pass → gameplay-implementation-review
        → build-playability-review → game-qa → game-ship
        → game-docs → game-retro
```

## Pipeline (APP / WEB)

```
whereto (phase → roadmap → slice → IMPLEMENTATION_HANDOFF)
        → [optional] skills/prd          — if scope is a full feature spec
        → [optional] skills/prototype    — throwaway answer before committing
        → [optional] skills/domain-modeling + skills/codebase-design
        → skills/tdd                     — build from handoff test-first
        → skills/typeui-fundamentals     — UI/a11y while implementing surfaces
        → skills/diagnosing-bugs         — when stuck
```

`prototype-slice-plan` vs `prototype`: the first **chooses** what to validate; the second **builds throwaway code** to answer a design question.
