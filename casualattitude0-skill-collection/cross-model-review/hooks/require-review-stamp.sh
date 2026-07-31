#!/usr/bin/env bash
# Stop hook: blocks the turn until the plan file carries the review stamp.
#
# The gate only checks for the stamp. It never reviews — that is the
# cross-model-review skill's job. The stamp is the handshake between them.
#
# Config (env, with defaults):
#   CMR_PLAN_GLOB   glob of plan files to guard   (default: docs/plans/*.md)
#   CMR_STAMP       stamp substring to look for   (default: cross-model-review: approved)
set -euo pipefail

PLAN_GLOB="${CMR_PLAN_GLOB:-docs/plans/*.md}"
STAMP="${CMR_STAMP:-cross-model-review: approved}"

cat >/dev/null   # drain the hook payload on stdin; this gate needs none of it

shopt -s nullglob
unstamped=()
for f in $PLAN_GLOB; do
  # Every plan in the glob is guarded. Committing an unstamped plan must not
  # exempt it — a plan committed before review is exactly the one to catch.
  tail -n 5 "$f" | grep -qF "$STAMP" || unstamped+=("$f")
done

[ ${#unstamped[@]} -eq 0 ] && exit 0

printf '%s' "{\"decision\":\"block\",\"reason\":\"These plans have no cross-model-review stamp: ${unstamped[*]}. Run the cross-model-review skill on each, then stamp it. Do not end the turn until every one is stamped or the user tells you to stop.\"}"
