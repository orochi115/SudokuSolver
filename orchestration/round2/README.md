# Round-2 对比测试

> **状态：环境就绪、待跑测。** 第二轮多模型对比，让新一批 11 个模型按 727 规划文档的策略分层，
> 分 **5 个顺序阶段 P0→P1→P2→E→P3** 实现剩余策略族，比较实现质量、727 解题增量、用时与费用。
> 总控分支 = `master`；执行者地基 = `foundation`（已剥离 `orchestration/` 与 `research/hodoku-logic/`，对"被对比"无感）。

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
- `EVAL-RUBRIC.md` — 跑完后另开会话的主观评测（文档/checklist 勾选、P3 是否污染 human-default、策略排序合理性）。

## harness（v2 关键改造）
- **恢复机制**：墙钟超时（睡眠也计时）；`run-all` 断点续跑（只跳过 OK 阶段，STOP/中断的会重试）；`watchdog.sh` 自动 reap 卡死子树；`caffeinate -dimsu` 自启（挡空闲睡眠，**合盖仍需 `sudo pmset -a disablesleep 1`**）；子树 kill（修复睡眠后僵死进程杀不掉）。
- **grok**：`--output-format streaming-json`（拿到完整过程、修复 idle 误杀、sessionId 在 end 事件）；重试用 session resume。
- **门控/判官**：`verify-727.ts` 对 727 逐步健全性 + 计数；`check-p3-isolation.ts` P3 隔离；污染检测（暴力 oracle 扫描 + 解出数阈值）。
- **并发**：`MAX_PAR=8`，共享 key 三对仍串行；`VERIFY_MAX` 限制并发 verify，保护本地机器。

## 跑测
```
SERIAL_PROVIDERS="alibaba-cn siliconflow-cn amazon-bedrock grok" SERIAL_CAP=1 \
MAX_PAR=8 VERIFY_MAX=3 RETRIES=3 TIMEOUT=3600 GROK_RETRY_MODE=resume \
orchestration/round2/harness/run-all.sh orchestration/round2/models.txt
```
> 合盖睡眠请先 `! sudo pmset -a disablesleep 1`（跑完 `... disablesleep 0`）。中断后**直接重跑同一命令即可断点续跑**。
> **grok 费用**：grok CLI 不暴露 token/cost。报告内可估算——加 `GROK_PRICE_IN=<$/1M> GROK_PRICE_OUT=<$/1M>`（按 chars/4 估）；**精确花费请查 xAI 控制台（grok-build）/ Cursor 面板（grok-composer）** 本次时间窗。

跑完归档（**按 run 嵌套**，支持多次运行）：`orchestration/round2/harness/archive-run.sh round2/run2`
→ `model/<short>` → `archive/round2/run2/<short>`、`foundation` → `archive/round2/run2/foundation`、日志入 LFS。
（v1 已归档于 `archive/round2/run1/*`。）重跑前用 `harness/cleanup.sh [--purge]` 重置工作区。
