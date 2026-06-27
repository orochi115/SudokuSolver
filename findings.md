# P0 关键发现

## 现有架构
- `buildLinkGraph` 已支持 group nodes、bivalue strong links、单数字强链。
- `searchAic` 返回 `AicResult` 含 kind: 'type1' | 'type2' | 'discontinuous-loop' | 'continuous-loop'，但当前 `aic.ts` 只消费 type1/type2 open chain，loop kinds 未被使用。
- `boundaries.ts` 已预留 `nice-loop` 和 `xy-chain`，`overlap.ts` 已预留这些 id 的 futureMembers。
- `uniqueness.ts` 目前是 3 个独立函数，需扩展为共享 UR engine。

## 验收失败原因
- 缺少 strategyId: finned-x-wing, finned-swordfish, finned-jellyfish, nice-loop, xy-chain, turbot-fish, hidden-unique-rectangle, unique-rectangle-type-3, unique-rectangle-type-5, unique-rectangle-type-6。

## 实现顺序
1. Finned fish（复用 basic-fish 结构）
2. Nice loop / XY-chain / Turbot fish（复用链引擎）
3. UR 扩展（扩展 uniqueness.ts）
