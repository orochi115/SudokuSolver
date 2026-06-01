# Forcing Chains / Nets Boundary (FR-8)

## Human-Acceptable Logic
- Single-premise alternating strong/weak inference chains (AIC) with no branching.
- Depth ≤ 6 links (human short-term memory limit).
- Continuous nice loops, discontinuous nice loops, X-Chain, XY-Chain, ALS chains of short length.
- Simple Coloring (2-coloring on single digit).
- Named short patterns (Skyscraper, Kite, etc.) as special cases of 4-6 link AIC.

## Enumeration / Disallowed (marked as "last resort" or disabled by default)
- Branching forcing nets (multiple premises, OR/AND nets).
- Nishio / template enumeration / multi-digit trial-and-error.
- Depth >6 or exponential search.
- BUG+1 when it requires assuming uniqueness beyond UR.

Engine exposes config `forcingBoundary: 'strict' | 'lenient'` (default 'strict').
Only 'strict' chains are used in AC-3 ground-truth validation to guarantee soundness without hidden enumeration.

See also: docs/flow.md for how strategies are ordered and when forcing is reached.
