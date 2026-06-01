# 多模型对比协议 (Multi-Model Comparison Protocol)

本项目的引擎部分天然适合做大模型横评:验收标准**客观、可自动化**(健全性 0/1 + 解出率连续值),
环境自包含、可复现。本文件定义如何公平地组织这场对比。

## 核心原则:先冻结地基,再从策略层分叉
> 否则测的是"脚手架/提示词",而不是模型本身。

1. **冻结共享面(frozen surface)**。所有模型分支从**同一个 base commit** 出发,且**不得修改**:
   - `packages/engine/src/{grid,trace,strategy,solver,soundness,bruteforce,parser}.ts`
   - `data/ground-truth/`(冻结评分集)
   - `docs/`(需求与里程碑)
   - 顶层配置(`package.json`、`tsconfig*`、`vitest.config.ts`)
2. **分叉点 = M2**。每个模型在自己的分支上,只在 `packages/engine/src/strategies/` 下新增策略实现并注册。
3. **同一任务书**。所有分支拿到完全相同的指令:实现 `docs/milestones/M2.md`(及 M3.md)中的策略,
   遵守 `strategy.ts` 契约与 `naked-single.ts` 约定。

## 分支约定
```
foundation                 # 冻结地基(本分支),打 tag 如 v0-foundation
model/<name>-m2            # 某模型实现 M2,从 foundation 分叉
model/<name>-m3            # 进一步实现 M3
```
建议用 git worktree 并行隔离各分支。

## 评分维度(开跑前定稿,勿事后改)
| 维度 | 指标 | 来源 |
|---|---|---|
| **正确性(硬门槛)** | 标准答案集 violation 数(应为 0) | `checkTraceSoundness` |
| **能力 · 解出率** | 各难度非暴力解出率 % | 解出率统计脚本(M2 产出) |
| **能力 · 策略覆盖** | 正确实现并被单测覆盖的策略数 | 各分支测试 |
| **效率** | 平均每题步数 / 求解耗时 | 统计脚本 |
| **代码质量** | typecheck 通过、可读性、是否复用底座 | 人工 + lint |
| **成本** | 实现耗时 / token(可选) | 过程记录 |

> **任何 violation > 0 视为该里程碑未通过**(不健全的解题器不可用于教学),先于解出率排序。

## 防过拟合
- 评分集 `data/ground-truth/` 已冻结且公开给所有分支用于自测——这部分是"公开集"。
- 另用 `scripts/gen-ground-truth.ts` 以**不同 SAMPLE/stride** 生成一个**不提交、不公开**的 holdout 集,
  仅在最终评分时由裁判跑,检验是否对公开集过拟合。

## 评分流程
1. 每个 `model/<name>-mX` 分支跑 `npm run typecheck && npm test`。
2. 跑解出率统计脚本(对公开集 + holdout 集)。
3. 汇总到对比报告:正确性门槛 → 解出率 → 策略覆盖 → 效率 → 质量。
4. 综合:从胜出分支取主实现,可择优嫁接其他分支的亮点(judge-panel 式合并)。
