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
MAX_PAR="${MAX_PAR:-4}"
SERIAL_PROVIDERS="${SERIAL_PROVIDERS:-amazon-bedrock alibaba-cn siliconflow-cn grok}"
SERIAL_CAP="${SERIAL_CAP:-1}"
STATUS_DIR="$R2/reports/status"
PHASES=(p0 p1 p2 e p3)
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
  exec > >(tee -a "$ldir/pipeline.log") 2>&1

  sf="$STATUS_DIR/$name.tsv"; : > "$sf"
  prev_ok=1
  for ph in "${PHASES[@]}"; do
    if [ "$prev_ok" != "1" ]; then printf '%s\tSKIP\n' "$ph" >> "$sf"; continue; fi
    echo "### [$name] $model :: $ph  ($(date '+%Y-%m-%d %H:%M:%S'))"
    if bash "$HARNESS/run-model.sh" "$model" "$name" "$runner" "$ph" "$RETRIES"; then
      printf '%s\tPASS\n' "$ph" >> "$sf"
    else
      printf '%s\tFAIL\n' "$ph" >> "$sf"; prev_ok=0
    fi
  done
  exit 0
fi

# ---- main: provider-aware scheduler ----
MODELS_FILE="${1:-$R2/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE"; exit 1; }

mkdir -p "$R2/reports"
exec > >(tee -a "$R2/reports/scheduler.log") 2>&1
echo "===== round2 run-all start $(date '+%Y-%m-%d %H:%M:%S') ====="

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

echo "Scheduler: MAX_PAR=$MAX_PAR, serial=[$SERIAL_PROVIDERS]@$SERIAL_CAP, RETRIES=$RETRIES, phases=[${PHASES[*]}], $n_models models"

while [ "$(remaining)" -gt 0 ] || [ "${#run_pids[@]}" -gt 0 ]; do
  reap; progressed=0
  if [ "${#run_pids[@]}" -lt "$MAX_PAR" ]; then
    for i in "${!models[@]}"; do
      [ "${launched[$i]}" = "0" ] || continue
      [ "${#run_pids[@]}" -lt "$MAX_PAR" ] || break
      p="${ptags[$i]}"
      if [ "$(count_prov "$p")" -lt "$(cap_of "$p")" ]; then
        "$SELF" --one "${models[$i]}" "${names[$i]}" "${runners[$i]}" "$p" &
        run_pids+=("$!"); run_provs+=("$p"); launched[$i]="1"; progressed=1
        echo "launched ${names[$i]} ($p / ${runners[$i]})  [running=${#run_pids[@]}]"
      fi
    done
  fi
  if [ "$progressed" = "0" ]; then if [ "${#run_pids[@]}" -gt 0 ]; then sleep 2; else break; fi; fi
done
wait

echo "All pipelines finished. Generating report..."
bash "$HARNESS/report.sh" "$MODELS_FILE" || true
echo "Report: $R2/reports/summary.md"
