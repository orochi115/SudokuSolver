#!/usr/bin/env bash
# run-all.sh [models-file]                          full-auto fan-out: P0->P1->P2->E->P3 over all models
# run-all.sh --one <model> <name> <runner> <ptag>   (internal) one model's 5-phase chain
#
# round2 scheduler. Each model runs the ordered phase chain P0->P1->P2->E->P3
# (each model independent, models in parallel). A phase runs only if the previous
# phase PASSED; on failure the remaining phases are SKIP. Gate per phase =
# typecheck + tests + 0 soundness violations + all required strategyIds registered
# (+ P3 anti-pollution). 727 solve counts are collected, not gated.
#
# Provider-aware concurrency: total cap MAX_PAR; each "serial" provider-tag
# (SERIAL_PROVIDERS) capped at SERIAL_CAP (shared API keys). The provider-tag is
# column 4 of models.txt (NOT derived), so grok / siliconflow-cn etc. serialize.
#
# Env: MAX_PAR (4), RETRIES (3), TIMEOUT (run-model, 3600),
#      SERIAL_PROVIDERS (default "amazon-bedrock alibaba-cn siliconflow-cn grok"),
#      SERIAL_CAP (1), DRY_RUN=1 (simulate --one without calling models).
set -o pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/run-all.sh"
HARNESS="$(cd "$(dirname "$0")" && pwd)"
REPO="$(git rev-parse --show-toplevel)"
R2="$(cd "$HARNESS/.." && pwd)"
RETRIES="${RETRIES:-3}"
MAX_PAR="${MAX_PAR:-8}"               # API-turn concurrency; shared-key pairs still serialized below
VERIFY_MAX="${VERIFY_MAX:-3}"         # local verify concurrency cap (protects the laptop); used by run-model
SERIAL_PROVIDERS="${SERIAL_PROVIDERS:-amazon-bedrock alibaba-cn siliconflow-cn grok}"
SERIAL_CAP="${SERIAL_CAP:-1}"
# Stagger between launches so N models don't all cold-start at once (npm install + MCP
# spin-up + first API turn). The run2 grok Read tool_output_error was contention at the
# 8-way simultaneous cold-start; spreading launches out gives each room to initialize.
LAUNCH_STAGGER="${LAUNCH_STAGGER:-8}"
export VERIFY_MAX
STATUS_DIR="$R2/reports/status"
PHASES=(p0 p1 p2a p2b e p3)
mkdir -p "$STATUS_DIR"

cap_of() { case " $SERIAL_PROVIDERS " in *" $1 "*) printf '%s' "$SERIAL_CAP";; *) printf '%s' "$MAX_PAR";; esac; }

