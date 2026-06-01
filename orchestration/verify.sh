#!/usr/bin/env bash
# verify.sh <worktree-dir> [milestone]
#
# The verification gate. Runs (in the target worktree):
#   1. typecheck   2. unit tests   3. judge gate (soundness + solve-rate floors)
#
# The gate requires VALID + SOUND output only: typecheck passes, tests pass, and
# ZERO soundness violations. Solve-rate / strategy count are COLLECTED by the
# judge for comparison, NOT gated — we run each model to its best effort and
# compare the numbers afterwards. (Soundness is non-negotiable: an unsound solver
# can inflate its solve-rate with illegal eliminations, so its numbers are
# meaningless.)
#
# Optional gating: export MIN_EASY/MIN_MEDIUM/MIN_HARD/MIN_DIAB/MIN_STRATEGIES
# before calling to enforce floors. Off by default (the judge skips a floor of 0).
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir> [milestone]}"
MS="${2:-}"
ORCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JUDGE_SRC="$ORCH_ROOT/orchestration/judge/verify-engine.ts"
JUDGE_DST="$WT/.verify-engine.ts"

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
