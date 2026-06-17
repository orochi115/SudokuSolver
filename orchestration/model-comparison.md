# 多模型对比协议 (Multi-Model Comparison Protocol)

> 仅供编排者。worker 模型看不到本文件(它只在 `orchestration` 分支)。

引擎部分天然适合大模型横评:验收**客观、可自动化**(健全性 0/1 + 解出率连续值),
环境自包含、可复现。本文件定义如何公平地组织对比。

## 核心原则:先冻结地基,再从策略层分叉
> 否则测的是"脚手架/提示词",而不是模型本身。

1. **冻结共享面**。所有模型分支从同一个 `foundation` 出发,且**不得修改**:
   - `packages/engine/src/{grid,trace,strategy,solver,soundness,bruteforce,parser}.ts`
   - `data/ground-truth/`(冻结评分集)
   - `docs/`、顶层配置(`package.json`、`tsconfig*`、`vitest.config.ts`)
2. **分叉点 = M2**。每个模型只在 `packages/engine/src/strategies/` 下新增策略并注册。
3. **同一任务书**。所有分支拿到完全相同的提示词(见 `prompts/`)。

## 分支约定
```
foundation              # 干净地基(worker 起点)
orchestration           # 本编排区(只有你用)
model/<name>            # 某模型的工作分支,从 foundation 分叉
```
建议用 git worktree 并行隔离各分支。

## 评分维度(开跑前定稿,勿事后改)
| 维度 | 指标 | 来源 |
|---|---|---|
| **正确性(硬门槛)** | 标准答案集 violation 数(应为 0) | `checkTraceSoundness` |
| **能力 · 解出率** | 各难度非暴力解出率 % | `scripts/solve-rate.ts`(M2 产出) |
| **能力 · 策略覆盖** | 正确实现且被单测覆盖的策略数 | 各分支测试 |
| **效率** | 平均每题步数 / 求解耗时 | 统计脚本 |
| **代码质量** | typecheck 通过、可读性、是否复用底座 | 人工 + lint |
| **成本** | 实现耗时 / token(可选) | 过程记录 |

> **任何 violation > 0 视为该里程碑未通过**(不健全的解题器不可用于教学),先于解出率排序。

## 防过拟合
- `data/ground-truth/`(公开集)冻结并供 worker 自测。
- 另用 `scripts/gen-ground-truth.ts` 以**不同 SAMPLE/stride** 生成一个**不提交**的 holdout 集,
  仅在最终评分时由你跑,检验是否对公开集过拟合。

## 评分流程
1. 每个 `model/<name>` 分支跑 `npm run typecheck && npm test`。
2. 跑 `scripts/solve-rate.ts`(对公开集 + holdout 集)。
3. 汇总:正确性门槛 → 解出率 → 策略覆盖 → 效率 → 质量。
4. 综合:取胜出分支主实现,可择优嫁接其他分支亮点。
