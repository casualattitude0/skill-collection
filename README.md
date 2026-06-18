# Skills

A curated library of Claude Code Agent Skills — **37 skills across 7 duty
folders** — ready to activate globally in any project.

| Folder | Skills | What it covers |
|--------|:------:|----------------|
| `testing/` | 7 | TDD, Playwright, pytest, frontend testing |
| `react/` | 1 | React / Next.js performance |
| `vue/` | 9 | Vue 3 + ecosystem (Pinia, Router, Vite, Vitest, Nuxt) |
| `flutter/` | 10 | Flutter / Dart app development |
| `golang/` | 8 | Go language development |
| `unity/` | 1 | Unity DOTS/ECS patterns |
| `product-planning/` | 1 | Product requirements docs |

---

## Install a skill

Skills are activated as symlinks in `~/.claude/skills/`. Each symlink points
back into this repo, so editing a skill here is immediately reflected everywhere
— no reinstall needed.

### 1. Clone the repo (once)

```bash
git clone https://github.com/AaronXue0/Skills.git ~/Developer/Skills
cd ~/Developer/Skills
```

### 2. Activate a skill

```bash
# Syntax
ln -sfn "$PWD/<folder>/<skill-name>" ~/.claude/skills/<skill-name>

# Examples
ln -sfn "$PWD/testing/tdd" ~/.claude/skills/tdd
ln -sfn "$PWD/vue/vue" ~/.claude/skills/vue
ln -sfn "$PWD/flutter/flutter-build-responsive-layout" ~/.claude/skills/flutter-build-responsive-layout
```

The symlink takes effect in the **next Claude Code session** you open.

### 3. Verify activation

```bash
ls ~/.claude/skills/
```

You should see your activated skill names listed. Claude Code picks them up
automatically — no config change needed.

### 4. Deactivate a skill

```bash
rm ~/.claude/skills/<skill-name>
# The repo copy stays intact; only the activation link is removed.
```

---

## Repository layout

```
.
├── testing/            # writing, running, and debugging tests
├── react/              # React / Next.js development
├── vue/                # Vue 3 + ecosystem
├── flutter/            # Flutter / Dart app development
├── golang/             # Go language development
├── unity/              # Unity game development (ECS/DOTS)
├── product-planning/   # specs & requirements
└── impact-driven-writing/  # writing skills (separate git repo + remote)
```

`impact-driven-writing/` is a self-contained project with its own git history
(`casualattitude0/impact-driven-writing`). It is intentionally excluded from
this repo — work on it from inside that directory.

---

## Skills reference

### testing/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `tdd` | mattpocock/skills | 251K | Language-agnostic red-green-refactor TDD |
| `playwright-best-practices` | currents-dev | 51K | Deep Playwright guide — E2E, flaky tests, POM, a11y, security |
| `playwright-cli` | microsoft/playwright-cli | 59K | CLI for snapshot-driven agentic browser automation |
| `webapp-testing` | anthropics/skills | 97K | Playwright web-app testing via Python helper scripts |
| `python-testing-patterns` | wshobson/agents | 24K | pytest — AAA, fixtures, mocking, TDD |
| `frontend-testing-best-practices` | sergiodxa | 1.7K | Prefer E2E, minimize mocking |
| `playwright-generate-test` | github/awesome-copilot | 13K | Generate Playwright tests from a live site |

### react/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `react-best-practices` | vercel-labs/agent-skills | 480K | React/Next.js performance — 70 ranked rules across 8 categories |

### vue/  — `antfu/skills` (Vue / Vite / VueUse core team)

| Skill | Purpose |
|-------|---------|
| `vue` | Vue 3 reference — Composition API, `<script setup>`, reactivity, built-ins |
| `vue-best-practices` | Architecture, reactivity, SFC, data flow |
| `vue-router-best-practices` | Vue Router 4 — guards, params, lifecycle |
| `vue-testing-best-practices` | Vitest + Vue Test Utils, component testing, E2E |
| `pinia` | Official Vue state management — stores, getters, actions |
| `vueuse-functions` | VueUse composables reference |
| `vite` | Vite config, plugins, SSR, Rolldown migration |
| `vitest` | Vitest unit testing framework |
| `nuxt` | Nuxt full-stack Vue — SSR, auto-imports, file routing |

_~26K installs (top skill in the set)._

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

### golang/  — `samber/cc-skills-golang`

| Skill | Purpose |
|-------|---------|
| `golang-code-style` | Clarity-focused style (what linters can't enforce) |
| `golang-naming` | Package, error, and receiver naming conventions |
| `golang-error-handling` | Wrapping, errors.Is/As, sentinels, slog logging |
| `golang-concurrency` | Goroutines, channels, errgroup, leak/race avoidance |
| `golang-context` | Idiomatic `context.Context` propagation and cancellation |
| `golang-testing` | Table-driven tests, testify, fuzzing, goleak |
| `golang-performance` | Allocation/CPU/GC optimization patterns |
| `golang-project-layout` | cmd/internal/pkg structure, modules, monorepos |

_~5–6K installs each._

### unity/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `unity-ecs-patterns` | wshobson/agents | 8.2K | Unity DOTS/ECS — Jobs, Burst, archetypes |

### product-planning/

| Skill | Source | Installs | Purpose |
|-------|--------|----------|---------|
| `prd` | github/awesome-copilot | 19K | Product Requirements Documents — strict schema + discovery interview |

---

## Add a skill to this repo

1. Place the skill folder inside the matching duty folder (create a new
   top-level folder if no existing duty fits).
2. Symlink it into `~/.claude/skills/` (see **Install a skill** above).
3. Add a row to the relevant table in this README.

Skills were downloaded directly from their upstream GitHub repos — not via the
`skills` CLI — so this repo is self-contained and version-controlled.
