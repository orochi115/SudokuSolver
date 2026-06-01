#!/usr/bin/env bash
# verify.sh <worktree-dir>
#
# The verification gate for a model branch. Runs (in the target worktree):
#   1. typecheck   2. unit tests   3. judge gate (engine soundness + solve rate)
# Exits 0 only if all pass. The judge gate is the hard requirement: any
# soundness violation over the frozen ground-truth set fails the branch.
#
# The judge script lives only on the orchestration branch; it is copied into the
# worktree, run, then removed, so the worker's tree stays clean and unaware of it.
set -uo pipefail

WT="${1:?usage: verify.sh <worktree-dir>}"
ORCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JUDGE_SRC="$ORCH_ROOT/orchestration/judge/verify-engine.ts"
JUDGE_DST="$WT/.verify-engine.ts"

fail=0

echo "--- [verify] typecheck ---"
( cd "$WT" && npm run typecheck ) || fail=1

echo "--- [verify] unit tests ---"
( cd "$WT" && npm test ) || fail=1

echo "--- [verify] judge gate (soundness + solve rate) ---"
cp "$JUDGE_SRC" "$JUDGE_DST"
trap 'rm -f "$JUDGE_DST"' EXIT
( cd "$WT" && npx tsx .verify-engine.ts ) || fail=1
rm -f "$JUDGE_DST"
trap - EXIT

if [ "$fail" -eq 0 ]; then
  echo "=== [verify] PASS ==="
else
  echo "=== [verify] FAIL ==="
fi
exit "$fail"
