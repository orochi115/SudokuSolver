#!/usr/bin/env bash
# run-model.sh <provider/model> <short-name> <prompt-file> [max-retries]
#
# Drives ONE model through ONE milestone:
#   - isolates work in a git worktree on branch model/<short-name> (from foundation)
#   - runs the prompt headless via `opencode run` (permissions pre-approved),
#     wrapped in a TIMEOUT so a hanging model cannot block the run
#   - gates on verify.sh (milestone-aware: requires real solve-rate progress);
#     on failure, continues the SAME session with the verifier output as feedback,
#     up to max-retries
#   - commits the milestone result (pass or fail) to model/<short-name>
#   - records token cost via `opencode export`
#
# Env: TIMEOUT (seconds per opencode attempt, default 1800)
# Prereqs: provider/model authenticated in opencode; `git lfs pull` done.
set -uo pipefail

MODEL="${1:?usage: run-model.sh <provider/model> <short-name> <prompt-file> [max-retries]}"
NAME="${2:?missing short-name}"
PROMPT_FILE="${3:?missing prompt-file}"
MAX_RETRIES="${4:-3}"
TIMEOUT="${TIMEOUT:-1800}"

REPO="$(git rev-parse --show-toplevel)"
# Normalised absolute path (no '..') so it matches `git worktree list` output.
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt"
WT="$WT_ROOT/$NAME"
BRANCH="model/$NAME"
PROMPT_PATH="$REPO/$PROMPT_FILE"
[ -f "$PROMPT_PATH" ] || { echo "prompt not found: $PROMPT_PATH"; exit 1; }

LOG_DIR="$WT_ROOT/logs/$NAME"   # outside the worktree, so logs never enter a commit
mkdir -p "$LOG_DIR"
MS="$(basename "$PROMPT_FILE" .md)"   # milestone label, e.g. m2

AUTONOMY=$'\n\n## 自主执行(headless)\n本任务在无人值守环境运行:请完全自主完成,**不要提问**;遇歧义就选合理方案、简述假设并继续。\n若有会影响实现的疑问,请写入 worktree 根目录的 `QUESTIONS.md`(每条一行)再继续,不要停下等待回答。\n反复运行 `npm run typecheck` 与 `npm test` 直到全绿后再结束。'

# Run opencode with a hard timeout; output (JSON events) goes to $1.
run_opencode() {
  local log="$1"; shift
  opencode "$@" >"$log" 2>&1 &
  local pid=$!
  ( sleep "$TIMEOUT"; kill -TERM "$pid" 2>/dev/null; sleep 5; kill -KILL "$pid" 2>/dev/null ) &
  local wpid=$!
  wait "$pid"; local rc=$?
  kill "$wpid" 2>/dev/null; wait "$wpid" 2>/dev/null
  [ "$rc" -ge 124 ] && echo "(opencode hit ${TIMEOUT}s timeout, killed)" >>"$log"
  return 0
}

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

# Record token cost for the milestone's session (best-effort).
record_cost() {
  local sid="$1"
  [ -n "$sid" ] || { echo '{"sessionID":null,"note":"no session id captured"}' >"$LOG_DIR/$MS.cost.json"; return; }
  node "$REPO/orchestration/cost-of-session.mjs" "$sid" >"$LOG_DIR/$MS.cost.json" 2>/dev/null \
    || echo "{\"sessionID\":\"$sid\",\"note\":\"export failed\"}" >"$LOG_DIR/$MS.cost.json"
  echo "=== [$NAME] $MS cost -> $(cat "$LOG_DIR/$MS.cost.json") ==="
}

# --- ensure worktree ---
if git -C "$REPO" worktree list --porcelain | grep -qx "worktree $WT"; then
  echo "=== [$NAME] reusing worktree $WT ==="
elif git -C "$REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "=== [$NAME] attaching existing branch $BRANCH to new worktree ==="
  git -C "$REPO" worktree add "$WT" "$BRANCH"
else
  echo "=== [$NAME] creating worktree on $BRANCH (from foundation) ==="
  git -C "$REPO" worktree add -b "$BRANCH" "$WT" foundation
fi

echo "=== [$NAME] installing deps ==="
( cd "$WT" && npm install --silent )

# --- attempt 1 ---
echo "=== [$NAME] $MS attempt 1 :: $MODEL ==="
LOG1="$LOG_DIR/$MS-attempt-1.log"
run_opencode "$LOG1" run -m "$MODEL" --dir "$WT" --dangerously-skip-permissions --format json "$(cat "$PROMPT_PATH")$AUTONOMY"
SID="$(grep -o 'ses_[A-Za-z0-9]*' "$LOG1" | head -1)"

i=1
while true; do
  if OUT="$(bash "$REPO/orchestration/verify.sh" "$WT" "$MS" 2>&1)"; then
    echo "$OUT"
    echo "=== [$NAME] $MS PASSED after $i attempt(s) ==="
    commit_milestone PASS "$i"
    record_cost "$SID"
    break
  fi
  echo "$OUT"
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "=== [$NAME] $MS FAILED after $i attempt(s) ==="
    commit_milestone FAIL "$i"
    record_cost "$SID"
    exit 1
  fi
  i=$((i + 1))
  echo "=== [$NAME] $MS verify failed; retry $i (continuing session) ==="
  LOGN="$LOG_DIR/$MS-attempt-$i.log"
  run_opencode "$LOGN" run --dir "$WT" --dangerously-skip-permissions --format json -c \
    "上一次验收未通过。verify 输出如下:

$OUT

请自主修复,不要提问,直到 npm run typecheck、npm test 全绿,且达到验收要求(健全性 0 violation 且解出率达标)。"
done
