#!/usr/bin/env bash
# run-model.sh <model-id> <short-name> <runner> <phase> [max-retries]
#   runner ∈ opencode | grok        phase ∈ p0 p1 p2 e p3
#
# Drives ONE model through ONE round2 phase:
#   - isolates work in a git worktree on branch model/<short> (from foundation);
#     the worktree is created at p0 and REUSED by later phases (cumulative).
#   - builds the prompt: round2/prompts/<phase>.md + required-ids section + autonomy
#   - runs it headless via `opencode run` OR `grok -p` (permissions pre-approved),
#     wrapped in idle-detection + a hard TIMEOUT
#   - gates on round2 verify.sh <wt> <phase>; on failure continues/retries with the
#     verifier output as feedback, up to max-retries
#   - commits the phase result (pass/fail) and records metrics (cost/tokens/time)
#   - collects the per-phase .r2-verify-<phase>.json (verifySec + 727 counts)
#
# Env: TIMEOUT (sec/attempt, default 3600), IDLE (sec no-output => turn done, default 180),
#      GROK_RETRY_MODE (resume|fresh, default resume).
set -uo pipefail

MODEL="${1:?usage: run-model.sh <model-id> <short> <runner> <phase> [max-retries]}"
NAME="${2:?missing short}"
RUNNER="${3:?missing runner}"
PH="${4:?missing phase}"
MAX_RETRIES="${5:-3}"
TIMEOUT="${TIMEOUT:-3600}"
GROK_RETRY_MODE="${GROK_RETRY_MODE:-resume}"

REPO="$(git rev-parse --show-toplevel)"
HARNESS="$(cd "$(dirname "$0")" && pwd)"          # orchestration/round2/harness
R2="$(cd "$HARNESS/.." && pwd)"                    # orchestration/round2
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt-r2"
WT="$WT_ROOT/$NAME"
BRANCH="model/$NAME"
PROMPT_PATH="$R2/prompts/$PH.md"
[ -f "$PROMPT_PATH" ] || { echo "prompt not found: $PROMPT_PATH"; exit 1; }

LOG_DIR="$WT_ROOT/logs/$NAME"
mkdir -p "$LOG_DIR"

note() { echo "[NOTE $NAME/$PH] $*"; printf '%s %s\n' "$(date +%H:%M:%S)" "$*" >>"$LOG_DIR/$PH.notes"; }

AUTONOMY=$'\n\n## 自主执行(headless)\n本任务在无人值守环境运行:请完全自主完成,**不要提问**;遇歧义就选合理方案、简述假设并继续。\n若有会影响实现的疑问,请写入 worktree 根目录的 `QUESTIONS.md`(每条一行)再继续,不要停下等待回答。\n反复运行 `npm run typecheck` 与 `npm test` 直到全绿后再结束。'

required_ids_section() {
  local f="$R2/required-ids/$PH.txt" list
  [ -f "$f" ] || return 0
  list="$(grep -vE '^[[:space:]]*(#|$)' "$f")"
  [ -n "$list" ] || return 0
  printf '\n\n## 必须实现/保持注册的策略(缺一不可,缺失会被验收退回重试)\n请按下列**精确 strategyId** 注册到 `strategies/index.ts`(地基已有 33 个策略,无需重列):\n%s\n' "$list"
}

# --- opencode runner (JSON event stream; idle-detect to proceed promptly) ---
run_opencode() {
  local log="$1"; shift
  local idle_limit="${IDLE:-180}"
  opencode "$@" >"$log" 2>&1 &
  local pid=$! waited=0 idle=0 last=0 size
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10; waited=$((waited + 10))
    size=$(wc -c <"$log" 2>/dev/null | tr -d ' '); size=${size:-0}
    if [ "$size" -gt "$last" ]; then last=$size; idle=0; else idle=$((idle + 10)); fi
    if [ "$idle" -ge "$idle_limit" ]; then note "opencode idle ${idle_limit}s -> turn done -> $(basename "$log")"; kill -TERM "$pid" 2>/dev/null; sleep 3; kill -KILL "$pid" 2>/dev/null; break; fi
    if [ "$waited" -ge "$TIMEOUT" ]; then note "opencode hard TIMEOUT ${TIMEOUT}s -> killed"; kill -TERM "$pid" 2>/dev/null; sleep 3; kill -KILL "$pid" 2>/dev/null; break; fi
  done
  wait "$pid" 2>/dev/null; return 0
}

