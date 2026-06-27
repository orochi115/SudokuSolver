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

# Kill a process AND all its descendants (a bare kill left wedged children alive
# after sleep-induced socket stalls — see round2 v1 post-mortem). TERM then KILL.
_kill_tree() { local p="$1" c; for c in $(pgrep -P "$p" 2>/dev/null); do _kill_tree "$c"; done; kill -TERM "$p" 2>/dev/null; }
_kill_tree9() { local p="$1" c; for c in $(pgrep -P "$p" 2>/dev/null); do _kill_tree9 "$c"; done; kill -KILL "$p" 2>/dev/null; }

AUTONOMY=$'\n\n## 自主执行(headless)\n本任务在无人值守环境运行:请完全自主完成,**不要提问**;遇歧义就选合理方案、简述假设并继续。\n若有会影响实现的疑问,请写入 worktree 根目录的 `QUESTIONS.md`(每条一行)再继续,不要停下等待回答。\n反复运行 `npm run typecheck` 与 `npm test` 直到全绿后再结束。\n\n## 红线(硬性,违反直接判失败)\n- **禁止任何"伪装成人类策略"的枚举/搜索**:human-default 档的策略**不得**做试错/回溯/矛盾穷举(Nishio/forcing-net 之类),这类只允许放进 `last-resort`(P3,且 id 必须进 `LAST_RESORT_IDS`)。\n- **禁止调用暴力求解器/答案**:策略代码**绝不**可调用 `solveBruteforce`/`countSolutions`/`findGroundTruth` 或读取任何答案来"解题"——验收会扫描并直接判失败。\n- 每个 elimination/placement 必须是**有名可讲的人类推理**,验收对 400 题与 727 残集**逐步**做健全性校验,任何非法消除直接判失败。\n\n## 结束前自检(必须做,并写进设计说明)\n- 跑 `npm run solve:list -- --profile human-default` 与 `-- --profile last-resort`,记录两档 727 解出数(本阶段相对上一阶段的 delta)。\n- 确认 human-default 的解出提升来自**真实人类技巧**,不是搜索;若某策略涉及多分支搜索,要么归到 last-resort,要么不提交。\n- 自审:逐策略说明在 727 上命中多少题、有无任何策略内部做回溯/穷举。'

required_ids_section() {
  local f="$R2/required-ids/$PH.txt" list
  [ -f "$f" ] || return 0
  list="$(grep -vE '^[[:space:]]*(#|$)' "$f")"
  [ -n "$list" ] || return 0
  printf '\n\n## 必须实现/保持注册的策略(缺一不可,缺失会被验收退回重试)\n请按下列**精确 strategyId** 注册到 `strategies/index.ts`(地基已有 33 个策略,无需重列):\n%s\n' "$list"
}

# Fail-safe self-improvement: if THIS phase was attempted in a PRIOR run and did not
# pass (we're resuming), rebuild a post-mortem from the persisted artifacts —
#   .notes (idle/timeout self-kills), .verify.json (soundness/pollution/missing ids),
#   <ph>.watchdog-kill.txt (external stall kill) — and prepend it to attempt-1's prompt
# so the model knows exactly what went wrong last time and corrects instead of repeating.
# (.notes/.verify.json/watchdog-kill survive across runs; attempt logs are truncated.)
resume_feedback_section() {
  local notes="$LOG_DIR/$PH.notes" vj="$LOG_DIR/$PH.verify.json" wk="$LOG_DIR/$PH.watchdog-kill.txt"
  [ -f "$notes" ] || [ -f "$vj" ] || [ -f "$wk" ] || return 0   # no prior attempt -> first run, nothing to say
  printf '\n\n## ⚠️ 续跑提示:上次本阶段未完成,先读这里再动手\n'
  printf '你在上一次运行中**没有通过本阶段**(代码改动已保留在当前 worktree)。下面是上次失败/被中断的原因,请**针对性改进、不要重复同样的错误**:\n'
  if [ -f "$wk" ]; then
    printf '\n### 上次被 watchdog 强杀(长时间零输出)\n```\n%s\n```\n' "$(tail -n 14 "$wk")"
    printf '→ 上次很可能陷入死循环、单步过久、或在等待输入。**把工作切成小步、持续产生输出**:每实现/修改一个策略就立刻 `npm run typecheck` + 跑相关测试并打印进度;严禁长时间静默或一次性铺很大改动。\n'
  fi
  if [ -f "$notes" ]; then
    local idle; idle="$(grep -iE 'idle|timeout|stall' "$notes" 2>/dev/null | tail -n 4)"
    [ -n "$idle" ] && printf '\n### 上次的 idle/超时记录\n```\n%s\n```\n→ 同上:频繁产出、避免静默。\n' "$idle"
  fi
  if [ -f "$vj" ]; then
    printf '\n### 上次验收结果(.verify.json 摘要)\n```json\n%s\n```\n' "$(head -c 1400 "$vj")"
    printf '→ 优先修复其中的 soundness violation / human-default 污染 / 缺失的 required strategyId。\n'
  fi
}

