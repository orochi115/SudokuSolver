---
id: technique.unique-rectangle-bug
name_en: Unique Rectangle / Hidden UR / BUG (Deadly-Pattern Family)
name_zh: 唯一矩形 / 隐性唯一矩形 / 全双值致死 (致死图案族)
family: uniqueness
difficulty: tough-extreme
strategyId: unique-rectangle-type1, unique-rectangle-type2, unique-rectangle-type3, unique-rectangle-type4, unique-rectangle-type5, unique-rectangle-type6, hidden-unique-rectangle, bug-plus-one, unique-loop
sources:
  - SUDOKUWIKI-UNIQUE-RECTANGLES
  - SUDOKUWIKI-BUG
  - HODOKU-UNIQUENESS
  - CHINESE-KAZUSA-UR
---

# Unique Rectangle / Hidden UR / BUG — 致死图案族

## One-Sentence Rule

Under the assumption that the puzzle has exactly one solution, any candidate placement
that would complete a *deadly pattern* — a set of unclued cells whose digits could be
swapped to give a second valid solution — must be false, so it can be eliminated.

## 精确模式定义

### The Deadly Pattern (UR core)
A **Unique Rectangle (UR)** is four cells occupying **exactly two rows, two columns, and
two boxes**, all of which *could* hold the same two digits `{a,b}` (the **UR digits**). If
those four cells ended up containing only `{a,b}` (an `a/b/b/a` arrangement), then `a`
and `b` could be interchanged within the two boxes to give a *second* solution — illegal
in a unique puzzle. The "two boxes" requirement is essential: if the four cells span
**four** boxes, swapping moves a digit into a different box and the two arrangements are
not interchangeable, so it is **not** deadly (SUDOKUWIKI "Noticing the Deadly Pattern").

Missing candidates (HoDoKu): a UR cell need not *currently* list both UR digits; it only
needs to be *able* to hold them (neither UR digit blocked by a given/peer). A UR digit
already eliminated earlier still counts as long as no given forbids it.

### Floor / roof terminology
The two cells with only `{a,b}` are the **floor**; the two cells carrying **extra**
candidates are the **roof**. UR types are classified by where the extra candidates sit
(one cell / two adjacent / two diagonal) and which inference cracks the rectangle.

### Extra candidates
- **Type 1**: extra candidates in exactly **one** corner.
- **Types 2/3/4/6**: extra candidates in **two non-diagonal (adjacent)** corners.
- **Type 5**: extra candidates in **two diagonal corners, or three** corners.
- **Hidden UR**: up to **three** corners carry arbitrary extra clutter.

### BUG (Bivalue Universal Grave)
A grid state where **every unsolved cell is bivalue** and **every candidate appears
exactly twice in every row, column, and box** is a deadly pattern (it has two solutions).
**BUG+1** is that state spoilt by exactly one cell carrying one extra candidate.

### Unique Loop / general deadly pattern
The 4-cell rectangle generalises: any even cycle of bivalue cells on digits `{a,b}` that
visits two-of-each in every house it touches is a deadly *loop* (Extended UR is the 6-cell
/ 3-digit case — see `extended-ur.md`).

## 触发判定

1. Find four cells in exactly **2 rows ∩ 2 columns ∩ 2 boxes** that can all hold the same
   two digits `{a,b}` (allow missing candidates if no given blocks them).
2. Classify by the extra-candidate footprint (one corner / two adjacent / two diagonal /
   three corners) — this selects the type.
3. For **BUG**: confirm all unsolved cells are bivalue and every digit is exactly twice in
   each house; locate the single tri-value cell (BUG+1).

## 消除/落子规则（全部情形）

### Type 1 — extra candidates in one corner
That one corner is the only escape from the deadly pattern, so one of its extra
candidates must be true. **Eliminate both UR digits `a,b` from that corner.** If only one
extra candidate remains, it is a placement. (HoDoKu u1; SUDOKUWIKI Fig 2: 2/9 floor in
three cells, orange corner D1={1,2,5,9} ⇒ remove 2,9 from D1.)

### Type 2 — extra candidate in two adjacent corners (same single extra digit `c`)
One of the two roof cells must be `c` (else they collapse to `{a,b}` and the pattern is
deadly). **Eliminate `c` from every cell that sees *both* roof cells** (their shared row
or column, and their shared box if any). Variants by geometry:
- **Type 2 / 2A**: roof cells share a box ⇒ eliminate `c` in that box *and* the shared
  line.