# ---- internal single-model 5-phase chain ----
if [ "${1:-}" = "--one" ]; then
  model="${2:?model}"; name="${3:?name}"; runner="${4:?runner}"; ptag="${5:?ptag}"

  if [ "${DRY_RUN:-0}" = "1" ]; then
    echo "$(date +%s) START $ptag $name ($runner)" >>"$R2/reports/dryrun.log"
    for ph in "${PHASES[@]}"; do echo "  would run $name :: $ph"; done >>"$R2/reports/dryrun.log"
    sleep "${DRY_SLEEP:-2}"
    echo "$(date +%s) END   $ptag $name" >>"$R2/reports/dryrun.log"
    exit 0
  fi

  ldir="$(cd "$REPO/.." && pwd)/sudoku-wt-r2/logs/$name"
  mkdir -p "$ldir"
  exec >> "$ldir/pipeline.log" 2>&1   # append (resume keeps prior log); no tee (terminal noise off for long runs)

  # Soft-gate + resumable: status labels are OK (soft-pass, scored by 727-delta in
  # <phase>.verify.json), STOP (hard fail: build/test/soundness/pollution), SKIP.
  # On resume we KEEP already-decided phases and only run undecided ones.
  sf="$STATUS_DIR/$name.tsv"; touch "$sf"
  # set_status keeps exactly ONE row per phase, in PHASES order (a resumed phase used to
  # APPEND a duplicate row — run2 post-mortem: every re-run model ended with overlapping
  # rows, and report.sh then read a stale one). Full history goes to <name>.hist.tsv.
  set_status() {  # <phase> <status>
    printf '%s\t%s\t%s\n' "$1" "$2" "$(date +%s)" >> "$STATUS_DIR/$name.hist.tsv"
    local q tmp="$sf.tmp" pv; : > "$tmp"
    for q in "${PHASES[@]}"; do
      if [ "$q" = "$1" ]; then printf '%s\t%s\n' "$q" "$2" >> "$tmp"
      else pv="$(awk -F'\t' -v p="$q" '$1==p{v=$2} END{if(v!="")print v}' "$sf" 2>/dev/null)"; [ -n "$pv" ] && printf '%s\t%s\n' "$q" "$pv" >> "$tmp"; fi
    done
    mv "$tmp" "$sf"
  }
  # Resume rule: only a clean OK is final (skip it). A prior STOP/SKIP may have been
  # infrastructure (sleep/network), so on a fresh launch it is RE-ATTEMPTED; a genuine
  # hard-fail just re-STOPs (bounded by RETRIES). Within ONE run, a fresh STOP cascades
  # to SKIP for later phases (don't build on a broken/unsound/polluted state).
  hard_stop=0
  for ph in "${PHASES[@]}"; do
    prev="$(awk -F'\t' -v p="$ph" '$1==p{v=$2} END{if(v!="")print v}' "$sf")"
    if [ "$prev" = "OK" ]; then echo "### [$name] $ph already OK — skip (resume)"; continue; fi
    if [ "$hard_stop" = "1" ]; then set_status "$ph" SKIP; continue; fi
    echo "### [$name] $model :: $ph  ($(date '+%Y-%m-%d %H:%M:%S'))"
    if bash "$HARNESS/run-model.sh" "$model" "$name" "$runner" "$ph" "$RETRIES"; then
      set_status "$ph" OK
    else
      set_status "$ph" STOP; hard_stop=1
    fi
  done
  exit 0
fi

# ---- main: provider-aware scheduler ----
MODELS_FILE="${1:-$R2/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE"; exit 1; }

mkdir -p "$R2/reports"
rm -rf "$R2/reports/.verifylock"   # clear stale verify-semaphore slots from a prior run
exec > >(tee -a "$R2/reports/scheduler.log") 2>&1
echo "===== round2 run-all start $(date '+%Y-%m-%d %H:%M:%S') (pid $$) ====="
echo "$$" > "$R2/reports/run-all.pid"   # so launch.sh / the user can target the (possibly detached) process group

# Keep machine awake while running (lid-OPEN idle/system sleep only; clamshell/lid-close
# still needs `sudo pmset -a disablesleep 1`). Auto-released when this script exits.
if command -v caffeinate >/dev/null 2>&1; then
  caffeinate -dimsu -w "$$" >/dev/null 2>&1 &
  echo "caffeinate -dimsu -w $$ (PID $!) started — blocks idle/system sleep (NOT lid-close)"
fi
# Watchdog: reaps any pipeline whose log stops growing past WATCHDOG_STALL (sleep/network
# wedge belt-and-suspenders, on top of run-model's own wall-clock deadlines). Dies with us.
WATCHDOG_PID=""
if [ "${WATCHDOG:-1}" = "1" ]; then
  bash "$HARNESS/watchdog.sh" "$$" >>"$R2/reports/watchdog.log" 2>&1 &
  WATCHDOG_PID=$!; echo "watchdog PID $WATCHDOG_PID (stall=${WATCHDOG_STALL:-2400}s)"
  trap 'kill "$WATCHDOG_PID" 2>/dev/null' EXIT
fi

models=(); names=(); runners=(); ptags=(); launched=()
while read -r m n r p _rest; do
  [ -n "$m" ] || continue
  models+=("$m"); names+=("$n"); runners+=("${r:-opencode}"); ptags+=("${p:-${m%%/*}}"); launched+=("0")
