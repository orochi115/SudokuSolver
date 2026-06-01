#!/usr/bin/env bash
# report.sh [models-file]
#
# Aggregates results across all model worktrees into:
#   orchestration/reports/summary.md    per-model status + judge JSON + produced docs
#   orchestration/reports/questions.md  every model's QUESTIONS.md, collated
#
# Run automatically by run-all.sh; can also be run standalone at any time.
set -uo pipefail

REPO="$(git rev-parse --show-toplevel)"
WT_ROOT="$REPO/../sudoku-wt"
REPORTS="$REPO/orchestration/reports"
STATUS_DIR="$REPORTS/status"
JUDGE="$REPO/orchestration/judge/verify-engine.ts"
MODELS_FILE="${1:-$REPO/orchestration/models.txt}"
mkdir -p "$REPORTS"

SUMMARY="$REPORTS/summary.md"
QUESTIONS="$REPORTS/questions.md"

{
  echo "# 横评结果汇总"
  echo
  echo "> 由 report.sh 生成。判据:M2/M3 是否通过验收闸门(typecheck + test + 健全性 0 violation)。"
  echo "> solveRate / violations 来自裁判脚本对冻结 \`data/ground-truth\` 的实跑。"
  echo
} > "$SUMMARY"

{
  echo "# 模型提问汇总(供预先在基础文档中答复)"
  echo
  echo "> 模型在 headless 运行中把会影响实现的疑问写入各自 worktree 的 QUESTIONS.md;此处汇总。"
  echo
} > "$QUESTIONS"

grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE" | while read -r model name _rest; do
  wt="$WT_ROOT/$name"
  sf="$STATUS_DIR/$name.tsv"

  m2="?"; m3="?"
  if [ -f "$sf" ]; then
    m2="$(awk -F'\t' '$1=="m2"{print $2}' "$sf")"; [ -n "$m2" ] || m2="?"
    m3="$(awk -F'\t' '$1=="m3"{print $2}' "$sf")"; [ -n "$m3" ] || m3="?"
  fi

  {
    echo "## $name  (\`$model\`)"
    echo
    echo "- M2: **$m2**   M3: **$m3**"
  } >> "$SUMMARY"

  if [ -d "$wt" ]; then
    # judge JSON (engine soundness + solve rate at current worktree state)
    cp "$JUDGE" "$wt/.verify-engine.ts"
    judge_out="$(cd "$wt" && npx tsx .verify-engine.ts 2>/dev/null || echo '{}')"
    rm -f "$wt/.verify-engine.ts"
    {
      echo "- 引擎裁判(当前 worktree 状态):"
      echo '```json'
      echo "$judge_out"
      echo '```'
      echo "- 产出文档:"
      for f in docs/notes/m2.md docs/notes/m3.md docs/forcing-boundary.md docs/flow.md; do
        if [ -f "$wt/$f" ]; then echo "  - \`$f\` ✅"; else echo "  - \`$f\` —"; fi
      done
      echo "- 日志:\`sudoku-wt/logs/$name/\`"
      echo
    } >> "$SUMMARY"

    # collate questions
    if [ -f "$wt/QUESTIONS.md" ]; then
      {
        echo "## $name (\`$model\`)"
        cat "$wt/QUESTIONS.md"
        echo
      } >> "$QUESTIONS"
    fi
  else
    echo "- (worktree 不存在,可能未运行)" >> "$SUMMARY"
    echo >> "$SUMMARY"
  fi
done

echo "wrote $SUMMARY"
echo "wrote $QUESTIONS"
