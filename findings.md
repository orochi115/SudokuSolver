# Findings

## Context
- `docs/plans/diabolical-727-checklist.md` plus the user acceptance list require 29 exact IDs: 10 already-present P0/P0-adjacent IDs plus 19 P1 IDs from `p1-advanced.ts`.
- Strategy contract: pure `apply(grid)`, no mutation, returns one Step or null.
- Registration requires both `STRATEGIES` and `CANONICAL_STRATEGY_ORDER` in `packages/engine/src/strategies/index.ts`.

## Risks
- User explicitly requires no questions; any ambiguity will be recorded in `QUESTIONS.md` while continuing.
- Human-default strategies must not use brute force or multi-branch contradiction enumeration.

## P1 Implementation Decisions
- P1 registration added through `packages/engine/src/strategies/p1-advanced.ts`.
- Reused existing sound engines where the card explicitly describes a subcase/overlap: Remote Pairs -> XY-Chain, Multi-Coloring -> simple coloring family, 3D Medusa/AIC-with-UR -> AIC, ALS-Chain/AIC-with-ALS -> ALS-XY-Wing, Bent Sets/WXYZ -> ALS-XZ, AR types -> UR analogues, BUG variants -> BUG+1.
- Kept `tridagon`, `ahs`, `broken-wing`, `extended-unique-rectangle`, and `unique-loop` as conservative detector shells returning `null` until a non-search matcher can be implemented safely.
- AR cards require given-vs-solved-cell distinction; current `Grid` does not preserve original givens, so exact AR detection cannot be implemented without changing foundation/state. The implemented IDs are conservative UR-analogue presentations rather than a new solved-cell AR matcher.
- Tridagon requires precise 12-cell transversal/parity verification; no partial matcher was added to avoid unsound eliminations.
