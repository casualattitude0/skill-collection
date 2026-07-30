# Skill Manifest

Tracks which vendored skills in this repo are symlinked into `~/.claude/skills/`.
Maintained by `casualattitude0-skill-collection/skill-curator`. Run `/skill-curator`
after vendoring a new skill to re-scan for overlaps and re-sync symlinks.

Covers the vendored collection plus `local-skills/career/`, which was brought
under management on 2026-07-30 — leaving 22 always-on skills outside the
manifest meant 814 tokens in every conversation with no way to turn them off.
Anything else in `local-skills/` is still unmanaged, as is `find-skills`, which
points outside this repo.

A `disabled` row does not delete anything: the skill stays on disk and flipping
the row back to `enabled` plus a `sync.sh` run restores it.

## Skills

| Skill | Source dir | Status | Reason |
|---|---|---|---|
| nuxt | antfu-skills/nuxt | disabled | Vue stack — disabled 2026-07-30, not in active use |
| pinia | antfu-skills/pinia | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vite | antfu-skills/vite | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vitest | antfu-skills/vitest | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vue | antfu-skills/vue | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vue-best-practices | antfu-skills/vue-best-practices | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vue-router-best-practices | antfu-skills/vue-router-best-practices | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vue-testing-best-practices | antfu-skills/vue-testing-best-practices | disabled | Vue stack — disabled 2026-07-30, not in active use |
| vueuse-functions | antfu-skills/vueuse-functions | disabled | Vue stack — disabled 2026-07-30, not in active use |
| algorithmic-art | anthropics-skills/algorithmic-art | enabled |  |
| brand-guidelines | anthropics-skills/brand-guidelines | disabled | applies Anthropic's own brand colors and typography — not our brand, so it never applies here |
| doc-coauthoring | anthropics-skills/doc-coauthoring | enabled | kept over documentation-writer — a full co-authoring workflow, not a pointer |
| frontend-design | anthropics-skills/frontend-design | disabled | 1.3k words of aesthetic direction, subsumed by impeccable (50k) and typeui-fundamentals (44k) |
| internal-comms | anthropics-skills/internal-comms | enabled |  |
| mcp-builder | anthropics-skills/mcp-builder | enabled |  |
| slack-gif-creator | anthropics-skills/slack-gif-creator | enabled |  |
| theme-factory | anthropics-skills/theme-factory | enabled |  |
| web-artifacts-builder | anthropics-skills/web-artifacts-builder | enabled |  |
| webapp-testing | anthropics-skills/webapp-testing | enabled | kept alongside playwright-cli — Python/local-app debugging with browser-log capture is a distinct job |
| typeui-fundamentals | bergside-typeui/typeui-fundamentals | enabled | kept over frontend-design — principles and WCAG reference, complementary to impeccable |
| commitify | casualattitude0-skill-collection/commitify | enabled |  |
| git-hot-fix | casualattitude0-skill-collection/git-hot-fix | enabled |  |
| github-pr-merge | casualattitude0-skill-collection/github-pr-merge | enabled |  |
| github-pr-workflow | casualattitude0-skill-collection/github-pr-workflow | enabled |  |
| github-pr-workflow-only | casualattitude0-skill-collection/github-pr-workflow-only | enabled |  |
| local-transcribe | casualattitude0-skill-collection/local-transcribe | enabled |  |
| model-selection | casualattitude0-skill-collection/model-selection | enabled |  |
| showcase-writer | casualattitude0-skill-collection/showcase-writer | enabled |  |
| skill-curator | casualattitude0-skill-collection/skill-curator | enabled |  |
| skill-verdict | casualattitude0-skill-collection/skill-verdict | enabled |  |
| ssh-account-doctor | casualattitude0-skill-collection/ssh-account-doctor | enabled |  |
| unify | casualattitude0-skill-collection/unify | enabled |  |
| whereto | casualattitude0-skill-collection/whereto | enabled |  |
| avoid-ai-writing | conorbronsdon-avoid-ai-writing/avoid-ai-writing | enabled |  |
| playwright-best-practices | currents-dev-playwright-best-practices-skill/playwright-best-practices | enabled | kept — Playwright-specific reference, not redundant with the framework-agnostic frontend-testing-best-practices |
| ponytail | dietrichgebert-ponytail/ponytail | enabled |  |
| ponytail-audit | dietrichgebert-ponytail/ponytail-audit | enabled |  |
| ponytail-debt | dietrichgebert-ponytail/ponytail-debt | enabled |  |
| ponytail-gain | dietrichgebert-ponytail/ponytail-gain | enabled |  |
| ponytail-help | dietrichgebert-ponytail/ponytail-help | enabled |  |
| ponytail-review | dietrichgebert-ponytail/ponytail-review | enabled |  |
| flutter-add-integration-test | flutter-skills/flutter-add-integration-test | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-add-widget-preview | flutter-skills/flutter-add-widget-preview | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-add-widget-test | flutter-skills/flutter-add-widget-test | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-apply-architecture-best-practices | flutter-skills/flutter-apply-architecture-best-practices | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-build-responsive-layout | flutter-skills/flutter-build-responsive-layout | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-fix-layout-issues | flutter-skills/flutter-fix-layout-issues | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-implement-json-serialization | flutter-skills/flutter-implement-json-serialization | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-setup-declarative-routing | flutter-skills/flutter-setup-declarative-routing | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-setup-localization | flutter-skills/flutter-setup-localization | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| flutter-use-http-package | flutter-skills/flutter-use-http-package | disabled | Flutter stack — disabled 2026-07-30, not in active use |
| documentation-writer | github-awesome-copilot/documentation-writer | disabled | 378-word Diátaxis pointer, subsumed by doc-coauthoring's fuller workflow |
| playwright-generate-test | github-awesome-copilot/playwright-generate-test | disabled | narrowest of the three browser drivers; playwright-cli plus playwright-best-practices cover it |
| prd | github-awesome-copilot/prd | enabled |  |
| graphify | graphify-labs-graphify/graphify | enabled |  |
| humanizer-zh-tw | kevintsai1202-humanizer-zh-tw/humanizer-zh-tw | disabled | superseded by humanizer-tw — identical trigger string, and native Chinese patterns beat translated English tells |
| academic-cv-builder | local-skills/career/academic-cv-builder | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| career-changer-translator | local-skills/career/career-changer-translator | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| cover-letter-generator | local-skills/career/cover-letter-generator | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| creative-portfolio-resume | local-skills/career/creative-portfolio-resume | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| executive-resume-writer | local-skills/career/executive-resume-writer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| interview-prep-generator | local-skills/career/interview-prep-generator | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| job-description-analyzer | local-skills/career/job-description-analyzer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| linkedin-profile-optimizer | local-skills/career/linkedin-profile-optimizer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| offer-comparison-analyzer | local-skills/career/offer-comparison-analyzer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| portfolio-case-study-writer | local-skills/career/portfolio-case-study-writer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| reference-list-builder | local-skills/career/reference-list-builder | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-ats-optimizer | local-skills/career/resume-ats-optimizer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-bullet-writer | local-skills/career/resume-bullet-writer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-formatter | local-skills/career/resume-formatter | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-quantifier | local-skills/career/resume-quantifier | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-section-builder | local-skills/career/resume-section-builder | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-tailor | local-skills/career/resume-tailor | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| resume-version-manager | local-skills/career/resume-version-manager | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| salary-negotiation-prep | local-skills/career/salary-negotiation-prep | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| targeted-cv-generator | local-skills/career/targeted-cv-generator | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| tech-resume-optimizer | local-skills/career/tech-resume-optimizer | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| xue-hesheng-resume | local-skills/career/xue-hesheng-resume | disabled | job-search skill — never fires during development work; brought under the manifest 2026-07-30 so it is toggleable |
| ask-matt | mattpocock-skills/ask-matt | enabled |  |
| code-review | mattpocock-skills/code-review | enabled |  |
| codebase-design | mattpocock-skills/codebase-design | enabled |  |
| diagnosing-bugs | mattpocock-skills/diagnosing-bugs | enabled |  |
| domain-modeling | mattpocock-skills/domain-modeling | enabled |  |
| grill-me | mattpocock-skills/grill-me | enabled |  |
| grill-with-docs | mattpocock-skills/grill-with-docs | enabled |  |
| grilling | mattpocock-skills/grilling | enabled |  |
| handoff | mattpocock-skills/handoff | enabled |  |
| implement | mattpocock-skills/implement | enabled |  |
| improve-codebase-architecture | mattpocock-skills/improve-codebase-architecture | enabled |  |
| prototype | mattpocock-skills/prototype | enabled |  |
| research | mattpocock-skills/research | enabled |  |
| resolving-merge-conflicts | mattpocock-skills/resolving-merge-conflicts | enabled |  |
| setup-matt-pocock-skills | mattpocock-skills/setup-matt-pocock-skills | enabled |  |
| tdd | mattpocock-skills/tdd | enabled |  |
| teach | mattpocock-skills/teach | enabled |  |
| to-spec | mattpocock-skills/to-spec | enabled |  |
| to-tickets | mattpocock-skills/to-tickets | enabled |  |
| triage | mattpocock-skills/triage | enabled |  |
| wayfinder | mattpocock-skills/wayfinder | enabled |  |
| writing-great-skills | mattpocock-skills/writing-great-skills | enabled |  |
| playwright-cli | microsoft-playwright-cli/playwright-cli | enabled | kept as the general browser driver over playwright-generate-test |
| agent-reach | panniantong-agent-reach/agent-reach | enabled |  |
| impeccable | pbakaus-impeccable/impeccable | enabled | kept over frontend-design — process and tooling, complementary to typeui-fundamentals |
| golang-code-style | samber-cc-skills-golang/golang-code-style | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-concurrency | samber-cc-skills-golang/golang-concurrency | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-context | samber-cc-skills-golang/golang-context | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-error-handling | samber-cc-skills-golang/golang-error-handling | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-naming | samber-cc-skills-golang/golang-naming | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-performance | samber-cc-skills-golang/golang-performance | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-project-layout | samber-cc-skills-golang/golang-project-layout | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| golang-testing | samber-cc-skills-golang/golang-testing | disabled | Go stack — disabled 2026-07-30, the corpus's heaviest block (~2.0k tokens across 8 skills) and not in active use |
| frontend-testing-best-practices | sergiodxa-agent-skills/frontend-testing-best-practices | enabled | kept — framework-agnostic principles; specific plus agnostic is not an overlap |
| react-best-practices | vercel-labs-agent-skills/react-best-practices | enabled |  |
| python-testing-patterns | wshobson-agents/python-testing-patterns | enabled |  |
| humanizer-tw | yelban-humanizer.tw/humanizer-tw | enabled | kept over humanizer-zh-tw — native Chinese patterns, Taiwanese voice, plus Grep/Glob so it can scan files |

