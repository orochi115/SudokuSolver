---
id: technique.wxyz-wing
name_en: WXYZ-Wing / VWXYZ-Wing (Wing Size-Ladder)
name_zh: WXYZ翼 / VWXYZ翼（翼阶梯）
family: wings
difficulty: diabolical
strategyId: wxyz-wing, vwxyz-wing
sources:
  - SUDOKUWIKI-WXYZ-WING
  - HODOKU-WINGS
---

# WXYZ-Wing / VWXYZ-Wing — 翼类技巧的尺寸阶梯

## One-Sentence Rule

A WXYZ-Wing is 4 cells holding exactly 4 digits, confined to two houses, with exactly
one *non-restricted* common digit `Z`; since one of those `Z`s must be true, any cell
seeing every `Z` in the four cells cannot be `Z` (the size-`N` wing generalises this to
`N` cells / `N` digits / `N-1` pincers).

## 精确模式定义

### The size-ladder (general bent-set wing)
A size-`N` wing is a **bent N-cell, N-candidate Almost Locked Set**: `N` cells whose
union of candidates is exactly `N` digits, where the cells are restricted to **exactly
two houses** (a box + a line). Of the `N` digits, exactly one is *non-restricted*; that
digit is `Z` and drives the eliminations. The ladder:

| Name        | Cells | Digits | Pincers | A.k.a.       |
|-------------|-------|--------|---------|--------------|
| XY-Wing     | 3     | 3      | 2       | (Y-Wing)     |
| XYZ-Wing    | 3     | 3      | 2       | Bent Triple  |
| WXYZ-Wing   | 4     | 4      | 3       | Bent Quad    |
| VWXYZ-Wing  | 5     | 5      | 4       | Bent Quint   |
| (size `N`)  | `N`   | `N`    | `N-1`   | Bent `N`-set |

### Restricted vs non-restricted common digit
- **Restricted digit** `D`: *all* instances of `D` inside the pattern see each other
  (share a row, column, or box) — they are locked to one house.
- **Non-restricted digit** `Z`: at least one instance of `Z` in the pattern does NOT see
  at least one other `Z` in the pattern. A valid WXYZ-Wing has **exactly one** such `Z`.

### WXYZ-Wing (size 4) — two equivalent formulations
- **Type 1 (hinge form)**: a hinge cell containing some of `{W,X,Y,Z}` plus three outlier
  cells; in the narrowest case the hinge = `{W,X,Y,Z}` and the outliers are `wZ`,`xZ`,`yZ`
  (each carrying `Z`). General Type 1: any 4 cells / 4 digits in two houses with exactly
  one non-restricted digit `Z`. `Z` may live in 4, 3, or only 2 of the cells.
- **Type 2**: two cells in the same box AND same line (together holding 4 digits — the
  "hinge", not necessarily each holding all four) plus two cells that cannot see each
  other holding two of the four each, one in the hinge's box and one elsewhere on the
  line. Here **all four digits are restricted**.

## 触发判定

### General (Type 1) predicate
Pick 4 cells `C={c1,c2,c3,c4}` confined to one box and one line, with
`|⋃ cand(C)| = 4 = {W,X,Y,Z}`. For each digit `d`, let `restricted(d)` ⇔ every cell of
`C` containing `d` pairwise-sees. The pattern is valid iff exactly one digit `Z` has
`¬restricted(Z)`. **Fires** iff `∃ T ∉ C` with `Z∈cand(T)` ∧ `T` sees **every** cell of
`C` that contains `Z`.

### Type 2 predicate
Hinge = two cells `h1,h2` sharing a box and a line with `cand(h1)∪cand(h2)={W,X,Y,Z}`.
Wings `a` (in hinge box) and `b` (elsewhere on the line) with `¬sees(a,b)`, each bivalue
⊂ `{W,X,Y,Z}`. **Fires** iff some outside cell sees all occurrences of one of the four
(now restricted) digits in the pattern.

## 消除/落子规则（全部情形）

- **Type 1**: remove `Z` from every cell `T ∉ C` that sees **all** occurrences of `Z`
  within the four pattern cells. (When `Z` is present in only 2–3 of the 4 cells the
  target set is *larger*, because fewer `Z`s must be "seen".)
