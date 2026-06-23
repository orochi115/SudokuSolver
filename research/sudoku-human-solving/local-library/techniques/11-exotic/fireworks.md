---
id: technique.fireworks
name_en: Fireworks
name_zh: Fireworks / 烟花
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-FIREWORKS
---

# Fireworks / 烟花

## One-Sentence Rule

In an L of three cells — an intersection cell X (where a row and column cross inside a box) plus the row's other in-box cell Y and the column's other in-box cell Z — any digit confined within the box to those positions must appear at least once among X, Y, Z; when two, three, or four digits share the same L, the resulting weak link / locked set promotes to a (double) firework, triple firework (hidden triple), or quad firework (hidden quad).

## Human Scan Procedure

1. Pick a box and one of its intersection cells X (a row/column crossing inside the box).
2. For a digit, check it is confined inside the box to X+Y (the row line) and to X+Z (the column line); then X/Y/Z is a single firework for that digit.
3. Find two or more digits sharing the same X (same row line and column line). Two digits give a weak link at X usable in AIC.
4. With three digits on three L-cells, treat them as a locked set: strip all non-firework candidates from those three cells (triple firework = distributed hidden triple).
5. With four digits across two aligned double fireworks, apply the hidden-quad eliminations: intersection cells keep only their own pair, wing cells keep all four.

## Formula Role

Fireworks is an exotic, rare locked-set/hidden-subset detector laid out across a box+row+column instead of a single house. Discovered by shye (Nov 2021, New Sudoku Players Forum); triple fireworks occur at roughly naked-quad frequency. Specialized — place it after standard subsets, fish, ALS, and AIC in a practical workflow.

## Sources

SUDOKUWIKI-FIREWORKS
