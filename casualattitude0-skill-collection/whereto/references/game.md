# Game project playbook

Games are judged by whether they're *fun* and *finishable*, and both are invisible in a file listing — you have to infer them from what's been built. The classic trap is a project with gorgeous menus and a title screen but no actual gameplay loop: lots of files, almost no game. Weight your read toward the **core loop** (the thing the player does over and over) and toward **content volume**, not toward polish on the shell.

Use with [phase-scoring.md](phase-scoring.md) for placement and [next-slice.md](next-slice.md) for slice patterns.

## Phase ladder

Place the project on this ladder using evidence, not the README's claim.

### 1. Concept / Prototype
Testing whether the core mechanic is fun. Grey-box art, placeholder audio, one messy scene, throwaway code.

**Evidence bullets:**
- Mechanics scripts exist (input, player controller, core verb) but assets are mostly placeholders
- No save system or save is stubbed/`TODO`
- No settings, pause, or full menu flow — or menus exist without gameplay behind them
- One scene/level or sandbox test scene; no content pipeline
- `TODO`/`FIXME` clusters in gameplay scripts, not polish scripts

### 2. Vertical Slice
One small slice (a level, a match) playable start-to-finish at near-final quality, proving the whole stack works together.

**Evidence bullets:**
- Exactly one (or very few) polished level/scene with final-quality core loop
- Player can complete that slice start-to-finish without debug shortcuts
- Core feedback chain present (action → response → consequence) in that slice
- Still only one of everything — one enemy type, one biome, etc.
- Save may work for that slice only

### 3. Production
Content is being mass-produced against a proven template.

**Evidence bullets:**
- Many levels/scenes/entities following a repeated data-driven pattern
- Asset pipeline or import tools; growing content-data files (JSON/YAML/resources)
- Commits add content volume, not new systems
- Level editor or procedural tools may appear
- Placeholder ratio dropping across new content

### 4. Alpha
Feature-complete (all systems present, even if rough); now it's about content and bugs.

**Evidence bullets:**
- Save/load, settings, audio mixer, full menu flow all present (rough OK)
- All mechanics from GDD exist in some form
- Lots of `TODO: balance` / tuning comments
- Multiple levels/scenes but not all content-complete
- QA notes or internal playtest docs may appear

### 5. Beta
Content-complete; focus is polish, balance, performance, playtesting.

**Evidence bullets:**
- No new features landing in recent git — commits are tuning/bugfix/optimization
- Content count matches or nears GDD targets
- Playtest feedback docs or bug trackers active
- Performance profiling commits
- Final art/audio replacing remaining placeholders

### 6. Gold / Launch
Shipping.

**Evidence bullets:**
- Store/platform metadata (Steam depot, `*.plist`, console SDK folders)
- Build/packaging scripts; release CI
- Version tags; release branches
- Age-rating/compliance files if applicable

### 7. Live-ops / Post-launch
Patches, DLC, seasons, community.

**Evidence bullets:**
- Post-launch version tags; hotfix branches
- Analytics/telemetry SDK integrated
- Content-update cadence in commits
- Season/battle-pass data files or DLC manifests

## What to look for

- **Engine & structure** — Unity (`Assets/`, `ProjectSettings/`, `.meta`), Unreal (`*.uproject`, `Content/`, `Source/`), Godot (`project.godot`, `*.tscn`, `*.gd`), or custom/framework (Bevy, Phaser, LÖVE, MonoGame). The engine tells you where scenes, prefabs, and scripts live.
- **The core loop** — find the scripts that implement player action → feedback → progression. Is it complete, or are input and a player controller all that exist?
- **Content inventory** — count levels/scenes/maps, enemies/characters, items. Content count vs. a target (if a GDD states one) locates you between vertical slice and beta.
- **Asset polish gap** — ratio of placeholder (grey-box, `_placeholder`, programmer-art, temp audio) to final assets. This is the single best phase tell for a game.
- **Systems shell** — save/load, settings, audio mixer, localization, input remapping, pause. Their absence caps the project below alpha regardless of how fun the core is.
- **Design docs** — a GDD, mechanics docs, or level-design notes state the *intended* scope. Compare against what's built to measure remaining distance.
- **Shippability** — platform SDKs, store pages, build automation, age-rating/compliance files signal a real launch intent vs. a portfolio piece.

## Destinations to disambiguate in conversation

A game prototype can be aimed at very different finish lines — pin which one:
- **Portfolio / learning piece** — finish a vertical slice, polish it, done. No store, no live-ops.
- **Commercial launch** — full production → beta → store release on specific platforms.
- **Live-service** — launch is the *start*; the roadmap must include post-launch content cadence and telemetry.
- **Game jam / experiment** — timeboxed; the destination is "submit," and scope should be cut to fit.

## Common failure modes to flag

- Polished menus/UI wrapping a nonexistent or unfinished core loop.
- No save system this late — it blocks alpha and is often underestimated.
- Content built by hand with no pipeline, making production phase unsustainable.
- Scope in the GDD wildly exceeds momentum in git — the honest move may be a scope cut, not a longer roadmap.

## Typical next-slice types (see [next-slice.md](next-slice.md))

| Situation | Slice pattern |
|-----------|---------------|
| Core loop unproven | Mechanic prototype — zero progression, test the verb |
| Loop works, one level only | Vertical slice — one level E2E at target quality |
| Content exists, no save/menus | Systems shell — save, settings, menu flow |
| Slice proven, need scale | Content pipeline — prove repeatable level production |

Deeper Game slice catalog (mechanic / onboarding / progression / combat / economy / vertical): `skills/prototype-slice-plan/references/slice-types.md` in this pack.

## Bundled deep tools (same pack)

When research or conversation shows a specialized need, read the matching skill under `skills/` — do not leave this pack:

| Finding | Tool |
|---------|------|
| GDD exists but unreviewed / design risk high | `skills/game-review` |
| Asset polish / pipeline blocking production | `skills/asset-review` |
| Economy / faucet-sink unclear | `skills/balance-review` |
| FTUE / churn / persona friction | `skills/player-experience` |
| Playable build, feel unknown | `skills/feel-pass` |
| Playable build, "is it worth playing?" | `skills/build-playability-review` |
| Don't know which tool | `skills/triage` |

Catalog: [skills/README.md](../skills/README.md).
