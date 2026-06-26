# Round2 主观评测提纲（跑完后另开会话执行）

> 用途：客观数据（PASS/FAIL/SKIP、727 增量、用时、费用、测试用时）由 harness 汇总进 `report-final.md`；
> 本提纲是**主观评测**项，**另开一个全新 Claude 会话**逐模型分支评估，结论并入 `report-final.md` 的「主观评测」节。
> 评测对象：各模型分支 `archive/round2/<short>`（archive-run.sh 归档后的扁平命名；通关程度从 reports 的 summary 看）。

## 评测前准备
- `git fetch` 并列出 `archive/round2/*` 分支；每个模型分支单独 checkout 或用 worktree。
- 基准对照：`foundation` 分支（起点：33 策略、727 = 0/0）。

## 评测项

### 1. 文档是否更新（checklist 打勾情况）
对每个模型分支检查：
- `docs/plans/diabolical-727-checklist.md` 的 §P0–§P3 表，该模型实际实现的 strategyId 是否被勾选 ✅，勾选是否与代码实际注册一致（**有无虚勾**：勾了 ✅ 但 `index.ts` 没注册 / 没测试）。
- 各阶段 `docs/notes/{p0,p1,p2,e,p3}.md` 设计说明是否产出、是否言之有物（含 727 增量数字、E 项处理）。
- 「已有策略调整 backlog」表的 E 项状态是否据实更新。
- 评分建议：完整且诚实 / 部分 / 缺失或虚勾。

### 2. P3 是否污染 human-default
对每个**进入过 P3** 的模型分支：
- 读 `packages/engine/src/strategies/profiles.ts`：全部 P3 id（见 `required-ids/p3-only.txt`）是否都在 `LAST_RESORT_IDS`。
- 跑 `npm test`（`strategy-profiles.test.ts`）确认 `HUMAN_DEFAULT_STRATEGIES` 不含任何 P3 id。
- 交叉验证：`npm run solve:list -- --profile human-default` 与 `-- --profile last-resort`，确认 P3 增量只体现在 last-resort、human-default 解出数未被 P3 抬高。
- 评分建议：干净隔离 / 有泄漏（具体哪个 id 进了 human-default）。

### 3. 新规划策略排序的合理性
对每个模型分支评估其对策略排序/归属的处理：
- `index.ts` 的 `difficulty` 排序与 `CANONICAL_STRATEGY_ORDER`：新族插位是否符合人类识别成本（对照 checklist「难度刻度」band 与「拟定 difficulty」）。
- `overlap.ts` / `chain/boundaries.ts`：复用型策略（turbot-fish、xy-chain、remote-pairs、als-xy-wing 等）是否正确移入 members / 复用 owner，而非各自新写搜索（有无重复 detector）。
- 是否出现 difficulty 撞值、family 名兜底 id、或把红线策略错排进 human-default band。
- 评分建议：合理 / 局部可商榷（举例）/ 明显错排。

## 产出
把三项的逐模型结论 + 横向对比写成一节，并入 `orchestration/round2/report-final.md`。主观项需标注「主观评测」与评测会话出处。
