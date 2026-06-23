---
id: technique.sk-loop
name_en: SK-Loop
name_zh: SK-Loop / 多米诺环
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-SK-LOOP
---

# SK-Loop / 多米诺环

## One-Sentence Rule

A bi-directional continuous loop of eight strongly-linked pairs threaded through four boxes (two bands x two stacks) — one link per box, per participating row and per participating column — locks the sixteen cells of the loop into a single solved set, so every loop candidate appearing outside the loop along its aligned units can be eliminated.

## Human Scan Procedure

1. Pick four boxes forming a rectangle (two bands and two stacks); in each box the cell where the chosen row-cells and column-cells intersect must be a given.
2. In each box, identify the two-cell "mini-row" link and the two-cell "mini-column" link; of the two cells in a row- or column-link, one may be solved but neither is a given.
3. Confirm the outer links: two boxes sharing a band (or stack) hold a candidate pair in common, and the inner mini-row/mini-column links share two further candidates not used by the outer links.
4. Count the links: single, double, or triple links are allowed so long as the eight links together use all 16 cells' candidates and their sizes sum to ≤ 16 (the classic Easter Monster form is eight hidden pairs = 16).
5. Trace the loop in either direction as alternating strong links (e.g. `(27=38)B13- (38=16)B79- ...`); because it closes, the membership is locked.
6. Eliminate: outer-link candidates are removed from the rest of their shared row/column outside the pivots; inner-link candidates are removed from the rest of their box outside the mini-row/mini-column.

## Formula Role

A rare, extreme-tier exotic discovered while cracking the "Easter Monster." It is the special, easily-recognised case of an MSLS (every SK-Loop implies an MSLS) and is best attempted only after AIC, ALS, and simpler exotics stall on a band/stack-symmetric puzzle. Its rigid rectangle-of-givens template makes it scannable by hand where the general MSLS is not.

## Sources

SUDOKUWIKI-SK-LOOP