# Wait for a backgrounded child by WALL-CLOCK (date), not loop-iteration count.
# Rationale (round2 v1 post-mortem): laptop sleep freezes the poll loop, so an
# iteration counter undercounts elapsed time and never trips — a sleep-wedged,
# dead-socket process hung forever. Wall-clock deadlines fire correctly on wake.
#   _wait_child <pid> <log> <idle_limit> <hard_timeout>
# Ends the turn on: (a) natural exit, (b) no log growth for idle_limit WALL secs
# (turn done / stalled), or (c) hard_timeout WALL secs. Kills the whole subtree.
_wait_child() {
  local pid="$1" log="$2" idle_limit="$3" hard="$4"
  local start now size last_size=0 last_grow
  start=$(date +%s); last_grow=$start
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10; now=$(date +%s)
    size=$(wc -c <"$log" 2>/dev/null | tr -d ' '); size=${size:-0}
    if [ "$size" -gt "$last_size" ]; then last_size=$size; last_grow=$now; fi
    if [ "$idle_limit" -gt 0 ] && [ $((now - last_grow)) -ge "$idle_limit" ]; then
      note "idle ${idle_limit}s (wall, no output) -> turn done/stalled -> $(basename "$log")"; _kill_tree "$pid"; sleep 2; _kill_tree9 "$pid"; break; fi
    if [ $((now - start)) -ge "$hard" ]; then
      note "hard TIMEOUT ${hard}s (wall) -> killed -> $(basename "$log")"; _kill_tree "$pid"; sleep 2; _kill_tree9 "$pid"; break; fi
  done
  wait "$pid" 2>/dev/null; return 0
}

# --- opencode runner: lingers after the turn, so idle (no-output) ends it ---
run_opencode() {
  local log="$1"; shift
  : >"$log"
  opencode "$@" >"$log" 2>&1 &
  _wait_child "$!" "$log" "${IDLE:-180}" "$TIMEOUT"
}

