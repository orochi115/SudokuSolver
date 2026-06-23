---
id: technique.msls
name_en: Multi-Sector Locked Sets
name_zh: MSLS / 多扇区数组
family: exotic
difficulty: extreme
sources:
  - ENJOYSUDOKU-MSLS
---

# MSLS / 多扇区数组

## One-Sentence Rule

Choose a digit subset and a collection of "sector" houses (rows, columns, boxes) whose truths (cells that must be filled by the subset) exactly balance the links (the houses that can supply them) at rank 0, so the loop's cells form one giant locked set and any candidate of the subset that would consume a supply without meeting a demand can be eliminated.

## Human Scan Procedure

1. Pick a small digit subset D (e.g. 1 2 4 7) that recurs across a symmetric region of the grid.
2. Choose base sets (truths): the rows/columns/cells that must each be filled by a digit of D — write them as e.g. `14r5 27r6 147r8 12r9`.
3. Choose cover sets (links): the crossing houses that can supply those digits — e.g. `56c3 36c5 89c8 38c9`.
4. Count: when the number of truths equals the number of links, the system is rank 0 — demands and supplies match exactly. Treat each loop cell as either a demand or a supply.
5. The matched cells are now a locked multi-sector set: digits of D are simultaneously squeezed *out* of some cells (hidden behaviour) and excluded *from* others (naked behaviour).
6. Eliminate every candidate that would reduce a supply without satisfying a demand — i.e. all non-D candidates in truth cells, and all D candidates seeing the cover that lie outside the set.

## Formula Role

The general rank-0 set-logic pattern that subsumes simple/multi fish, naked/hidden sets, Sue de Coq, and SK-Loops (which are its first-discovered, "virus-pattern" special case). It is powerful but hard to scan unaided; in a human workflow it sits at the extreme tier after AIC and ALS, used to break the band/stack-symmetric bottlenecks of the very hardest puzzles. The disciplined truth/link count is what distinguishes it from guess-driven last-resort methods.

## Sources

ENJOYSUDOKU-MSLS
