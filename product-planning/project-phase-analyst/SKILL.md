---
name: project-phase-analyst
description: Figure out what phase a project is in and where it should go next. Point this at any Game, APP, or WEB project folder and it researches the whole thing — source, scripts, docs, assets (art/audio/etc.), plus git history — infers the project's real direction and destination, then works with the user to confirm current status, propose the next few phases, brainstorm cross-cutting ideas, and pin the final goal. Use whenever the user asks "what phase is this project in", "where should this project go next", "help me plan the roadmap for this game/app/site", "analyze this codebase and tell me what's next", "I inherited this project, what state is it in", or otherwise wants a situational read and forward plan for a whole project rather than a single feature.
---

# Project Phase Analyst

Your job is to stand inside an unfamiliar (or half-remembered) project, work out **where it is**, **where it's trying to go**, and hand the user a concrete map of **what to do next** — ending with a saved roadmap they can keep.

The user is usually the project's owner. They may know the project well but have lost the forest for the trees, or they may have just inherited it. Either way, the value you add is a clear-eyed outside read: what the evidence says the project *actually* is, versus what anyone hoped it would be, and the shortest honest path to the finish line.

Work through the five stages below in order. Stages 1–3 are research you do quietly; stage 4 is a conversation; stage 5 is the artifact. Don't skip the conversation — a roadmap the user didn't help shape won't survive contact with their real intentions.

## Stage 0 — Detect the project type

Before researching, classify the project as **Game**, **APP** (mobile/desktop application), or **WEB** (website / web app), because the milestones and signals that matter differ sharply between them. Detect from what's on disk rather than asking, then confirm your guess in one line once you reach stage 4.

Quick signals:
- **Game** — engine markers: `*.uproject` (Unreal), `project.godot` (Godot), Unity `Assets/` + `ProjectSettings/` + `*.meta`, `Cargo.toml` with `bevy`, `package.json` with `phaser`/`pixi.js`/`three`. Also: `Assets/` heavy with sprites/models/audio, level/scene files, `GDD`/design-doc mentions.
- **APP** — `pubspec.yaml` (Flutter), `*.xcodeproj`/`Package.swift` (iOS/macOS), `build.gradle` + `AndroidManifest.xml`, `package.json` with `react-native`/`electron`/`expo`, `Cargo.toml` with `tauri`.
- **WEB** — `index.html` at a web root, `next.config.*`, `nuxt.config.*`, `vite.config.*`, `astro.config.*`, `package.json` with `react`/`vue`/`svelte`/`@angular`, deploy configs (`vercel.json`, `netlify.toml`, `Dockerfile` serving a site).

If signals are mixed (e.g. a web-based game, or an app with a marketing site), pick the **primary deliverable** and note the secondary. If genuinely unclear, proceed with the shared method and ask the user in stage 4.

Once classified, **read the matching playbook** — it tells you which milestones, artifacts, and risks define each phase for that type:
- Game → [references/game.md](references/game.md)
- APP → [references/app.md](references/app.md)
- WEB → [references/web.md](references/web.md)

## Stage 1 — Research everything on disk

Build a complete picture of what exists. For anything larger than a few dozen files, spawn parallel `Explore` or `general-purpose` subagents so you cover the whole tree without drowning in it — one per concern (source, docs, assets, config/build) works well. Have each return a structured summary, not raw dumps.

Look at five layers:

1. **Source / scripts** — the actual logic. What subsystems exist, which look finished vs stubbed, where the `TODO`/`FIXME`/`HACK` density is. Stubs and TODO clusters are your best signal of the working edge.
2. **Documentation** — READMEs, design docs, GDDs, PRDs, ADRs, wikis, `docs/`, inline `NOTES`. This is *stated* intent — what someone said they wanted. Treat it as a claim to verify, not ground truth; docs rot faster than code.
3. **Assets** — images, audio, models, fonts, video, data files. Volume and polish of assets say a lot about phase: a folder of grey-box placeholders means prototype; a full art bible means production. Note obvious placeholder-vs-final gaps.
4. **Config / build / infra** — build scripts, CI, deploy configs, env files, store metadata, package manifests. Presence of release/deploy plumbing signals the project is reaching outward.
5. **Tests** — existence, coverage breadth, whether they pass. Test investment usually tracks how much the team trusts the thing to keep working.

