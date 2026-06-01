# Forcing Chains Boundary (FR-8)

## Human-Acceptable Logic
- Single premise, alternating strong/weak links along one path (AIC, X-Chain, XY-Chain, Nice Loop)
- Depth ≤ 8 links (reasonable for manual tracing)
- No branching / forking in the primary deduction path
- Continuous or discontinuous nice loops that close with contradiction or confirmation
- ALS-based chains that remain grouped-link style (no full nets)

## Disallowed / "Disguised Enumeration" (to disable or mark)
- Multi-branch forcing nets (multiple simultaneous implications)
- Nishio-style trial-and-error (assume digit, propagate, backtrack)
- Template enumeration or pattern matching that effectively tries all possibilities
- Deep forcing chains (>12 links or with >2 branches)
- Any strategy whose justification requires exploring multiple mutually exclusive cases in the explanation

## Engine Configuration
The solver exposes `allowForcingNets: boolean` (default false) and `maxChainDepth: number` (default 8).
Strategies under forcing-chain must respect these; if disabled, return null even if pattern matches.

This boundary ensures the engine stays within "human logical" techniques while allowing future opt-in for harder puzzles.
