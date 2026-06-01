# Solver Flow (FR-9)

Derived from STRATEGIES registry order + representative traces.

## Phase Order (by difficulty)
1. full-house / naked-single / hidden-single (10-20)
2. locked-candidates (20)
3. naked/hidden-subset (30)
4. basic-fish / single-digit-patterns (40)
5. xy/xyz/w-wing (50)
6. simple-coloring (60)
7. aic (X-Chain, XY-Chain, Nice Loop, AIC Type1/2) (70)
8. als (XZ, XY-Wing, Death Blossom, chains) (80)
9. uniqueness (UR/AR/BUG, optional) (90)
10. sue-de-coq (95)
11. forcing-chain (depth-limited) (100)

## Worked Example Trace Excerpt (diabolical AIC)
Step: aic
elim: r3c4≠5 (via [r3c4-5 strong r3c9-5 weak r8c9-5 strong r8c2-5 weak r3c2-5] discontinuous nice loop)
highlights: {links: [...] }  // full alternating path

All steps human-readable, no violation on ground-truth.

## Source of Truth
The registry in strategies/index.ts + each strategy's apply() is the single source; docs/flow.md auto-syncs with code.