As you go, keep a running list of: **what's done**, **what's in progress**, **what's stubbed or missing**, and **what's contradictory** (docs promise X, code has none of it).

## Stage 2 — Read the git history (only if `.git` exists)

Code is a snapshot; git is the *trajectory*. If there's no `.git`, skip this and say so — you'll lean harder on file mtimes and stubs instead.

Gather and interpret:
- `git log --oneline -50` and `git log --stat` on recent commits — what areas are hot, what the recent arc of work has been.
- Commit cadence (`git log --format=%ci`) — steady, bursty, or long-abandoned? A six-month gap changes everything about "what's next."
- `git status` and `git stash list` — uncommitted WIP reveals exactly what the user was last wrestling with.
- Branches (`git branch -a`) and tags/releases (`git tag`, `git log --tags`) — tags mean shipped versions; long-lived feature branches mean parked ambitions.

Synthesize momentum: is this project accelerating, cruising, stalling, or being revived? Say which — it drives whether the next phases should be ambitious or consolidating.

## Stage 3 — Define direction and destination

Now form a thesis. Reconcile three sources, and name it when they disagree:
- **Stated intent** — what the docs say the project is for.
- **Revealed intent** — what the code and commits actually build toward.
- **Momentum** — what git says is realistically happening.

Produce two things internally before you talk to the user:
1. **Current phase** — place the project on its type's phase ladder (from the playbook), with the specific evidence that puts it there. Be honest: "the README says 'beta' but there's no build pipeline, no store listing, and core save/load is stubbed — this is late prototype."
2. **Destination** — the finish line the evidence points at. If the evidence is ambiguous (a prototype could become a hobby toy or a commercial launch), hold two candidate destinations and let the user pick in stage 4.

## Stage 4 — Position the user for the next move (conversation)

This is the payoff. Present your read and steer the user to a decision. Keep it tight and lead with a recommendation at each step — don't dump a survey.

Do these four things, roughly in order but conversationally:

1. **Confirm current status.** State where you think the project is and the evidence, in a few lines. Ask the user to confirm or correct. Their correction is gold — it tells you which of your inferences were wrong before you build a plan on them.
2. **Propose the next few phases.** Lay out the 2–4 phases between here and the destination, each as a milestone with a clear exit criterion ("Phase: Vertical Slice — one level playable start-to-finish with final-quality core loop"). Sequence them by dependency and by what unblocks the most. Recommend which to start first and why.
3. **Brainstorm cross-cutting ideas.** Surface a handful of ideas that span phases or don't fit neatly in one — technical bets, scope cuts, risks to de-risk early, opportunities the current trajectory is missing. Frame them as options, flag the ones you'd actually take.
4. **Pin the final destination.** Get explicit agreement on the finish line, so the roadmap has a target. If the user picks a different destination than you inferred, re-check that the proposed phases still lead there.

Ask real questions where a choice is genuinely the user's to make (destination, scope, timeline appetite). Don't manufacture questions for things the evidence already settles.

## Stage 5 — Write the roadmap artifact

Once the user has confirmed status and destination, write the plan to a file so it outlives the chat. Default to `PROJECT_PHASE.md` at the project root (or `docs/PROJECT_PHASE.md` if a `docs/` folder exists). Mention the path to the user.

Use this structure:

```markdown
# Project Phase & Roadmap — [Project Name]

_Analysis date: [YYYY-MM-DD] · Type: [Game/APP/WEB]_

## Where it is now
[Current phase + the concrete evidence. Momentum read from git.]

## Where it's going
[The pinned destination, in one or two sentences.]

## Roadmap
### Phase 1 — [Name]  ← next
- **Goal:** [what "done" means]
- **Exit criterion:** [the observable thing that says this phase is complete]
- **Key work:** [3–6 bullets]

### Phase 2 — [Name]
...

## Cross-cutting ideas & risks
- [idea/risk] — [why it matters, when to act on it]

## Open questions
- [anything still undecided that will need a call later]
```

Keep the roadmap concrete and evidence-anchored — every phase should trace back to something you actually found in the project. A roadmap full of generic best-practice phases is worthless; one that says "your save system is stubbed and blocks everything downstream, do it first" is the whole point.
