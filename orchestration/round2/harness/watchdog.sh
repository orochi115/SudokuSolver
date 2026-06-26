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
    echo "$(date '+%H:%M:%S') WATCHDOG: $name stale ${age}s (>$STALL) -> killing run-model subtree $rmpid"
    _kill_tree "$rmpid"
  done
done
echo "watchdog exit (scheduler $SCHED gone)"
