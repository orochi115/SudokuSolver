---
id: technique.locked-candidates
name_en: Locked Candidates
name_zh: 区块排除
family: intersections
difficulty: basic-medium
sources:
  - HODOKU-INTERSECTIONS
  - SUDOKUWIKI-FAMILIES
  - SUDOKUCOM-POINTING-PAIRS
---

# Locked Candidates / 区块排除

## One-Sentence Rule

If all candidates for a digit in one house are confined to the intersection with another house, eliminate that digit from the rest of the other house.

## Variants

- Pointing: candidates in a box are confined to one row/column, so remove from that row/column outside the box.
- Claiming: candidates in a row/column are confined to one box, so remove from the rest of that box.

## Human Scan Procedure

1. Pick one digit.
2. Inspect each box for candidates aligned in one row or column.
3. Inspect each row/column for candidates restricted to one box.
4. Remove outside candidates accordingly.

## Failure Conditions

- Candidate appears in multiple rows/columns inside the box.
- Candidate appears in multiple boxes along the line.

## Sources

HODOKU-INTERSECTIONS, SUDOKUWIKI-FAMILIES, SUDOKUCOM-POINTING-PAIRS
