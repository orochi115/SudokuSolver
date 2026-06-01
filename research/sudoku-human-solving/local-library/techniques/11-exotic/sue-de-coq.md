---
id: technique.sue-de-coq
name_en: Sue de Coq
name_zh: Sue de Coq / 双区域不交数组
family: exotic
difficulty: extreme
sources:
  - HODOKU-MISC
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Sue de Coq / 双区域不交数组

## One-Sentence Rule

At a line-box intersection, candidate sets can be partitioned into overlapping locked subsets that eliminate candidates from the line and box.

## Human Scan Procedure

1. Inspect intersections of a row/column with a box.
2. Find two or three intersection cells with extra candidates.
3. Find supporting cells in the line and box whose candidates partition those extras.
4. Remove line-side candidates from the rest of the line and box-side candidates from the rest of the box.

## Formula Role

Sue de Coq is a subset-counting technique. It is useful but specialized; it should appear after common ALS/AIC techniques in a practical workflow.

## Sources

HODOKU-MISC, SUDOPEDIA-SOLVING-TECHNIQUE