- **Type 2B**: each box holds one floor + one roof cell ⇒ roof cells share only a line ⇒
  eliminate `c` along that line only.
- **Type 2C / 2D** (SUDOKUWIKI; HoDoKu folds 2C into Type 5): the extra `c` sits in two
  *diagonal* corners — eliminate `c` from cells seeing both; if the lone extra digits
  occur in only one cell outside the rectangle, that cell becomes a naked single on them.

### Type 3 — extra candidates form a locked set with an outside cell
Treat the two roof cells as a single **pseudo-cell** holding only their extra candidates
`{c,d,…}`. If outside cells in a shared house combine with that pseudo-cell to form a
**naked subset** (pair/triple/quad) on those extra digits, **eliminate the subset's
digits from all other cells in that house** (outside the subset). The roof cells may share
a line (Type 3) or a box (Type 3b); the locked set may be a pair, triple, or quad
(SUDOKUWIKI Type 3/3b with triple pseudo-cells; HoDoKu u3).

### Type 4 — conjugate pair on a UR digit through the roof
Roof cells share a house. If **one UR digit (say `a`) is confined to the two roof cells**
within a house that contains both of them (a conjugate pair / locked candidate on `a`),
then `a` must occupy one roof cell — so placing the *other* UR digit `b` in either roof
cell would force the deadly pattern. **Eliminate the other UR digit `b` from both roof
cells.**
- **Type 4**: roof cells share a box ⇒ test conjugacy in both their row/column and box.
- **Type 4B**: roof cells (floor not in same box) share only a line ⇒ test that line only.

### Type 5 — extra single digit `c` in two diagonal or three corners
Same logic as Type 2 but with the extra digit in a diagonal/triple footprint. `c` must
appear in one of those cells. **Eliminate `c` from every cell that sees all the
extra-candidate corners.** SUDOKUWIKI's "Type 5" also covers the *single-strong-link*
diagonal-naked-pair variant: a rectangle across two boxes with two opposite corners
bivalue `{a,b}`, where one digit `a` is strongly linked from a corner to an adjacent
corner ⇒ **remove `a` from the opposite (mid/pivot) bivalue corner** (placing `a` there
forces the deadly swap). HoDoKu's "Type 6" = SUDOKUWIKI's "Type 5" (different digit
removed, same result).

### Type 6 — X-Wing on a UR digit through diagonal extras
Extra candidates in **two diagonal** corners. If **one UR digit `a` appears only inside
the two rows and two columns of the rectangle** (i.e. `a` forms an X-Wing on the four UR
cells), then placing `a` in a diagonal extra-corner would force `a` into its partner too,
forcing the deadly pattern. **Eliminate `a` from both diagonal extra-candidate corners**
(two placements). Every Type 6 is accompanied by a pair of Hidden Rectangles giving the
same result (HoDoKu u6).

### Hidden Unique Rectangle (HUR)
Allow two or three corners to carry arbitrary extra clutter. Pick a UR corner **without**
extra candidates as the start; look at the **row and column of the diagonally opposite
corner**. If **one UR digit `a` appears nowhere outside the UR in those two houses**, then
**eliminate the *other* UR digit `b` from the diagonally opposite corner**. (HoDoKu hr:
both houses through the opposite corner act as conjugate pairs on `a`, forcing the
opposite corner to `a` whenever it is not `a` elsewhere — either way `b` is excluded.)

### BUG+1
The single cell with three candidates must take the digit that, in the otherwise-bivalue
grid, would appear a **third** time in its row, *column*, and box (the "odd" digit). **Place
that digit** in the BUG cell (equivalently eliminate the other two). All alternatives leave
the bivalue graveyard with two solutions (SUDOKUWIKI BUG; HoDoKu bug1).

### Unique Loop / general deadly pattern
For an even bivalue loop on `{a,b}` that is two-of-each in every house it meets, the
same Type-1…4 inferences apply with "the loop" replacing "the rectangle": a single extra
candidate on the loop ⇒ remove `a,b` there; etc.

## 退化与边界

- **Four boxes, not two** ⇒ not a deadly pattern (digits land in different boxes).
- **A given (clue) at any corner** ⇒ the swap is impossible ⇒ no UR (this is exactly the
  premise the *Avoidable* Rectangle exploits — see `avoidable-rectangle.md`).
- **Three corners resolved**: a UR stays "alive"; the fourth corner must avoid the digit
  diagonally opposite (per SUDOKUWIKI comment by martin).