# --- grok runner: single-turn via --prompt-file. ---
# NOTE: `grok -p/--prompt-file` is single-turn and EXITS when the turn is done
# (unlike opencode, which lingers). With `--output-format json` grok also buffers
# a single JSON object to stdout at the very END, so there is NO incremental
# output to detect idle on — an idle-kill would (and did, in the P0 smoke) murder
# grok mid-work before it emits the session id. So we WAIT for natural exit and
# only enforce the hard TIMEOUT cap.
# Args: <log> <prompt-file> [resume-session-id]
run_grok() {
  local log="$1" pf="$2" sid="${3:-}"
  local args=(-m "$MODEL" --cwd "$WT" --output-format json --always-approve --no-plan --prompt-file "$pf")
  [ -n "$sid" ] && args=(-r "$sid" "${args[@]}")
  grok "${args[@]}" >"$log" 2>&1 &
  local pid=$! waited=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10; waited=$((waited + 10))
    if [ "$waited" -ge "$TIMEOUT" ]; then note "grok hard TIMEOUT ${TIMEOUT}s -> killed"; kill -TERM "$pid" 2>/dev/null; sleep 3; kill -KILL "$pid" 2>/dev/null; break; fi
  done
  wait "$pid" 2>/dev/null; return 0
}

commit_phase() {
  local status="$1" attempts="$2"
  git -C "$WT" add -A
  if git -C "$WT" diff --cached --quiet; then echo "=== [$NAME] $PH: nothing to commit ==="; return 0; fi
  git -C "$WT" commit -q -m "model/$NAME: $PH $status (${attempts} attempt(s)) [$MODEL via $RUNNER]"
  echo "=== [$NAME] committed $PH ($status) ==="
}

record_metrics() {
  local status="$1" attempts="$2" wall="$3"
  if [ "$RUNNER" = "grok" ]; then
    node "$HARNESS/metrics-grok.mjs" "$LOG_DIR" "$PH" "$status" "$attempts" "$wall" >"$LOG_DIR/$PH.metrics.json" 2>/dev/null \
      || echo "{\"phase\":\"$PH\",\"note\":\"metrics failed\"}" >"$LOG_DIR/$PH.metrics.json"
  else
    node "$REPO/orchestration/harness/metrics.mjs" "$LOG_DIR" "$PH" "$status" "$attempts" >"$LOG_DIR/$PH.metrics.json" 2>/dev/null \
      || echo "{\"phase\":\"$PH\",\"note\":\"metrics failed\"}" >"$LOG_DIR/$PH.metrics.json"
  fi
  echo "=== [$NAME] $PH metrics -> $(cat "$LOG_DIR/$PH.metrics.json") ==="
}

collect_verify_json() {
  [ -f "$WT/.r2-verify-$PH.json" ] && cp "$WT/.r2-verify-$PH.json" "$LOG_DIR/$PH.verify.json" || true
  for f in "$WT/.r2-solve-$PH".*.json; do [ -f "$f" ] && cp "$f" "$LOG_DIR/" || true; done
}

# --- ensure worktree (created at p0, reused later) ---
if git -C "$REPO" worktree list --porcelain | grep -qx "worktree $WT"; then
  echo "=== [$NAME] reusing worktree $WT ==="
  [ "$PH" = "p0" ] && note "PRE-EXISTING worktree reused at p0 (leftover from a prior run; RESUMING)."
