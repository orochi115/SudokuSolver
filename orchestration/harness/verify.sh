#!/usr/bin/env bash
# verify.sh <worktree-dir> [milestone]
#
# The verification gate. Runs (in the target worktree):
#   1. typecheck   2. unit tests   3. judge gate (soundness + solve-rate floors)
#
# The gate requires: typecheck passes, tests pass, ZERO soundness violations, AND
# all of the milestone's REQUIRED strategy ids are registered (equal scope for
# every model — orchestration/harness/required-ids/<ms>.txt). Solve-rate is COLLECTED,
# NOT gated, so the comparison reflects implementation QUALITY on a fixed scope.
# (Soundness is non-negotiable: an unsound solver can inflate solve-rate with
# illegal eliminations.) Optional extra gating: export MIN_EASY/.../MIN_STRATEGIES.
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir> [milestone]}"
MS="${2:-}"
HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JUDGE_SRC="$HARNESS/judge/verify-engine.ts"
JUDGE_DST="$WT/.verify-engine.ts"

# Load the milestone's required strategy ids (comments/blanks stripped) for the gate.
REQ_FILE="$HARNESS/required-ids/$MS.txt"
if [ -f "$REQ_FILE" ]; then
  REQUIRE_IDS="$(grep -vE '^[[:space:]]*(#|$)' "$REQ_FILE" | tr '\n' ' ')"
  export REQUIRE_IDS
fi

fail=0
echo "--- [verify $MS] typecheck ---"
( cd "$WT" && npm run typecheck ) || fail=1
echo "--- [verify $MS] unit tests ---"
( cd "$WT" && npm test ) || fail=1
echo "--- [verify $MS] judge gate (soundness required; solve-rate collected) ---"
cp "$JUDGE_SRC" "$JUDGE_DST"
trap 'rm -f "$JUDGE_DST"' EXIT
( cd "$WT" && npx tsx .verify-engine.ts ) || fail=1
rm -f "$JUDGE_DST"; trap - EXIT

if [ "$fail" -eq 0 ]; then echo "=== [verify $MS] PASS ==="; else echo "=== [verify $MS] FAIL ==="; fi
exit "$fail"
