#!/usr/bin/env bash
# launch.sh [models-file]
#
# Start run-all.sh DETACHED from this shell/session, so a closed terminal,
# disconnected SSH, a reaped agent/background task, or a lid-close that severs the
# controlling session can NOT deliver a signal to the run's process group. (run2
# died this way: the whole group went down at once ~40min in — see archive notes.)
#
#   setsid  -> new session + process group, no controlling terminal
#   nohup   -> ignore SIGHUP
#   </dev/null, >LOG 2>&1 -> no tty, all output to a tail-able file
#
# All run-all.sh env vars pass through unchanged, e.g.:
#   SERIAL_PROVIDERS="alibaba-cn siliconflow-cn amazon-bedrock grok" SERIAL_CAP=1 \
#   MAX_PAR=8 VERIFY_MAX=3 RETRIES=3 TIMEOUT=3600 GROK_RETRY_MODE=resume \
#   orchestration/round2/harness/launch.sh orchestration/round2/models.txt
set -uo pipefail

HARNESS="$(cd "$(dirname "$0")" && pwd)"
R2="$(cd "$HARNESS/.." && pwd)"
REPO="$(git -C "$HARNESS" rev-parse --show-toplevel)"
MODELS_FILE="${1:-$R2/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE" >&2; exit 1; }

mkdir -p "$R2/reports"
OUT="$R2/reports/run-all.out"
PIDFILE="$R2/reports/run-all.pid"
WT_LOGS="$(cd "$REPO/.." && pwd)/sudoku-wt-r2/logs"

# Refuse to launch if a run-all is already alive (avoid two schedulers fighting over worktrees).
if pgrep -f "run-all\.sh .*models\.txt" >/dev/null 2>&1; then
  echo "!! a run-all.sh already appears to be running — refusing to double-launch. Check: pgrep -fl run-all.sh" >&2
  exit 1
fi

rm -f "$PIDFILE"
if command -v setsid >/dev/null 2>&1; then
  setsid bash "$HARNESS/run-all.sh" "$MODELS_FILE" </dev/null >"$OUT" 2>&1 &
  disown "$!" 2>/dev/null || true
elif command -v perl >/dev/null 2>&1; then
  # macOS lacks setsid. Daemonize via perl: fork (parent exits), child leads a NEW
  # session (POSIX::setsid -> no controlling terminal, own process group), then exec.
  nohup perl -e 'use POSIX; fork and exit; POSIX::setsid(); exec { $ARGV[0] } @ARGV' \
    bash "$HARNESS/run-all.sh" "$MODELS_FILE" </dev/null >"$OUT" 2>&1 &
  disown "$!" 2>/dev/null || true
else
  nohup bash "$HARNESS/run-all.sh" "$MODELS_FILE" </dev/null >"$OUT" 2>&1 &
  disown "$!" 2>/dev/null || true
fi

# run-all writes its own pid to $PIDFILE on startup; wait briefly for it.
PID=""
for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$PIDFILE" ] && { PID="$(cat "$PIDFILE")"; break; }; sleep 0.3; done
[ -n "$PID" ] || { echo "!! run-all did not write $PIDFILE within 3s — check $OUT" >&2; tail -n 20 "$OUT" 2>/dev/null; exit 1; }

echo "run-all launched DETACHED (new session): pid $PID   log -> $OUT"
echo
echo "  watch scheduler : tail -f $OUT"
echo "  watch a model   : tail -f $WT_LOGS/<name>/pipeline.log"
echo "  liveness        : grep '\\[hb' $OUT | tail        (heartbeat every \${HEARTBEAT_SEC:-60}s)"
echo "  stop the run    : kill -TERM -$PID                (negative pid = whole process group)"
echo "  (a clean signal will be logged to scheduler.log via run-all's signal trap)"
