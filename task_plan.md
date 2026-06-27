# Task Plan: P1 标准进阶策略实现（diabolical-727）

## Goal
在已完成 P0 的 33 个策略基础上，实现 `docs/plans/diabolical-727-checklist.md` §P1 列出的全部 28 个 strategyId，完成必要重构（E4 ALS 收编），通过类型检查与全量测试，提升 727 解出率并产出设计说明 `docs/notes/p1.md`。

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] 阅读 §P1 表与实现指南
- [ ] 探索现有 strategies/、overlap.ts、boundaries.ts、engine 接口
- [ ] 阅读研究卡（P1  exotic/coloring/ALS/AHS/wing/UR 相关）
- [ ] 记录 findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure
- [ ] 确定各 strategyId 的复用 owner 与 detector 分配
- [ ] 确定 difficulty 与 CANONICAL_STRATEGY_ORDER 插入位置
- [ ] 规划新增/修改文件清单
- **Status:** pending

### Phase 3: Implementation
- [ ] 实现 finned fish 三策略
- [ ] 实现 coloring 族（multi-coloring、3d-medusa）
- [ ] 实现 chain/AIC 族扩展（nice-loop、xy-chain、turbot-fish 若 P0 未做、AIC-with-ALS/UR）
- [ ] 实现 wing/bent/oddagon 族（wxyz-wing、remote-pairs、bent-sets、broken-wing）
- [ ] 实现 uniqueness 扩展（AR1–4、EUR、unique-loop、BUG 变体）
- [ ] 实现 ALS/AHS 族并落 E4 收编
- [ ] 实现 tridagon
- [ ] 更新 overlap.ts / boundaries.ts / profiles.ts / index.ts
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] `npm run typecheck` exit 0
- [ ] `npm test` 全部通过
- [ ] `data/ground-truth/` 全 400 题零 violation
- [ ] 727 增量：`npm run solve:list -- --profile human-default` 与 last-resort
- [ ] 写 `docs/notes/p1.md`
- **Status:** pending

### Phase 5: Delivery
- [ ] 更新 checklist §P1 与 E4 勾选
- [ ] 最终自检：无枚举伪装、无暴力求解器调用
- **Status:** pending

## Key Questions
1. P0 实际已实现哪些策略？基线 727 解出数是多少？
2. 哪些 P1 策略可共享 detector/owner，哪些必须新建？
3. ALS-chain 的通用实现如何兼容现有 als-xy-wing？
4. AIC-with-ALS/UR 的链节点类型如何扩展 buildLinkGraph？
5. 全语料运行耗时与是否需要增量调试？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 待记录 | 待记录 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| python 命令未找到 | 1 | 使用 python3 |

## Notes
- 用户要求 headless 自主执行，不写进 QUESTIONS.md 除非遇到会阻塞实现的歧义。
- 所有新增策略必须精确注册 strategyId，缺一即退回重试。
- 严禁 human-default 策略内部做试错/穷举/调用暴力求解器。
