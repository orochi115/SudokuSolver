---
id: technique.aligned-exclusion
name_en: Aligned Pair/Triple Exclusion
name_zh: 对齐数对/三数排除 (APE/ATE)
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-APE
---

# Aligned Pair/Triple Exclusion (APE/ATE)

## One-Sentence Rule

Two (or three) cells that share a set of commonly-seen cells cannot take any
candidate combination that would empty one of those common cells (an Almost
Locked Set), so any digit appearing only in such forbidden combinations is
eliminated from the base cells.

## Human Scan Procedure

1. Pick a *base pair* of cells — ideally aligned (they see each other), which
   also forbids them from sharing a value.
2. Find cells/ALSs that BOTH base cells see completely. The simplest is a
   bi-value buddy cell; 2-cell and 3-cell ALSs also work.
3. List every candidate combination the base pair could hold.
4. Cross off ("exclude") each combination that would leave a commonly-seen ALS
   with no candidate left, plus any combination repeating a value in an aligned
   pair.
5. If a digit in one base cell survives in no allowed combination, eliminate it.

## Variants (APE vs ATE)

- **APE** — base of two cells. Type 1: the cells see each other (aligned).
  Type 2: they do not see each other, so identical candidates are possible in
  both, slightly changing the bookkeeping.
- **ATE** — base of three cells; enumerate all 3-candidate combinations and
  exclude any that empties a commonly-seen cell. Far more laborious, which is
  why both techniques are rare in manual solving.

## Formula Role

A subset-counting / ALS-interaction technique. It overlaps heavily with ALS and
AIC eliminations, so in a practical workflow it should sit very late — after
common ALS/AIC methods and Sue de Coq — as an "extreme" fallback rather than a
routine scan.

## Sources

SUDOKUWIKI-APE
