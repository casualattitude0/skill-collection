# Artifact voice — write like a person who shipped late

Use this for every user-facing line in `PROJECT_PHASE.md`, `IMPLEMENTATION_HANDOFF.md`, Stage 4 chat, and the completion summary. Distilled from avoid-ai-writing for **docs + blunt** register. Self-contained: do not leave this pack to load a writing skill.

## Voice

Sound like a tired lead who read the repo and will defend the call. Not a consultant. Not a launch blog.

- Short sentences mixed with longer ones. Fragments OK.
- Name files, counts, and blockers. No vibes without evidence.
- Take a position. "Do X first because Y." Not "you might consider."
- One idea per sentence in handoff criteria. Tables for lists; prose for judgment.

## Never put these in artifacts

**Words (cut or replace on sight):**
delve, landscape (metaphor), tapestry, realm, paradigm, embark, beacon, testament, robust, comprehensive, cutting-edge, leverage (verb), pivotal, underscores, meticulous, seamless, game-changer, utilize, vibrant, thriving, showcasing, deep dive, unpack, intricate, holistic, actionable, impactful, learnings, synergy, interplay, foster, elevate, unleash, streamline, empower, resonate, nuanced, multifaceted, ecosystem (metaphor), crucial, overarching, at its core, in order to, due to the fact that, serves as, boasts.

**Phrases (delete the whole clause):**
"it's worth noting", "notably", "importantly", "interestingly", "furthermore", "moreover", "additionally", "that said", "that being said", "at the end of the day", "when it comes to", "in today's…", "let's dive in", "here's the kicker", "here's what's interesting", "great question", "I hope this helps", "feel free to", "there are many ways", "it depends" (without then picking one).

**Shapes:**
- Em dashes in body prose. Use commas, periods, or parentheses. (Tables/labels may keep ` — ` as a separator.)
- "It's not X, it's Y."
- "While X is impressive, Y remains a challenge" with both halves vague.
- Bold on every other phrase. Bold one thing per section max, or none.
- Parallel marketing bullets with no verbs ("Stable efficiency / Reliable connectivity / Optimized performance").
- Closing with "the future looks bright" or "only time will tell."

## Write this instead

| AI default | Human version |
|------------|---------------|
| "This is a robust, comprehensive roadmap toward a seamless launch." | "Three phases. First: one playable level with save. Then menus. Then content pipeline." |
| "It's worth noting that the README claims beta." | "README says beta. Evidence says late prototype: save stubbed, 1/12 levels." |
| "Leverage the existing auth layer to unlock actionable insights." | "Auth happy path works. Add error/empty/offline on the habit log screen next." |
| "The soul of this experience is engaging and immersive." | "Soul: hit confirm within 1 frame. Late flash = mushy combat." |
| "There are many valid next steps." | "Build the vertical slice. Save-only won't prove the loop." |

## Per artifact

### `PROJECT_PHASE.md`
- Scorecard rows: plain facts. No praise.
- Evidence bullets: path or observation + what it implies.
- Phase goals: observable exit ("player finishes level 1 and save file exists"), not "establish a solid foundation."
- Risks: name the failure ("scope stays at 12 levels while git is monthly" ), not "potential challenges ahead."

### `IMPLEMENTATION_HANDOFF.md`
- Build target: one concrete sentence a builder can check.
- Experience table: action → response → timing number → quality you can see/hear.
- Soul line: one measurable or observable thing. Not "feels good."
- Acceptance: verbs and checks. "Someone else completes the flow without you narrating" beats "experience is validated."

### Stage 4 chat
- Re-ground in one line. Recommend. Options A/B/C.
- No survey dumps. No "Great question!"

### Completion summary
- Keep the status block. Skip pep talk after it.
- Next Step: one PRIMARY path. Conditionals only when they change the tool.

## Quick self-check before saving

1. Any Tier-1 word from the never-list? Cut it.
2. Any em dash in a sentence (not a table cell separator)? Split the sentence.
3. Can you point each claim at a file, count, or user quote? If not, cut or mark Open question.
4. Read the Destination and Soul lines aloud. If they sound like a pitch deck, rewrite.
