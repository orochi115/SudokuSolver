# Round2 · run4 Harness 改造（设计）

> **状态：设计文档已就绪，harness 待实现。**
> 这是 **Round2 对比实验**的第 **4 次跑测（run4）** 的协议与脚本改造，不是新的「Round4 实验」。
> 在 run1–run3（harness v2）复盘基础上，引入 turn 制、append-only 状态、checkpoint、detach + Monitor。

## 术语（避免混淆）

| 词 | 含义 |
|---|---|
| **Round2** | 第二轮多模型对比实验整体（727 残题、P0–P3、同一批模型） |
| **run1 / run2 / run3 / run4** | Round2 的第 N 次**跑测**；归档于 `archive/round2/runN/` |
| **round**（harness） | 单次 run 内的**阶段**，即 P0 / P1 / P2a / P2b / E / P3（勿与 Round2 混读） |
| **turn** | 单个 `strategyId` 的实现 |
| **action** | 单次 opencode 对话 |

## 文档索引

| 文档 | 内容 |
|---|---|
| [**harness-spec.md**](./harness-spec.md) | 主规格：状态机、文件布局、resume、verify、Monitor/Watchdog |
| [**state-and-events.md**](./state-and-events.md) | 状态与事件：禁止覆盖、jsonl 留痕、resume 伪代码 |
| [**scoring.md**](./scoring.md) | KPI（策略利用率）、full corpus 人工跑 |

## run1–run3 vs run4（harness）

| 维度 | run1–run3（v2） | run4（v3，本文档） |
|---|---|---|
| 阶段交付 | 整 phase 一次 prompt | **round** 内 **turn** 制（单 strategyId） |
| runner | opencode + grok CLI | **统一 opencode** |
| 状态 | `status/*.tsv`、可覆盖 `*.metrics.json` | **append-only jsonl** |
| 恢复 | prevruns 搬文件 + 阶段 resume | **checkpoint + events 游标** |
| 监管 | launch detach | detach + **monitor.sh** + control 信号 |
| 策略 id | 每阶段注册 | **预写死 stub**；difficulty 模型在 turn 内设定 |

历史报告：[`../report-final.md`](../report-final.md)（run3）、[`../results-summary.md`](../results-summary.md)。

## 代码位置（实现后）

仍在 **`orchestration/round2/harness/`** 演进（不新建 round4 目录）；设计稿仅在 `orchestration/round2/design/`。

## 实现顺序

1. `state-and-events.md` 事件 schema
2. `run-turn.sh` → `run-round.sh` → 改造 `run-all.sh` / `launch.sh`
3. `watchdog.sh` 费用熔断 + 留痕
4. `monitor.sh`
5. `report.sh` 读 jsonl

## 跑测（run4，实现后）

```bash
sudo pmset -a disablesleep 1
orchestration/round2/harness/launch.sh orchestration/round2/models.txt
# RUN_TAG 默认 round2/run4 → archive/round2/run4/

tail -f orchestration/round2/reports/run-all.out
orchestration/round2/harness/monitor.sh watch

touch orchestration/round2/reports/control/PAUSE   # 优雅暂停

# 跑完后人工 full corpus（不进 run-all）
# node orchestration/harness/run-archive-full-corpus.mjs --ref archive/round2/run4/<name> ...
```