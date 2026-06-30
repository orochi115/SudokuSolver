# Round-2 对比测试

> **状态：run3 已完成并归档（2026-06-29）。** P3 通关 5/11；权威结果见 [`report-final.md`](./report-final.md)、[`results-summary.md`](./results-summary.md)。
> 第二轮多模型对比：11 个模型按 727 规划文档的策略分层，分 **P0→P1→P2a→P2b→E→P3** 六阶段链实现剩余策略族。
> 总控分支 = `master`（引擎 + harness + `verify:r2` 等 worker 工具的**源头**）。
> 执行者地基 = `foundation`（从 master **派生**：剥离 `orchestration/` 与 `research/hodoku-logic/`；run4 将按需从 master 重切）。

## 目的
不是再排名一个固定里程碑，而是**沿 `docs/plans/diabolical-727.md` + `diabolical-727-checklist.md` 的 P0–P3 分层把 727 残题逐层补齐**，看各模型在相同范围下能走多远、解出多少、花多少。

## 阶段（每模型独立链，6 阶段；**soft-gate**——硬失败才 STOP，否则按 727-delta 评分进下一阶段）
| 阶段 | 内容 | required-ids | 进度口径 |
|---|---|---|---|
| P0 | 高杠杆、复用既有机制（含耦合 E2/E3/E6） | `required-ids/p0.txt` | `--profile human-default` |
| P1 | 标准进阶（含耦合 E4） | `required-ids/p1.txt`（累积） | human-default |
| P2a | 罕见/异域·前半（wing 阶梯 + 主要异域） | `required-ids/p2a.txt`（累积） | human-default |
| P2b | 罕见/异域·后半（其余异域） | `required-ids/p2b.txt`（累积） | human-default |
| E | 独立存量调整（E1 tieBreak、E7 复核），**无新 id** | `required-ids/e.txt`（=P2b） | human-default 不回退 |
| P3 | 最后手段 / 红线，**仅 last-resort** | `required-ids/p3.txt`（累积）；防污染用 `p3-only.txt` | `--profile last-resort`（human-default 不受影响） |

**门控（v2）：** 硬门 = typecheck + test + **400 与 727 逐步健全性 0 violation** + **无 human-default 污染**（策略不得用暴力 oracle；human-default 727 解出 > `POLLUTION_HUMAN_MAX` 视为伪装 forcing）+ P3 隔离。required-ids 缺失为**软项**（记 missing + 按 727-delta 评分，不再一票否决）。verify rc：0 全过 / 2 软过 / 1 硬失败。

## 资产
- `models.txt` — 11 模型（列：model-id / short / runner / provider-tag）。
- `prompts/{p0,p1,p2a,p2b,e,p3}.md` — 各阶段提示词（harness 运行时追加 required-ids 段 + 自主执行/红线/自检段）。
- `required-ids/{p0,p1,p2a,p2b,p3,e}.txt` + `p3-only.txt` — 各阶段累积 strategyId；`p3-only` 供 P3 防污染门控。
- `docs/strategy-implementation-guide.md`（worker-facing 脚手架，随 foundation 继承）。
- `harness/` — run-all / run-model / verify / watchdog / judge(verify-727,check-p3-isolation) / metrics(-grok) / report / cleanup / archive-run。
- `EVAL-RUBRIC.md` — 主观评测提纲（待另开会话执行）。
- `report-final.md` / `results-summary.md` — run3 完整报告与摘要。
- `reports/run3-summary.md` — run3 客观数据表（从 LFS tarball 恢复）。
- `run-logs/run-round2-*.tar.gz` — 三次运行日志（Git LFS）。

## 归档索引

| Run | 标签 | Tarball | 分支前缀 | P3 完成 |
|---|---|---|---|---:|
| run1 | v1 harness | `run-round2-20260627-004321.tar.gz` | `archive/round2/run1/` | 1/11 |
| run2 | v2 中断 | `run-round2-run2-20260627-074107.tar.gz` | `archive/round2/run2/` | 0/11 |
| **run3** | **权威** | `run-round2-run3-20260629-081109.tar.gz` | `archive/round2/run3/` | **5/11** |

