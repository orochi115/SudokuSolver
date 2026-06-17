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
WT_ROOT="$(cd "$REPO/.." && pwd)/sudoku-wt"
REPORTS="$REPO/orchestration/reports"
STATUS_DIR="$REPORTS/status"
JUDGE="$REPO/orchestration/harness/judge/verify-engine.ts"
MODELS_FILE="${1:-$REPO/orchestration/round1/models.txt}"
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
      echo "- 指标(cost / runtime / tokens,来自各 attempt 日志的 step_finish):"
      for ms in m2 m3; do
        mf="$WT_ROOT/logs/$name/$ms.metrics.json"
        if [ -f "$mf" ]; then echo "  - $ms: \`$(cat "$mf")\`"; fi
      done
      nf=$(cat "$WT_ROOT/logs/$name/"*.notes 2>/dev/null)
      if [ -n "$nf" ]; then echo "- ⚠️ 异常记录(notes):"; printf '%s\n' "$nf" | sed 's/^/    /'; fi
      echo "- 日志:\`sudoku-wt/logs/$name/\`(pipeline.log + 各 attempt 的 opencode JSON)"
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

# Durable, committable snapshot of this run (small files only: report + per-model
# cost/notes). Raw transcripts stay on disk under sudoku-wt/logs/ (too big for git).
RUNID="$(date '+%Y%m%d-%H%M%S')"
ARCH="$REPORTS/archive/$RUNID"
mkdir -p "$ARCH"
cp "$SUMMARY" "$QUESTIONS" "$ARCH/" 2>/dev/null
grep -vE '^[[:space:]]*(#|$)' "$MODELS_FILE" | while read -r _m name _r; do
  for ms in m2 m3; do
    [ -f "$WT_ROOT/logs/$name/$ms.metrics.json" ] && cp "$WT_ROOT/logs/$name/$ms.metrics.json" "$ARCH/$name-$ms.metrics.json" 2>/dev/null
    [ -f "$WT_ROOT/logs/$name/$ms.notes" ] && cp "$WT_ROOT/logs/$name/$ms.notes" "$ARCH/$name-$ms.notes" 2>/dev/null
  done
done
echo "snapshot -> $ARCH (commit it on the orchestration branch to keep the run record)"
