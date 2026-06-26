#!/usr/bin/env bash
# report.sh [models-file]
#
# Aggregates round2 results across all model worktrees into:
#   orchestration/round2/reports/summary.md     per-model × per-phase status,
#                                               727 counts, time, cost, tokens
#   orchestration/round2/reports/questions.md   every model's QUESTIONS.md, collated
# Objective data only; subjective evaluation (EVAL-RUBRIC.md) is a separate session.
set -uo pipefail

HARNESS="$(cd "$(dirname "$0")" && pwd)"
REPO="$(git rev-parse --show-toplevel)"
R2="$(cd "$HARNESS/.." && pwd)"
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt-r2"
REPORTS="$R2/reports"; STATUS_DIR="$REPORTS/status"
MODELS_FILE="${1:-$R2/models.txt}"
PHASES=(p0 p1 p2a p2b e p3)
mkdir -p "$REPORTS"

SUMMARY="$REPORTS/summary.md"; QUESTIONS="$REPORTS/questions.md"

jget() { # jget <file> <key> ; tiny JSON scalar extractor (no jq dependency)
  [ -f "$1" ] || { printf ''; return; }
  grep -oE "\"$2\"[: ]*\"?[^,\"}]*\"?" "$1" | head -1 | sed -E "s/\"$2\"[: ]*//; s/^\"//; s/\"$//"
}

{
  echo "# Round2 横评结果汇总（客观数据）"
  echo
  echo "> 由 report.sh 生成。阶段链 P0→P1→P2a→P2b→E→P3（每模型独立链；soft-gate）。"
  echo "> 结果：OK=软通过(sound+无污染,按727-delta评分) · STOP=硬失败(build/test/健全性/污染) · SKIP=前序STOP后跳过。"
  echo "> 硬门：typecheck+test+400&727逐步健全性0violation+无human-default污染（+P3隔离）；required-ids缺失为软项(missing列)。"
  echo "> 727 计数来自各阶段判官；费用/tokens 来自运行日志（grok/部分plan-based provider无费用字段→N/A）。"
  echo "> 主观评测（文档/checklist勾选、P3是否污染human-default、策略排序合理性）见 EVAL-RUBRIC.md，另开会话执行。"
  echo
  echo "| 模型 | runner | 阶段 | 结果 | 727(human) | 727(last) | 缺id数 | 污染警告 | 测试用时s | 用时s | 费用\$ | tokens(in/out) |"
  echo "|---|---|---|---|---|---|---|---|---|---|---|---|"
} > "$SUMMARY"

: > "$QUESTIONS"
{ echo "# 模型提问汇总（headless 运行中写入各自 QUESTIONS.md）"; echo; } >> "$QUESTIONS"

grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE" | while read -r model name runner ptag _rest; do
  ldir="$WT_ROOT/logs/$name"; sf="$STATUS_DIR/$name.tsv"; wt="$WT_ROOT/$name"
  for ph in "${PHASES[@]}"; do
    st="$(grep -E "^$ph	" "$sf" 2>/dev/null | cut -f2)"; st="${st:-—}"
    mj="$ldir/$ph.metrics.json"; vj="$ldir/$ph.verify.json"
    cost="$(jget "$mj" cost)"; ain="$(jget "$mj" input)"; aout="$(jget "$mj" output)"; act="$(jget "$mj" activeSec)"
    vh="$(jget "$vj" solveHuman)"; vl="$(jget "$vj" solveLastResort)"; vs="$(jget "$vj" verifySec)"
    miss="$(jget "$vj" missingIds)"; nmiss=$(printf '%s' "$miss" | tr ' ' '\n' | grep -c . 2>/dev/null || echo 0)
    pollf="$(jget "$vj" pollutionWarnFiles)"; poll=$([ -n "${pollf// /}" ] && echo "⚠" || echo "-")
    printf '| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s/%s |\n' \
      "$name" "${runner:-?}" "$ph" "$st" "${vh:-—}" "${vl:-—}" "${nmiss:-—}" "$poll" "${vs:-—}" "${act:-—}" "${cost:-—}" "${ain:-—}" "${aout:-—}" >> "$SUMMARY"
  done
  # produced design notes
  notes="$(ls "$wt/docs/notes/"{p0,p1,p2a,p2b,e,p3}.md 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
  [ -n "$notes" ] && printf '| %s | | _notes_ | %s | | | | | | | | |\n' "$name" "$notes" >> "$SUMMARY"
  # collate QUESTIONS.md
  if [ -f "$wt/QUESTIONS.md" ]; then
    { echo "## $name"; echo; cat "$wt/QUESTIONS.md"; echo; } >> "$QUESTIONS"
  fi
done

echo "wrote $SUMMARY"
echo "wrote $QUESTIONS"
