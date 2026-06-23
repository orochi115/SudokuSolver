# Exocet - SudokuWiki.org

Source: https://www.sudokuwiki.org/Exocet
Copyright: Andrew Stuart @ Syndicated Puzzles, 2007-2026 (mirror for research/reference only)

## Overview

The Exocet (referred to as "jExocet", Junior Exocet) is an advanced Sudoku
solving technique used in extremely difficult puzzles with high candidate
density. It "takes on three or four candidate sets at a time which is just
what is needed in the bottlenecks of extreme puzzles."

Phil's concise description: "When 2 of the 3 cells in a box-line intersection
together contain 3 or 4 candidates, then in each of the two boxes in the same
band but in different lines, if there are cells with the same 3 or 4
candidates, any others can be removed."

## The Exocet Pattern

### Pattern Rule 1: Base Cells
Two Base cells (B) aligned within one box, containing three or four candidates
in total. Distributions such as {1,2,3,4}+{1,2,3,4}, {1,2,3}+{2,3,4}, or
{1,2,3}+{3,4} qualify.

### Pattern Rule 2: Target Cells
Two Target cells (T) together contain all base digits (plus any extras). The
Targets cannot see each other or the Base cells, and lie in the same Tier or
Stack (a row or column of three boxes).

Supporting structure:
- S-Cells: six cells outside the Tier, at the intersections of three
  Cross-Lines descending from the Targets.
- Companion Cells (C): one per Target.
- Mirror Cells (M): two per Target, beside the opposite Target.
- Escape Cells: hold candidates that prove false in the base.

### Pattern Rule 3: Companion Requirements
Companion Cells must not contain Base candidates, not even as given clues.

### Pattern Rule 4: Cover-Lines
Each base candidate appears at most twice among the S-Cells. Cover-Lines are
perpendicular to the Cross-Lines and mark where base candidates appear; a
candidate appearing twice in one column can be covered vertically.

## Pattern Inferences

- The two Target cells must contain different base digits.
- Mirror cells must contain the same base digits as their opposite Target
  cell, plus one digit that is false in the base cells.
- The two true base digits must each appear true in two S-cells.

## Elimination Rules

- Rule 1: Any candidate in a Target cell that is not one of the Base
  candidates can be removed.
- Rule 3: A base candidate restricted to only one S-cell cover house is
  invalid and is false in the base mini-line and target cells.
- Rule 4: A base digit in a target that must be true in the other target is
  false (a reduced target acts as a strong link).
- Rule 5: A base candidate that has a cross-line as an S-cell cover house must
  be false in the target cell in that cross-line.

## Junior vs. Senior Exocet

"Exocet" refers to any pattern with two targets holding two base digits found
in the base cells. The jExocet (Junior Exocet) is the most well known case:
its targets lie in the same band as the base cells. In a Senior Exocet (SE),
the target cells may lie anywhere along the two cross-lines (not in the base
band); the search is radically different and most Junior inferences are lost,
so it is rarely practical by hand.

## Historical Context

First discovered by Allan Barker in the "Fata Morgana" puzzle; named by
forum participant Champagne. David P Bird authored the JExocet Compendium,
the primary documentation for the technique.
