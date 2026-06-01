#!/usr/bin/env bash
# run-model.sh <provider/model> <short-name> <prompt-file> [max-retries]
#
# Drives ONE model through ONE milestone, semi-automatically:
#   - isolates the work in a git worktree on branch model/<short-name> (from foundation)
#   - runs the prompt headless via `opencode run` (permissions pre-approved)
#   - gates on verify.sh; on failure, continues the SAME opencode session with the
#     verifier output as feedback, up to max-retries.
#
# Human checkpoint between milestones is intentional: inspect the worktree/diff
# before running the next milestone's prompt against the same worktree.
#
# Prereqs: the provider/model must be authenticated in opencode; Git LFS pulled.
set -euo pipefail

MODEL="${1:?usage: run-model.sh <provider/model> <short-name> <prompt-file> [max-retries]}"
NAME="${2:?missing short-name}"
PROMPT_FILE="${3:?missing prompt-file}"
MAX_RETRIES="${4:-3}"

REPO="$(git rev-parse --show-toplevel)"
WT_ROOT="$REPO/../sudoku-wt"
WT="$WT_ROOT/$NAME"
BRANCH="model/$NAME"
PROMPT_PATH="$REPO/$PROMPT_FILE"
[ -f "$PROMPT_PATH" ] || { echo "prompt not found: $PROMPT_PATH"; exit 1; }

# Logs live OUTSIDE the worktree so they can never be picked up by a worker commit.
LOG_DIR="$WT_ROOT/logs/$NAME"
mkdir -p "$LOG_DIR"

MS="$(basename "$PROMPT_FILE" .md)"   # milestone label, e.g. m2

# Deterministically commit the milestone's result to branch model/<name>,
# regardless of whether the worker committed on its own. Keeps each model branch
# in a clean, labelled state (pass or fail) for the report and later inspection.
commit_milestone() {
  local status="$1" attempts="$2"
  git -C "$WT" add -A
  if git -C "$WT" diff --cached --quiet; then
    echo "=== [$NAME] $MS: nothing to commit ==="
    return 0
  fi
  git -C "$WT" commit -q -m "model/$NAME: $MS $status (${attempts} attempt(s)) [$MODEL]"
  echo "=== [$NAME] committed $MS ($status) ==="
}

# Hard autonomy clause appended for headless runs (we are measuring coding
# ability, so question-asking / permission quirks are neutralised).
AUTONOMY=$'\n\n## 自主执行(headless)\n本任务在无人值守环境运行:请完全自主完成,**不要提问**;遇歧义就选合理方案、简述假设并继续。\n若有会影响实现的疑问,请写入 worktree 根目录的 `QUESTIONS.md`(每条一行)再继续,不要停下等待回答。\n反复运行 `npm run typecheck` 与 `npm test` 直到全绿后再结束。'

mkdir -p "$WT_ROOT"
if ! git -C "$REPO" worktree list --porcelain | grep -q "worktree $WT$"; then
  echo "=== [$NAME] creating worktree on $BRANCH (from foundation) ==="
  git -C "$REPO" worktree add -b "$BRANCH" "$WT" foundation
fi

echo "=== [$NAME] installing deps in worktree ==="
( cd "$WT" && npm install --silent )

echo "=== [$NAME] attempt 1 :: $MODEL :: $PROMPT_FILE ==="
opencode run -m "$MODEL" --dir "$WT" --dangerously-skip-permissions \
  "$(cat "$PROMPT_PATH")$AUTONOMY" 2>&1 | tee "$LOG_DIR/attempt-1.log"

i=1
while true; do
  if OUT="$(bash "$REPO/orchestration/verify.sh" "$WT" 2>&1)"; then
    echo "$OUT"
    echo "=== [$NAME] PASSED after $i attempt(s) ==="
    commit_milestone PASS "$i"
    break
  fi
  echo "$OUT"
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "=== [$NAME] FAILED after $i attempt(s); needs human attention ==="
    commit_milestone FAIL "$i"
    exit 1
  fi
  i=$((i + 1))
  echo "=== [$NAME] verify failed; retry $i (continuing session) ==="
  opencode run --dir "$WT" --dangerously-skip-permissions -c \
    "上一次验收未通过。verify 输出如下:

$OUT

请自主修复,不要提问,直到 npm run typecheck、npm test 全绿,且引擎对 data/ground-truth 零健全性 violation。" 2>&1 | tee "$LOG_DIR/attempt-$i.log"
done
