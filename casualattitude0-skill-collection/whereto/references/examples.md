# Whereto — Worked Examples

Three short chains. They show decision logic and the voice final artifacts should use: facts, counts, a call. Not pitch language.

---

## Example 1: Game — Late Prototype (Godot roguelite)

**Signals:** 1 grey-box level, 1 enemy, save stubbed. GDD wants 12 levels / 20 enemies / 15 upgrades. Git ~monthly.

**Phase scorecard:**
```
Stated: beta (README) · Evidence: late prototype / pre-vertical-slice · Confidence: High
Blockers: save stubbed, 1/12 levels, GDD scope gap
Momentum: cruising
Destination: commercial launch (user confirmed)
```

**Roadmap (short):**
- Phase 1 — Vertical slice: one level start to finish, real save on exit
- Phase 2 — Systems shell: settings, full menu flow
- Phase 3 — Production template: repeatable level pipeline

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Vertical slice (1 level E2E) | 2 | 2 | 2 | 2 | 2 | **10** |
| B: Save system only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Build all 12 levels | 0 | 0 | 1 | 0 | 0 | 1 |

**Recommended:** A. Proves the loop and the stack together. Save rides along; it is not the experiment.

**Handoff build target:**
> One Godot level playable start to finish with combat, death, restart, and save on exit.

**MUST:** core loop in one scene, one save slot, death → restart  
**PLACEHOLDER OK:** grey-box art, beep audio, UI chrome  
**MUST BE REAL:** input latency, hit feedback, save that survives reopen

---

## Example 2: APP — MVP → Alpha (Flutter habit tracker)

**Signals:** Real API auth on happy path. Local persistence works. No crash reporting. Error / empty / offline missing. One smoke test. Git steady.

**Phase scorecard:**
```
Stated: MVP (README) · Evidence: MVP moving into alpha · Confidence: High
Blockers: no crash reporting, thin robustness states, thin tests
Momentum: cruising
Destination: public store launch
```

**Roadmap (short):**
- Phase 1 — Alpha hardening: error / empty / offline on core flow
- Phase 2 — Beta: crash reporting, TestFlight / internal track
- Phase 3 — Launch: store metadata, signing, release CI

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Robustness pass (error/empty/offline) | 2 | 2 | 2 | 2 | 2 | **10** |
| B: Crash reporting only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Full test suite | 1 | 1 | 1 | 1 | 1 | 5 |

**Recommended:** A. Happy path already works. Real users hit network and empty states first.

**Handoff build target:**
> Primary habit-logging flow shows loading, empty, error, and offline without crash or blank screen.

**MUST:** loading skeleton, empty copy + CTA, API error retry, offline queue or message  
**OUT OF SCOPE:** new features, analytics, store assets

---

## Example 3: WEB — Overclaimed Beta (Next.js marketing site)

**Signals:** README says "basically ready to ship." Lorem on pricing and about. No vercel.json / netlify / CI. No sitemap / robots / meta. Nav not responsive.

**Phase scorecard:**
```
Stated: launch-ready (README) · Evidence: alpha/beta gap · Confidence: High
Blockers: placeholder copy, no deploy, no SEO, non-responsive nav
Momentum: cruising
Destination: public marketing launch
```

**Roadmap (short):**
- Phase 1 — Launch gap: real content + deploy + SEO basics
- Phase 2 — Hardening: responsive + a11y
- Phase 3 — Launch: prod domain + monitoring

**Next slice candidates:**

| Candidate | Valid | Feasib | Signal | Depend | Scope | Total |
|-----------|-------|--------|--------|--------|-------|-------|
| A: Launch-gap (content + deploy + SEO) | 2 | 2 | 2 | 1 | 2 | **9** |
| B: Responsive pass only | 1 | 2 | 1 | 2 | 2 | 8 |
| C: Full redesign | 0 | 0 | 0 | 1 | 0 | 1 |

**Recommended:** A. You cannot call it launch until real copy sits on a real URL with crawlable meta.

**Handoff build target:**
> Staging deploy with real pricing/about copy, meta/OG tags, sitemap, robots.txt, and mobile nav under 768px.

**MUST:** replace lorem on pricing + about, deploy config, sitemap + robots, title/description/OG per page, hamburger nav  
**PLACEHOLDER OK:** stock hero image, blog section skipped  
**OUT OF SCOPE:** CMS, A/B tests, analytics (later slice)
