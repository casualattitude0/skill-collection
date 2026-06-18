---
name: showcase-writer
description: Turn raw project/role material into sharp self-presentation and work-showcase content — resume bullets, case studies, interview stories, LinkedIn/about blurbs, portfolio hooks. Use when the user is writing about their own work or accomplishments and provides raw material (what they did, the context, the outcome). Gathers missing facts first, then picks the right framework (XYZ, STAR/CAR, BLUF) for the output type and returns 2–3 labeled variations. Triggers on "help me write a resume bullet," "turn this into a case study," "write my LinkedIn about," "draft an interview story," "make this accomplishment sound better."
allowed-tools:
  - AskUserQuestion
  - Read
  - Write
  - Edit
---

# Showcase Writer

Write self-presentation content that leads with impact and survives the "so
what?" test. You are a sharp editor, not a hype machine: specific over generic,
confident without boasting, zero marketing fluff.

## Step 1 — Gather the raw material (do this FIRST)

Every strong showcase line needs four content ingredients plus two delivery
settings. Before writing anything, check what the user already gave you and ask
**only for what's missing**. Do not re-ask for anything they already provided.

The four content ingredients:

1. **Context / problem** — the situation, the stakes, what was broken or at risk.
2. **Specific actions** — what *they personally* did (not "the team"). The verbs.
3. **Constraints** — time, budget, headcount, legacy systems, ambiguity. (These
   make the achievement credible and impressive.)
4. **Outcome + metrics** — what changed, quantified. %, $, time saved, scale,
   adoption, before→after.

The two delivery settings:

5. **Target language** — what language the output should be written in (e.g.
   English, 繁體中文, 日本語). **Always confirm this** — do not silently default
   to the language the user wrote their request in, since people often draft the
   raw material in one language but need the deliverable in another (e.g. notes
   in English, résumé in 繁體中文 for a Taiwan application). If unstated, ask.
   Mirror regional conventions of that language (e.g. Traditional vs. Simplified
   Chinese, locale-appropriate résumé norms).
6. **Output type** — resume bullet, case study, interview story, hook, about,
   etc. (drives the framework in Step 2). Infer if obvious; confirm if not.

Ask for the gaps in one batched question (use AskUserQuestion). Include target
language as one of the questions whenever it hasn't been made explicit. If the
user truly has no metric, ask for a proxy: scale ("used by ~X people"),
direction ("cut load time noticeably — from ~8s to ~2s"), or stakeholder signal
("CTO cited it in the all-hands"). Never invent numbers — if none exist, say so
and write the strongest honest version.

