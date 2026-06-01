#!/usr/bin/env bash
# run-all.sh [models-file]                     full-auto fan-out: M2 -> M3 over all models
# run-all.sh --one <provider/model> <name>     (internal) one model's M2->M3 pipeline
#
# Full-auto by design: each model runs M2 (gated, with retries); only if M2 passes
# does M3 run (gated, with retries). Models run in parallel up to MAX_PAR.
# After M3, the gate accepts a passing M2 even if M3 stalls — partial progress is
# kept and shown in the report.
#
# Env: MAX_PAR (default 4), RETRIES (default 3).
# Prereqs: providers authenticated in opencode; `git lfs pull` done.
set -uo pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/run-all.sh"
REPO="$(git rev-parse --show-toplevel)"
RETRIES="${RETRIES:-3}"
MAX_PAR="${MAX_PAR:-4}"
STATUS_DIR="$REPO/orchestration/reports/status"
mkdir -p "$STATUS_DIR"

# ---- internal single-model pipeline ----
if [ "${1:-}" = "--one" ]; then
  model="${2:?model}"; name="${3:?name}"
  sf="$STATUS_DIR/$name.tsv"
  : > "$sf"

  echo "### [$name] $model :: M2"
  if bash "$REPO/orchestration/run-model.sh" "$model" "$name" "orchestration/prompts/m2.md" "$RETRIES"; then
    printf 'm2\tPASS\n' >> "$sf"
    echo "### [$name] $model :: M3"
    if bash "$REPO/orchestration/run-model.sh" "$model" "$name" "orchestration/prompts/m3.md" "$RETRIES"; then
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

# ---- main: fan out ----
MODELS_FILE="${1:-$REPO/orchestration/models.txt}"
[ -f "$MODELS_FILE" ] || { echo "models file not found: $MODELS_FILE"; exit 1; }

echo "Fanning out M2->M3 (MAX_PAR=$MAX_PAR, RETRIES=$RETRIES) from $MODELS_FILE"
# Each non-comment line "provider/model shortname" -> `run-all.sh --one provider/model shortname`.
# xargs -L1 keeps each line's two fields as two args; -P runs MAX_PAR in parallel.
grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE" | xargs -P "$MAX_PAR" -L1 "$SELF" --one

echo "All pipelines finished. Generating report..."
bash "$REPO/orchestration/report.sh" "$MODELS_FILE" || true
echo "Report: orchestration/reports/summary.md  (questions: orchestration/reports/questions.md)"