工作区：`model/*` 已清空；**`foundation` 工作分支已退役**（快照在 `archive/round2/run3/foundation`）。run4 从 master 重切（见下方「分支策略」）。

## 分支策略（run4+）

```
master      ← 唯一源头：引擎代码、harness、verify:r2、文档
   │
   ├─ orchestration/  只在 master，worker 看不到
   │
   └─ foundation      ← 从 master 派生（删 orchestration/、中性化提示）
         └─ model/<short>  ← 跑测时 worktree 分叉点
```

- **引擎/worker 工具**（如 `packages/engine/scripts/verify-r2.ts`）必须先落在 **master**，再随重切带入 foundation。不要只提交在 foundation 上——run4 重切时会丢。
- **harness 改造**只改 `master` 上的 `orchestration/`，与 foundation 重切无关。
- run4 准备：从当前 master 重切 `foundation`（同 `a2f9070` 做法：删 orchestration/、research/hodoku-logic/、中性化文档）。旧 foundation 已归档为 `archive/round2/run3/foundation`（`0ee279e`，含 verify:r2）。

## harness（v2 关键改造）
- **恢复机制**：墙钟超时（睡眠也计时）；`run-all` 断点续跑（只跳过 OK 阶段，STOP/中断的会重试）；`watchdog.sh` 自动 reap 卡死子树；`caffeinate -dimsu` 自启（挡空闲睡眠，**合盖仍需 `sudo pmset -a disablesleep 1`**）；子树 kill（修复睡眠后僵死进程杀不掉）。
- **grok**：`--output-format streaming-json`（拿到完整过程、修复 idle 误杀、sessionId 在 end 事件）；重试用 session resume。
- **门控/判官**：`verify-727.ts` 对 727 逐步健全性 + 计数；`check-p3-isolation.ts` P3 隔离；污染检测（暴力 oracle 扫描 + 解出数阈值）。
- **并发**：`MAX_PAR=8`，共享 key 三对仍串行；`VERIFY_MAX` 限制并发 verify，保护本地机器。

## 跑测（下次 run4+）

**必须用 detached 启动**（run2 教训：直接跑 `run-all.sh` 会被会话 SIG 杀整组）：

```
sudo pmset -a disablesleep 1   # 合盖前
SERIAL_PROVIDERS="alibaba-cn siliconflow-cn amazon-bedrock grok" SERIAL_CAP=1 \
MAX_PAR=8 VERIFY_MAX=3 RETRIES=3 TIMEOUT=3600 GROK_RETRY_MODE=resume \
orchestration/round2/harness/launch.sh orchestration/round2/models.txt
# 监控: tail -f orchestration/round2/reports/run-all.out
```

> 跑完 `sudo pmset -a disablesleep 0`。中断后**直接重跑同一 launch 命令即可断点续跑**。
> **grok 费用**：grok CLI 不暴露 token/cost。报告内可估算——加 `GROK_PRICE_IN=<$/1M> GROK_PRICE_OUT=<$/1M>`（按 chars/4 估）；**精确花费请查 xAI 控制台（grok-build）/ Cursor 面板（grok-composer）** 本次时间窗。

跑完归档（scheduler 打印 `All pipelines finished` 后）：`orchestration/round2/harness/archive-run.sh round2/run4`
→ `model/<short>` → `archive/round2/run4/<short>`、`foundation` 快照 → `archive/round2/run4/foundation`、日志入 LFS。
重跑前用 `harness/cleanup.sh [--purge]` 重置工作区。

## Round-4 设计（下一版 harness）

基于 run2/run3 复盘的新协议（turn 制、append-only 状态、Monitor、checkpoint）见 **[`../round4/`](../round4/)**。
