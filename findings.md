# Findings & Decisions

## Requirements
- 在 P0（33 策略）基础上实现 P1 全部 28 个 strategyId（见 checklist §P1）。
- 必须实现：finned-x-wing、finned-swordfish、finned-jellyfish、nice-loop、xy-chain、turbot-fish、hidden-unique-rectangle、unique-rectangle-type-3/5/6、tridagon、multi-coloring、3d-medusa、als-chain、ahs、wxyz-wing、remote-pairs、bent-sets、broken-wing、avoidable-rectangle-type-1/2/3/4、extended-unique-rectangle、unique-loop、bug-lite、bug-plus-n、aic-with-als、aic-with-ur。
- 耦合重构 E4：als-xy-wing 降为 als-chain 的 len-2 特例。
- 产出 `docs/notes/p1.md`；勾选 checklist；通过 typecheck / npm test / 400 ground-truth / 727 增量。

## Research Findings
- 待填充。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 待记录 | 待记录 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 无 | 无 |

## Resources
- `docs/plans/diabolical-727-checklist.md`
- `docs/strategy-implementation-guide.md`
- `packages/engine/src/strategy.ts`
- `packages/engine/src/strategies/index.ts`
- `packages/engine/src/strategies/overlap.ts`
- `packages/engine/src/chain/boundaries.ts`

## Visual/Browser Findings
- 无。