- **Type 2**: for every digit `d∈{W,X,Y,Z}`, remove `d` from every outside cell that
  sees all occurrences of `d` in the pattern. Concretely (per source): the `XZ`-type
  digits eliminate elsewhere on the line; the `WY`-type digits eliminate in the rest of
  the hinge box — multiple simultaneous eliminations are typical.
- **Size `N` (general)**: identical to Type 1 with `N` cells/`N` digits and one
  non-restricted `Z`: remove `Z` from cells seeing every `Z` in the `N`-set.

## 退化与边界

- If all `N` digits are restricted, the cells form a **Naked Subset** in one house
  (not a wing). A wing is *bent* (spans two houses).
- WXYZ-Wing with `Z` in all four cells and the hinge bivalue-rich is the narrow classic;
  WXYZ-Wing with the hinge missing `Z` (Type 2 / general Type 1) is still valid.
- Two non-restricted digits ⇒ not a (single-Z) wing; may instead be a doubly-linked ALS.
- Larger `N` is increasingly rare and increasingly subsumed by ALS-XZ / AIC; sudokuwiki
  notes the general WXYZ definition raised detections from 299 → 8313 on Ruud's 50k set.

## 与其他技巧的关系

- **WXYZ-Wing is a 4-cell Almost Locked Set elimination**; the whole ladder is the
  "single non-restricted candidate" special case of **ALS-XZ** (see `../09-als/als.md`).
- **XYZ-Wing is the 3-cell rung** of this ladder (see `xy-xyz-w-wings.md`); WXYZ adds one
  cell + one digit, VWXYZ adds another, etc.
- Member of the **Bent Sets** family; the minimal 2-cell/2-digit bent set is the Almost
  Locked Pair (see `bent-sets.md`).
- Every wing is expressible as a short AIC / cell-forcing chain.

## Worked example

### WXYZ-Wing Type 1, classic (source — cite `SUDOKUWIKI-WXYZ-WING`, Example 1, "From the Start")
`000004700500370060230000004700030840000401000084060003300000059070093002006200000`
- Hinge `D3`={1,2,5,9} (all four digits); outliers `D4`,`D6`,`F1`, each carrying `Z=9`.
- Restricted: `1` (both in box), `2` (same row), `5` (same row). Non-restricted: `9`
  (the 9 in `F1` cannot see the 9s in `D4`/`D6`).
- Elimination: **9 removed from D2** (D2 sees every 9 in the pattern).

### WXYZ-Wing Type 1, Z in 3 cells (source — cite `SUDOKUWIKI-WXYZ-WING`, Example 2, "From the Start")
`802003709000104000500000004008000405020307060107000200300000001000901000209800307`
- Four cells `{D6,E5,G6,J6}` total `{2,5,6,9}`; non-restricted `Z=5` (hinge `D6` lacks 5).
- Eliminations: **5 removed from F6, G5, J5**.

### WXYZ-Wing Type 1, Z in only 2 cells (source — cite `SUDOKUWIKI-WXYZ-WING`, Example 3, "From the Start")
`010000003608000207003900500000604010030050020040302000001007600305000109200000030`
- Four cells `{C1,B2,C8,C3}` total `{3,4,5,9}`; non-restricted `Z=3` (present in just the
  two pincers). Source reading: C1=4 ⇒ C8={3,5}, then C8+C3+B2 act as a Y-Wing on 3.
- Eliminations: **3 removed from B7, B8, B9**.

## Soundness

The hinge/ALS argument: the four cells span exactly 4 digits. The restricted digits are
each locked to a single house within the pattern, so they cannot all vacate the four
cells — equivalently, treating the 4 cells as an Almost Locked Set, fixing the lone
non-restricted digit `Z` outside the set would empty the set of a digit it cannot
relinquish. Formally: assume target `T=Z`. Then `Z` is removed from every pattern cell it
sees — by construction `T` sees them all, so the 4 cells lose `Z` entirely and now hold
only the 3 restricted digits among 4 cells. But each restricted digit is confined to one
house, so 4 cells cannot accommodate 3 digits without two cells sharing a digit-house
illegally (pigeonhole on a Locked Set) — contradiction. Hence `T≠Z`. Type 2 is the same
argument per restricted digit, with the bent hinge guaranteeing one of the two endpoints
carries each eliminated digit. ∎

## Sources

SUDOKUWIKI-WXYZ-WING, HODOKU-WINGS
