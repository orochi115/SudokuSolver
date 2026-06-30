# Round-4 对比测试（设计阶段）

> **状态：设计文档已就绪，harness 待实现。** 在 round2 复盘基础上重构跑测协议：turn 制、append-only 状态、可恢复 checkpoint、detach + Monitor。
> 文档均在 `orchestration/round4/` 内，不污染 worker 地基。

## 文档索引

| 文档 | 内容 |
|---|---|
| [**harness-spec.md**](./harness-spec.md) | **主规格**：round/turn/action 状态机、文件布局、resume、verify 分层、hard fail、Monitor/Watchdog |
| [**state-and-events.md**](./state-and-events.md) | **状态与事件**：禁止覆盖的规则、jsonl 字段、start/stop/kill 留痕、resume 算法伪代码 |
| [**scoring.md**](./scoring.md) | KPI（策略利用率）、与解出率的关系、round 末评分项 |

## 与 round2 的关系

| 维度 | round2 | round4 |
|---|---|---|
| 阶段单位 | phase（P0…P3）一次大 prompt | **round** = 原 phase；内层 **turn** = 单 strategyId |
| runner | opencode + grok CLI | **统一 opencode** |
| 状态文件 | `status/*.tsv` + 可覆盖的 `*.metrics.json` | **append-only jsonl** + 不可变 action 日志 |
| 恢复 | 阶段级 resume + prevruns 搬文件 | **checkpoint commit + events 游标** |
| 监管 | launch detach，无 Monitor | **detach + monitor.sh + control 文件信号** |
| 地基 | 每 round 注册新 id | **id 预写死 stub**；difficulty 由模型在 turn 内设定 |

round2 归档与报告见 [`../round2/`](../round2/)。

## 实现顺序（建议）

1. 事件流与 checkpoint（`state-and-events.md`）— 先于任何跑测逻辑
2. `run-turn.sh` 单 turn 循环（action retry → verify-turn）
3. `run-round.sh` 编排 turns + round 末 verify
4. `run-all.sh` + `launch.sh` + control 信号
5. `watchdog.sh` 扩展（费用熔断 + 留痕）
6. `monitor.sh` 只读仪表盘
7. `report.sh` 读 jsonl 聚合

## 跑测（实现后）

```bash
# 开跑前：从 master 重切 foundation；确认 models.txt
sudo pmset -a disablesleep 1
orchestration/round4/harness/launch.sh orchestration/round4/models.txt
tail -f orchestration/round4/reports/run-all.out
# 另一终端
orchestration/round4/harness/monitor.sh

# 暂停（action 结束后优雅退出）
touch orchestration/round4/reports/control/PAUSE

# 跑完后人工 full corpus（不进脚本）
# node orchestration/harness/run-archive-full-corpus.mjs --ref archive/round4/runN/<name> ...
```