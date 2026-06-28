# Task Plan: P2b 异域策略第二批实现（diabolical-727）

## Goal
在已完成 P0/P1/P2a 的基础上，实现 `docs/plans/diabolical-727-checklist.md` §P2 后半的 7 个 strategyId：
subset-exclusion、sue-de-coq-extended、aic-with-exotic-links、twinned-xy-chains、franken-fish、mutant-fish、gurth。
通过类型检查与全量测试，提升 727 解出率并产出设计说明 `docs/notes/p2b.md`。

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] 阅读 §P2 表后半、实现指南、既有 P0/P1/P2a 代码
- [x] 探索现有 strategies/、overlap.ts、boundaries.ts、engine 接口
- [ ] 阅读研究卡（subset-exclusion、sue-de-coq、AIC-with-ALS、fish、gurth）
- [ ] 记录 findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure
- [ ] 确定各 strategyId 的复用 owner 与 detector 分配
- [ ] 确定 difficulty 与 CANONICAL_STRATEGY_ORDER 插入位置
- [ ] 规划新增/修改文件清单
- **Status:** pending

### Phase 3: Implementation
- [ ] 实现 Subset Exclusion（owner，APE/ATE 为其对齐特例）
- [ ] 实现 Sue de Coq Extended（复用 sue-de-coq owner）
- [ ] 实现 AIC with exotic links / Twinned XY-Chains
- [ ] 实现 Franken / Mutant fish（含 Endo Fins / Cannibalism / Siamese 呈现）
- [ ] 实现 Gurth's Symmetrical Placement
- [ ] 更新 overlap.ts / boundaries.ts / index.ts
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] `npm run typecheck` exit 0
- [ ] `npm test` 全部通过
- [ ] `data/ground-truth/` 全 400 题零 violation
- [ ] 727 增量：`npm run solve:list -- --profile human-default` 与 last-resort
- [ ] 写 `docs/notes/p2b.md`
- **Status:** pending

### Phase 5: Delivery
- [ ] 更新 checklist §P2 后半勾选
- [ ] 最终自检：无枚举伪装、无暴力求解器调用
- **Status:** pending

## Key Questions
1. P2a 实际基线 727 解出数是多少？
2. 哪些 P2b 策略可共享 detector/owner，哪些必须新建？
3. Subset Exclusion 与现有 APE/ATE 如何统一且不重复搜索？
4. Franken/Mutant fish 的 base/cover 域扩展边界如何界定？
5. Gurth 对称占位能否在不读取 givens 的前提下实现通用检测？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 待记录 | 待记录 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 无 | 无 | 无 |

## Notes
- 用户要求 headless 自主执行，不写进 QUESTIONS.md 除非遇到会阻塞实现的歧义。
- 所有新增策略必须精确注册 strategyId，缺一即退回重试。
- 严禁 human-default 策略内部做试错/穷举/调用暴力求解器。
