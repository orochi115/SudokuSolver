在已完成 P0–P2 的覆盖类工作后，本阶段（E）专做**与新策略无关的存量策略调整**——只动既有策略的契约/元数据/排序，**不引入任何新 strategyId**。

> 说明：与新策略**耦合**的 E 项（E2/E3/E4/E6）已在 P0/P1 内随其触发策略完成；本阶段只处理**独立型** E 项（E1、E7），见 `docs/plans/diabolical-727-checklist.md` 的「已有策略调整 backlog」表「归类」列。

## 先读
- `docs/plans/diabolical-727-checklist.md` 的「已有策略调整 backlog」表（E1、E7 行）与「难度刻度」节
- `packages/engine/src/strategy.ts`（`tieBreak` 元数据字段与 determinism 契约）
- `packages/engine/src/strategies/index.ts`（`STRATEGIES` / `CANONICAL_STRATEGY_ORDER`）
- 相关测试：`test/strategy-precedence.test.ts`（determinism）、`test/strategy-profiles.test.ts`

## 任务
1. **E1 — 补全 `tieBreak` 元数据**：给所有"同一难度档可能产出多个候选实例"的多实例策略，逐策略填写声明式 `tieBreak` 排序键（字段与 determinism 测试已就位，只差逐策略填值）。目标：同技巧多实例时产出**确定性**，消除任何隐式/随机排序。
2. **E7 — 难度刻度全局子策略粒度复核（仅复核 / 提案，谨慎落地）**：评估存量策略（尤其 uniqueness 9xx vs chains 7xx / ALS 8xx）的 `difficulty` 是否按真实人类成本全局排序。**这属行为变更**：除非你能用 727/全语料证据证明重排后 solved 不回退、且 trace 选择更合理，否则**只在 `docs/notes/e.md` 写出提案与证据，不要改动 difficulty**。

## 硬性约定
- **不得新增 strategyId**，不得改变任一既有策略的判定逻辑/消除集；E1 只填排序元数据，E7 默认只提案。
- 不改地基核心文件与 `data/`。
- 改动后 `STRATEGIES` 与 `CANONICAL_STRATEGY_ORDER` 仍一致、difficulty 仍互不重复。

## 完成判据（必须全绿）
1. `npm run typecheck` exit 0；`npm test` 全部通过（尤其 `strategy-precedence` determinism 测试）。
2. **健全性**：`data/ground-truth/` 全 400 题零 violation。
3. **727 不回退**：`npm run solve:list -- --profile human-default` 的 solved 数 **不低于** P2 结束时；若你在 E7 真动了 difficulty，必须给出 solved 不降的证据。

## 产出设计说明（必须）
`docs/notes/e.md`：E1 给哪些策略补了 tieBreak、依据什么排序键；E7 的复核结论（保持现状 / 提案重排，附证据）；`solve:list` 前后对比。
