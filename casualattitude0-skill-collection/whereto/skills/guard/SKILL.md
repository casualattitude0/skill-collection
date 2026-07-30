---
bundled_into: whereto
name: guard
description: "Full safety mode. Combines /careful (destructive command warnings) with file scope restriction. Prevents editing files outside a specified directory."
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


# /guard: Full Safety Mode

Activates BOTH destructive command safety (/careful) AND file edit scope restriction.

## Activation

AskUserQuestion: What directory should I restrict edits to?
- A) Current feature directory (auto-detect from recent git changes)
- B) Specific path: [user provides path]
- C) Only files in current PR/branch diff

## Scope Restriction

When active, before any Edit/Write tool call:

1. Check if target file is within the allowed scope
2. If outside scope:

> 🛡️ **GUARD MODE**: This file is outside the allowed scope.
> Scope: [allowed directory]
> Target: [file being edited]
>
> This edit is BLOCKED. To proceed, either:
> A) Expand scope to include this file
> B) Temporarily bypass for this one edit
> C) Deactivate guard mode

## Careful Mode (included)

All /careful protections are also active. See `/careful` for destructive command warnings.

## Use Cases

- **During a focused bug fix:** Guard to only the affected module
- **During asset work:** Guard to only asset directories (don't accidentally change code)
- **During balance tuning:** Guard to only data/config files (don't change game logic)

## Deactivation

Say "turn off guard mode" or start a new session.