# --- grok runner: single-turn via --prompt-file, exits on its own. ---
# Uses --output-format streaming-json (NOT json): json buffers one object to the
# END (0-byte log mid-turn -> killed the idle heuristic AND lost the process trace
# in round2 v1). streaming-json emits incremental events (thought/text/tool/end),
# so the log grows live -> stall detection works and the full process is captured.
# sessionId is in the final {"type":"end",...,"sessionId":...} event.
# Args: <log> <prompt-file> [resume-session-id]
run_grok() {
  local log="$1" pf="$2" sid="${3:-}"
  : >"$log"
  local args=(-m "$MODEL" --cwd "$WT" --output-format streaming-json --always-approve --no-plan --prompt-file "$pf")
  [ -n "$sid" ] && args=(-r "$sid" "${args[@]}")
  grok "${args[@]}" >"$log" 2>&1 &
  # grok exits naturally; idle here = "stalled" (e.g. sleep-killed socket), default 600s.
  _wait_child "$!" "$log" "${GROK_STALL:-600}" "$TIMEOUT"
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

# Verify concurrency lock (R6): cap simultaneous verifies across all parallel
# models to VERIFY_MAX so N heavy vitest+solve:list runs don't thrash the laptop.
# mkdir-based counting semaphore; run-all clears the lockdir at start (stale-safe).
LOCKDIR="$R2/reports/.verifylock"
acquire_verify() {
  mkdir -p "$LOCKDIR"; local k sf
  while true; do
    for k in $(seq 1 "${VERIFY_MAX:-3}"); do
      sf="$LOCKDIR/slot$k"
      if mkdir "$sf" 2>/dev/null; then echo "$sf"; return 0; fi
    done
    sleep 5
  done
}
release_verify() { [ -n "${1:-}" ] && rmdir "$1" 2>/dev/null; return 0; }

# Run verify.sh under a verify-slot + a hard wall-clock cap (a sleep-stalled verify
# must not wedge the pipeline). Echoes verify output; returns verify's exit code:
#   0 = full pass | 2 = soft (sound+clean but required ids incomplete) | 1 = hard fail.
guarded_verify() {
  local out="$LOG_DIR/$PH-verify-$i.out"; : >"$out"; rm -f "$out.rc"
  local slot; slot="$(acquire_verify)"
  ( bash "$HARNESS/verify.sh" "$WT" "$PH" >"$out" 2>&1; echo $? >"$out.rc" ) &
  _wait_child "$!" "$out" 0 "${VERIFY_TIMEOUT:-1800}"
  release_verify "$slot"
  cat "$out"
  local rc; rc="$(cat "$out.rc" 2>/dev/null)"; [ -n "$rc" ] && return "$rc" || return 1
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

PROMPT_TEXT="$(cat "$PROMPT_PATH")$(required_ids_section)$AUTONOMY$(resume_feedback_section)"

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

# Soft-gate loop (R4): verify rc 0=full / 2=soft(sound+clean, ids incomplete) / 1=hard.
# Full pass -> done. Hard fail -> retry; if exhausted, STOP (exit 1). Soft -> retry to
# push for more ids; if exhausted, ACCEPT as soft-pass (exit 0) scored by 727-delta.
finish() {  # <status-label> <exitcode>
  collect_verify_json; commit_phase "$1" "$i"; record_metrics "$1" "$i" "$(( $(date +%s) - t0 ))"; exit "$2"
}
i=1
while true; do
  OUT="$(guarded_verify)"; rc=$?
  echo "$OUT"
  if [ "$rc" -eq 0 ]; then echo "=== [$NAME] $PH FULL PASS after $i attempt(s) ==="; finish OK-full 0; fi
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    if [ "$rc" -eq 2 ]; then echo "=== [$NAME] $PH SOFT-PASS after $i (sound+clean; ids incomplete — scored by 727-delta) ==="; finish OK-soft 0
    else echo "=== [$NAME] $PH HARD-FAIL after $i (build/test/soundness/pollution) ==="; finish STOP 1; fi
  fi
  i=$((i + 1))
  echo "=== [$NAME] $PH verify rc=$rc; retry $i ==="
  LOGN="$LOG_DIR/$PH-attempt-$i.log"
  FB="上一次验收未通过(rc=$rc)。verify 输出如下:

$OUT

请自主修复,不要提问,直到 npm run typecheck、npm test 全绿,引擎对 data/ground-truth 与 727 残集零健全性 violation、无 human-default 污染;并尽量补全本阶段全部 required strategyId。"
  if [ "$RUNNER" = "grok" ]; then
    PFN="$LOG_DIR/$PH-prompt-$i.txt"
    if [ -n "$SID" ] && [ "$GROK_RETRY_MODE" = "resume" ]; then
      printf '%s' "$FB" >"$PFN"; run_grok "$LOGN" "$PFN" "$SID"
    else
      printf '%s\n\n%s' "$PROMPT_TEXT" "$FB" >"$PFN"; run_grok "$LOGN" "$PFN"
    fi
    NSID="$(grep -oE '"sessionId"[: ]*"[^"]+"' "$LOGN" | head -1 | sed -E 's/.*"sessionId"[: ]*"([^"]+)".*/\1/')"
    [ -n "$NSID" ] && SID="$NSID"
  else
    if [ -n "$SID" ]; then CONT=(--session "$SID"); else CONT=(-c); fi
    run_opencode "$LOGN" run --dir "$WT" --dangerously-skip-permissions --format json "${CONT[@]}" "$FB"
  fi
done
