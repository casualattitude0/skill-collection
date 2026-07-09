# Next Slice Plan — Scoring & Template

After the roadmap is agreed (Stage 5), pick **one** slice to build next. Propose 3 candidates, score each, recommend exactly one.

## Hard rules

1. **ONE recommendation.** Not "any of these would work."
2. **Falsifiable hypothesis.** "If X, we learn Y. If not, we learn Z."
3. **≤2 weeks default** for solo/small team unless user stated otherwise.
4. **Rejected alternatives** must name the specific weakness (not "lower priority").

## 5 scoring axes (0–2 each, total /10)

### 1. Validation Value
Does this slice test the riskiest unknown blocking the roadmap?

- **2** = Tests the #1 blocker or riskiest assumption. Failure teaches the most important thing.
- **1** = Tests a real unknown but not the riskiest one.
- **0** = Outcome predictable. This is polish or demo, not validation.

### 2. Implementation Feasibility
Can this slice ship in the target timeframe?

- **2** = ≤2 weeks with current stack/team. Dependencies satisfied or fakeable.
- **1** = 2–4 weeks, or 1–2 dependencies need prep first.
- **0** = >4 weeks or blocked by unsolved technical problems.

### 3. Signal Clarity
Will you get an observable pass/fail?

- **2** = Binary signal: works or doesn't. Observable without interpretation.
- **1** = Signal exists but needs interpretation ("seems better").
- **0** = Too shallow to reveal anything useful.

### 4. Dependency Risk
How many other systems must exist for this slice?

- **2** = 0–1 dependencies. Self-contained.
- **1** = 2–3 dependencies. Manageable fakes.
- **0** = 4+ dependencies. This is the whole product at low quality.

### 5. Scope Discipline
Is the slice as small as possible while still valid?

- **2** = Can't remove anything without losing the validation signal.
- **1** = 1–2 cuttable elements.
- **0** = Significant bloat or sneaked-in nice-to-haves.

## Candidate comparison table

```
Next Slice Candidates
═══════════════════════════════════════════════════════════════════
Candidate    Valid  Feasib  Signal  Depend  Scope   Total   Rank
───────────  ─────  ──────  ──────  ──────  ─────   ─────   ────
A: [name]    _/2    _/2     _/2     _/2     _/2     _/10    _
B: [name]    _/2    _/2     _/2     _/2     _/2     _/10    _
C: [name]    _/2    _/2     _/2     _/2     _/2     _/10    _
═══════════════════════════════════════════════════════════════════

RECOMMENDED: [Candidate _] — [1–2 sentences why]

Rejected:
- [B]: [specific weakness]
- [C]: [specific weakness]
```

## Interpretation

| Total | Meaning |
|-------|---------|
| 9–10 | Strong slice — build this |
| 7–8 | Viable — acceptable if no 9–10 exists |
| 5–6 | Weak — rescope or pick different risk |
| ≤4 | Wrong slice — too big, wrong risk, or no signal |

## Type-specific slice patterns

### Game
- **Mechanic prototype** — core verb fun with zero progression
- **Vertical slice** — one level/scene start-to-finish at target quality
- **Systems shell** — save/settings/menus blocking alpha
- **Content pipeline** — prove one level can be produced repeatably

### APP
- **Core flow E2E** — onboard → primary action → result with real data
- **Robustness pass** — error/empty/offline states on existing happy path
- **Observability slice** — crash reporting + analytics before beta
- **Store-readiness** — signing, metadata, release build (only when alpha gates met)

### WEB
- **Launch-gap close** — deploy config + SEO + real content replacing placeholders
- **Core flow E2E** — sign-in → primary action (web apps)
- **Responsive/a11y pass** — mobile layout + keyboard nav before public launch
- **Staging + CI** — environment pipeline before prod cutover

## Output template (append to PROJECT_PHASE.md under `## Next Slice`)

```markdown
## Next Slice

**Recommended:** [slice name]  
**Score:** [X/10]  
**Hypothesis:** [If we build X, we validate Y. Failure means Z.]

### What to build
- [item]
- [item]

### What to fake (placeholder OK)
- [item — what it looks like]

### What must be real (do NOT fake)
- [item — why faking kills the signal]

### Success criteria
- [observable pass]

### Failure looks like
- [observable fail — what you learn if it fails]

### Build time estimate
[~N days/weeks]

### Dependencies
- [list or "none"]

### Rejected alternatives
- **[Candidate B]:** [why not]
- **[Candidate C]:** [why not]
```
