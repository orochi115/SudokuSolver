在已完成 P0、P1、P2a 的基础上，实现 **P2b「罕见/异域，第二批」**——余下的异域结构。这是进入红线枚举前最后一批人类技巧。

## 先读
- `docs/plans/diabolical-727-checklist.md` 的 **§P2** 表（本阶段取其后半）
- `docs/strategy-implementation-guide.md`（可复用 API/基类/夹具）
- 你在 P0/P1/P2a 的 `strategies/` 代码、`index.ts`、`overlap.ts`、`chain/boundaries.ts`
- 研究卡：`11-exotic/subset-exclusion.md`、`11-exotic/sue-de-coq.md`、`08-chains-aic/aic-with-als.md`、
  `04-fish/`（franken/mutant fish 扩展）、uniqueness/对称（gurth）

## 任务
实现文末清单中的 P2b id：
- **Subset Exclusion（Subset Counting）**：owner；P2a 的 APE/ATE 是其对齐特例，应复用本 owner。
- **Sue de Coq 扩展**：复用现有 sue-de-coq owner，界定与基型差异。
- **AIC with exotic links / Twinned XY-Chains**：AIC 引擎 + exotic 节点 / 复用 xy-chain。
- **Franken / Mutant fish**：fish 扩展（含 Endo Fins / Cannibalism / Siamese 呈现）。
- **Gurth's Symmetrical Placement**：对称占位（uniqueness/对称 owner）。

## 硬性约定
- 不改地基与既有策略行为；策略为纯函数、不改 grid；填 highlights/双语讲解；按 difficulty 注册并同步 `CANONICAL_STRATEGY_ORDER`；移入 members；每策略配单测。
- **在 §P2 表勾选 ✅** 已完成的 strategyId。
- 红线与结束前自检见文末「自主执行」段。

## 完成判据
1. `npm run typecheck`、`npm test` 全绿。
2. 健全性：400 题 + 727 残集逐步零 violation。
3. 727 增量：`solve:list --profile human-default` 记录较 P2a 的提升并写进 `docs/notes/p2b.md`。

## 产出
`docs/notes/p2b.md`：异域策略建模与思路、727 增量较 P2a、哪些题仍 stuck、判断还缺什么策略族、最难点。
