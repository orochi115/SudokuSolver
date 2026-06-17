# 方法论：结果数据的生成与管理

> 如何产生、归档、读取对比测试的结果数据。涉及单轮里程碑结果、全语料结果，以及它们的体积治理。

## 数据分两类

| 类型 | 内容 | 体量 | 存放 |
|---|---|---|---|
| **单轮里程碑结果** | 每模型 M2/M3 的 cost/tokens/耗时、裁判输出、解出率 | 小 | `reports/archive/<时间戳>/`（运行快照，可提交） |
| **原始 transcript/日志** | opencode 完整会话日志 | 大 | 打包成 `run-logs/*.tar.gz` 走 Git LFS，**不进 git 历史** |
| **全语料结果** | 各模型在完整 OpenSudoku 语料（~893,916 题）逐题结果 + 失败清单 | 大（~20MB 压缩） | full-corpus `results.json`，打包进 LFS tar.gz |

> 体积治理原则：模型实现 = git 分支（`archive/round1/<tag>/*`），代码本身就是记录；
> 大体积原始数据只用 LFS 存 tar.gz，**派生产物**（如失败用例集、汇总表）才提交进主干。
> 本轮整理后：原始 tar.gz 全部保留在 `archive/round1/orchestration`，master 主干只留派生产物
> （`data/failing-diabolical/`、本目录文档）。

## 生成

- **度量（`metrics.mjs`）**：从每次 attempt 的 JSON 日志累加 `step_finish` 事件 → cost、token、步数、
  `activeSec`（首末事件时间差 ≈ 模型工作时长）。**不依赖 `opencode export`**（大会话 128KB 截断）。
- **报告（`gen-report.mjs`）**：跑裁判取解出率 + 读 metrics + 解析每模型工具/技能使用，产出 `report-final.md`
  （环境表、结果表[所有模型取值相同的列自动省略]、工具使用、失败清单、复现步骤）。换模型重跑后一键再生。
  ```bash
  node orchestration/gen-report.mjs orchestration/models.txt
  ```
- **全语料跑分（`run-archive-full-corpus.mjs`）**：对某个 git ref 在完整语料上逐题求解，记录每难度
  solved/validSolved/stuck/errors 与失败清单。
  ```bash
  node orchestration/run-archive-full-corpus.mjs \
    --ref <git-ref> --name <结果名> \
    --out-dir orchestration/reports/full-corpus/<结果名> --workers 12
  ```
- **全语料失败分类（`analyze-full-corpus-results.mjs`）**：跨模型对齐失败清单，找出"被某模型解出但当前未解出"
  的重叠用例（用成功者定位能力缺口）。

## 归档

- **一键归档（`archive-run.sh <tag>`）**：提交 worktree WIP → 把 `logs` + `reports` 打包成
  `run-logs/run-<tag>-<date>.tar.gz`（LFS）并提交 → 删 worktree → `model/<名>` → `archive/<tag>/<名>`。
  **没有不可逆删除**：代码留分支、日志留 LFS。
- **纯删除（`cleanup.sh`）**：只删 worktree（默认保留分支）；`--purge` 连分支/日志/reports 一起删。

## 读取全语料结果（含失败用例）

全语料 `results.json` 结构：`{ options, results: [ {model, name, ref, strategies, report: {<难度>: {n, solved,
validSolved, stuck, errors, failures: [{index, puzzle, outcome, final}]}}} ], summary }`。

- `failures[].index` 是该难度失败列表的 **1-based** 序号，仅用于溯源；**`puzzle`（81 位字符串）才是真相来源**，
  不要拿 `index` 反查 `puzzles/<难度>.opensudoku`（易差 1）。
- 抽取某结果某难度的失败题（示例：当前引擎基线的 diabolical 727 题）：
  ```bash
  tar -xzO -f <full-corpus.tar.gz> <dir>/results.json | python3 -c '
  import json,sys
  d=json.load(sys.stdin)
  r=[x for x in d["results"] if x["name"]=="<结果名>"][0]
  for f in sorted(r["report"]["diabolical"]["failures"], key=lambda f:f["index"]):
      print(f["puzzle"])
  '
  ```

> 已抽好的当前引擎 727 题失败集见 [`../../data/failing-diabolical/`](../../data/failing-diabolical/)
> （含复现命令与溯源）。源 tar.gz 在 `archive/round1/orchestration` 的 `orchestration/run-logs/`。

## 相关

- 对比测试总流程：[`model-comparison-process.md`](./model-comparison-process.md)
- 跨分支 trace 对比定位：[`cross-branch-trace-diffing.md`](./cross-branch-trace-diffing.md)
