# Sudoku Solving Flow (FR-9)

> Human-readable solving workflow derived from strategy registry and worked traces.

## Overview

This document describes the systematic solving flow that the engine follows, organized by difficulty tiers. The solver always tries the simplest applicable technique first (FR-7).

## Difficulty Tiers

| Tier | Difficulty | Strategies |
|------|------------|------------|
| T1   | 10         | naked-single, full-house, hidden-single |
| T2   | 20-30      | locked-candidates, naked-subset, hidden-subset |
| T3   | 40-50      | basic-fish, single-digit-patterns, xy-wing, xyz-wing, w-wing |
| T4   | 60-100     | simple-coloring, aic, als, uniqueness, sue-de-coq, forcing-chain |

## Solver Loop

```
while not solved:
    for strategy in strategies_sorted_by_difficulty:
        step = strategy.apply(grid)
        if step and (step.placements or step.eliminations):
            apply_step(grid, step)
            restart_from_easiest  # FR-7
            break
    if no_progress:
        stuck
```

## Strategy Descriptions

### T1: Singles (Difficulty 10)

**naked-single**: A cell with only one candidate → place it.

**full-house**: When a house has 8 cells solved, the last empty cell gets the missing digit.

**hidden-single**: A digit appears only once in a house → place it in that cell.

### T2: Intersections & Subsets (Difficulty 20-30)

**locked-candidates (Pointing)**: When all candidates of a digit in a box lie in one row/column, eliminate that digit from the rest of the row/column.

**locked-candidates (Claiming)**: When all candidates of a digit in a row/column lie in one box, eliminate from the rest of the box.

**naked-subset**: N cells in a house with exactly N candidates that are all in those cells → eliminate those candidates from other cells in the house.

**hidden-subset**: N digits appear only in N cells in a house → those cells can only have those digits.

### T3: Fish, Wings & Patterns (Difficulty 40-50)

**basic-fish**: X-Wing, Swordfish, Jellyfish patterns. When a digit can only appear in certain rows/columns forming a rectangle, eliminate from the rectangle's corners' peers.

**single-digit-patterns**: Turbot patterns (Skyscraper, Kite, etc.). Single-digit chains with strong links that produce eliminations.

**xy-wing**: Pivot cell {X,Y} with two pincers {X,Z} and {Y,Z}. Eliminate Z from cells seeing both pincers.

**xyz-wing**: Pivot cell {X,Y,Z} with two pincers {X,Z} and {Y,Z}. More powerful than XY-Wing.

**w-wing**: Two bivalue cells with same pair {X,Y} bridged by a strong link on X. Eliminate Y from cells seeing both.

### T4: Advanced Chains (Difficulty 60-100)

**simple-coloring**: For one digit, build a bipartite graph of conjugate pairs. Color trap (uncolored cell seeing both colors → eliminate) or color wrap (same-color cells seeing each other → both false).

**aic**: Alternating Inference Chains. Build strong/weak link graph, find chains where:
- Type 1: endpoints same digit, seeing cells → eliminate
- Type 2: endpoints different digits in seeing cells → eliminate
- Continuous loop: weak links become effectively strong
- Discontinuous loop: contradiction at break point

**als**: Almost Locked Sets. N cells with N+1 candidates in one house.
- ALS-XZ: Two ALS share restricted common candidate X; eliminate common candidate Z
- Doubly-linked ALS-XZ: Two RCCs give stronger locking
- ALS-XY-Wing: Three ALS linked through two RCCs
- ALS Chain: Sequence of ALS connected by RCCs
- Death Blossom: Stem cell connects to ALS petals

**uniqueness** (optional): Requires unique solution assumption.
- Unique Rectangle: Four cells with same two candidates in rectangle formation
- BUG: Bipolar UD pattern where all candidates appear exactly twice

**sue-de-coq**: Line-box intersection with partitioned candidate sets. Eliminates from line and box rest.

**forcing-chain**: Last resort. Within boundary rules:
- Single-candidate: All branches from one cell lead to same result
- Single-digit house: All digit positions in house lead to same result
- Contradiction: Assume leads to contradiction → eliminate that branch

## Representative Worked Traces

### Example 1: Simple Coloring
```
Puzzle: ...
Steps:
  1. hidden-single → R5C3 = 7
  2. simple-coloring (digit 3) → R2C1 ≠ 3 (trap)
```

### Example 2: AIC Chain
```
Puzzle: ...
Steps:
  1. locked-candidates → R4C9 ≠ 5
  2. aic (X-Chain, digit 2) → R1C5 ≠ 2 (Type 1)
```

### Example 3: ALS
```
Puzzle: ...
Steps:
  1. hidden-single → R3C7 = 4
  2. als (ALS-XZ) → R2C3 ≠ 9
```

## Forcing Chain Boundary

See `docs/forcing-boundary.md` for the exact rules on what counts as human-acceptable forcing chains vs. disguised enumeration.

Allowed:
- Single-premise chains (one cell OR one house's digit)
- Contradiction chains
- Depth ≤ 15

Forbidden:
- Forcing nets (multi-branch)
- Nishio/template enumeration
- Backtracking

## Configuration

The engine exposes these configuration options:

```typescript
interface EngineConfig {
  uniqueness: {
    enabled: boolean;  // Default: false (requires unique solution assumption)
  };
  forcingChain: {
    enabled: boolean;
    maxDepth: number;  // Default: 15
    allowHouseForcing: boolean;
    allowContradiction: boolean;
  };
}
```

## References

- Strategy definitions: `packages/engine/src/strategies/`
- Solver loop: `packages/engine/src/solver.ts`
- Trace format: `packages/engine/src/trace.ts`