## Resolved overlap groups

Audited 2026-07-30. Every skill named here carries a `Reason` in the table
above, so the group needs no re-litigating on the next run.

- **Chinese anti-AI-writing** — kept `humanizer-tw`, disabled `humanizer-zh-tw`.
  Both declared the identical `metadata.trigger` string and the same five-step
  body, both descending from `blader/humanizer`. `humanizer-tw` targets native
  Chinese failure modes (翻譯腔, 互聯網黑話, 書面語過重); `humanizer-zh-tw` carried
  English tells in translation (em-dash overuse, rule-of-three). Trade accepted:
  the disabled one had 42 pattern headings against 22.
  `avoid-ai-writing` is English-scoped and was never part of this group.
- **Browser drivers** — kept `playwright-cli` and `webapp-testing`, disabled
  `playwright-generate-test`. The three genuinely competed to drive a browser;
  the disabled one was a 378-word MCP wrapper covered by the other two.
- **Frontend-testing advice** — kept both `playwright-best-practices` and
  `frontend-testing-best-practices`. Recorded as a five-skill "Playwright
  cluster" in the first pass, which was over-grouped: these two are
  Playwright-specific and framework-agnostic respectively, and specific plus
  agnostic is not an overlap.
- **Design advice** — kept `impeccable` and `typeui-fundamentals`, disabled
  `frontend-design`. The kept pair split process/tooling from
  principles/WCAG; the disabled one was 1.3k words subsumed by both.
- **Docs authoring** — kept `doc-coauthoring`, disabled `documentation-writer`
  (a 378-word Diátaxis pointer).

Also disabled, not an overlap: `brand-guidelines`, which applies Anthropic's
own brand colors and typography and so never applies here.

## Considered and kept

- **Grilling trio** — `grill-me` (typed), `grilling` (model-invoked),
  `grill-with-docs` (typed, plus ADRs). `grill-me` and `grilling` are the same
  interview split by invocation mode, which is upstream's deliberate pairing
  rather than accidental redundancy. Disabling `grilling` would stop the model
  reaching for it unprompted; revisit only if that never gets used.

## Next audit — where the weight actually is

Resolving the groups above cut ~1.1k of ~30k description bytes, about 4%. The
remaining volume is concentrated rather than duplicated, so it cannot be
reclaimed by dedup — only by dropping capability:

- `agent-reach` alone is 1,972 bytes (6.5% of the total)
- then `playwright-best-practices` 998, `impeccable` 909, `ponytail` 865
- the eight `golang-*` skills together run ~4,000

None are redundant. Cutting any is a "do I still use this?" call, not an
overlap call, so `/skill-curator` will not propose them.
