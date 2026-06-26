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
PHASES=(p0 p1 p2 e p3)
mkdir -p "$REPORTS"

SUMMARY="$REPORTS/summary.md"; QUESTIONS="$REPORTS/questions.md"

jget() { # jget <file> <key> ; tiny JSON scalar extractor (no jq dependency)
  [ -f "$1" ] || { printf ''; return; }
  grep -oE "\"$2\"[: ]*\"?[^,\"}]*\"?" "$1" | head -1 | sed -E "s/\"$2\"[: ]*//; s/^\"//; s/\"$//"
}

{
  echo "# Round2 横评结果汇总（客观数据）"
  echo
  echo "> 由 report.sh 生成。阶段链 P0→P1→P2→E→P3，前一阶段验收通过才进下一阶段。"
  echo "> 门控：typecheck + test + 健全性 0 violation + required strategyId 全注册（P3 加防污染）。"
  echo "> 727 计数来自各阶段 \`solve:list\`（human-default；P3 另记 last-resort）；费用/tokens 来自运行日志（grok 可能无费用字段）。"
  echo "> 主观评测（文档/checklist 勾选、P3 是否污染 human-default、策略排序合理性）见 EVAL-RUBRIC.md，另开会话执行。"
  echo
  echo "| 模型 | runner | 阶段 | 结果 | 727(human) | 727(last) | 测试用时s | 用时s | 费用\$ | tokens(in/out) |"
  echo "|---|---|---|---|---|---|---|---|---|---|"
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
    printf '| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s/%s |\n' \
      "$name" "${runner:-?}" "$ph" "$st" "${vh:-—}" "${vl:-—}" "${vs:-—}" "${act:-—}" "${cost:-—}" "${ain:-—}" "${aout:-—}" >> "$SUMMARY"
  done
  # produced design notes
  notes="$(ls "$wt/docs/notes/"{p0,p1,p2,e,p3}.md 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
  [ -n "$notes" ] && printf '| %s | | _notes_ | %s | | | | | | |\n' "$name" "$notes" >> "$SUMMARY"
  # collate QUESTIONS.md
  if [ -f "$wt/QUESTIONS.md" ]; then
    { echo "## $name"; echo; cat "$wt/QUESTIONS.md"; echo; } >> "$QUESTIONS"
  fi
done

echo "wrote $SUMMARY"
echo "wrote $QUESTIONS"
