# 补全 727 Diabolical（Roadmap ②）

> **状态：骨架。** 详细规划**待 Roadmap ①（[taxonomy 重构](./taxonomy-refactor.md)）完成后**重新分析再定稿——下方任务描述尚未 review，且新策略集合需结合届时的引擎状态重新梳理。本文件先固定目标、方法骨架与红线。

**目标：** 让当前引擎解出 [`../../data/failing-diabolical/`](../../data/failing-diabolical/) 里的 **727 道 diabolical**（目前全部 `stuck`，0 invalid）。可能需多轮、逐族推进，未必一轮覆盖全部。

**前置：** 先完成 taxonomy 重构（①），使新策略以人类技巧命名的细粒度 ID 接入、按识别成本排序、一步=一个具体模式实例。

## Taxonomy 约束（继承 Roadmap ①）

- 新策略必须使用具体的人类技巧 ID，避免把不同技巧塞进宽泛家族名（例如不要新增只叫 `fish`、`als`、`chain` 的默认 trace ID）。
- `difficulty` 按人类识别/学习成本排序，而不是按实现复杂度或运行成本排序；默认 trace 优先展示更容易讲解的技巧。
- 一个 trace step 默认对应一个具体模式实例；同一技巧的跨实例合并如果为了控范围暂时保留，必须在计划里列为显式 deferred exception。
- 每个新增或增强技巧都要有 restored-state 测试，断言具体 `strategyId`、关键 sound deduction，以及整题 solved/sound 不回退。
- 若某个新策略需要共享分析缓存，先保持实现正确且简单；缓存只能作为后续性能优化任务单独引入。

## 验证（沿用三层模型）

- 每修好若干题，用全语料 `npm run corpus:run` 确认 **solved 数不回退、0 invalid**（重型门槛）。
- 每攻克一题，在 `packages/engine/test/diabolical-regressions.test.ts` 加一条针对性回归（restored-state + 整题 solved/sound）。
- `data/ground-truth/` 的 `npm test`（AC-3 全 400 题 0 violation）始终保持绿。
- 进度 = 727 中已转为 solved 的数量（用 `corpus:run --difficulty diabolical` 跟踪）；随策略增加，`data/failing-diabolical/` 重新生成会逐步缩小。

## 方法骨架

1. **特征分析（聚类 727）**：对每个 stuck 终局记录空格数、候选掩码、最后若干步策略 ID、可用策略探针；按"首个可用的缺失技巧族"信号聚类。候选族：
   - AIC 环 / grouped 端点、XY-chain / Y-chain 路径
   - ALS-XZ / ALS-XY / 更长 ALS 链
   - finned / sashimi fish
   - X-Cycles / multi-coloring
   - UR Type 2/3/4/6、BUG+1 扩展
2. **选最高产出族**先做。
3. **TDD 实现**：先写失败用例（restored-state 定位首个分歧 + 整题），再最小实现新策略/更强变体；遵循 ① 的命名、一步粒度与排序原则。
4. **全语料校验无回退** → 提交 → 下一族。

## 红线（同 ① 的工程约束）

- 任何改动若降低全语料 solved 数或引入 invalid，立即停。
- 同一选择策略调三次仍不行，重审架构而非再堆 tie-break 规则。
- 全语料性能不是本阶段首要目标；若需要缓存，作为独立优化任务处理，不把缓存当作策略正确性的前提。
- **不**引入回溯、模板枚举、无约束 forcing nets、或题号专用 guard——这些不算"人类解法"。

## 对照实验结果（HoDoKu 纯逻辑普查，2026-06-22）

已用 HoDoKu（纯逻辑、零暴力/模板）跑完全部 727，详见 [`research/hodoku-logic/FINDINGS.md`](../../research/hodoku-logic/FINDINGS.md)（含可复现脚本与每题技巧 trace）。要点：

- **全套人类技巧（含 forcing chains + nets）：727/727 全解，0 invalid。** 即每道都可纯逻辑解出。
- **禁用 forcing nets（仍保留 forcing chains）：424/727 解出，303 stuck。** 约 40% 真正需要 net 级强度（本计划红线视为非人类）。
- **首个缺失技巧族聚类（最高产出在前）：**
  1. **链 / Nice Loop ≈ 380**：（成组）不连续环为主。引擎已有 `AIC`/`X-Chain`，缺的是**更强的链搜索**——group node + 不连续环判定。**单一最高杠杆。**
  2. **finned/sashimi fish ≈ 179**：现有 fish 策略的受控扩展。
  3. **Hidden Rectangle 65**：小而独立的 uniqueness 补充。
  4. **forcing nets 52**：最硬尾部，受红线限制可能保持 stuck，需显式决策是否接受 ~7% 残留。
  5. **Turbot Fish 34**：部分已被 skyscraper/2-string-kite/empty-rectangle 覆盖。

→ 实现优先级建议直接采用上面 1→2→3 的顺序（先强化链引擎，再补 finned fish，再 Hidden Rectangle），nets 依赖的尾部最后单独评估。

## 待定稿事项（Roadmap ① 后再分析）

- 新策略的**具体清单与优先级**：以上对照实验已给出数据支撑的初版排序；① 完成后结合引擎状态与命名再定稿。
- ~~是否新增对照开源解法的阶段~~ — 已完成（见上 / [`research/hodoku-logic/`](../../research/hodoku-logic/)）。
- 策略灵感来源：`research/sudoku-human-solving/local-library/`（技巧卡与来源摘要）。
