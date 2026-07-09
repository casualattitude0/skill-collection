# Whereto — Worked Examples

Three abbreviated chains matching common project situations. Full artifacts would be longer; these show the decision logic and structure.

---

## Example 1: Game — Late Prototype (Godot roguelite)

**Signals found:** 1 grey-box level, 1 enemy, save stubbed, GDD promises 12 levels / 20 enemies / 15 upgrades, git active (~monthly commits).

**Phase scorecard:**
```
Stated: beta (README) · Evidence: late prototype / pre-vertical-slice · Confidence: High
Blockers: save stubbed, 1/12 levels, scope gap vs GDD
Momentum: cruising
Destination pinned: commercial launch (user confirmed)
```

**Roadmap (abbreviated):**
- Phase 1 — Vertical Slice: one level start-to-finish, real save on exit
- Phase 2 — Systems shell: settings, full menu flow
- Phase 3 — Production template: repeatable level pipeline

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Vertical slice (1 level E2E) | 2 | 2 | 2 | 2 | 2 | **10** |
| B: Save system only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Build all 12 levels | 0 | 0 | 1 | 0 | 0 | 1 |

**Recommended:** A — tests core loop + stack integration; save is part of slice, not standalone.

**Handoff build target:**
> One Godot level playable start-to-finish with combat, death, restart, and save on exit.

**MUST scope:** core loop in one scene, save/load one slot, death → restart  
**PLACEHOLDER OK:** art (grey-box), audio (beeps), UI chrome  
**MUST BE REAL:** input responsiveness, hit feedback, save actually persists

---

## Example 2: APP — MVP → Alpha (Flutter habit tracker)

**Signals found:** Real API auth happy path, local persistence works, no crash reporting, error/empty/offline states missing, one smoke test, git steady.

**Phase scorecard:**
```
Stated: MVP (README) · Evidence: MVP transitioning to alpha · Confidence: High
Blockers: no observability, thin robustness states, thin tests
Momentum: cruising
Destination pinned: public store launch
```

**Roadmap (abbreviated):**
- Phase 1 — Alpha hardening: robustness states on core flow
- Phase 2 — Beta: crash reporting, TestFlight/internal track
- Phase 3 — Launch: store metadata, signing, release CI

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Robustness pass (error/empty/offline) | 2 | 2 | 2 | 2 | 2 | **10** |
| B: Crash reporting only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Full test suite | 1 | 1 | 1 | 1 | 1 | 5 |

**Recommended:** A — core flow works; real users will hit network/empty failures first.

**Handoff build target:**
> Primary habit-logging flow handles loading, empty, error, and offline without crashing or blank screens.

**MUST scope:** loading skeleton, empty state copy + CTA, API error retry, offline queue or message  
**OUT OF SCOPE:** new features, analytics, store assets

---

## Example 3: WEB — Overclaimed Beta (Next.js marketing site)

**Signals found:** README says "basically ready to ship", lorem pricing + about page, no vercel.json/netlify/CI, no sitemap/robots/meta, nav not responsive.

**Phase scorecard:**
```
Stated: launch-ready (README) · Evidence: alpha/beta gap · Confidence: High
Blockers: placeholder content, no deploy pipeline, no SEO, non-responsive nav
Momentum: cruising
Destination pinned: public marketing launch
```

**Roadmap (abbreviated):**
- Phase 1 — Launch gap close: real content + deploy + SEO basics
- Phase 2 — Beta hardening: responsive + a11y pass
- Phase 3 — Launch: prod domain + monitoring

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Launch-gap (content + deploy + SEO) | 2 | 2 | 2 | 1 | 2 | **9** |
| B: Responsive pass only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Full redesign | 0 | 0 | 0 | 1 | 0 | 1 |

**Recommended:** A — can't validate launch without real content on a real URL with crawlable meta.

**Handoff build target:**
> Marketing site deployed to staging with real pricing/about copy, meta/OG tags, sitemap, robots.txt, and mobile nav.

**MUST scope:** replace lorem on pricing + about, vercel.json or netlify.toml, sitemap + robots, title/description/OG per page, hamburger nav <768px  
**PLACEHOLDER OK:** hero image stock photo, blog section omitted  
**OUT OF SCOPE:** CMS, A/B testing, analytics (next slice)
