# Implementation Handoff Template

Use this for Stage 7 output. Write to `IMPLEMENTATION_HANDOFF.md` at project root (or `docs/IMPLEMENTATION_HANDOFF.md` if `docs/` exists). Every section required unless marked optional.

**Hard rule:** Describe what the user/player must experience. No code, no file edit instructions, no implementation steps.

```markdown
# Implementation Handoff: [Slice Name]

Roadmap: [link or path to PROJECT_PHASE.md § Next Slice]
Branch: [branch]
Date: [YYYY-MM-DD]
Type: [Game/APP/WEB]

## 1. Build Target

What this build produces in one sentence:
> [e.g., "One Godot level playable start-to-finish with save on exit and final-quality combat loop."]

## 2. Scope

### In Scope (build these)
- [ ] [item — MUST]
- [ ] [item — SHOULD]
- [ ] [item — COULD]

### Out of Scope (don't touch)
- [item — why excluded]
- [item]

### Placeholder OK (fake these)
- [item — what placeholder looks like and why real version isn't needed]
- [item]

## 3. Experience Requirements (what the USER/PLAYER must experience)

| User/Player Action | Expected Response | Timing | Quality Target |
|--------------------|-------------------|--------|----------------|
| [tap/click/navigate] | [what happens — visual, audio, feedback] | [ms / immediate / on load] | [snappy / clear / forgiving] |
| [core action] | [full feedback chain] | [constraint] | [observable quality] |

## 4. System Requirements

| System | What It Does | Exists? | Notes |
|--------|-------------|---------|-------|
| [e.g., Auth] | [session handling] | Yes / Partial / No | [what needs building] |
| [e.g., API] | [data fetch/persist] | Partial | [endpoints or models needed] |
| [e.g., Save] | [persist state] | No | [MUST for this slice / skip] |

## 5. Asset Requirements

| Asset | Real or Placeholder | Spec |
|-------|-------------------|------|
| [item] | Placeholder OK | [grey box / lorem / beep] |
| [item] | MUST BE REAL | [why — core to signal] |

## 6. Acceptance Criteria

### Engineering Done (functional)
- [ ] [builds/runs without errors]
- [ ] [core flow completable end-to-end]
- [ ] [all interactions in §3 work]

### Experience Done (what matters most)
- [ ] [user/player can accomplish X without confusion]
- [ ] [specific observable quality from §3 verified by using, not reading code]
- [ ] [the "soul" of this slice: {one sentence}]

### NOT Done Until
- [ ] [someone other than the developer used it / played it / ran through the flow]
- [ ] [experience-critical items verified by doing, not by code review]

## 7. Known Risks

| Risk | Impact | Tempting Shortcut | Why It Kills the Slice |
|------|--------|-------------------|------------------------|
| [risk] | Critical/High/Med | [what devs will try] | [what signal you lose] |

## 8. Test Hooks

| What to Test | How to Test | Pass Criteria |
|-------------|-------------|---------------|
| [core flow] | [manual steps / automated] | [observable pass] |
| [edge case] | [how] | [pass] |
```

## Scope tag definitions

| Tag | Meaning |
|-----|---------|
| **MUST** | Slice fails without this. Non-negotiable. |
| **SHOULD** | Important but slice can ship to validate hypothesis without it. |
| **COULD** | Nice-to-have; cut first if time runs out. |
| **PLACEHOLDER OK** | Fake it; real version not needed for validation. |
| **OUT OF SCOPE** | Explicitly do not build; prevents scope creep. |

## Common handoff mistakes

| Mistake | Fix |
|---------|-----|
| All items same priority | MUST/SHOULD/COULD on every in-scope item |
| No experience criteria | §6 Experience Done with user-observable checks |
| "Standard" behavior | Specify exactly — loading time, error copy, empty state |
| Code snippets | Remove — handoff is intent, not implementation |
| No "soul" line | One sentence: what makes this slice itself, not generic |
