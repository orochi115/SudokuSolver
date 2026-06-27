#!/usr/bin/env bash
# watchdog.sh <scheduler-pid>
#
# Belt-and-suspenders reaper for the round2 run. run-model already enforces
# wall-clock deadlines on the model call and verify; this catches hangs OUTSIDE
# those (npm install, git, between-steps) — e.g. a process left in a stalled
# syscall by laptop sleep. Every CHECK secs it looks at each model's pipeline.log;
# if it hasn't grown for WATCHDOG_STALL secs (WALL clock, so sleep counts), it
# kills that model's run-model subtree so the scheduler records STOP and advances
# (a fresh `run-all` re-attempts STOP phases — see run-all resume rule).
# Exits when the scheduler PID dies.
set -uo pipefail

SCHED="${1:?usage: watchdog.sh <scheduler-pid>}"
REPO="$(git rev-parse --show-toplevel)"
LOGS="$(cd "$REPO/.." && pwd)/sudoku-wt-r2/logs"
STALL="${WATCHDOG_STALL:-2400}"   # 40min; > run-model's own idle(180)/grok-stall(600)/verify caps
CHECK="${WATCHDOG_CHECK:-120}"

_kill_tree() { local p="$1" c; for c in $(pgrep -P "$p" 2>/dev/null); do _kill_tree "$c"; done; kill -KILL "$p" 2>/dev/null; }
_tree_pids() { local p="$1" c; echo "$p"; for c in $(pgrep -P "$p" 2>/dev/null); do _tree_pids "$c"; done; }

echo "watchdog up: stall=${STALL}s check=${CHECK}s sched=$SCHED"
while kill -0 "$SCHED" 2>/dev/null; do
  sleep "$CHECK"
  now=$(date +%s)
  [ -d "$LOGS" ] || continue
  for pl in "$LOGS"/*/pipeline.log; do
    [ -f "$pl" ] || continue
    name="$(basename "$(dirname "$pl")")"
    mt=$(stat -f %m "$pl" 2>/dev/null || echo "$now"); age=$((now - mt))
    [ "$age" -lt "$STALL" ] && continue
    # is a run-model for this model still alive? (pipeline done models won't match)
    rmpid=$(pgrep -f "run-model\.sh [^ ]+ $name " 2>/dev/null | head -1)
    [ -n "$rmpid" ] || continue
    # derive the phase from the run-model cmdline: bash run-model.sh <model> <name> <runner> <ph> ...
    cmd="$(ps -o command= -p "$rmpid" 2>/dev/null)"
    ph="$(printf '%s' "$cmd" | sed -nE 's/.*run-model\.sh +[^ ]+ +'"$name"' +[^ ]+ +([^ ]+).*/\1/p')"; ph="${ph:-unknown}"
    pids_csv="$(_tree_pids "$rmpid" | paste -sd, -)"
    reason="pipeline.log 已 ${age}s 无增长 (> WATCHDOG_STALL=${STALL}s): 模型完全无输出 — 卡死/死循环/在等输入/或 socket 被睡眠冻死。"
    echo "$(date '+%H:%M:%S') WATCHDOG: $name/$ph stale ${age}s (>$STALL) -> KILL run-model subtree $rmpid [$pids_csv]"
    echo "  reason: $reason"
    # Persist a phase-specific kill record. run-model reads this on the NEXT run to
    # tell the model exactly why its prior attempt was reaped (self-improvement feedback).
    kr="$(dirname "$pl")/$ph.watchdog-kill.txt"
    {
      echo "=== watchdog KILL $name/$ph @ $(date '+%F %T') ==="
      echo "reason: $reason"
      echo "--- pipeline.log tail (what it was doing) ---"; tail -n 10 "$pl" 2>/dev/null
      echo "--- process subtree (SIGKILLed) ---"; ps -o pid,ppid,etime,stat,command -p "$pids_csv" 2>/dev/null
      echo
    } >>"$kr" 2>&1
    sed 's/^/  | /' "$kr" | tail -n 16   # echo the record into watchdog.log too
    _kill_tree "$rmpid"
    echo "$(date '+%H:%M:%S') WATCHDOG: $name/$ph subtree killed; scheduler will record STOP and advance."
  done
done
echo "watchdog exit (scheduler $SCHED gone)"
