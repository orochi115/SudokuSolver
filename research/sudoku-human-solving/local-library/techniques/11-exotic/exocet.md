---
id: technique.exocet
name_en: Exocet
name_zh: Exocet / 飞鱼导弹
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-EXOCET
---

# Exocet / 飞鱼导弹

## One-Sentence Rule

Two aligned base cells in one box share a set of 3 or 4 candidates, and two target cells in the same band (but different boxes/lines) are forced to hold exactly the two true base digits, so any candidate in a target that is not a base digit can be eliminated.

## Human Scan Procedure

1. Find two cells in a single box, aligned in one mini-line, whose combined candidates total exactly 3 or 4 digits — these are the Base cells (B).
2. Locate two Target cells (T), one in each of the other two boxes of the same tier/stack, that cannot see each other or the base cells.
3. Confirm the supporting S-cells (the six cells along the cross-lines descending from the targets) and that each base digit appears at most twice across the cover houses (Cover-Lines).
4. Check the Companion cells contain none of the base digits (not even as givens), so the targets are forced to absorb the true base digits.
5. Eliminate from each target every candidate that is not one of the base digits; apply the secondary rules (a base digit restricted to one cover house is false; a base digit forced true in the other target is false here).

## Variants

- Junior Exocet (JE): the standard, most common form — target cells lie in the same band as the base cells, giving the full set of inferences (mirror cells, S-cell links) above.
- Senior Exocet (SE): target cells may sit anywhere along the two cross-lines, not in the base band. The search is radically different and most Junior inferences are lost; included mainly for completeness and rarely usable by hand.

## Formula Role

A rare, last-resort-tier pattern reserved for the bottlenecks of extreme puzzles where simpler chains and ALS moves stall. It tackles 3–4 candidate sets at once. Place it after AIC/ALS and other exotics in any practical workflow; the Junior form is the only one realistically scanned by humans.

## Sources

SUDOKUWIKI-EXOCET
