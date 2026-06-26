# Round-2 对比测试

> **状态：环境就绪、待跑测。** 第二轮多模型对比，让新一批 11 个模型按 727 规划文档的策略分层，
> 分 **5 个顺序阶段 P0→P1→P2→E→P3** 实现剩余策略族，比较实现质量、727 解题增量、用时与费用。
> 总控分支 = `master`；执行者地基 = `foundation`（已剥离 `orchestration/` 与 `research/hodoku-logic/`，对"被对比"无感）。

## 目的
不是再排名一个固定里程碑，而是**沿 `docs/plans/diabolical-727.md` + `diabolical-727-checklist.md` 的 P0–P3 分层把 727 残题逐层补齐**，看各模型在相同范围下能走多远、解出多少、花多少。

## 阶段（每模型独立链；前一阶段验收通过才进下一阶段，失败则该模型停在此处）
| 阶段 | 内容 | required-ids | 进度口径 |
|---|---|---|---|
| P0 | 高杠杆、复用既有机制（含耦合 E2/E3/E6） | `required-ids/p0.txt` | `solve:list --profile human-default` |
| P1 | 标准进阶（含耦合 E4） | `required-ids/p1.txt`（累积） | human-default |
| P2 | 罕见 / 异域 | `required-ids/p2.txt`（累积） | human-default |
| E | 独立存量调整（E1 tieBreak、E7 复核），**无新 id** | `required-ids/e.txt`（=P2） | human-default 不回退 |
| P3 | 最后手段 / 红线，**仅 last-resort** | `required-ids/p3.txt`（累积）；防污染用 `p3-only.txt` | `--profile last-resort`（human-default 不受影响） |

## 资产
- `models.txt` — 11 模型（含 runner 列：opencode / grok）。
- `prompts/{p0,p1,p2,e,p3}.md` — 各阶段任务提示词（harness 运行时追加 required-ids 段 + 自主执行段）。
- `required-ids/{p0,p1,p2,p3,e}.txt` + `p3-only.txt` — 各阶段必须注册的 strategyId（累积）；`p3-only` 供 P3 防污染门控。
- `harness/`（见 [§ harness](#harness)） — round2 编排脚本（5 阶段 + grok runner + 扩展 verify/report）。
- `EVAL-RUBRIC.md` — 跑完后另开会话做的主观评测提纲（文档/checklist 勾选、P3 是否污染 human-default、策略排序合理性）。

## harness
复用 `orchestration/harness/` 的通用框架（worktree 隔离、idle 检测、metrics、判官），round2 专属改造放在 `orchestration/round2/harness/`：
- `run-all.sh` 按有序阶段表 `p0 p1 p2 e p3` 逐阶段 gate 调度（替代 round1 硬编码的 M2→M3），按 `models.txt` 的 runner 列分派 opencode / grok。
- grok runner 用 `grok` CLI 跑 `composer25` 与 `grokbuild`（重试用 session resume，不行则 single-shot 回退）。
- verify/judge 扩展：每阶段记 `solve:list` 727 计数（P3 加跑 last-resort）+ 测试用时；P3 阶段加防污染门控。

## 跑测
```
SERIAL_PROVIDERS="alibaba-cn siliconflow-cn amazon-bedrock grok" SERIAL_CAP=1 \
MAX_PAR=4 RETRIES=3 TIMEOUT=3600 \
orchestration/round2/harness/run-all.sh orchestration/round2/models.txt
```
跑完 `archive-run.sh round2`：日志入 LFS、`model/<short>` → `archive/round2/<status>/<short>`、`foundation` → `archive/round2/foundation`。
