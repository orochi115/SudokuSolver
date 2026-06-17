# 第一轮对比测试 · 结果摘要

> 完整报告（环境、工具使用、复现步骤）见 [`../../orchestration/report-final.md`](../../orchestration/report-final.md)（随 harness 保留）。
> 本文摘录关键结论，并记录"胜出者 → 修复"后的当前引擎基线。

## 100 题样本（固定范围；健全性 0 violation 为硬门槛）

| 模型 | M2 | M3 | strat | hard | diabolical | viol | cost$ |
|---|---|---|---|---|---|---|---|
| `anthropic/claude-sonnet-4-6` | PASS | PASS | 17 | 100% | **99%** | 0 | $10.43 |
| `openai/gpt-5.5` | PASS | PASS | 17 | 100% | 97% | 0 | $16.41 |
| `anthropic/claude-opus-4-8` | PASS | PASS | 17 | 100% | 88% | 0 | $12.63 |
| `google/gemini-3.5-flash` | PASS | PASS | 17 | 100% | 81% | 0 | $5.55 |
| `openai/gpt-5.3-codex` | PASS | PASS | 17 | 100% | 78% | 0 | $3.37 |
| `alibaba-cn/deepseek-v4-flash` | PASS | PASS | 17 | 100% | 72% | 0 | $0.34 |
| `alibaba-cn/qwen3-coder-plus` | FAIL | SKIP | 11 | 100% | 76% | **1876** | $8.94 |

（其余模型 diabolical 偏低或为 0，略；easy/medium 全部 100%。）

## 全量题库复测（valid solved 口径，hard 100% 候选 6 模型）

| 模型 | hard valid | diabolical valid | invalid |
|---|---:|---:|---:|
| `anthropic/claude-sonnet-4-6` | 99.999% | **98.949%** (118423/119681) | 0 |
| `openai/gpt-5.5` | 99.993% | 96.841% | 0 |
| `anthropic/claude-opus-4-8` | 99.992% | 85.806% | 0 |
| `google/gemini-3.5-flash` | 99.924% | 79.352% | 0 |
| `openai/gpt-5.3-codex` | 99.745% | 75.109% | 0 |
| `alibaba-cn/deepseek-v4-flash` | 97.835% | 64.415% | **411** |

关键观察：

- 100 题样本对 hard 区分度不足（6 个候选全 100%）；全量 hard 才拉开 97.835%–99.999%。
- diabolical 最能反映高级策略质量：sonnet46 全量 valid 98.949% 居首。
- deepseekv4 样本健全但全量出现 411 个 invalid，说明样本闸门不足以覆盖全部 soundness 风险。

## 胜出者 → 修复 → 当前引擎基线

以 **sonnet46**（diabolical 全量最高）为基础，逐步追踪对比其他分支（gemini35flash / opus48 等）的成功路径，
综合修复 locked-candidates 选择策略、ALS 覆盖、forcing-chain 组合等（详见
[`../investigations/`](../investigations/) 根因笔记与
[`../roadmap/remaining-diabolical-regression-plan.md`](../roadmap/remaining-diabolical-regression-plan.md)）。

修复后（`archive/round1/analysis-sonnet46-strategy-fix`，即当前 master 引擎）全量基线：

| 难度 | solved / n | stuck | errors |
| --- | ---: | ---: | ---: |
| easy | 100000 / 100000 | 0 | 0 |
| medium | 352643 / 352643 | 0 | 0 |
| hard | 321592 / 321592 | 0 | 0 |
| diabolical | 118954 / 119681 | **727** | 0 |
| total | 893189 / 893916 | 727 | 0 |

剩余 727 题（全部 stuck，无 invalid）= 下一阶段策略拆分 + 新策略开发目标，已抽出为
[`../../data/failing-diabolical/`](../../data/failing-diabolical/)。
