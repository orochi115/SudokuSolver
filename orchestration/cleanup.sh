#!/usr/bin/env bash
# cleanup.sh [--purge] [models-file]
#
# Default: remove the per-model worktrees (../sudoku-wt/<name>) but KEEP the
#          model/<name> branches and their commits — so results survive.
# --purge: also delete the model/<name> branches and the run logs, and clear
#          the generated reports/. Use once you've captured everything you need.
#
# Worktrees are removed with --force (safe: run-model.sh commits each milestone,
# so there is no unsaved work). Branch deletion is skipped for the branch you are
# currently on.
set -uo pipefail

PURGE=0
if [ "${1:-}" = "--purge" ]; then PURGE=1; shift; fi

REPO="$(git rev-parse --show-toplevel)"
WT_ROOT="$REPO/../sudoku-wt"
MODELS_FILE="${1:-$REPO/orchestration/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE"; exit 1; }

CUR="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"

grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE" | while read -r _model name _rest; do
  wt="$WT_ROOT/$name"
  branch="model/$name"

  if git -C "$REPO" worktree list --porcelain | grep -q "worktree $wt$"; then
    echo "removing worktree: $wt"
    git -C "$REPO" worktree remove --force "$wt" || echo "  (could not remove $wt)"
  fi

  if [ "$PURGE" -eq 1 ]; then
    if [ "$branch" = "$CUR" ]; then
      echo "skip branch delete (currently on $branch)"
    elif git -C "$REPO" show-ref --verify --quiet "refs/heads/$branch"; then
      echo "deleting branch: $branch"
      git -C "$REPO" branch -D "$branch" || echo "  (could not delete $branch)"
    fi
    rm -rf "$WT_ROOT/logs/$name"
  fi
done

git -C "$REPO" worktree prune

if [ "$PURGE" -eq 1 ]; then
  echo "clearing generated reports"
  find "$REPO/orchestration/reports" -type f ! -name '.gitignore' -delete 2>/dev/null || true
  rm -rf "$REPO/orchestration/reports/status" 2>/dev/null || true
fi

echo "done. ($([ "$PURGE" -eq 1 ] && echo 'purged worktrees+branches+logs+reports' || echo 'removed worktrees; branches kept'))"
