# Skills

A curated library of Claude Code Agent Skills, organized by duty. Most are
installed from upstream GitHub repos; each is activated by symlinking it into
`~/.claude/skills/`.

| Folder | Skills | Focus |
|--------|:------:|-------|
| `testing/` | 6 | Playwright, pytest, frontend testing |
| `engineering/` | 12 | Matt Pocock's engineering workflow — TDD, diagnosis, PRDs, triage, module design |
| `productivity/` | 5 | Matt Pocock's non-code workflow — grilling, handoff, teaching |
| `react/` | 1 | React / Next.js performance |
| `vue/` | 9 | Vue 3 + ecosystem (Pinia, Router, Vite, Vitest, Nuxt) |
| `flutter/` | 10 | Flutter / Dart app development |
| `golang/` | 8 | Go language development |
| `unity/` | 1 | Unity DOTS/ECS patterns |
| `game/` | 29 | Game-dev workflow — design review, planning, playtest, ship (gstack-game) |
| `design/` | 2 | UI/UX design principles, accessibility & AI-frontend craft |
| `git/` | 2 | GitHub PR review-and-merge workflow, batch commits |
| `product-planning/` | 2 | Project phase analysis, roadmaps, PRDs |
| `impact-driven-writing/` | 5 | Writing — AI-ism removal, humanizer, showcase, docs |

## Activation

