# Run4 分析 · RUN_ID

> 基线：run3 · 处理：harness v3
> 协议：[../design/experiment-matrix.md](../design/experiment-matrix.md) §8–9
> 填表人： · 日期：

## 机制验收（表 6）

| 检查项 | 结果 | 备注 |
|---|---|---|
| 失败可定位 ≥90% | ☐ 过 ☐ 不过 | |
| E 类 vs run3 | ☐ 降 ☐ 未降 | watchdog.kill 计 ___ |
| H3 重试有效 | ☐ 是 ☐ 否 | 抽样 step： |
| H5 fixtureFlags | ☐ 有检出 ☐ 无 | |

## 假设（表 7）

| 假设 | ☐ 成立 ☐ 不成立 | 证据一行 |
|---|---|---|
| H1/H2 | | |
| H3 | | |
| H4 | | |
| H5 | | |

## 每模型一行（表 8 + 失败分类）

| 模型 | 最高 phase | 完成 step/总 step | 主失败类 A–E | 首硬失败 step+verify | 727 human | 727 last | phaseUtil | cost$ |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

## 与 run3 对照摘要

| 指标 | run3 | run4 | Δ |
|---|---|---|---|
| P3 完成数 | 5/11 | /10 | |
| B 类（缺 id 为主） | | | |
| E 类（infra） | | | |
| D 类（空壳嫌疑） | | | |