- **BUG false positives**: BUG requires *both* all-bivalue *and* every-digit-twice-per-house;
  an all-bivalue grid where some digit appears three times in a house is **not** a BUG. In
  Sudoku-X the diagonals add constraints that can void an apparent BUG.
- Type 5 (single strong link) and Type 6 partially overlap with Hidden UR; HoDoKu Type 6 ≡
  SUDOKUWIKI Type 5 ≡ two coincident HUR Type 1s.

## 与其他技巧的关系

- **Hidden UR ↔ UR Type 6**: every Type 6 is two Hidden Rectangles at the same site; both
  yield the same placement. SUDOKUWIKI's "Type 5" is HoDoKu's "Type 6".
- **Type 3 ↔ Naked/Hidden Subsets**: Type 3 is literally a UR pseudo-cell completing a
  Locked Subset (`../03-subsets/`).
- **Avoidable Rectangle** is the same deadly pattern read backwards, using *solved* (not
  given) cells (`avoidable-rectangle.md`).
- **BUG generalises the UR**: a UR is the smallest BUG-like deadly pattern; BUG is the
  whole-grid version. Every BUG is reportedly crackable by an XY-Chain (`../08-chains-aic/`).
- **Extended UR** is the 2×3 / 3-digit deadly pattern (`extended-ur.md`); **Unique Loops**
  generalise to arbitrary even bivalue cycles.
- **Gurth's Symmetrical Placement** is a different uniqueness consequence (symmetry, not
  rectangles) — `gurth.md`.

## Worked example

### UR Type 1 (source — cite `SUDOKUWIKI-UNIQUE-RECTANGLES`, Fig 2, "From the Start")
`006324800850090000000700000004007680300000007067400300000003000000040021008259700`
- Floor 2/9 in three cells of rectangle DF/columns 1&9 (rows D,F); orange corner
  D1 = {1,2,5,9}. Three yellow cells already reduced to {2,9}.
- Elimination: **remove 2 and 9 from D1** (it must be 1 or 5), avoiding the 2/9 deadly
  pattern on D1/D9/F1/F9.

### UR Type 2 (source — cite `SUDOKUWIKI-UNIQUE-RECTANGLES`, Fig 3, "From the Start")
`020000000060000794809060200700003000900102003000500008004020507682000030000000010`
- Floor `{1,5}`; roof cells A5,A6 (same box) each carry the single extra digit **7**.
- One of A5/A6 must be 7. Elimination: **remove 7 from every cell seeing both roof cells**
  — here A3 (row 1) and C6 (box 2): 7 removed from A3 and C6.

### UR Type 4 (source — cite `SUDOKUWIKI-UNIQUE-RECTANGLES`, Fig 10, "From the Start")
`030090000000000604906000350060180700090040020004035010048000205703000000000010030`
- Floor `{6,7}`; roof cells A4,A6 share box 2. In box 2 the UR digit **6** is confined to
  the two roof cells (conjugate pair on 6).
- Elimination: **remove 7 from A4 and A6** (one of them must be 6, so 7 there would force
  the 6/7 deadly pattern).

### BUG+1 (source — cite `SUDOKUWIKI-BUG`, "Load Example")
`030000000109000008008007560900020057000080000520070006073800400800000901000000080`
- After the basics the grid is all-bivalue except cell **F8 = {3,4,6}**. Digits 4 and 6
  appear twice each in column 8 and row F; placing 4 or 6 leaves the bivalue graveyard
  (two solutions). Placing 3 makes 3 appear three times in column 8 and row F.
- Placement: **F8 = 3** (the digit that breaks the universal bivalue grave).

## Soundness

**Single-solution assumption (stated explicitly):** every elimination here is valid *only*
if the puzzle is known/assumed to have **exactly one** solution. The deadly pattern is not
forbidden by the Sudoku rule itself — an `a/b/b/a` rectangle in two boxes is perfectly
legal arithmetic; it merely admits a *second* solution by swapping `a↔b` inside the two
boxes. The argument is proof-by-contradiction: *suppose* the eliminated candidate were
true; then the four UR cells (or the BUG grid) reduce to a freely swappable configuration,
producing two valid completions; that contradicts uniqueness; therefore the candidate is
false. If the source does not guarantee a unique solution (e.g. a hand-entered or
multi-solution grid), these techniques can wrongly delete candidates of a genuine
alternate solution — so they must be disabled there. ∎

## Sources

SUDOKUWIKI-UNIQUE-RECTANGLES, SUDOKUWIKI-BUG, HODOKU-UNIQUENESS, CHINESE-KAZUSA-UR
