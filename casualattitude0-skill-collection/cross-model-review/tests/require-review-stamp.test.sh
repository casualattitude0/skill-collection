#!/usr/bin/env bash
# Regression tests for the Stop hook's approval-stamp validation.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
HOOK="$ROOT/hooks/require-review-stamp.sh"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/docs/plans"

assert_blocks() {
  printf '%s\n' "$1" > "$WORK/docs/plans/plan.md"
  local output
  output=$(cd "$WORK" && CMR_PLAN_GLOB='docs/plans/*.md' "$HOOK" </dev/null)
  [[ "$output" == *'"decision":"block"'* ]]
}

assert_passes() {
  printf '%s\n' "$1" > "$WORK/docs/plans/plan.md"
  local output
  output=$(cd "$WORK" && CMR_PLAN_GLOB='docs/plans/*.md' "$HOOK" </dev/null)
  [[ -z "$output" ]]
}

assert_blocks '<!-- cross-model-review: approved -->'
assert_blocks '<!-- cross-model-review: approved by gpt-5.6 (Codex CLI, thread review-123) -->
later text'
assert_blocks '<!-- cross-model-review: approved by  (Codex CLI, thread review-123) -->'
assert_blocks '<!-- cross-model-review: approved by gpt-5.6 (Codex CLI, thread ) -->'
assert_passes '<!-- cross-model-review: approved by gpt-5.6 (Codex CLI, thread review-123) -->'

printf 'require-review-stamp tests passed\n'