elif git -C "$REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "=== [$NAME] attaching existing branch $BRANCH to new worktree ==="
  note "PRE-EXISTING branch $BRANCH attached (RESUMING)."
  git -C "$REPO" worktree add "$WT" "$BRANCH"
else
  echo "=== [$NAME] creating worktree on $BRANCH (from foundation) ==="
  git -C "$REPO" worktree add -b "$BRANCH" "$WT" foundation
fi

echo "=== [$NAME] installing deps ==="
( cd "$WT" && npm install --silent )

PROMPT_TEXT="$(cat "$PROMPT_PATH")$(required_ids_section)$AUTONOMY"

# --- attempt 1 ---
echo "=== [$NAME] $PH attempt 1 :: $MODEL ($RUNNER) ==="
LOG1="$LOG_DIR/$PH-attempt-1.log"
t0=$(date +%s)
SID=""
if [ "$RUNNER" = "grok" ]; then
  PF1="$LOG_DIR/$PH-prompt-1.txt"; printf '%s' "$PROMPT_TEXT" >"$PF1"
  run_grok "$LOG1" "$PF1"
  SID="$(grep -oE '"sessionId"[: ]*"[^"]+"' "$LOG1" | head -1 | sed -E 's/.*"sessionId"[: ]*"([^"]+)".*/\1/')"
  [ -n "$SID" ] || note "no grok sessionId captured in attempt 1 -> retries will use fresh prompt"
else
  run_opencode "$LOG1" run -m "$MODEL" --dir "$WT" --dangerously-skip-permissions --format json "$PROMPT_TEXT"
  SID="$(grep -o 'ses_[A-Za-z0-9]*' "$LOG1" | head -1)"
  [ -n "$SID" ] || note "no session id captured in attempt 1 (model may have failed to start/errored) -> see $PH-attempt-1.log"
fi

i=1
while true; do
  if OUT="$(bash "$HARNESS/verify.sh" "$WT" "$PH" 2>&1)"; then
    echo "$OUT"; echo "=== [$NAME] $PH PASSED after $i attempt(s) ==="
    collect_verify_json; commit_phase PASS "$i"; record_metrics PASS "$i" "$(( $(date +%s) - t0 ))"; break
  fi
  echo "$OUT"
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "=== [$NAME] $PH FAILED after $i attempt(s) ==="
    collect_verify_json; commit_phase FAIL "$i"; record_metrics FAIL "$i" "$(( $(date +%s) - t0 ))"; exit 1
  fi
  i=$((i + 1))
  echo "=== [$NAME] $PH verify failed; retry $i ==="
  LOGN="$LOG_DIR/$PH-attempt-$i.log"
  FB="上一次验收未通过。verify 输出如下:

$OUT

请自主修复,不要提问,直到 npm run typecheck、npm test 全绿,且引擎对 data/ground-truth 零健全性 violation、本阶段全部 required strategyId 已注册。"
  if [ "$RUNNER" = "grok" ]; then
    PFN="$LOG_DIR/$PH-prompt-$i.txt"
    if [ -n "$SID" ] && [ "$GROK_RETRY_MODE" = "resume" ]; then
      printf '%s' "$FB" >"$PFN"; run_grok "$LOGN" "$PFN" "$SID"
    else
      # fresh fallback: re-send original prompt + feedback (same worktree state preserved)
      printf '%s\n\n%s' "$PROMPT_TEXT" "$FB" >"$PFN"; run_grok "$LOGN" "$PFN"
    fi
    NSID="$(grep -oE '"sessionId"[: ]*"[^"]+"' "$LOGN" | head -1 | sed -E 's/.*"sessionId"[: ]*"([^"]+)".*/\1/')"
    [ -n "$NSID" ] && SID="$NSID"
  else
    if [ -n "$SID" ]; then CONT=(--session "$SID"); else CONT=(-c); fi
    run_opencode "$LOGN" run --dir "$WT" --dangerously-skip-permissions --format json "${CONT[@]}" "$FB"
  fi
done
