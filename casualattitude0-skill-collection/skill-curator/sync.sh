#!/bin/sh
# Reconcile ~/.claude/skills/ symlinks against MANIFEST.md.
# Usage: sync.sh [--dry-run]
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MANIFEST="$REPO_ROOT/MANIFEST.md"
TARGET_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

[ -f "$MANIFEST" ] || { echo "MANIFEST.md not found at $MANIFEST" >&2; exit 1; }

# Table rows look like: | skill-name | source/dir/skill-name | enabled | reason |
grep -E '^\| ' "$MANIFEST" | grep -v -- '---' | grep -v '| Skill | Source dir |' | \
while IFS='|' read -r _ name dir status _rest; do
  name=$(echo "$name" | xargs)
  dir=$(echo "$dir" | xargs)
  status=$(echo "$status" | xargs)
  [ -z "$name" ] && continue

  link="$TARGET_DIR/$name"
  src="$REPO_ROOT/$dir"

  if [ "$status" = "enabled" ]; then
    if [ ! -d "$src" ]; then
      echo "skip: $name — source dir missing ($dir); remove the row or restore the skill" >&2
      continue
    fi
    if [ "$DRY_RUN" = "1" ]; then
      [ -L "$link" ] && [ "$(readlink "$link")" = "$src" ] || echo "would link: $name -> $dir"
    else
      ln -sfn "$src" "$link"
    fi
  else
    if [ -L "$link" ]; then
      if [ "$DRY_RUN" = "1" ]; then
        echo "would unlink: $name (disabled: $status)"
      else
        rm -f "$link"
      fi
    fi
  fi
done
