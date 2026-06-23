Title: Guardians - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Guardians

(Copyright Andrew Stuart @ Syndicated Puzzles. Listed under "Deprecated Strategies".)

# Guardians

Also known as Broken Wings, Turbot-Fish, or Oddagon. The strategy operates on single-digit loops.

- **Perfect Pair**: a number occurring exactly twice in one unit (row, column, or box) — a conjugate pair / strong link.
- **Imperfect Pair**: a number occurring three or more times in a unit.

A closed loop of five perfectly paired cells ("Deadly Loop") is impossible in a valid Sudoku. Since such a loop cannot exist, a near-loop of this shape must contain disruptions: cells (guardians) that prevent perfect pairing. Logically, one or more of the guardians must contain the candidate; if none did, the pairings would all be perfect and that is impossible.

## Elimination Rules

1. Single guardian => the candidate is placed (installs) in that cell.
2. Multiple guardians => eliminate the candidate from cells that see ALL the guardians.
3. Guardians in a single unit => erase the candidate from both loop cells in that unit.

## Type 1 — Single Guardian (digit 3)

Loop of perfect pairs E7-E5 (row), E5-G5 (column), G5-G9 (row), G9-D9 (column), and the closing segment D9-E7 in box 6 which is an imperfect triplet containing a single guardian. The guardian prevents the deadly loop and is forced true.

## Type 2 — Double Guardians (digit 7)

Loop with two imperfect connections: H3-H9 (row imperfect) and H3-G2 (box imperfect). Guardians G1 and H7. Both guardians see cell G7, so 7 is removed from G7.

## Type 3 — Disruptive Guardians (digit 1)

Loop with imperfect connections B4-G4 (column imperfect) and G4-G7 (row imperfect). Guardians C4 and G6. Candidate 1 is removed from G4, a cell that is part of the loop itself (legitimate per Rule 3).

## Relationship to Other Strategies

Type 1 cases are often simpler via Simple Colouring; some Type 2/3 patterns via Multi-Colouring. As of March 2010, Guardians was deprecated as "a complicated way of looking at what is ultimately a nice loop with off-chain eliminations," replaced by X-Cycles analysis.
