---
id: technique.singles
name_en: Singles
name_zh: 唯一数
family: singles
difficulty: basic
sources:
  - HODOKU-SINGLES
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Singles / 唯一数

## One-Sentence Rule

If a cell has one candidate, or a digit has one possible location in a house, place it.

## Variants

- Full House: the last empty cell in a house.
- Naked Single: one candidate remains in a cell.
- Hidden Single: one digit has only one possible cell in a house.

## Human Scan Procedure

1. Scan houses with many solved cells for full houses.
2. Scan each digit through boxes using cross-hatching.
3. If candidates are marked, find cells with one mark.
4. After placing, update all peer candidates.

## Eliminations

A placement eliminates the same digit from all peers and may create new singles.

## Sources

HODOKU-SINGLES, SUDOPEDIA-SOLVING-TECHNIQUE