Skills use the [Agent Skills](https://agentskills.io) `SKILL.md` format. Most folders target **Claude Code** by default; several also ship multi-harness installers.

### Claude Code (default)

```bash
# activate (takes effect next Claude Code session)
ln -sfn "$PWD/<folder>/<skill>" ~/.claude/skills/<skill>

# deactivate (repo copy stays intact)
rm ~/.claude/skills/<skill>
```

### All agent IDEs — product-planning

`whereto` and `prd` install into Claude Code, Cursor, Codex, Gemini, OpenClaw, Hermes, and other harnesses:

```bash
# user scope — every project
./product-planning/bin/install.sh --user

# project scope — this repo only
./product-planning/bin/install.sh --project

# pick harnesses
./product-planning/bin/install.sh --user --harness claude,cursor,agents whereto
```

See [product-planning/whereto/INSTALL.md](product-planning/whereto/INSTALL.md) for the full IDE matrix and manual paths.

`impact-driven-writing/` is a local folder of writing-focused skills, indexed
below. It also carries a small `npx` installer (`bin/install.js`) for
distributing those skills.

## Skills

### testing/

| Skill | Source | Purpose |
|-------|--------|---------|
| `playwright-best-practices` | [currents-dev](https://github.com/currents-dev/playwright-best-practices-skill) | Deep Playwright guide — E2E, flaky tests, POM, a11y |
| `playwright-cli` | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | CLI for agentic browser automation |
| `webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | Playwright web-app testing via Python |
| `python-testing-patterns` | [wshobson/agents](https://github.com/wshobson/agents) | pytest — fixtures, mocking, TDD |
| `frontend-testing-best-practices` | [sergiodxa](https://github.com/sergiodxa/agent-skills) | Prefer E2E, minimize mocking |
| `playwright-generate-test` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | Generate Playwright tests from a live site |

### engineering/ — source: [mattpocock/skills](https://github.com/mattpocock/skills)

Matt Pocock's daily engineering workflow. **Model-invoked** skills fire automatically
when relevant; **User-invoked** (`/name`) skills are reachable only by you. Run
`/setup-matt-pocock-skills` once first — it configures the issue tracker, triage labels,
and doc layout the other skills rely on.

| Skill | Type | Purpose |
|-------|------|---------|
| `tdd` | model | Test-driven development — build features / fix bugs test-first, red-green-refactor |
| `diagnosing-bugs` | model | Diagnosis loop for hard bugs and performance regressions |
| `codebase-design` | model | Shared vocabulary for designing deep, testable, AI-navigable modules |
| `domain-modeling` | model | Build and sharpen a project's domain model / ubiquitous language |
| `prototype` | model | Throwaway prototype to answer a design question (state model, UI shape) |
| `setup-matt-pocock-skills` | user | One-time setup — issue tracker, triage labels, doc layout |
| `grill-with-docs` | user | Relentless interview to sharpen a plan, creating ADRs + glossary as you go |
| `improve-codebase-architecture` | user | Scan for deepening opportunities, HTML report, then grill the one you pick |
| `to-prd` | user | Turn the conversation into a PRD, publish to the issue tracker |
| `to-issues` | user | Break a plan/PRD into independently-grabbable tracer-bullet issues |
| `triage` | user | Move issues + external PRs through a triage state machine into agent-ready briefs |
| `ask-matt` | user | Router — ask which skill or flow fits your situation |

### productivity/ — source: [mattpocock/skills](https://github.com/mattpocock/skills)

| Skill | Type | Purpose |
|-------|------|---------|
| `grilling` | model | Interview you relentlessly to stress-test a plan before building |
| `grill-me` | user | Relentless interview to sharpen a plan or design |
| `handoff` | user | Compact the current conversation into a handoff doc for another agent |
| `teach` | user | Teach you a new skill or concept within the workspace |
| `writing-great-skills` | user | Reference for writing and editing skills well |

### react/

| Skill | Source | Purpose |
|-------|--------|---------|
| `react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React / Next.js performance rules |

### vue/ — source: [antfu/skills](https://github.com/antfu/skills)

| Skill | Purpose |
|-------|---------|
| `vue` | Vue 3 Composition API reference |
| `vue-best-practices` | Architecture, reactivity, SFC, data flow |
| `vue-router-best-practices` | Vue Router 4 — guards, params, lifecycle |
| `vue-testing-best-practices` | Vitest + Vue Test Utils |
| `pinia` | State management |
| `vueuse-functions` | VueUse composables |
| `vite` | Vite config, plugins, SSR |
| `vitest` | Unit testing framework |
| `nuxt` | Nuxt SSR, auto-imports, file routing |

### flutter/ — source: [flutter/skills](https://github.com/flutter/skills) (official)

| Skill | Purpose |
|-------|---------|
| `flutter-apply-architecture-best-practices` | Layered MVVM + Repository architecture |
| `flutter-build-responsive-layout` | Adaptive layouts |
| `flutter-fix-layout-issues` | Debug overflow / constraint errors |
| `flutter-add-widget-test` | Widget tests |
| `flutter-add-integration-test` | Integration tests (Flutter Driver) |
| `flutter-add-widget-preview` | Widget previews |
| `flutter-implement-json-serialization` | JSON model mapping |
| `flutter-setup-declarative-routing` | go_router navigation |
| `flutter-setup-localization` | i18n |
| `flutter-use-http-package` | REST via the `http` package |

### golang/ — source: [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang)

| Skill | Purpose |
|-------|---------|
| `golang-code-style` | Clarity-focused style |
| `golang-naming` | Naming conventions |
| `golang-error-handling` | Wrapping, errors.Is/As, slog |
| `golang-concurrency` | Goroutines, channels, errgroup |
| `golang-context` | `context.Context` propagation |
| `golang-testing` | Table-driven tests, testify, fuzzing |
| `golang-performance` | Allocation / CPU / GC optimization |
| `golang-project-layout` | cmd/internal/pkg structure, modules |

### unity/

| Skill | Source | Purpose |
|-------|--------|---------|
| `unity-ecs-patterns` | [wshobson/agents](https://github.com/wshobson/agents) | Unity DOTS/ECS — Jobs, Burst, archetypes |

### game/ — source: [fagemx/gstack-game](https://github.com/fagemx/gstack-game)

A self-contained package of 29 game-dev skills sharing `bin/` tooling and a
`gstack-config` system. Strongest in design review and planning, with dev-phase
support. Entry point `/gstack-game` routes to the right sub-skill; run
`game/bin/install.sh` to wire up the shared config.

| Skill | Purpose |
|-------|---------|
| `game-ideation` / `spark-lens` / `game-import` | Brainstorm ideas, generate creative sparks, turn docs into a GDD |
| `game-direction` / `game-review` / `pitch-review` | Review strategy, design docs, and pitches |
| `game-eng-review` / `gameplay-implementation-review` / `balance-review` | Technical, code, and economy/balance review |
| `player-experience` / `game-ux-review` / `playtest` | Simulate player experience, review UX, design playtests |
| `game-qa` / `game-visual-qa` / `game-debug` / `asset-review` | QA, visual audits, debugging, asset pipeline review |
| `game-ship` / `game-retro` / `game-docs` / `game-codex` | Ship/PR, retrospectives, doc updates, adversarial second opinion |
| `careful` / `guard` / `unfreeze` | Edit-scope guardrails for production/live systems |

### design/

| Skill | Source | Purpose |
|-------|--------|---------|
| `typeui-fundamentals` | [bergside/typeui](https://github.com/bergside/typeui) | Design-system-agnostic UI/UX principles — hierarchy, 30 UX laws, typography, spacing, WCAG accessibility |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Production-grade frontend design & iteration — 23 `/impeccable` commands (craft, shape, audit, critique, polish, animate…), 44 deterministic AI-slop detector rules, bundled Node tooling |

### product-planning/

Portable planning skills — [agentskills.io](https://agentskills.io) format, multi-IDE install via `product-planning/bin/install.sh`.

| Skill | Source | Purpose |
|-------|--------|---------|
| `whereto` | local | Project phase analysis — evidence-scored placement, roadmap, scored next slice, implementation handoff (`PROJECT_PHASE.md` + `IMPLEMENTATION_HANDOFF.md`) for Game/APP/WEB projects. [Install guide](product-planning/whereto/INSTALL.md) |
| `prd` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | Product Requirements Documents |

### git/

| Skill | Source | Purpose |
|-------|--------|---------|
| `github-pr-workflow` | local | Open a PR (source → target), review it with a sub-agent (Pass/Failed), then merge or comment-and-fix. Driven by `gh` via `driver.mjs`. |
| `git-commit` | [anthropics/skills](https://github.com/anthropics/skills) | Batch-commit changes into logical, Conventional Commits-style commits — `/git-commit all` or `/git-commit current` |

### impact-driven-writing/ — writing skills

| Skill | Source / Author | Purpose |
|-------|-----------------|---------|
| `avoid-ai-writing` | [Conor Bronsdon](https://github.com/conorbronsdon/avoid-ai-writing) | Audit and rewrite content to remove AI-isms |
| `humanizer-tw` | [yelban](https://github.com/yelban/humanizer.tw) | 去除中文 AI 生成痕跡（台灣風格） |
| `humanizer-zh-tw` | [kevintsai1202](https://github.com/kevintsai1202/Humanizer-zh-TW) | 去除 AI 寫作特徵（繁體中文） |
| `showcase-writer` | original | Resume bullets, case studies, interview stories |
| `documentation-writer` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | Technical docs via the Diátaxis framework |

The resume / job-search skills (`career/`) are vendored from
[Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills).

Vendored writing skills retain their upstream licenses; credit belongs to the
original authors linked above.
