# FR-9: Solving Flow (Derived from Strategy Registry)

This document describes the human-readable solving flow as implemented by the engine's strategy registry. Strategies are applied in ascending difficulty order.

## Strategy Application Order

| Priority | Strategy | Difficulty | Type | What It Does |
|----------|----------|------------|------|-------------|
| 1 | full-house | 10 | Placement | Last empty cell in a house |
| 2 | naked-single | 10 | Placement | Cell with only one candidate |
| 3 | hidden-single | 10 | Placement | Unique candidate in a house |
| 4 | locked-candidates | 20 | Elimination | Pointing / claiming |
| 5 | naked-subset | 25 | Elimination | Naked pair / triple / quadruple |
| 6 | hidden-subset | 30 | Elimination | Hidden pair / triple / quadruple |
| 7 | basic-fish | 40 | Elimination | X-Wing / Swordfish / Jellyfish |
| 8 | single-digit-patterns | 45 | Elimination | Skyscraper / 2-String Kite |
| 9 | xy-wing | 50 | Elimination | XY-Wing pattern |
| 10 | xyz-wing | 50 | Elimination | XYZ-Wing pattern |
| 11 | w-wing | 50 | Elimination | W-Wing pattern |
| 12 | simple-coloring | 60 | Elimination | Single-digit conjugate chain coloring |
| 13 | aic | 70 | Elimination | Alternating Inference Chains (X-Chain, XY-Chain) |
| 14 | als | 80 | Elimination | Almost Locked Sets (ALS-XZ) |
| 15 | uniqueness | 90 | Elimination | Unique Rectangle (optional, unique-solution assumption) |
| 16 | sue-de-coq | 95 | Elimination | Line-box intersection subset counting |
| 17 | forcing-chain | 100 | Placement | Bivalue cell forcing |

## Flow Semantics

1. After each step, the solver restarts from priority 1 (cheapest strategy).
2. Within each priority, the first strategy that returns a step is applied immediately.
3. Deductions never overlap or duplicate elimination targets.
4. All strategies are pure functions: they inspect but never mutate the grid.

## Typical Puzzle Progression

```
easy:     full-house + naked-single + hidden-single → solved
medium:   ... + locked-candidates + naked-subset → solved
hard:     ... + fish + wings + coloring → solved
diabolical: ... + AIC + ALS → partially solved
```