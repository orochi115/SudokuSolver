# Fireworks Strategy in Sudoku

Source: https://www.sudokuwiki.org/Fireworks (SudokuWiki.org, Andrew Stuart)
Mirror fetched: 2026-06-23. Author site retains copyright; mirrored here for offline research reference only.

## Introduction

Fireworks is a relatively new pattern discovered by **shye** in November 2021 and
discussed on the New Sudoku Players Forum (enjoysudoku). The pattern operates on a
fundamental principle about candidate placement within intersecting rows and columns.

## Basic Firework Pattern

The core concept is straightforward: "when a candidate in an intersecting row and
column is limited to the same box, it must be placed in the intersecting cell."

Consider a row and column intersection within a box. For any candidate (like the
number 9), there are three possible locations forming an L:

- Cell **X** at the intersection (row meets column inside the box)
- Cell **Y** in the same row but in the rest of the box
- Cell **Z** in the same column but in the rest of the box

For the candidate to qualify, that digit must be confined within the box to the row
line at Y (plus X) and within the box to the column line at Z (plus X) — i.e. the
candidate appears in at most these positions inside the box. The candidate must then
appear at least once among the three cells X, Y, Z.

A single firework provides limited elimination opportunities in classic Sudoku since
there is no common cell seen by all three positions. (In Sudoku-X the diagonals can
supply a common peer, so even a single firework can eliminate.)

The pattern becomes powerful when **multiple candidates** share the same intersection.
When candidates 8 and 9 both exhibit this firework pattern at the same intersection,
they create a weak link between those numbers at cell X, obligating at least one of
cells Y or Z to contain either 8 or 9. This connection can be incorporated into
advanced inference chains (AIC).

## Triple Firework

When three candidates display the same firework pattern across three cells, they form
a **Locked Set**. With three candidates appearing in three cells and each candidate
requiring at least one position among those cells, all other candidates can be safely
removed from those three cells — behaving like a hidden triple, but with the cells
distributed in an L across a box+row+column rather than sharing one house.

The identifying feature is the absence of the three firework candidates elsewhere on
the row/column lines that define the L (the "blue shaded" regions where these digits
cannot appear).

**Triple Firework Example Eliminations:**
For cells [F1 | F4 | C4] forming locked set {3/7/8}, candidates 4/5/6 can be removed
from C4.

Among 45,000 difficult puzzles tested, approximately 300 triple fireworks were found —
comparable in frequency to naked quads.

## Quadruple Firework

A quadruple firework is two overlapping double fireworks aligning on four cells. This
variant is exceptionally rare. Example:

- Intersection cell J1 contains {1,2}
- Intersection cell D6 contains {3,4}
- Wing cells D1 and J6 contain all four candidates {1,2,3,4}

The intersection cells retain only their firework candidates, while the wing cells
preserve the complete set — a hidden quad distributed across the L pattern.

## Practice / Frequency

Seven exemplar puzzles requiring fireworks were catalogued with difficulty scores
ranging from 6.7 to 7.7 (puzzles discovered by Klaus Brenner).
