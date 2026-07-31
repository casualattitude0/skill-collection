#!/usr/bin/env bash
# Stop hook: blocks the turn until the plan file carries the review stamp.
#
# The gate only checks for the stamp. It never reviews — that is the
# cross-model-review skill's job. The stamp is the handshake between them.
#
# Config (env, with defaults):
#   CMR_PLAN_GLOB   glob of plan files to guard   (default: docs/plans/*.md)
#
# A valid stamp is the final line of a plan and identifies both the reviewer and
# the resumable reviewer thread. A substring is not enough: anyone could write
# one without having the review the gate is meant to require.
set -euo pipefail

PLAN_GLOB="${CMR_PLAN_GLOB:-docs/plans/*.md}"
STAMP_PATTERN='^<!--[[:space:]]cross-model-review:[[:space:]]approved[[:space:]]by[[:space:]].+[[:space:]]\(.+,[[:space:]]thread[[:space:]].+\)[[:space:]]-->$'

cat >/dev/null   # drain the hook payload on stdin; this gate needs none of it

shopt -s nullglob
unstamped=()
for f in $PLAN_GLOB; do
  # Every plan in the glob is guarded. Committing an unstamped plan must not
  # exempt it — a plan committed before review is exactly the one to catch.
  tail -n 1 "$f" | grep -Eq "$STAMP_PATTERN" || unstamped+=("$f")
done

[ ${#unstamped[@]} -eq 0 ] && exit 0

printf '%s' "{\"decision\":\"block\",\"reason\":\"These plans have no cross-model-review stamp: ${unstamped[*]}. Run the cross-model-review skill on each, then stamp it. Do not end the turn until every one is stamped or the user tells you to stop.\"}"
