#!/usr/bin/env bash
# archive-run.sh [tag]      (tag default: round2; USE A RUN-NESTED TAG like round2/run2
#                            so multiple runs don't collide — v1 lives at archive/round2/run1/*)
#
# Finalize a completed round2 run: PRESERVE everything, then clear the working area.
#   1. commit any uncommitted WIP in each round2 model worktree
#   2. package sudoku-wt-r2/logs + round2/reports into
#      orchestration/round2/run-logs/run-<safetag>-<date>.tar.gz (Git LFS), commit it
#   3. remove the worktrees
#   4. rename model/<name> -> archive/<tag>/<name>; SNAPSHOT foundation -> archive/<tag>/foundation
#      (foundation is KEPT in place — run-model.sh branches every new worktree from it, so
#       renaming it away would break the next run)
#   5. clear working reports  (only removes the logs dir if step 2 packaged them successfully)
# Re-runnable; to DELETE instead of archive use cleanup.sh --purge.
set -uo pipefail

TAG="${1:-round2}"
SAFE_TAG="${TAG//\//-}"   # slash-safe for filenames: round2/run2 -> round2-run2
REPO="$(git rev-parse --show-toplevel)"
HARNESS="$(cd "$(dirname "$0")" && pwd)"
R2="$(cd "$HARNESS/.." && pwd)"
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt-r2"
DATE="$(date +%Y%m%d-%H%M%S)"
cd "$REPO"

echo "=== 1) commit WIP in round2 worktrees ==="
for wt in $(git worktree list --porcelain | awk '/sudoku-wt-r2\//{print $2}'); do
  git -C "$wt" add -A 2>/dev/null
  git -C "$wt" diff --cached --quiet 2>/dev/null || { git -C "$wt" commit -q -m "Final state ($TAG)"; echo "  $(basename "$wt"): WIP committed"; }
done

echo "=== 2) package logs + reports -> Git LFS ==="
TARBALL="orchestration/round2/run-logs/run-$SAFE_TAG-$DATE.tar.gz"
TAR_OK=0
if [ -d "$WT_ROOT/logs" ]; then
  mkdir -p orchestration/round2/run-logs
  # NB: do NOT suppress tar errors — a silent failure here used to let step 5 rm the logs.
  if tar czf "$TARBALL" -C "$WT_ROOT" logs -C "$R2" reports && [ -s "$TARBALL" ]; then
    TAR_OK=1
    git lfs track "orchestration/round2/run-logs/*.tar.gz" >/dev/null 2>&1 || true
    git add .gitattributes "$TARBALL"
    echo "  -> $TARBALL ($(du -h "$TARBALL" | cut -f1), LFS)"
  else
    echo "  !! tar FAILED -> $TARBALL — KEEPING $WT_ROOT/logs (step 5 will not remove it)"
  fi
else
  echo "  (no $WT_ROOT/logs — nothing to package)"; TAR_OK=1   # nothing to lose
fi

echo "=== 3) remove worktrees ==="
for wt in $(git worktree list --porcelain | awk '/sudoku-wt-r2\//{print $2}'); do
  git worktree remove --force "$wt" && echo "  removed $(basename "$wt")"
done
git worktree prune

echo "=== 4) archive branches ==="
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/model 2>/dev/null); do
  dest="archive/$TAG/${b#model/}"
  if git show-ref --verify --quiet "refs/heads/$dest"; then echo "  SKIP $b ($dest exists)"; else git branch -m "$b" "$dest" && echo "  $b -> $dest"; fi
done
# SNAPSHOT foundation (copy, not rename): the next run's run-model.sh creates each
# worktree with `git worktree add -b model/<name> <wt> foundation`, so foundation MUST
# survive. A rename would leave no foundation and break every subsequent run.
if git show-ref --verify --quiet refs/heads/foundation; then
  if git show-ref --verify --quiet "refs/heads/archive/$TAG/foundation"; then echo "  SKIP foundation (already archived)"; else git branch "archive/$TAG/foundation" foundation && echo "  foundation snapshot -> archive/$TAG/foundation (foundation retained)"; fi
fi

echo "=== 5) clear working reports ==="
if [ "$TAR_OK" = 1 ]; then rm -rf "$WT_ROOT"; else echo "  KEEPING $WT_ROOT (tar failed in step 2 — archive again before cleaning)"; fi
rm -rf "$R2/reports/status"
rm -f "$R2/reports/scheduler.log" "$R2/reports/watchdog.log" "$R2/reports/summary.md" "$R2/reports/questions.md" "$R2/reports/dryrun.log"

echo "=== 6) commit the log archive ==="
if ! git diff --cached --quiet; then
  git commit -q -m "Archive round2 run '$TAG': logs via LFS, model/* -> archive/$TAG/* (foundation snapshotted, kept)"
  echo "  committed: $(git log --oneline -1)"
else
  echo "  (nothing staged)"
fi
echo "done. branches under archive/$TAG/: $(git for-each-ref --format='%(refname:short)' "refs/heads/archive/$TAG" 2>/dev/null | wc -l | tr -d ' ')"
