# Skills

A curated library of Claude Code Agent Skills, organized by duty. Most are
installed from upstream GitHub repos; each is activated by symlinking it into
`~/.claude/skills/`.

| Folder | Skills | Focus |
|--------|:------:|-------|
| `testing/` | 7 | TDD, Playwright, pytest, frontend testing |
| `react/` | 1 | React / Next.js performance |
| `vue/` | 9 | Vue 3 + ecosystem (Pinia, Router, Vite, Vitest, Nuxt) |
| `flutter/` | 10 | Flutter / Dart app development |
| `golang/` | 8 | Go language development |
| `unity/` | 1 | Unity DOTS/ECS patterns |
| `product-planning/` | 1 | Product requirements docs |
| `impact-driven-writing/` | 5 | Writing — AI-ism removal, humanizer, showcase, docs |

## Activation

```bash
# activate (takes effect next Claude Code session)
ln -sfn "$PWD/<folder>/<skill>" ~/.claude/skills/<skill>

# deactivate (repo copy stays intact)
rm ~/.claude/skills/<skill>
```

`impact-driven-writing/` is a self-contained writing-skills project kept as a
gitignored folder here (upstream:
[`casualattitude0/impact-driven-writing`](https://github.com/casualattitude0/impact-driven-writing)).
It ships its own `npx` installer for distributing those skills, and is indexed below.

## Skills

### testing/

| Skill | Source | Purpose |
|-------|--------|---------|
| `tdd` | [mattpocock/skills](https://github.com/mattpocock/skills) | Red-green-refactor TDD, language-agnostic |
| `playwright-best-practices` | [currents-dev](https://github.com/currents-dev/playwright-best-practices-skill) | Deep Playwright guide — E2E, flaky tests, POM, a11y |
| `playwright-cli` | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | CLI for agentic browser automation |
| `webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | Playwright web-app testing via Python |
| `python-testing-patterns` | [wshobson/agents](https://github.com/wshobson/agents) | pytest — fixtures, mocking, TDD |
| `frontend-testing-best-practices` | [sergiodxa](https://github.com/sergiodxa/agent-skills) | Prefer E2E, minimize mocking |
| `playwright-generate-test` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | Generate Playwright tests from a live site |

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

### product-planning/

| Skill | Source | Purpose |
|-------|--------|---------|
| `prd` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | Product Requirements Documents |

### impact-driven-writing/ — writing skills

Lives in the separate [`casualattitude0/impact-driven-writing`](https://github.com/casualattitude0/impact-driven-writing) repo.

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
