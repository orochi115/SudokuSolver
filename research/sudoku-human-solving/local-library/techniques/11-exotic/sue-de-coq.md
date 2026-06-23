---
id: technique.sue-de-coq
strategyId: sue-de-coq
name_en: Sue de Coq
name_zh: Sue de Coq / 双区域不交数组
family: exotic
difficulty: extreme
sources:
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Sue de Coq / 双区域不交数组

## One-Sentence Rule

At a box-line intersection, the intersection candidates split into two disjoint
locked sets — one anchored to the rest of the line, one anchored to the rest of
the box — so that line-side digits clear the line and box-side digits clear the
box.

## 精确模式定义

Let `B` be a box and `L` a row or column. Let `C` = the set of *unsolved* cells
in the intersection `B ∩ L` (the up-to-three cells shared by the box and the
line). Let `V` = the union of candidates over the cells of `C`.

- `C` (intersection cells): `|C| ≥ 2`. At most two of these cells may serve as
  the true intersection set; a third intersection cell, if present, must be
  reassigned to the line group or the box group (see below).
- `V` (intersection candidates): `|V| ≥ |C| + 2`. The "`+2`" surplus is the
  whole engine — two more candidate values than there are intersection cells.
- `CL` (line cells): cells in `L \ C` (same line, outside the intersection)
  chosen to host part of the surplus. Their candidate union is `VL`.
- `CB` (box cells): cells in `B \ C` (same box, outside the intersection)
  chosen to host the other part. Their candidate union is `VB`.
- **Disjointness condition**: no value of `V` may appear in *both* `VL` and
  `VB`. (`VL ∩ VB ∩ V = ∅` for intersection-drawn values.)
- `n` = number of candidates in `VL ∪ VB` that are *not* drawn from `V`
  (extension candidates). Standard (basic) SdC has `n = 0`.

Cardinality / cell budget: the construction requires `|CL| + |CB| = |V| − |C| +
n` cells outside the intersection, with at least one cell in each of `CL` and
`CB`, and with at least `|V| − |C|` of their candidates drawn from `V`.

Basic templates (the two hand-scannable forms):
- **2-cell / 4-candidate**: `|C| = 2`, `|V| = 4`; `CL` = one bivalue line cell,
  `CB` = one bivalue box cell, their candidates partitioning two of the four `V`
  values, disjoint from each other.
- **3-cell / 5-candidate**: `|C| = 3`, `|V| = 5`; `CL` and `CB` each one bivalue
  cell drawing two disjoint values from `V`; one `V` value stays locked inside
  `C`.

## 触发判定

A Sue de Coq fires iff a partition `(C, CL, CB)` exists with:

```
|C| >= 2
V = union(cand(c) for c in C)
|V| >= |C| + 2
CL ⊆ cells(L) \ C,  CB ⊆ cells(B) \ C,  CL ≠ ∅,  CB ≠ ∅
VL = union(cand(c) for c in CL);  VB = union(cand(c) for c in CB)
(VL ∩ VB ∩ V) = ∅                       # disjoint over intersection values
n = |(VL ∪ VB) \ V|                      # extension candidates
|CL| + |CB| = |V| - |C| + n
|(VL ∪ VB) ∩ V| >= |V| - |C|             # enough V-values covered outside C
# and CL, CB are themselves saturated: each cell's every candidate is used
```

In practice the scanner enumerates intersections, then for each searches the
line and box for bivalue (or, for extensions, larger) cells whose candidates are
drawn from `V` and are mutually disjoint, until the cell budget balances.

## 消除/落子规则（全部情形）

By the formal Two-Sector Disjoint Subsets result, `C` must hold `V \ (VB ∪ VL)`
(possibly empty), exactly `|VB| − |CB|` elements of `VB`, and exactly
`|VL| − |CL|` elements of `VL`. The eliminations:

1. **Box side** — remove every candidate of `VB ∪ (V \ VL)` from
   `B \ (C ∪ CB)`: i.e. the box-group digits, plus any intersection value not
   carried by the line group, vanish from the rest of the box.
