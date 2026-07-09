---
bundled_into: whereto
name: careful
description: "Safety mode. Warns before destructive commands (rm -rf, DROP TABLE, git push -f, force delete). Does NOT restrict file editing scope — use /guard for that."
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


# /careful: Destructive Command Safety

Activates heightened awareness for destructive operations. When active, flag and confirm before executing any potentially destructive command.

## What triggers a warning

| Pattern | Risk | Action |
|---------|------|--------|
| `rm -rf` (except node_modules, .next, dist, build, __pycache__) | File deletion | Confirm before executing |
| `git push -f` / `git push --force` | History rewrite | Confirm + warn about remote impact |
| `git reset --hard` | Uncommitted work loss | Confirm + suggest stash first |
| `git clean -f` | Untracked file deletion | Confirm + list what will be deleted |
| `git branch -D` | Branch deletion | Confirm + check if merged |
| `DROP TABLE` / `DROP DATABASE` | Data destruction | Confirm + verify environment |
| `TRUNCATE` | Data deletion | Confirm |
| `docker system prune` | Container cleanup | Confirm |
| Kill/stop commands on game servers | Service disruption | Confirm + check player count |

## Safe exceptions (no warning needed)

```
rm -rf node_modules/
rm -rf .next/
rm -rf dist/
rm -rf build/
rm -rf __pycache__/
rm -rf .cache/
rm -rf tmp/
git push (without -f)
```

## Activation

This skill is activated by invoking `/careful`. It stays active for the remainder of the session.

When active, before any Bash command that matches a warning pattern:

> ⚠️ **CAREFUL MODE**: This command will [describe impact].
> Affected: [list files/data/branches]
> Reversible: [yes/no/partially]
>
> Proceed? (confirm to execute)

## Deactivation

Say "turn off careful mode" or start a new session.

