#!/usr/bin/env bash
# cleanup.sh [--purge]
#
# Reset the round2 working area for a fresh run.
#   default : remove sudoku-wt-r2 worktrees + working logs/reports; KEEP model/* branches
#   --purge : ALSO delete model/* branches (full clean — use before a from-scratch rerun)
# Does NOT touch archive/round2/* branches or the foundation branch.
set -uo pipefail

PURGE=0; [ "${1:-}" = "--purge" ] && PURGE=1
REPO="$(git rev-parse --show-toplevel)"
HARNESS="$(cd "$(dirname "$0")" && pwd)"
R2="$(cd "$HARNESS/.." && pwd)"
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt-r2"
cd "$REPO"

echo "=== remove round2 worktrees ==="
for wt in $(git worktree list --porcelain | awk '/sudoku-wt-r2\//{print $2}'); do
  git worktree remove --force "$wt" && echo "  removed $(basename "$wt")"
done
git worktree prune
rm -rf "$WT_ROOT"

echo "=== clear working reports ==="
rm -rf "$R2/reports/status"
rm -f "$R2/reports/scheduler.log" "$R2/reports/summary.md" "$R2/reports/questions.md" "$R2/reports/dryrun.log"

if [ "$PURGE" = "1" ]; then
  echo "=== purge model/* branches ==="
  for b in $(git for-each-ref --format='%(refname:short)' refs/heads/model 2>/dev/null); do
    git branch -D "$b" && echo "  deleted $b"
  done
fi
echo "done (purge=$PURGE)."
