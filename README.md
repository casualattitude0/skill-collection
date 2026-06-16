# Skills

A curated workspace of Claude Code Agent Skills — **38 skills across 8 duty
folders**, each vetted by source reputation, install count, and content quality,
then downloaded directly from its upstream GitHub repo.

| Folder | Skills | Focus |
|--------|:------:|-------|
| `testing/` | 7 | TDD, Playwright, pytest, frontend testing |
| `react/` | 1 | React / Next.js performance |
| `vue/` | 9 | Vue 3 + ecosystem (Pinia, Router, Vite, Vitest, Nuxt) |
| `flutter/` | 10 | Flutter / Dart app development |
| `golang/` | 8 | Go language development |
| `unity/` | 1 | Unity DOTS/ECS |
| `documentation/` | 1 | Technical writing |
| `product-planning/` | 1 | Specs & requirements |

## Layout

Skills are organized into top-level folders by **duty** (what the skill helps you do):

```
.
├── testing/            # writing, running, and debugging tests
├── react/              # React / Next.js development
├── vue/                # Vue 3 + ecosystem (Pinia, Router, Vite, Vitest, Nuxt)
├── flutter/            # Flutter / Dart app development
├── golang/             # Go language development
├── unity/              # Unity game development
├── documentation/      # technical writing
├── product-planning/   # specs & requirements
└── impact-driven-writing/   # writing-focused skills collection (own git repo + remote)
```

## Curated skills

### testing/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `tdd` | mattpocock/skills | 251K | Universal red-green-refactor TDD methodology (language-agnostic) |
| `playwright-best-practices` | currents-dev | 51K | Deepest Playwright guide — ~40 reference files (E2E, flaky, POM, a11y, security…) |
| `playwright-cli` | microsoft/playwright-cli | 59K | CLI for snapshot-driven agentic browser automation |
| `webapp-testing` | anthropics/skills | 97K | Playwright web-app testing via Python helper scripts |
| `python-testing-patterns` | wshobson/agents | 24K | pytest fundamentals — AAA, fixtures, mocking, TDD |
| `frontend-testing-best-practices` | sergiodxa | 1.7K | Frontend testing rules (prefer E2E, minimize mocking) |
| `playwright-generate-test` | github/awesome-copilot | 13K | Generate Playwright tests by exploring a live site |

### react/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `react-best-practices` | vercel-labs/agent-skills | 480K | React/Next.js performance — 70 ranked rules across 8 categories |

### vue/  — `antfu/skills` (Anthony Fu — Vue / Vite / VueUse core team)

| Skill | Purpose |
|-------|---------|
| `vue` | Vue 3 reference — Composition API, `<script setup>` macros, reactivity, built-ins (from official vuejs/docs) |
| `vue-best-practices` | "Must-use" Vue workflow — architecture, reactivity, SFC, data flow |
| `vue-router-best-practices` | Vue Router 4 — guards, params, route lifecycle |
| `vue-testing-best-practices` | Vitest + Vue Test Utils, component testing, E2E |
| `pinia` | Official Vue state management — stores, getters, actions |
| `vueuse-functions` | VueUse composables |
| `vite` | Vite build tool — config, plugins, SSR, Rolldown migration |
| `vitest` | Vitest unit testing framework |
| `nuxt` | Nuxt full-stack Vue — SSR, auto-imports, file routing |

_~26K installs (top skill). Subsumes the `vuejs-ai`/`hyf0` sets, which are identical mirrors of each other — those were deliberately skipped to avoid duplication._

### flutter/  — official `flutter/skills` (Flutter team)

| Skill | Purpose |
|-------|---------|
| `flutter-apply-architecture-best-practices` | Layered MVVM + Repository architecture |
| `flutter-build-responsive-layout` | Adaptive layouts (LayoutBuilder/MediaQuery) |
| `flutter-fix-layout-issues` | Debug overflow / unbounded-constraint errors |
| `flutter-add-widget-test` | Component tests with WidgetTester |
| `flutter-add-integration-test` | Integration tests via Flutter Driver |
| `flutter-add-widget-preview` | Interactive widget previews |
| `flutter-implement-json-serialization` | `fromJson`/`toJson` model mapping |
| `flutter-setup-declarative-routing` | go_router / URL-based navigation |
| `flutter-setup-localization` | i18n (flutter_localizations + intl) |
| `flutter-use-http-package` | REST requests via the `http` package |

_~16–17.5K installs each. The official Flutter team's skill set._

### golang/  — `samber/cc-skills-golang` (samber — author of lo/mo/do)

| Skill | Purpose |
|-------|---------|
| `golang-code-style` | Clarity-focused style (what linters can't enforce) |
| `golang-naming` | Naming conventions (packages, errors, receivers…) |
| `golang-error-handling` | Wrapping, errors.Is/As, sentinels, slog logging |
| `golang-concurrency` | Goroutines, channels, errgroup, leak/race avoidance |
| `golang-context` | Idiomatic context.Context propagation & cancellation |
| `golang-testing` | Table-driven tests, testify, fuzzing, goleak |
| `golang-performance` | Allocation/CPU/GC optimization patterns |
| `golang-project-layout` | cmd/internal/pkg structure, modules, monorepos |

_~5–6K installs each. Curated core of an ~30-skill set (`golang-pro` deliberately skipped — overlaps)._

### unity/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `unity-ecs-patterns` | wshobson/agents | 8.2K | Unity DOTS/ECS — Jobs, Burst, archetypes. **ECS-specific**, not general MonoBehaviour gameplay. |

### documentation/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `documentation-writer` | github/awesome-copilot | 21K | Technical docs via the Diátaxis framework |

### product-planning/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `prd` | github/awesome-copilot | 19K | Product Requirements Documents — strict schema + discovery interview |

Each skill folder contains a `SKILL.md` (plus supporting references). Skills were
downloaded directly from their upstream GitHub repos (not via the `skills` CLI)
so this repo stays self-contained and version-controlled.

## Activation

This repo is the **single source of truth**. Skills are activated globally via
symlinks in `~/.claude/skills/`, each named by the skill's frontmatter `name`
and pointing back into the duty folder here — so editing a skill in this repo is
reflected in every project, and the CLI's flat install layout is avoided.

```bash
# activate a skill globally (run from the repo root)
ln -sfn "$PWD/<folder>/<skill>" ~/.claude/skills/<frontmatter-name>

# deactivate (the repo copy stays intact)
rm ~/.claude/skills/<frontmatter-name>
```

Symlinks live in `~/.claude/skills/` and are **not** part of this repo. New
symlinks take effect in the next Claude Code session.

## Adding a skill

1. Drop the skill folder into the matching duty folder (or create a new
   duty-named top-level folder).
2. Symlink it into `~/.claude/skills/` (see above).
3. Add a row to the relevant table in this README.

`impact-driven-writing/` is a self-contained project with its own git history and
GitHub remote (`casualattitude0/impact-driven-writing`). It is intentionally
ignored by this repo's git — work on it from inside that directory.