done < <(grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE")
n_models=${#models[@]}
[ "$n_models" -gt 0 ] || { echo "no models in $MODELS_FILE"; exit 1; }

run_pids=(); run_provs=()
reap() { local np=() nv=() i; for i in "${!run_pids[@]}"; do if kill -0 "${run_pids[$i]}" 2>/dev/null; then np+=("${run_pids[$i]}"); nv+=("${run_provs[$i]}"); fi; done; run_pids=(); run_provs=(); [ "${#np[@]}" -gt 0 ] && { run_pids=("${np[@]}"); run_provs=("${nv[@]}"); }; }
count_prov() { local p="$1" c=0 x; for x in ${run_provs[@]+"${run_provs[@]}"}; do [ "$x" = "$p" ] && c=$((c+1)); done; printf '%s' "$c"; }
remaining() { local c=0 i; for i in "${!models[@]}"; do [ "${launched[$i]}" = "0" ] && c=$((c+1)); done; printf '%s' "$c"; }

# --- liveness instrumentation (to diagnose the run2 whole-run death) ---
START=$(date +%s)
# Snapshot the run + process listing on any CATCHABLE fatal signal, before dying.
# SIGKILL can't be trapped — but if scheduler.log has no "caught SIG" line at the
# end, that itself rules out TERM/HUP/INT and points at KILL / OS sleep / supervisor.
_on_sig() {
  # Write DIRECTLY to a file, not via stdout: stdout is a pipe to `tee` (line 81), and a
  # process-group signal kills tee too — echoing here would die on SIGPIPE and log nothing
  # (this is why run2's death left no trace in scheduler.log). A fresh fd survives.
  {
    echo "!!!!! run-all caught SIG$1 @ $(date '+%F %T') (alive $(( $(date +%s) - START ))s; running=${#run_pids[@]}; remaining=$(remaining)) !!!!!"
    ps -o pid,ppid,pgid,etime,stat,command -ax 2>/dev/null | grep -E 'run-all|run-model|opencode|grok|caffeinate|watchdog\.sh' | grep -v grep || true
  } >> "$R2/reports/run-all.signal.log" 2>&1
  exit 143
}
trap '_on_sig TERM' TERM; trap '_on_sig HUP' HUP; trap '_on_sig INT' INT
HEARTBEAT="${HEARTBEAT_SEC:-60}"; last_hb=$START   # periodic liveness so the scheduler is never output-silent

echo "Scheduler: MAX_PAR=$MAX_PAR, stagger=${LAUNCH_STAGGER}s, serial=[$SERIAL_PROVIDERS]@$SERIAL_CAP, RETRIES=$RETRIES, phases=[${PHASES[*]}], $n_models models"

while [ "$(remaining)" -gt 0 ] || [ "${#run_pids[@]}" -gt 0 ]; do
  reap; progressed=0
  now=$(date +%s)
  if [ $((now - last_hb)) -ge "$HEARTBEAT" ]; then
    last_hb=$now
    echo "[hb $(date '+%H:%M:%S')] alive $(( now - START ))s | running=${#run_pids[@]} remaining=$(remaining)"
  fi
  if [ "${#run_pids[@]}" -lt "$MAX_PAR" ]; then
    for i in "${!models[@]}"; do
      [ "${launched[$i]}" = "0" ] || continue
      [ "${#run_pids[@]}" -lt "$MAX_PAR" ] || break
      p="${ptags[$i]}"
      if [ "$(count_prov "$p")" -lt "$(cap_of "$p")" ]; then
        "$SELF" --one "${models[$i]}" "${names[$i]}" "${runners[$i]}" "$p" &
        run_pids+=("$!"); run_provs+=("$p"); launched[$i]="1"; progressed=1
        echo "launched ${names[$i]} ($p / ${runners[$i]})  [running=${#run_pids[@]}]"
        # stagger cold-starts (skip the wait once all models are already running)
        [ "$(remaining)" -gt 0 ] && sleep "$LAUNCH_STAGGER"
      fi
    done
  fi
  if [ "$progressed" = "0" ]; then if [ "${#run_pids[@]}" -gt 0 ]; then sleep 2; else break; fi; fi
done
# NB: the loop above already joins every --one pipeline (reap empties run_pids on exit).
# Do NOT `wait` here — caffeinate (-w $$) and the watchdog both block until THIS pid exits,
# so a bare wait would deadlock. Stop the watchdog explicitly; caffeinate auto-releases on exit.
[ -n "${WATCHDOG_PID:-}" ] && kill "$WATCHDOG_PID" 2>/dev/null

echo "All pipelines finished. Generating report..."
bash "$HARNESS/report.sh" "$MODELS_FILE" || true
echo "Report: $R2/reports/summary.md"
