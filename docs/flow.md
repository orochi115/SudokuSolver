# Engine Solving Flow (FR-9)

## Overview

The engine solves Sudoku puzzles using a deterministic strategy pipeline. Strategies are applied in ascending order of `difficulty` (cost band). The solver restarts from the cheapest strategy after each successful step.

## Strategy Pipeline

| Difficulty | Strategy ID | Description |
|-----------|-------------|-------------|
| 10 | full-house | Complete a house with one empty cell |
| 10 | naked-single | Cell with only one candidate |
| 10 | hidden-single | Digit with only one possible cell in a house |
| 20 | locked-candidates | Pointing and claiming |
| 25 | naked-subset | Naked pair/triple/quad |
| 30 | hidden-subset | Hidden pair/triple/quad |
| 40 | basic-fish | X-Wing / Swordfish / Jellyfish |
| 45 | single-digit-patterns | Skyscraper / 2-String Kite / Empty Rectangle |
| 50 | xy-wing | XY-Wing pattern |
| 52 | xyz-wing | XYZ-Wing pattern |
| 52 | w-wing | W-Wing (bridged bivalue cells) |
| 60 | simple-coloring | Single-digit conjugate pair coloring |
| 70 | aic | X-Chain (single-digit alternating inference chains) |
| 80 | als | ALS-XZ (Almost Locked Sets) |
| 90 | uniqueness | Unique Rectangle / BUG+1 |
| 95 | sue-de-coq | Sue de Coq (box-line intersection) |
| 100 | forcing-chain | Depth-limited single-path forcing chains |

## Flow Control

1. The solver clones the input grid
2. Iterates strategies by ascending difficulty
3. Applies the first applicable step (placements + eliminations)
4. Restarts from the cheapest strategy
5. Repeats until solved or no strategy applies (stuck)

## Example Traces

### Easy Puzzle
```
1. hidden-single → places 1 cell
2. naked-single → places 1 cell
... (repeats until solved)
```

### Diabolical Puzzle
```
1. hidden-single → places 1 cell
2. locked-candidates → eliminates 2 candidates
3. naked-subset → eliminates 3 candidates
4. basic-fish → eliminates 4 candidates
5. single-digit-patterns → eliminates 2 candidates
6. simple-coloring → eliminates 1 candidate
7. aic → eliminates 2 candidates
8. als → eliminates 3 candidates
9. forcing-chain → eliminates 1 candidate
... (repeats)
```

## Soundness Guarantee

Every strategy is a pure function that does not modify the grid. The solver applies the returned `Step` after soundness verification. All strategies are validated against the 400-puzzle ground-truth dataset (AC-3).
