#!/usr/bin/env bash
# archive-run.sh <tag>
#
# Finalize a completed run: PRESERVE everything, then clear the working area.
# Nothing is irreversibly deleted — code is kept as branches, logs go to Git LFS.
#
#   1. commit any uncommitted WIP in each model worktree
#   2. package sudoku-wt/logs + orchestration/reports into
#      orchestration/run-logs/run-<tag>-<date>.tar.gz (Git LFS), and commit it
#   3. remove the worktrees
#   4. rename model/<name> -> archive/<tag>/<name>   (archive, not delete)
#   5. clear reports working files (keep .gitignore + committed snapshots) and
#      the now-archived sudoku-wt/logs
#
# Re-runnable: if there are no worktrees/logs (already archived) it just no-ops
# the missing steps. To DELETE instead of archive, use cleanup.sh --purge.
set -uo pipefail

TAG="${1:?usage: archive-run.sh <tag>   e.g.: archive-run.sh final}"
REPO="$(git rev-parse --show-toplevel)"
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt"
DATE="$(date +%Y%m%d-%H%M%S)"
cd "$REPO"

echo "=== 1) commit WIP in worktrees ==="
for wt in $(git worktree list --porcelain | awk '/sudoku-wt/{print $2}'); do
  git -C "$wt" add -A 2>/dev/null
  git -C "$wt" diff --cached --quiet 2>/dev/null || { git -C "$wt" commit -q -m "Final state ($TAG)"; echo "  $(basename "$wt"): WIP committed"; }
done

echo "=== 2) package logs + reports -> Git LFS ==="
TARBALL="orchestration/run-logs/run-$TAG-$DATE.tar.gz"
if [ -d "$WT_ROOT/logs" ]; then
  mkdir -p orchestration/run-logs
  tar czf "$TARBALL" -C "$WT_ROOT" logs -C "$REPO/orchestration" reports 2>/dev/null
  git lfs track "orchestration/run-logs/*.tar.gz" >/dev/null 2>&1 || true
  git add .gitattributes "$TARBALL"
  echo "  -> $TARBALL ($(du -h "$TARBALL" | cut -f1), LFS)"
else
  echo "  (no $WT_ROOT/logs — skipping)"
fi

echo "=== 3) remove worktrees ==="
for wt in $(git worktree list --porcelain | awk '/sudoku-wt/{print $2}'); do
  git worktree remove --force "$wt" && echo "  removed $(basename "$wt")"
done
git worktree prune

echo "=== 4) archive branches model/* -> archive/$TAG/* ==="
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/model 2>/dev/null); do
  dest="archive/$TAG/${b#model/}"
  if git show-ref --verify --quiet "refs/heads/$dest"; then
    echo "  SKIP $b ($dest already exists)"
  else
    git branch -m "$b" "$dest" && echo "  $b -> $dest"
  fi
done

echo "=== 5) clear working files ==="
rm -rf "$WT_ROOT"
rm -rf orchestration/reports/status
rm -f orchestration/reports/scheduler.log orchestration/reports/summary.md \
      orchestration/reports/questions.md orchestration/reports/dryrun.log

echo "=== 6) commit the log archive ==="
if ! git diff --cached --quiet; then
  git commit -q -m "Archive run '$TAG': logs via LFS, model/* -> archive/$TAG/*"
  echo "  committed: $(git log --oneline -1)"
else
  echo "  (nothing staged to commit)"
fi

echo "done. branches: $(git for-each-ref --format='%(refname:short)' "refs/heads/archive/$TAG" 2>/dev/null | wc -l | tr -d ' ') under archive/$TAG/"