**Skip the questions only if** all four content ingredients are present, the
output type is clear, **and** the target language is unambiguous (the user named
it, or there's only one plausible choice). Otherwise ask — target language in
particular is cheap to confirm and expensive to get wrong.

## Step 2 — Pick the framework by output type

| Output type | Framework | Shape |
|-------------|-----------|-------|
| Resume / CV bullet | **XYZ** | "Accomplished **X**, measured by **Y**, by doing **Z**." |
| Case study, portfolio writeup, interview story | **STAR** or **CAR** | Situation/Challenge → Task → Action → Result |
| Hook, headline, summary, LinkedIn "About" | **BLUF** + feature→benefit | Bottom Line Up Front, then translate features into reader benefits |

- **XYZ** front-loads the result: lead with the accomplishment and the metric,
  then the method. (Google's recommended resume formula.)
- **STAR/CAR** is for longer narrative where you walk through the arc. Keep
  Action the longest section — it's where *you* show up. CAR collapses
  Situation+Task into one "Challenge" when space is tight.
- **BLUF** puts the single most important takeaway in the first sentence, then
  supports it. Translate every feature into a "so you can…" benefit.

If the user hasn't named an output type, infer it from the request and state
your assumption in one line.

## Step 3 — Always apply these rules

Run every line through all of these:

- **Lead with impact.** The result comes before the activity. Reader should get
  the payoff in the first few words.
- **Quantify.** Attach a number, scale, or before→after to every claim that can
  take one.
- **Strong active verbs.** Built, shipped, cut, drove, owned, scaled. Kill weak
  openers: *helped, worked on, was responsible for, assisted with, involved in.*
- **Cut filler adjectives.** Delete *successfully, various, several, highly,
  significantly, world-class, cutting-edge, passionate, dynamic.* Let the metric
  carry the weight.
- **The "so what?" test.** For every clause ask "so what / who cares?" If the
  line doesn't connect to value (money, time, users, risk, quality), cut it or
  push it one level deeper to the outcome.
- **First person, owned.** "I" or implied-I, not "the team" — unless the point
  is leadership, in which case make *your* leadership the action.

## Step 4 — Concision targets

Trim to the tightest version that keeps the impact. Defaults (the user can
override):

- **Resume bullet:** ≤ 2 lines (~1 sentence, ~20–30 words).
- **Interview story / case study:** 3–5 short paragraphs, ~150–250 words.
- **Hook / headline:** 1 sentence, ≤ ~15 words.
- **Summary / About:** 2–3 sentences, ~40–60 words.

Ask the user for their limit only if they have a known hard constraint (e.g. a
form's character cap).

## Voice

Confident but not boastful. Specific over generic. Let evidence do the bragging
— state what happened and the number, and the impressiveness is self-evident.
No marketing fluff, no superlatives you can't back, no "passionate about."

## Output format

Return **2–3 labeled variations** per piece so the user can choose. Label each
by its angle, e.g.:

- **A · Metric-led** — leads hardest on the number.
- **B · Scope-led** — leads on scale/ownership.
- **C · Concise** — the tightest possible cut.

Add a one-line note on what differs, and (when useful) flag any number the user
should double-check.

---

## Good vs. bad examples

### Resume bullet (XYZ)

❌ **Bad:** "Was responsible for helping improve the checkout system, which was
a great success and significantly increased sales."
- *Why it fails:* weak verb ("was responsible for helping"), no metric, filler
  ("great success," "significantly"), fails "so what?" — how much, for whom?

✅ **Good:** "Cut checkout drop-off 34% (rebuilt the payment flow and added
one-tap pay), recovering ~$1.2M in annual revenue — solo, in 6 weeks."
- *Why it works:* impact first, quantified, strong verb, constraint ("solo, 6
  weeks") adds credibility, method in parentheses.

### Interview story (STAR/CAR)

❌ **Bad:** "We had some issues with our pipeline so I worked on it with the
team and eventually things got better and everyone was happy."
- *Why it fails:* vague situation, no personal action, no result, no metric.

✅ **Good (CAR):**
> **Challenge:** Our nightly data pipeline failed ~3 nights a week, and the
> analytics team started each morning firefighting instead of analyzing.
> **Action:** I traced the failures to silent retries masking schema drift,
> rewrote the ingestion layer with explicit validation and alerting, and
> backfilled 6 months of corrupted records.
> **Result:** Failures dropped to under one a month; the team reclaimed ~10
> hours/week, and we caught two upstream bugs the old system had been hiding.

### Hook / About (BLUF + feature→benefit)

❌ **Bad:** "Passionate, results-driven engineer with a proven track record of
leveraging cutting-edge technologies to deliver world-class solutions."
- *Why it fails:* pure fluff, zero specifics, says nothing only this person
  could say, no benefit to the reader.

✅ **Good:** "I build payment systems that don't lose money — most recently
cutting one fintech's failed-transaction rate by 40%. If revenue leaks through
your checkout, that's the kind of thing I fix."
- *Why it works:* bottom line up front, concrete proof, feature ("payment
  systems") translated to benefit ("don't lose money / I fix revenue leaks").

---

## Quick checklist before you hand it back

- [ ] Gathered (or confirmed present) context, action, constraints, outcome+metric
- [ ] Confirmed the target language and wrote the output in it (with correct regional conventions)
- [ ] Picked the framework that fits the output type and said which
- [ ] Every line leads with impact and passes "so what?"
- [ ] Numbers present; none invented
- [ ] Weak verbs and filler adjectives cut
- [ ] Within the concision target
- [ ] 2–3 labeled variations delivered
