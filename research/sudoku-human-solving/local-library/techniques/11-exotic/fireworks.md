---
id: technique.fireworks
strategyId: fireworks
name_en: Fireworks
name_zh: Fireworks / 烟花
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-FIREWORKS
---

# Fireworks / 烟花

## One-Sentence Rule

For an L of three cells — intersection cell X (a row/column crossing inside a
box) plus the row's other in-box cell Y and the column's other in-box cell Z —
any digit confined within the box to {X,Y} on its row line and to {X,Z} on its
column line must occupy at least one of X, Y, Z; two such digits give a weak
link, three give a distributed hidden triple, four a distributed hidden quad.

## 精确模式定义

Fix a box `Bx`, a row `r` and a column `c` with `r,c` both passing through `Bx`.

- `X` = the single cell `r ∩ c` (the intersection cell, inside `Bx`).
- `Y` = the two cells of row `r` that lie in `Bx` other than `X` (the "row line"
  of the L, inside the box).
- `Z` = the two cells of column `c` that lie in `Bx` other than `X` (the "column
  line" of the L, inside the box).
- The L footprint is `{X} ∪ Y ∪ Z` (up to 5 cells). When `Y`,`Z` reduce to one
  cell each (the common firework drawing), the L is exactly 3 cells `{X, y, z}`.

A digit `d` is a **firework digit at X** iff, inside `Bx`:
- every candidate `d` in row `r ∩ Bx` lies in `{X} ∪ Y`, AND
- every candidate `d` in column `c ∩ Bx` lies in `{X} ∪ Z`, AND
- `d` does not appear in `Bx` outside `{X} ∪ Y ∪ Z`.

Equivalently `d` is confined within `Bx` to the L cells of `X`.

- **Single firework**: 1 firework digit at `X`.
- **Double firework**: 2 firework digits sharing the same `X` (same `r`, same
  `c`).
- **Triple firework**: 3 firework digits sharing the same L (3 cells).
- **Quad firework**: 4 firework digits across two overlapping double fireworks
  whose L's align on 4 cells (two intersection cells + two wing cells).

## 触发判定

```
for box Bx, for intersection cell X = r∩c in Bx:
  rowline  = (cells of r in Bx) \ {X}      # Y
  colline  = (cells of c in Bx) \ {X}      # Z
  L = {X} ∪ rowline ∪ colline
  FW(X) = { d : positions_of(d, r∩Bx) ⊆ {X}∪rowline
               and positions_of(d, c∩Bx) ⊆ {X}∪colline
               and d not in (Bx \ L) }
  single  : |FW(X)| >= 1
  double  : |FW(X)| >= 2
  triple  : exists 3 digits of FW(X) confined to a 3-cell L {X,y,z}
  quad    : two X's X1,X2 with FW pairs P1,P2, |P1∪P2|=4, L1∪L2 = 4 cells
```

## 消除/落子规则（全部情形）

1. **Single firework (classic Sudoku)**: no common peer of X,Y,Z exists, so no
   direct elimination — record `d ∈ {X,Y,Z}` as a fact for chaining. (In
   Sudoku-X a diagonal peer can yield an elimination.)
2. **Double firework**: two firework digits `{a,b}` at `X` create a *weak link*
   between `a` and `b` at `X` — at least one of `Y∪Z` holds `a` or `b`. Use as
   an AIC node; no standalone elimination.
3. **Triple firework (3 digits {a,b,c} on 3 cells {X,y,z})**: the three cells
   form a distributed hidden triple — **remove every candidate other than
   a,b,c** from each of `X, y, z`.
4. **Quad firework**: with intersection cells `X1={a,b}`, `X2={c,d}` and wing
   cells holding all of `{a,b,c,d}`:
   - intersection cells `X1, X2` keep only their own firework pair (`X1`→{a,b},
     `X2`→{c,d}; strip others);
   - wing cells keep the full `{a,b,c,d}` (strip all non-firework candidates).

## 退化与边界

- If a firework digit also appears in `Bx` outside the L, it is **not** confined
  → disqualified.
- A single firework in plain Sudoku produces **no elimination** (no shared
  peer); it is only useful in Sudoku-X or as a chaining premise.
- If `Y` or `Z` is already solved/empty of the digit, the L shrinks and the
  digit may collapse to a Pointing/Hidden-Single rather than a firework.
- Triple firework requires the three digits to share *exactly* a 3-cell L; if
  they spread over 4+ cells it is not a hidden triple.
- Quad firework requires the two doubles to be *aligned* on 4 cells; otherwise
  no hidden quad forms.

## 与其他技巧的关系

- A triple firework is a **hidden triple** whose cells are distributed across a
  box+row+column L instead of one house; a quad firework is the distributed
  **hidden quad**.
- A double firework is a **weak link / grouped strong-inference node** for
  **AIC** (the "at least one of Y∪Z" obligation).
- Discovered by **shye** (Nov 2021, New Sudoku Players Forum). Triple fireworks
  occur at roughly **naked-quad frequency** (~300 in 45,000 hard puzzles).
- Sits after standard subsets, fish, ALS, and AIC in a practical workflow.

## Worked example

Triple firework (from the SUDOKUWIKI Fireworks example, candidate fragment):

- Box, row F and columns 1 & 4 give the L cells `F1 | F4 | C4` with locked set
  `{3,7,8}` (each of 3,7,8 is a firework digit confined to this L).
- `F1` is the intersection cell; `F4` is the row wing; `C4` is the column wing.
- Source-stated elimination: candidates **4, 5, 6 are removed from C4** (and any
  non-{3,7,8} candidate from F1 and F4), leaving the distributed hidden triple.

Quad firework (from the SUDOKUWIKI example):
- Intersection `J1 = {1,2}`, intersection `D6 = {3,4}`, wing cells `D1` and `J6`
  each holding `{1,2,3,4}`.
- Keep `J1→{1,2}`, `D6→{3,4}`; strip all non-`{1,2,3,4}` from `D1` and `J6`.

> Grids are reconstructed from the source's candidate/cell description; the
> surrounding 81-char digit grid **needs engine verification**.

## Soundness

Confinement means: within the box, digit `d` can only be placed on the row line
`{X}∪Y` and on the column line `{X}∪Z`. If `d` is not at `X`, then it must be at
some `Y` cell (to satisfy the box on row `r`) *and* at some `Z` cell (to satisfy
the box on column `c`) — but those are different cells, consuming two box slots
for one digit, impossible unless `d` is at `X`, or `d` occupies one of `Y`/`Z`
while the other line is covered by `X` elsewhere. The net invariant is that `d`
occupies at least one of `{X,Y,Z}`. With `k` firework digits sharing `k` such
cells, the `k` cells are saturated by exactly the `k` digits — a hidden `k`-set
— so all foreign candidates clear, exactly as for an in-house hidden subset.

## Sources

SUDOKUWIKI-FIREWORKS
