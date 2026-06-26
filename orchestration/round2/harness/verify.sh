#!/usr/bin/env bash
# verify.sh <worktree-dir> <phase>     phase ∈ p0 p1 p2 e p3
#
# round2 gate. Runs (in the target worktree):
#   1. typecheck   2. unit tests   3. judge gate (soundness + required-ids)
#   4. P3 ONLY: anti-pollution gate (every registered P3 id is last-resort-only)
# On pass it then captures the 727 progress meter (solve:list) and writes a
# per-phase JSON (.r2-verify-<phase>.json) with verifySec + 727 solved counts,
# which run-model.sh collects into the model's logs. Solve counts are COLLECTED,
# not gated (soundness + required-ids + P3 isolation are the hard gates) — except
# the per-phase prompt's "don't regress" expectation, judged at report time.
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir> <phase>}"
PH="${2:?missing phase}"
HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
R2="$(cd "$HARNESS/.." && pwd)"                 # orchestration/round2
REQ_DIR="$R2/required-ids"
# Reuse the round1 soundness+required-ids judge unchanged.
JUDGE_SRC="$(cd "$HARNESS/../../harness/judge" && pwd)/verify-engine.ts"
P3_JUDGE_SRC="$HARNESS/judge/check-p3-isolation.ts"

start=$(date +%s)

# required-ids for this phase (cumulative); strip comments/blanks.
REQ_FILE="$REQ_DIR/$PH.txt"
if [ -f "$REQ_FILE" ]; then
  REQUIRE_IDS="$(grep -vE '^[[:space:]]*(#|$)' "$REQ_FILE" | tr '\n' ' ')"
  export REQUIRE_IDS
fi

fail=0
echo "--- [verify $PH] typecheck ---"
( cd "$WT" && npm run typecheck ) || fail=1
echo "--- [verify $PH] unit tests ---"
( cd "$WT" && npm test ) || fail=1

echo "--- [verify $PH] judge gate (soundness + required-ids) ---"
cp "$JUDGE_SRC" "$WT/.verify-engine.ts"
( cd "$WT" && npx tsx .verify-engine.ts ) || fail=1
rm -f "$WT/.verify-engine.ts"

if [ "$PH" = "p3" ]; then
  echo "--- [verify $PH] P3 anti-pollution gate ---"
  P3_IDS="$(grep -vE '^[[:space:]]*(#|$)' "$REQ_DIR/p3-only.txt" | tr '\n' ' ')"
  export P3_IDS
  cp "$P3_JUDGE_SRC" "$WT/.check-p3-isolation.ts"
  ( cd "$WT" && npx tsx .check-p3-isolation.ts ) || fail=1
  rm -f "$WT/.check-p3-isolation.ts"
fi

# --- 727 progress meter (collected on pass; non-gating) ---
solveHuman=""; solveLast=""
if [ "$fail" -eq 0 ]; then
  echo "--- [verify $PH] solve:list (727, human-default) ---"
  if ( cd "$WT" && npm run --silent solve:list -- --profile human-default --out ".r2-solve-$PH.human.json" ) 2>&1 | tee /tmp/r2-solve-$PH.log; then :; fi
  solveHuman="$(grep -oE '[0-9]+/727' /tmp/r2-solve-$PH.log | head -1)"
  if [ "$PH" = "p3" ]; then
    echo "--- [verify $PH] solve:list (727, last-resort) ---"
    if ( cd "$WT" && npm run --silent solve:list -- --profile last-resort --out ".r2-solve-$PH.lastresort.json" ) 2>&1 | tee /tmp/r2-solve-$PH.lr.log; then :; fi
    solveLast="$(grep -oE '[0-9]+/727' /tmp/r2-solve-$PH.lr.log | head -1)"
  fi
fi

end=$(date +%s); verifySec=$((end - start))
printf '{"phase":"%s","verifySec":%d,"solveHuman":"%s","solveLastResort":"%s","pass":%s}\n' \
  "$PH" "$verifySec" "$solveHuman" "$solveLast" "$([ "$fail" -eq 0 ] && echo true || echo false)" \
  > "$WT/.r2-verify-$PH.json"

if [ "$fail" -eq 0 ]; then echo "=== [verify $PH] PASS (verify ${verifySec}s; 727 human=${solveHuman:-n/a} last=${solveLast:-n/a}) ==="; else echo "=== [verify $PH] FAIL ==="; fi
exit "$fail"
