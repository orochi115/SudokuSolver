#!/usr/bin/env bash
# run-all.sh [models-file]                     full-auto fan-out: M2 -> M3 over all models
# run-all.sh --one <provider/model> <name>     (internal) one model's M2->M3 pipeline
#
# Provider-aware scheduler: total concurrency is capped at MAX_PAR, AND each
# "serial" provider (default: amazon-bedrock + alibaba-cn, since alibaba-cn's
# 5 models share one DashScope key) is capped at SERIAL_CAP (default 1).
# Non-serial providers are limited only by MAX_PAR, so they still parallelise.
#
# Each model runs M2 (gated, with retries); only if M2 passes does M3 run.
# The gate requires VALID + SOUND output (typecheck, tests, 0 soundness
# violations) — solve-rate is collected for comparison, not gated.
#
# Env: MAX_PAR (default 4), RETRIES (default 3), TIMEOUT (run-model, default 1800),
#      SERIAL_PROVIDERS (default "amazon-bedrock"), SERIAL_CAP (default 1),
#      DRY_RUN=1 (simulate --one without calling models; for testing the scheduler).
set -o pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/run-all.sh"
REPO="$(git rev-parse --show-toplevel)"
RETRIES="${RETRIES:-3}"
MAX_PAR="${MAX_PAR:-4}"
SERIAL_PROVIDERS="${SERIAL_PROVIDERS:-amazon-bedrock alibaba-cn}"
SERIAL_CAP="${SERIAL_CAP:-1}"
STATUS_DIR="$REPO/orchestration/reports/status"
mkdir -p "$STATUS_DIR"

provider_of() { printf '%s' "${1%%/*}"; }
cap_of() { # provider -> concurrency cap
  case " $SERIAL_PROVIDERS " in *" $1 "*) printf '%s' "$SERIAL_CAP";; *) printf '%s' "$MAX_PAR";; esac
}

# ---- internal single-model pipeline ----
if [ "${1:-}" = "--one" ]; then
  model="${2:?model}"; name="${3:?name}"

  if [ "${DRY_RUN:-0}" = "1" ]; then   # scheduler test: simulate without real runs
    prov="$(provider_of "$model")"
    echo "$(date +%s) START $prov $name" >>"$REPO/orchestration/reports/dryrun.log"
    sleep "${DRY_SLEEP:-2}"
    echo "$(date +%s) END   $prov $name" >>"$REPO/orchestration/reports/dryrun.log"
    exit 0
  fi

  # Capture this model's whole pipeline (markers + run-model echoes + verify
  # output + notes) to a per-model file, while still showing it on the terminal.
  ldir="$(cd "$REPO/.." && pwd)/sudoku-wt/logs/$name"
  mkdir -p "$ldir"
  exec > >(tee -a "$ldir/pipeline.log") 2>&1

  sf="$STATUS_DIR/$name.tsv"
  : > "$sf"
  echo "### [$name] $model :: M2  ($(date '+%Y-%m-%d %H:%M:%S'))"
  if bash "$REPO/orchestration/harness/run-model.sh" "$model" "$name" "orchestration/harness/prompts/m2.md" "$RETRIES"; then
    printf 'm2\tPASS\n' >> "$sf"
    echo "### [$name] $model :: M3"
    if bash "$REPO/orchestration/harness/run-model.sh" "$model" "$name" "orchestration/harness/prompts/m3.md" "$RETRIES"; then
      printf 'm3\tPASS\n' >> "$sf"
    else
      printf 'm3\tFAIL\n' >> "$sf"
    fi
  else
    printf 'm2\tFAIL\n' >> "$sf"
    printf 'm3\tSKIP\n' >> "$sf"
  fi
  exit 0
fi

# ---- main: provider-aware scheduler ----
MODELS_FILE="${1:-$REPO/orchestration/round1/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE"; exit 1; }

# Capture the scheduler's own output (launch order, timing) to a file too.
mkdir -p "$REPO/orchestration/reports"
exec > >(tee -a "$REPO/orchestration/reports/scheduler.log") 2>&1
echo "===== run-all start $(date '+%Y-%m-%d %H:%M:%S') ====="

models=(); names=(); launched=()
while read -r m n _rest; do models+=("$m"); names+=("$n"); launched+=("0"); done \
  < <(grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE")
n_models=${#models[@]}
[ "$n_models" -gt 0 ] || { echo "no models in $MODELS_FILE"; exit 1; }

run_pids=(); run_provs=()

reap() { # drop finished jobs from the running arrays
  local np=() nv=() i
  for i in "${!run_pids[@]}"; do
    if kill -0 "${run_pids[$i]}" 2>/dev/null; then np+=("${run_pids[$i]}"); nv+=("${run_provs[$i]}"); fi
  done
  run_pids=(); run_provs=()
  [ "${#np[@]}" -gt 0 ] && { run_pids=("${np[@]}"); run_provs=("${nv[@]}"); }
}
count_prov() { local p="$1" c=0 x; for x in ${run_provs[@]+"${run_provs[@]}"}; do [ "$x" = "$p" ] && c=$((c+1)); done; printf '%s' "$c"; }
remaining() { local c=0 i; for i in "${!models[@]}"; do [ "${launched[$i]}" = "0" ] && c=$((c+1)); done; printf '%s' "$c"; }

echo "Scheduler: MAX_PAR=$MAX_PAR, serial=[$SERIAL_PROVIDERS]@$SERIAL_CAP, RETRIES=$RETRIES, $n_models models"

while [ "$(remaining)" -gt 0 ] || [ "${#run_pids[@]}" -gt 0 ]; do
  reap
  progressed=0
  if [ "${#run_pids[@]}" -lt "$MAX_PAR" ]; then
    for i in "${!models[@]}"; do
      [ "${launched[$i]}" = "0" ] || continue
      [ "${#run_pids[@]}" -lt "$MAX_PAR" ] || break
      p="$(provider_of "${models[$i]}")"
      if [ "$(count_prov "$p")" -lt "$(cap_of "$p")" ]; then
        "$SELF" --one "${models[$i]}" "${names[$i]}" &
        run_pids+=("$!"); run_provs+=("$p"); launched[$i]="1"; progressed=1
        echo "launched ${names[$i]} ($p)  [running=${#run_pids[@]}]"
      fi
    done
  fi
  if [ "$progressed" = "0" ]; then
    if [ "${#run_pids[@]}" -gt 0 ]; then sleep 2; else break; fi
  fi
done
wait

echo "All pipelines finished. Generating report..."
bash "$REPO/orchestration/harness/report.sh" "$MODELS_FILE" || true
echo "Report: orchestration/reports/summary.md  (questions: orchestration/reports/questions.md)"
