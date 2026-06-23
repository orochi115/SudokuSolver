# Aligned Pair Exclusion (APE)

Source: https://www.sudokuwiki.org/Aligned_Pair_Exclusion
Author: Andrew Stuart @ SudokuWiki.org. Content copyright Andrew Stuart, 2007-2026.
Mirror fetched: 2026-06-23. Reference documentation (not code).

## Overview

Aligned Pair Exclusion (APE), also called Subset Exclusion, is a complex but
interesting strategy that considers the combinations of available candidates in
a *base pair* of cells. The goal is to find at least one elimination from that
pair. It works with both *locked* pairs (the two base cells can see each other,
"aligned") and pairs that do not directly see each other.

## Fundamental Rules

APE uses two rules to exclude as many of the possible candidate combinations for
the two base cells as it can:

1. **Bi-value / ALS restriction.** Any two cells that can see each other CANNOT
   contain a pair of numbers that would empty a cell in an Almost Locked Set
   (ALS) they both entirely see. The simplest ALS is a bi-value cell: if a
   bi-value cell is a buddy of both base cells, the base pair cannot take both of
   that cell's two values, as that would leave the bi-value cell with no
   candidate.

2. **Same-unit constraint.** If a pair of cells are in the same unit (aligned),
   they cannot contain the same value.

## Application Process

1. Enumerate every possible candidate combination that could occupy the two base
   cells.
2. For each combination, check every cell (or ALS) that BOTH base cells see
   completely. If a combination would leave such an ALS with no remaining
   candidate, mark that combination as *excluded* (not allowed).
3. After all combinations are tested, look at each candidate digit in each base
   cell. If a digit only ever appears in excluded combinations, it can never be
   placed in that base cell, so it is eliminated.

The eliminations come from cells that "see both" base cells — bi-value cells,
2-cell ALSs, and even 3-cell ALSs can drive the exclusions.

## Types

- **Type 1** — the two base cells can see each other (aligned pair).
- **Type 2** — the two base cells do NOT see each other; here identical
  candidates are theoretically possible in both cells, which slightly changes the
  combination bookkeeping.

## Aligned Triple Exclusion (ATE)

Aligned Triple Exclusion extends the same logic to a triple of cells located in
an intersection. Instead of enumerating combinations for two cells, ATE
enumerates all 3-candidate combinations across the three base cells and excludes
any combination that would empty a cell / ALS that the relevant cells commonly
see, eliminating candidates that survive in no valid combination. It is far more
laborious than APE, which is why neither technique is popular in manual solving.

## Credits

Rod Hagglund first popularised this method. Additional ALS-pair insight credited
to Myth Jellies. An eight-cell example is credited to Klaus Brenner, found after
examining roughly 21 million puzzles.

(ATE is documented separately on Sudopedia: Aligned Triple Exclusion.)
