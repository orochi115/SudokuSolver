# P0 策略补全任务计划

## 目标
实现 Roadmap ② P0 全部 10 个 strategyId，提升 727 diabolical 残集 human-default 解出率。

## 阶段

### 阶段 1: 基础设施与读取 (done)
- [x] 读取项目结构、契约文件、现有策略实现、研究卡、测试。

### 阶段 2: Finned/Sashimi Fish
- [ ] 在 `basic-fish.ts` 旁创建 `finned-fish.ts`
- [ ] 实现统一 finned-fish detector，按 size 发 id `finned-x-wing`/`finned-swordfish`/`finned-jellyfish`
- [ ] 单元测试（用 worked example）
- [ ] 注册到 index.ts / overlap.ts

### 阶段 3: 链引擎扩展 (nice-loop, xy-chain, turbot-fish)
- [ ] 扩展 `aic-search.ts` / `chain/graph.ts` 以返回 loop kinds，或复用 searchAic
- [ ] 实现 `nice-loop` (continuous/discontinuous)
- [ ] 实现 `xy-chain` (复用 AIC 但限制 bivalue cells)
- [ ] 实现 `turbot-fish` (presentation alias，复用 x-chain)
- [ ] E6: aic 不私自发 loop；nice-loop 接管 loop kinds
- [ ] E2: 评估 unified single-digit strong-link family
- [ ] 单元测试
- [ ] 注册到 index.ts / overlap.ts / boundaries.ts

### 阶段 4: UR 扩展 (type 3/5/6 + hidden UR)
- [ ] 重构/扩展 uniqueness.ts 为共享 UR engine
- [ ] 实现 `unique-rectangle-type-3`
- [ ] 实现 `unique-rectangle-type-5`
- [ ] 实现 `unique-rectangle-type-6`
- [ ] 实现 `hidden-unique-rectangle`
- [ ] E3: 3 个独立 UR detector 收敛为共享 engine
- [ ] 单元测试
- [ ] 注册到 index.ts / overlap.ts

### 阶段 5: 验证与文档
- [ ] `npm run typecheck` exit 0
- [ ] `npm test` 全绿
- [ ] 400 ground-truth 零 violation
- [ ] 727 human-default / last-resort 跑分
- [ ] 更新 `docs/plans/diabolical-727-checklist.md` §P0 勾选
- [ ] 撰写 `docs/notes/p0.md`

## 当前问题
- 上阶段验收因缺少 10 个 strategyId 被退回。
- 当前 human-default 727 solved = 0，需补全策略提升。

## 约束
- 不修改地基、既有 33 策略行为。
- 不调用暴力求解器。
- 每个策略必须有 soundness 测试。
