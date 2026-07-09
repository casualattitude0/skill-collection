# Game project playbook

Games are judged by whether they're *fun* and *finishable*, and both are invisible in a file listing — you have to infer them from what's been built. The classic trap is a project with gorgeous menus and a title screen but no actual gameplay loop: lots of files, almost no game. Weight your read toward the **core loop** (the thing the player does over and over) and toward **content volume**, not toward polish on the shell.

## Phase ladder

Place the project on this ladder using evidence, not the README's claim.

1. **Concept / Prototype** — testing whether the core mechanic is fun. Grey-box art, placeholder audio, one messy scene, throwaway code. Signal: mechanics scripts exist but assets are almost all placeholders; no menus/save/settings.
2. **Vertical Slice** — one small slice (a level, a match) playable start-to-finish at near-final quality, proving the whole stack works together. Signal: one polished level/scene, final-quality core loop, but only one of everything.
3. **Production** — content is being mass-produced against a proven template. Signal: many levels/scenes/entities following a repeated pattern, asset pipelines, growing content-data files.
4. **Alpha** — feature-complete (all systems present, even if rough); now it's about content and bugs. Signal: save/load, settings, full menu flow, all mechanics present; lots of `TODO: balance`.
5. **Beta** — content-complete; focus is polish, balance, performance, playtesting. Signal: no new features landing in git, commits are tuning/bugfix/optimization; QA or feedback docs.
6. **Gold / Launch** — shipping. Signal: store/platform metadata (Steam depot config, `*.plist`, console SDK), build/packaging scripts, release tag.
7. **Live-ops / Post-launch** — patches, DLC, seasons, community. Signal: post-launch tags, hotfix branches, analytics/telemetry, content-update cadence.

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
