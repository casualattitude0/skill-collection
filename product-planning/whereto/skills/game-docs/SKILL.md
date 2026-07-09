---
bundled_into: whereto
name: game-docs
description: "Game release documentation update. Generates player-facing patch notes, internal changelog, and updates all project documentation after a release."
user_invocable: true
preamble-tier: 1
---
<!-- Bundled into whereto from gstack-game; edit this file directly (no outer build step). -->
## Preamble (run first)

```bash
setopt +o nomatch 2>/dev/null || true  # zsh compat
_WT_VERSION="1.0.0"
_SLUG=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_USER=$(whoami 2>/dev/null || echo "unknown")
_TEL_START=$(date +%s)
_SESSION_ID="$-$(date +%s)"

if [ -d docs ]; then
  _PROJECTS_DIR="docs/whereto-artifacts"
else
  _PROJECTS_DIR="whereto-artifacts"
fi
mkdir -p "$_PROJECTS_DIR"

echo "SLUG: $_SLUG"
echo "BRANCH: $_BRANCH"
echo "PROJECTS_DIR: $_PROJECTS_DIR"
echo "WT_VERSION: $_WT_VERSION"

_ARTIFACT_COUNT=$(ls "$_PROJECTS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$_ARTIFACT_COUNT" -gt 0 ] && echo "Artifacts: $_ARTIFACT_COUNT files in $_PROJECTS_DIR" && ls -t "$_PROJECTS_DIR"/*.md 2>/dev/null | head -5 | while read f; do echo "  $(basename "$f")"; done
```

**Shared artifact directory:** `$_PROJECTS_DIR` (`docs/whereto-artifacts/` or `whereto-artifacts/` in the target project) stores skill outputs for downstream skills in this pack.


## User Sovereignty

AI models recommend. You decide. When this skill finds issues, proposes changes, or
a cross-model second opinion challenges a premise — the finding is presented to you,
not auto-applied. Cross-model agreement is a strong signal, not a mandate. Your
direction is the default unless you explicitly change it.

## Public Output Care

Before writing PR bodies, store submission text, or other public output: strip secrets, player PII, NDA wording, unreleased dates, and named community reports. If unsure, ask the user before publishing.

## Completion Status Protocol

DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT.
Escalation after 3 failed attempts.


# /game-docs: Release Documentation

Update all documentation after a game release or patch.

## Step 0: Release Context

```bash
# Find recent release info
git tag --sort=-creatordate | head -5
_LATEST_TAG=$(git tag --sort=-creatordate | head -1)
[ -n "$_LATEST_TAG" ] && git log "$_LATEST_TAG"..HEAD --oneline --no-merges | head -20
```

AskUserQuestion: What version is this release? What are the highlights?

## Section 1: Player-Facing Patch Notes

**Format — players read this, not developers:**

```markdown
# Version X.Y.Z — [Catchy Title]

## ✨ New
- [Feature in player language] — [what it means for gameplay]

## ⚡ Improved
- [Improvement] — [why it matters]

## 🐛 Fixed
- [Bug description in player terms] — [what was happening, now fixed]

## ⚖️ Balance Changes
- [What changed] — [designer intent / reasoning]

## 🔧 Known Issues
- [Issue] — [workaround if any]
```

**Rules:**
- No code references, file paths, or technical jargon
- Every change answers "so what?" for the player
- Balance changes include the WHY (players want to understand intent)
- Group by impact, not by code area

**Game-Specific Patch Note Patterns:**

| Change Type | Bad (developer voice) | Good (player voice) |
|-------------|----------------------|---------------------|
| **Nerf** | "Reduced Warrior base damage from 50 to 40" | "Warriors deal less damage in early game. We noticed Warriors were clearing content 30% faster than other classes at low levels — this brings them in line while preserving their late-game power fantasy." |
| **Buff** | "Increased Mage mana regen by 20%" | "Mages recover mana faster. We heard you — running out of mana mid-fight felt punishing. You'll still need to manage resources, but you won't be stuck auto-attacking as often." |
| **Economy** | "Adjusted gold drop rates" | "You'll earn gold slightly faster from quests, but shop prices for top-tier items are higher. The net effect: mid-game feels smoother, but the best gear still requires commitment." |
| **Feel** | "Fixed input latency" | "Attacks now respond faster when you tap. If combat felt 'mushy' before, try it now — we shaved 2 frames off the startup animation." |
| **Remove** | "Removed feature X" | "We've removed [feature]. We know some of you used it, and here's why: [honest reason]. What replaces it: [alternative]." |

**Balance Change Communication Protocol:**
1. State WHAT changed (the numbers)
2. State WHY (the design intent — never leave balance changes unexplained)
3. State the EXPECTED EFFECT ("fights should last 5s longer on average")
4. Acknowledge player impact ("if you main Warrior, this will feel different")
5. Invite feedback ("tell us how this lands after a few sessions")

## Section 2: Internal Changelog

**Format — for the team:**

```markdown
# [version] — [date]

## Changes
- [commit-style description] ([files affected]) @[author]

## Metrics
- LOC changed: ___
- Files changed: ___
- Tests added: ___
- Known debt introduced: ___
```

## Section 3: Documentation Sweep

Check and update:
- [ ] README — Version number, install instructions, screenshots current?
- [ ] GDD — Does it reflect current game state? Mark outdated sections.
- [ ] API docs — If modding/plugin support exists
- [ ] Platform store descriptions — App Store/Steam/Play Store
- [ ] Website/landing page — Screenshots, feature list, trailer

## AUTO/ASK/ESCALATE

- **AUTO:** Generate changelog from git log, update version numbers
- **ASK:** Patch notes tone/framing, which changes to highlight, balance change explanations
- **ESCALATE:** Major undocumented breaking change, store description contradicts current build

## Anti-Sycophancy

Forbidden:
- ❌ "Great release!"
- ❌ "Players will appreciate these changes"

Instead: "12 changes documented. 3 balance changes need designer intent explanations before publishing."

## Completion Summary

```
Documentation:
  Patch notes: [written / updated]
  Internal changelog: [written / updated]
  Docs swept: ___/___ up to date
  STATUS: DONE / DONE_WITH_CONCERNS

  Next Step:
    PRIMARY: /game-retro — docs done, run retrospective
```

## Save Artifact

```bash
_DATETIME=$(date +%Y%m%d-%H%M%S)
echo "Saving to: $_PROJECTS_DIR/${_USER}-${_BRANCH}-release-docs-${_DATETIME}.md"
```

Write to `$_PROJECTS_DIR/{user}-{branch}-release-docs-{datetime}.md`. Supersedes prior if exists.

Discoverable by: /game-ship

