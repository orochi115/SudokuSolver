在已完成 P0、P1 的基础上，实现 **P2a「罕见/异域，第一批」**——wing 阶梯 + 主要异域结构。这是进入红线枚举前的人类技巧。

> P2 拆为两阶段（P2a/P2b）以缩小单阶段范围、细化 727 增量测量。本阶段只做下方清单中的 P2a id。

## 先读
- `docs/plans/diabolical-727-checklist.md` 的 **§P2** 表（本阶段取其前半）
- `docs/strategy-implementation-guide.md`（地基引擎可复用的 API/基类/夹具）
- 你在 P0/P1 的 `strategies/` 代码、`index.ts`、`overlap.ts`、`chain/boundaries.ts`
- 研究卡（`research/sudoku-human-solving/local-library/techniques/11-exotic/` 等）：
  `06-wings/wxyz-wing.md`（含 VWXYZ 与翼梯通项）、`11-exotic/exocet.md`、`11-exotic/sk-loop.md`、
  `11-exotic/msls.md`、`11-exotic/fireworks.md`、`11-exotic/aligned-exclusion.md`

## 任务
实现文末「必须实现的策略」清单中的 P2a id：
- **VWXYZ-Wing**：wing size-ladder 通项，复用 WXYZ 框架。
- **Exocet（Junior/Senior）/ SK-Loop / MSLS / Fireworks**：各 exotic owner；SK-Loop 是 MSLS 首发特例。
- **APE / ATE**：对齐对/三元排除（subset-exclusion 的对齐特例，owner 在 P2b）。

## 硬性约定
- 不改地基与既有策略行为；策略为纯函数、不改 grid；填 highlights/双语讲解；按 difficulty 注册并同步 `CANONICAL_STRATEGY_ORDER`；从 `overlap.ts`/`boundaries.ts` 移入 members；每策略配单测。
- **在 §P2 表勾选 ✅** 已完成的 strategyId。
- 红线与结束前自检见文末「自主执行」段（禁止 forcing/暴力求解器；双 profile 跑 solve:list）。

## 完成判据
1. `npm run typecheck`、`npm test` 全绿。
2. 健全性：`data/ground-truth` 400 题 + 727 残集逐步零 violation。
3. 727 增量：`solve:list --profile human-default` 记录较 P1 的提升并写进 `docs/notes/p2a.md`。

## 产出
`docs/notes/p2a.md`：实现的策略与思路、727 增量、仍 stuck 的题型观察、最难点。
