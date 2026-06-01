#!/usr/bin/env bash
# verify.sh <worktree-dir> [milestone]
#
# The verification gate. Runs (in the target worktree):
#   1. typecheck   2. unit tests   3. judge gate (soundness + solve-rate floors)
#
# The judge requires REAL PROGRESS, not just "nothing broken": a milestone-specific
# minimum solve rate and minimum strategy count. This is what stops a no-op run
# (which leaves the sound naked-single baseline intact) from falsely passing.
#
# Floors are heuristic and tunable here. Override per invocation with env vars
# (MIN_EASY/MIN_MEDIUM/MIN_HARD/MIN_DIAB/MIN_STRATEGIES).
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir> [milestone]}"
MS="${2:-}"
ORCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JUDGE_SRC="$ORCH_ROOT/orchestration/judge/verify-engine.ts"
JUDGE_DST="$WT/.verify-engine.ts"

# Milestone floors (only set if not already provided via env).
case "$MS" in
  m2) : "${MIN_EASY:=0.90}" "${MIN_MEDIUM:=0.40}" "${MIN_HARD:=0}" "${MIN_DIAB:=0}" "${MIN_STRATEGIES:=3}" ;;
  m3) : "${MIN_EASY:=0.95}" "${MIN_MEDIUM:=0.80}" "${MIN_HARD:=0.60}" "${MIN_DIAB:=0.25}" "${MIN_STRATEGIES:=8}" ;;
  *)  : "${MIN_EASY:=0}" "${MIN_MEDIUM:=0}" "${MIN_HARD:=0}" "${MIN_DIAB:=0}" "${MIN_STRATEGIES:=1}" ;;
esac
export MIN_EASY MIN_MEDIUM MIN_HARD MIN_DIAB MIN_STRATEGIES

fail=0
echo "--- [verify $MS] typecheck ---"
( cd "$WT" && npm run typecheck ) || fail=1
echo "--- [verify $MS] unit tests ---"
( cd "$WT" && npm test ) || fail=1
echo "--- [verify $MS] judge gate (soundness + solve-rate floors) ---"
cp "$JUDGE_SRC" "$JUDGE_DST"
trap 'rm -f "$JUDGE_DST"' EXIT
( cd "$WT" && npx tsx .verify-engine.ts ) || fail=1
rm -f "$JUDGE_DST"; trap - EXIT

if [ "$fail" -eq 0 ]; then echo "=== [verify $MS] PASS ==="; else echo "=== [verify $MS] FAIL ==="; fi
exit "$fail"
