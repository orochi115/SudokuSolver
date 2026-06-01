---
id: technique.naked-hidden-subsets
name_en: Naked and Hidden Subsets
name_zh: 显性/隐性数组
family: subsets
difficulty: basic-medium
sources:
  - HODOKU-NAKED
  - HODOKU-HIDDEN
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Naked and Hidden Subsets / 显性与隐性数组

## One-Sentence Rule

If N cells hold only N digits, remove those digits elsewhere; if N digits appear only in N cells, remove other digits from those cells.

## Naked Subset

N cells in one house contain exactly N candidate digits in total.

Eliminate those N digits from all other cells in the house.

## Hidden Subset

N digits in one house appear only in N cells.

Eliminate all non-subset digits from those N cells.

## Human Scan Procedure

1. Search pairs before triples before quads.
2. For naked subsets, scan candidate strings in cells.
3. For hidden subsets, scan positions of digits in a house.
4. Remember that hidden and naked subsets often appear as complements.

## Sources

HODOKU-NAKED, HODOKU-HIDDEN, SUDOPEDIA-SOLVING-TECHNIQUE
