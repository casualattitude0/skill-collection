# Phase Scoring — Evidence Rubric

Use this after reading the type playbook (`game.md`, `app.md`, or `web.md`). Phase placement is **evidence-based**, not label-based.

## Core rules

1. **Never accept a README phase claim without checking signals.** If README says "beta" but required beta signals are missing, record: `Stated: beta · Evidence: [actual phase]`.
2. **Place at the highest phase where ALL required signals for that step are met.** Missing one required signal → stay at the phase below.
3. **Contradictions lower confidence.** Each major contradiction drops confidence one band.
4. **Git momentum modulates ambition.** Stalling or abandoned projects should not get aggressive multi-phase roadmaps without a consolidation slice first.

## Confidence bands

| Band | Meaning |
|------|---------|
| **High** | 0–1 minor contradictions; clear signal cluster for one phase |
| **Medium** | 2–3 contradictions OR stated intent ≠ revealed intent |
| **Low** | Major contradictions, mixed deliverables, or insufficient files to tell |

Always report: `Phase: [name] · Confidence: [High/Medium/Low] · Stated claim: [what docs say]`

## Scorecard template (fill internally before Stage 4)

```
PHASE SCORECARD
═══════════════
Type: [Game/APP/WEB]
Stated phase (from docs): [X or "none"]
Evidence phase: [Y]
Confidence: [High/Medium/Low]

Evidence FOR current placement:
- [signal 1 — file/path or observation]
- [signal 2]
- [signal 3]

Evidence AGAINST (contradictions):
- [signal] — blocks claiming [higher phase]

Stated intent: [from docs]
Revealed intent: [from code/commits]
Momentum: [accelerating / cruising / stalling / revived / unknown]

Top blockers to next phase:
1. [blocker — why it gates downstream work]
2. [blocker]
```

## Per-type required signals (summary)

Full evidence bullets live in each type playbook. This table is the quick gate check.

### Game

| Phase | Required signals (all must be true to claim this phase) |
|-------|--------------------------------------------------------|
| Concept/Prototype | Core mechanic scripts exist; mostly placeholder assets; no/full save stub |
| Vertical Slice | ONE level/scene playable start-to-finish; final-quality core loop in that slice |
| Production | Repeated content pattern (many levels/enemies following template); asset pipeline |
| Alpha | Save/load, settings, full menu flow, all mechanics present (rough OK) |
| Beta | Content-complete; commits are polish/balance/bugfix not new features |
| Gold/Launch | Store/platform metadata, build/packaging scripts, release tag |
| Live-ops | Post-launch tags, hotfix branches, analytics/telemetry, content cadence |

### APP

| Phase | Required signals |
|-------|------------------|
| Concept/Prototype | UI screens exist; mock/hardcoded data; no real persistence |
| MVP build-out | Real data layer; auth stubs; main screens wired; edge cases missing |
| Alpha | Primary flows work on happy path; persistence + auth present; thin error states |
| Beta | Crash reporting, error/offline/empty states, beta distribution config |
| Launch | Store metadata, signing, release CI, version tags |
| Growth | Analytics-driven work, staged rollouts, changelog cadence |

### WEB

| Phase | Required signals |
|-------|------------------|
| Concept/Prototype | Few pages/spike; placeholder copy; no deploy config |
| MVP build-out | Real routing; first API/data integration; happy path works |
| Alpha | Primary pages/flows exist; real content mostly; thin responsive/a11y |
| Beta | Staging deploy, perf/a11y work, error handling, analytics |
| Launch | Prod deploy config, env/secrets, domain, sitemap/robots (content sites) |
| Growth | A/B or experiment infra, monitoring, ongoing content updates |

## Forced honesty examples

```diff
# BAD
- "This is a beta-ready game."

# GOOD
- "README claims beta. Evidence: late prototype.
  Missing: save system (stubbed), 1/12 GDD levels, no build pipeline.
  Confidence: High."
```

```diff
# BAD
- "The website is almost ready to ship."

# GOOD
- "README says 'basically ready to ship.' Evidence: alpha/beta gap.
  Blockers: lorem pricing copy, no deploy config, no sitemap, non-responsive nav.
  Confidence: High."
```

## Momentum → roadmap posture

| Momentum | Roadmap posture |
|----------|-----------------|
| Accelerating | Ambitious next phases OK if evidence supports |
| Cruising | Standard phase sequence |
| Stalling | Consolidation slice first; fewer phases; flag scope cut |
| Revived | Re-validate assumptions; first slice should be proof-of-life |
| Unknown (no git) | Conservative; note confidence Low; lean on file mtimes |
