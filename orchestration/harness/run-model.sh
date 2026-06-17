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

# Record an anomaly/observation for post-mortem (echoed + appended to a notes file).
note() { echo "[NOTE $NAME/$MS] $*"; printf '%s %s\n' "$(date +%H:%M:%S)" "$*" >>"$LOG_DIR/$MS.notes"; }

AUTONOMY=$'\n\n## 自主执行(headless)\n本任务在无人值守环境运行:请完全自主完成,**不要提问**;遇歧义就选合理方案、简述假设并继续。\n若有会影响实现的疑问,请写入 worktree 根目录的 `QUESTIONS.md`(每条一行)再继续,不要停下等待回答。\n反复运行 `npm run typecheck` 与 `npm test` 直到全绿后再结束。'

# Run opencode; JSON events stream to $1. We proceed as soon as the turn is done,
# detected by IDLE: some providers' `opencode run` does NOT exit after the model
# finishes (it lingers), which previously forced a full TIMEOUT wait between
# attempts. So we poll the log: no new output for IDLE seconds => turn done ->
# stop opencode and continue immediately. TIMEOUT is just the absolute cap.
# Env: IDLE (default 180s), TIMEOUT (absolute cap, default 1800s).
run_opencode() {
  local log="$1"; shift
  local idle_limit="${IDLE:-180}"
  opencode "$@" >"$log" 2>&1 &
  local pid=$! waited=0 idle=0 last=0 size
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10; waited=$((waited + 10))
    size=$(wc -c <"$log" 2>/dev/null | tr -d ' '); size=${size:-0}
    if [ "$size" -gt "$last" ]; then last=$size; idle=0; else idle=$((idle + 10)); fi
    if [ "$idle" -ge "$idle_limit" ]; then
      note "opencode idle ${idle_limit}s after last output -> turn done, stopping it -> $(basename "$log")"
      kill -TERM "$pid" 2>/dev/null; sleep 3; kill -KILL "$pid" 2>/dev/null; break
    fi
    if [ "$waited" -ge "$TIMEOUT" ]; then
      note "opencode hard TIMEOUT ${TIMEOUT}s -> killed -> $(basename "$log")"
      kill -TERM "$pid" 2>/dev/null; sleep 3; kill -KILL "$pid" 2>/dev/null; break
    fi
  done
  wait "$pid" 2>/dev/null
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

# Record milestone metrics (cost + tokens + runtime) by summing step_finish
# events from the attempt logs. Robust for large sessions (opencode export
# truncates at 128KB, so it is NOT used).
record_metrics() {
  local status="$1" attempts="$2"
  node "$REPO/orchestration/harness/metrics.mjs" "$LOG_DIR" "$MS" "$status" "$attempts" >"$LOG_DIR/$MS.metrics.json" 2>/dev/null \
    || echo "{\"milestone\":\"$MS\",\"note\":\"metrics failed\"}" >"$LOG_DIR/$MS.metrics.json"
  echo "=== [$NAME] $MS metrics -> $(cat "$LOG_DIR/$MS.metrics.json") ==="
}

# Build the "required strategies" section appended to the prompt, from the
# milestone's canonical id list. Equal scope for every model; verify.sh enforces it.
required_ids_section() {
  local f="$REPO/orchestration/harness/required-ids/$MS.txt" list
  [ -f "$f" ] || return 0
  list="$(grep -vE '^[[:space:]]*(#|$)' "$f")"
  printf '\n\n## 必须实现的策略(缺一不可,缺失会被验收退回重试)\n请按下列**精确 id** 各注册一个策略到 `strategies/index.ts`(naked-single 已是 baseline);\n分组 id 可在内部覆盖子技巧(如 als 含 ALS-XZ/链/Death Blossom):\n%s\n' "$list"
}

# --- ensure worktree ---
# Reuse within a run (M2 creates it, M3 reuses) is normal. Reuse/attach at the
# FIRST milestone (m2) means leftover state from a PRIOR run -> resume, recorded.
if git -C "$REPO" worktree list --porcelain | grep -qx "worktree $WT"; then
  echo "=== [$NAME] reusing worktree $WT ==="
  [ "$MS" = "m2" ] && note "PRE-EXISTING worktree reused (leftover from a prior run; RESUMING on top of it, not fresh). For a clean run: orchestration/harness/cleanup.sh --purge first."
elif git -C "$REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "=== [$NAME] attaching existing branch $BRANCH to new worktree ==="
  note "PRE-EXISTING branch $BRANCH attached to a new worktree (leftover from a prior run; RESUMING)."
  git -C "$REPO" worktree add "$WT" "$BRANCH"
else
  echo "=== [$NAME] creating worktree on $BRANCH (from foundation) ==="
  git -C "$REPO" worktree add -b "$BRANCH" "$WT" foundation
fi

echo "=== [$NAME] installing deps ==="
( cd "$WT" && npm install --silent )

# Fixed-scope: the model must implement ALL required ids (verify.sh enforces via
# REQUIRE_IDS). Solve-rate is collected, not gated -> compares implementation quality.
PROMPT_TEXT="$(cat "$PROMPT_PATH")$(required_ids_section)$AUTONOMY"

# --- attempt 1 ---
echo "=== [$NAME] $MS attempt 1 :: $MODEL ==="
LOG1="$LOG_DIR/$MS-attempt-1.log"
run_opencode "$LOG1" run -m "$MODEL" --dir "$WT" --dangerously-skip-permissions --format json "$PROMPT_TEXT"
SID="$(grep -o 'ses_[A-Za-z0-9]*' "$LOG1" | head -1)"
[ -n "$SID" ] || note "no session id captured in attempt 1 (opencode may have failed to start / model unavailable / errored immediately) -> see $MS-attempt-1.log"

i=1
while true; do
  if OUT="$(bash "$REPO/orchestration/harness/verify.sh" "$WT" "$MS" 2>&1)"; then
    echo "$OUT"
    echo "=== [$NAME] $MS PASSED after $i attempt(s) ==="
    commit_milestone PASS "$i"
    record_metrics PASS "$i"
    break
  fi
  echo "$OUT"
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "=== [$NAME] $MS FAILED after $i attempt(s) ==="
    commit_milestone FAIL "$i"
    record_metrics FAIL "$i"
    exit 1
  fi
  i=$((i + 1))
  echo "=== [$NAME] $MS verify failed; retry $i (continuing session) ==="
  LOGN="$LOG_DIR/$MS-attempt-$i.log"
  # Continue the SAME session by explicit id (parallel-safe; keeps all retry cost
  # under one session for attribution). Fall back to -c if no id was captured.
  if [ -n "$SID" ]; then CONT=(--session "$SID"); else CONT=(-c); fi
  run_opencode "$LOGN" run --dir "$WT" --dangerously-skip-permissions --format json "${CONT[@]}" \
    "上一次验收未通过。verify 输出如下:

$OUT

请自主修复,不要提问,直到 npm run typecheck、npm test 全绿,且引擎对 data/ground-truth 零健全性 violation。"
done