2. **Line side** — remove every candidate of `VL ∪ (V \ VB)` from
   `L \ (C ∪ CL)`: the line-group digits, plus any intersection value not
   carried by the box group, vanish from the rest of the line.
3. **Locked-inside case** (e.g. 3/5 form) — an intersection value not taken by
   either `CL` or `CB` is locked inside `C`; it is therefore eliminated from
   *both* the rest of the box and the rest of the line.
4. **Extension case** (`n > 0`) — the same value may legitimately appear in both
   `CL` and `CB` if it is *not* drawn from `V`; it then eliminates from both the
   rest of the line and the rest of the box where it sees the relevant set.

## 退化与边界

- `|V| = |C| + 1` is **not** SdC — only one surplus value, which collapses to a
  plain Pointing/Claiming (Locked Candidates) interaction.
- If a candidate in `V` appears outside `C` in *both* the line and the box, no
  disjoint partition exists; the pattern fails.
- Only two intersection cells may form `C`; a present third intersection cell
  must be folded into `CL` or `CB` — it is never simultaneously in `C`.
- An extension value used in both `CL` and `CB` must lie outside `V` (rule of
  shared extension digit); a shared *intersection* value breaks disjointness.
- Degenerates to a Naked Pair/Triple when `CL` or `CB` lies entirely inside one
  house with `C`.

## 与其他技巧的关系

- SdC is a special case of **Subset Counting** and is subsumed by **ALS-XZ /
  ALS chains**: `C ∪ CL` and `C ∪ CB` are two Almost Locked Sets sharing the
  restricted-common digits of `C`.
- **Basic vs extension**: the basic 2/4 and 3/5 forms have `n = 0`; extension
  types add cells for either extra intersection candidates or extra
  non-`V` candidates in the wings.
- It is the line-box-localised cousin of **MSLS** (both are rank-balanced
  set-logic) and overlaps with **APE/ATE** when the base pair sits in the
  intersection.

## Worked example

Basic 2-cell / 4-candidate (from the SUDOPEDIA / HoDoKu sdc01 layout, candidate
fragment; full-grid digits flagged needs engine verification):

- Intersection `C = r7c1, r7c3` with `V = {3,4,5,9}` (`|C|=2`, `|V|=4`, surplus 2).
- Line cell `CL = r7c7 = {4,5}` (drawn from `V`).
- Box cell `CB = r8c3 = {3,9}` (drawn from `V`, disjoint from `VL`).
- Partition: `{4,5}` locked into the row group `(r7c1, r7c3, r7c7)`; `{3,9}`
  locked into the box group `(r7c1, r7c3, r8c3)`.

Eliminations:
- Line side: remove **4 and 5** from the rest of row 7 (every cell of r7 except
  r7c1, r7c3, r7c7).
- Box side: remove **3 and 9** from the rest of box 7 (every cell of box 7
  except r7c1, r7c3, r8c3).

3-cell / 5-candidate locked-inside case (HoDoKu sdc02 layout):
- `C = r7c9, r8c9, r9c9`, `V = {2,4,5,6,7}` (`|C|=3`, `|V|=5`).
- `CL = r2c9 = {5,6}`, `CB = r9c7 = {2,7}`.
- Then `4 = V \ (VL ∪ VB)` is locked inside `C` → remove **4** from the rest of
  column 9 *and* the rest of box 9; remove **5,6** from the rest of column 9 and
  **2,7** from the rest of box 9.

> Both worked grids are reconstructed from the source's candidate description;
> the surrounding 81-char digit grid **needs engine verification**.

## Soundness

Each of `C ∪ CL` and `C ∪ CB` is an Almost Locked Set: `|cells| = |candidates| −
1`. The disjointness of `VL` and `VB` over `V` forces the two ALSs to take
*complementary* slices of `V` inside `C`. Hence every box-group digit is truly
locked into `C ∪ CB` (a box-only set) and every line-group digit into `C ∪ CL`
(a line-only set); a copy of such a digit elsewhere in that house would leave one
ALS short a digit, an impossibility. The locked-inside value, claimed by neither
wing, must occupy `C`, so it cannot appear elsewhere in either house.

## Sources

SUDOPEDIA-SOLVING-TECHNIQUE
