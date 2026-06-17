# 开发计划（统一入口）

> 本文是项目开发的**唯一状态与路线图入口**。需求总纲见 [`requirements.md`](./requirements.md)，
> 各阶段详细验收规格见 [`milestones/M1..M5.md`](./milestones/)。

## 当前状态

| 阶段 | 状态 | 说明 |
| --- | --- | --- |
| 第 1 阶段 · 研究库 | ✅ 完成 | `research/sudoku-human-solving/`（56 来源 / 13 技巧卡 / 中英术语） |
| M1 地基 | ✅ 完成 | 引擎核心 + 测试 + 冻结标准答案集；`Step`/`SolveTrace` 契约冻结 |
| M2 基础策略 (T1~T3) | ✅ 已实现 | 见下方策略覆盖；全部 T1~T3 策略已注册并通过单测 |
| M3 高级策略 (T4) | 🔶 基本完成 | AIC/ALS/链/唯一性等已实现；全语料仍余 **727 题** diabolical 未解出 |
| 策略拆分重构 | ⬜ 下一步 | 见下方「路线图 ①」 |
| 补全 727 | ⬜ 待开始 | 见下方「路线图 ②」；目标集 [`../data/failing-diabolical/`](../data/failing-diabolical/) |
| M4 网页逐步回放 | ⬜ 未开始 | `packages/web` 待建 |
| M5 交互式引导 UI | ⬜ 未开始 | 依赖 M4 + 引擎 |

全语料基线（当前引擎）：easy 100000/100000、medium 352643/352643、hard 321592/321592、
diabolical **118954/119681**（727 stuck，0 invalid）、合计 893189/893916。

## 策略覆盖（17 个，`packages/engine/src/strategies/`）

- **T1 入门**：`full-house`、`naked-single`、`hidden-single`
- **T2 区块/子集**：`locked-candidates`、`naked-subset`、`hidden-subset`
- **T3 鱼/翼**：`basic-fish`、`single-digit-patterns`（Skyscraper / 2-String Kite / Empty Rectangle）、`xy-wing`、`xyz-wing`、`w-wing`
- **T4 高级**：`simple-coloring`、`aic`、`als`（ALS-XZ / doubly-linked / ALS-XY-Wing / Death Blossom / chain）、`uniqueness`（UR1–5 / BUG+1）、`sue-de-coq`、`forcing-chain`
- **链基础设施**：`packages/engine/src/chain/{graph,aic-search,policy}.ts`

求解循环（`packages/engine/src/solver.ts`）按 `Strategy.difficulty` 排序，应用第一个产生进展的步骤后从最便宜策略重启。策略契约见 `packages/engine/src/strategy.ts`。

## 路线图

### ① 人类策略 taxonomy 拆分（下一步，不增加解题力）
把粗粒度策略族按"人类技巧命名"拆为更细的 `strategyId`，让默认 trace 的每一步对应一个**具体可命名的技巧**，便于教学回放与提示。

- **原则**：按人类识别/学习成本排序（非实现复杂度）；默认优先最简单的可用命名技巧；一步可含同一模式实例的多处消除，但**不**把不同子技巧仅因同族就并进一步。
- **优先级**：先消除跨*技巧*合并（如 ALS-XZ 与 Death Blossom 经 `combineSteps` collapse 成一个 `als` 步）；跨*实例*合并（如 `locked-candidates` 把全盘 pointing 并成一步）可**延后**，但须标注为显式例外，目标仍是「一步 = 一个具体模式实例」。
- **重点审查文件**：`als.ts`、`aic.ts`、`naked-subset.ts`、`hidden-subset.ts`、`basic-fish.ts`、`single-digit-patterns.ts`、`uniqueness.ts`、`forcing-chain.ts`；产出更新后的 `strategies/index.ts` 注册表与排序。
- **约束**：不加回溯、模板枚举、无约束 forcing nets、题号专用 guard；不加缓存（第一遍）；除粗策略已含的能力外不新增逻辑力。
- **验收**：全语料 solved 数不回退、0 invalid；既有回归测试（`packages/engine/test/diabolical-regressions.test.ts`）保持绿。

### ② 补全 727（新增策略）
针对 [`data/failing-diabolical/`](../data/failing-diabolical/) 的 727 题，按缺失技巧族聚类后，TDD 增量实现新策略/更强变体（候选族：grouped/finned/sashimi fish、X-Cycles/multi-coloring、更完整 ALS 链、UR Type 2/3/4/6、BUG+1 等）。
- **流程**：聚类 → 选最高产出族 → 写失败用例（restored-state + 整题）→ 最小实现 → 全语料校验无回退。
- **停止条件**：任何改动若降低全语料 solved 数或引入 invalid，立即停。
- 可能需多轮才能覆盖全部 727。

### ③ M4 网页逐步回放
`packages/web` 加载谜题 → 引擎产出 `SolveTrace` → 候选网格渲染 + 逐步回放 + 高亮 + 双语讲解。详见 [`milestones/M4.md`](./milestones/M4.md)。

### ④ M5 交互式引导 UI
任意盘面分级提示 + 落子校验。详见 [`milestones/M5.md`](./milestones/M5.md)。

## 验收清单（引用 milestones 细则）

- **M2**：每个 T1~T3 策略有单测；全部 400 题标准答案集零 violation；按难度报告解出率；策略顺序据统计调优。
- **M3**：`docs/forcing-boundary.md` 成文（FR-8）；T4 各策略 + 链接图/AIC 引擎单测；含 diabolical 零 violation；diabolical 解出率显著提升；`docs/flow.md` 由算法派生（FR-9）。
- **M4**：`packages/web` 可启动；逐步回放 + 高亮 + 双语讲解正确（AC-5）。
- **M5**：任意盘面分级提示 + 落子校验（AC-6，浏览器走查）。

## 运行与验证

```bash
npm install
npm test            # 单元 + 语料集成（含 diabolical 回归）
npm run typecheck
npm run gen:ground-truth   # 重新生成冻结标准答案集
npm run corpus:run -- --difficulty diabolical --limit 50   # 对当前引擎跑全语料子集
```
