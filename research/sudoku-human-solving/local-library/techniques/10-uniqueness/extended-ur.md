---
id: technique.extended-unique-rectangle
name_en: Extended Unique Rectangle
name_zh: 扩展唯一矩形
family: uniqueness
difficulty: diabolical
strategyId: extended-unique-rectangle
sources:
  - SUDOKUWIKI-EXTENDED-RECTANGLES
  - HODOKU-UNIQUENESS
---

# Extended Unique Rectangle — 扩展唯一矩形 (2×3 / 三数致死)

## One-Sentence Rule

Six cells confined to exactly three rows, three columns, and three boxes that hold a
**total of three candidates** form a deadly pattern (multiple solutions by permuting the
three digits); under uniqueness, the candidate(s) that would complete it are eliminated —
the 3-digit / 2×3 generalisation of the Unique Rectangle.

## 精确模式定义

### The Extended Deadly Pattern (2×3)
Just as a Naked/Hidden Pair extends to a Triple, the 2×2 UR extends to a **2×3** block:
**six cells occupying exactly three rows, three columns, and three boxes**, whose union of
candidates is **exactly three digits** `{a,b,c}` — a "Triple" spread over six cells. As
with subsets, the six cells need **not** each list all three digits; only the *total* must
be three. Valid distributions (SudokuWiki):
- `[a,b,c]+[a,b,c]+[a,b,c]` per line (the full 3×3 ideal), or with cells missing a digit:
  `[a,b,c]+[a,b,c]+[b,c]`, `[a,b]+[a,b,c]+[a,b,c]`, …
- the "skinny triple" `[a,b]+[a,c]+[b,c]`.

If all six cells reduced to only `{a,b,c}`, the three digits could be permuted among the
three rows/columns in several ways (each column independently fillable as a rotation of
`a,b,c`), giving multiple solutions — deadly.

### Why 2×3, not 3×3
A genuine 3×3 (nine-cell) deadly pattern exists in theory, but removing **any one** of the
three columns from the 3×3 leaves the multi-solution problem intact (each remaining column
still fills as `a+b+c` in several orders). So the practical, detectable shape is **2×3**;
3×3 patterns "come out in the wash" when the 2×3 is found.

### Floor / roof (Type 2)
The **Floor** is now **four** cells (in different boxes) totalling exactly three
candidates; the **Roof** is **two** cells in a different box, each carrying exactly one
extra candidate `d`.

## 触发判定

1. Find six cells in **exactly 3 rows ∩ 3 columns ∩ 3 boxes** whose total candidate set is
   exactly three digits `{a,b,c}` (orientation may be vertical or horizontal).
2. Identify the **extra** candidate(s) beyond `{a,b,c}` and which cell(s) carry them — this
   selects the type.

## 消除/落子规则（全部情形）

### Type 1 — extra candidate(s) in one "odd cell out"
Exactly one of the six cells carries extra candidate(s) beyond `{a,b,c}`. Those extras must
be true (else the full extended deadly pattern forms). **Eliminate all three UR digits
`{a,b,c}` from that odd cell** (if a single extra remains, it is a placement).

### Type 2 — Floor (4 cells) + Roof (2 cells, shared extra `d`)
Four Floor cells (different boxes) total `{a,b,c}`; two Roof cells in another box each
carry exactly one extra digit `d`. `d` must occupy one of the two Roof cells, else the
deadly `{a,b,c}` pattern forms. **Eliminate `d` from every cell seeing both Roof cells.**
Orientation decides direction: roof cells aligned in a **row** ⇒ eliminate `d` in that
**row and box**; aligned in a **column** ⇒ eliminate `d` in the **column and box**.

### Type 4 — double Locked Pairs + conjugate digit (extension of UR Type 4)
Instead of a single locked pair, use **two Locked Pairs in different boxes** with the roof
in a third box. The double locked pairs (e.g. locked by digit `c`) effectively resolve to
a virtual two-digit `{a,b}` locked pair, which then forms a **UR Type 4** with the roof
cells (locked by another digit). **Eliminate the conjugate UR digit from the roof cells**
(the digit not pinned by the strong link). (Per SudokuWiki, contributed by "Pieter.")

> Implementation note (SudokuWiki): of the Extended UR family the solver implements Type 1
> (original), Type 2 (added Jan 2024), and Type 4 (≈2022). Type 3 (extra candidates forming
> a locked set with outside cells, analogous to UR Type 3) is theoretically valid but not
> separately worked there.

## 退化与边界

- **Must occupy exactly three rows, three columns, three boxes.** Fewer boxes (e.g. two)
  collapse to an ordinary UR or are not deadly; spreading over more boxes breaks
  interchangeability.
- A 3×3 nine-cell pattern is valid but unnecessary to search — any 2×3 sub-pattern already
  triggers.
- Extended UR is uncommon; while hunting for the common 2×2 UR Type 1, watch for the same
  tight cluster of three shared candidates over three boxes.

## 与其他技巧的关系

- **Extended UR : Unique Rectangle :: Triple : Pair** — the 3-digit/6-cell generalisation
  of the deadly pattern (`unique-rectangle-bug.md`).
- **Type 1/2/4** mirror UR Type 1/2/4 exactly, with a 4-cell floor and 3-digit triple.
- The 3×3 *solved-cell* version is the higher-order **Avoidable Rectangle**
  (`avoidable-rectangle.md`).
- Generalises further into arbitrary **Unique Loops / polygons** (covered in
  `unique-rectangle-bug.md`).

## Worked example

### Type 1, vertical (source — cite `SUDOKUWIKI-EXTENDED-RECTANGLES`, Example 1, "From the Start")
`007020305802060910030900000000000600000246000009000000000002070096050204408070500`
- Extended deadly pattern on `{1,3,5}` in six yellow cells over rows C,E,G and columns 1,3.
- Odd cell out C1 carries extra candidate **6**. 6 must be the solution.
- Elimination: **remove 1 and 5 from C1** (⇒ C1 = 6).

### Type 1, vertical, multi-extra (source — cite `SUDOKUWIKI-EXTENDED-RECTANGLES`, Example 2, "From the Start")
`063020000700009206010007000032000800900000002001000530000900050806200007000040120`
- Pattern on `{4,7,9}` over cells A7,E7,E8,H7,H8 (rows A,E,H; columns 7,8). Cell **E8**
  carries extras 1 and 6.
- Elimination: **remove 4 and 7 from E8** (its extras 1/6 must supply the solution).

### Type 1, horizontal (source — cite `SUDOKUWIKI-EXTENDED-RECTANGLES`, Example 3, "From the Start")
`090801020801092600020000010009650040000000000060084100070000080006470205040509060`
- Triple `{3,7,8}` over rows D and E (horizontal). Lone extra **1** in D2 is the escape.
- Elimination: **remove 3, 7, 8 from D2** (⇒ use the extra 1).

### Type 2 (source — cite `SUDOKUWIKI-EXTENDED-RECTANGLES`, "EUR Type 2", "From the Start")
`100070003000000680900208000050004300002891500001600040000107005079000000500040006`
- Floor (four cells) totals `{2,3,4}`; Roof cells G1,G2 each carry extra **6**.
- 6 must be in G1 or G2. Elimination: **remove all other 6s in that row and box.**

### Type 4 (source — cite `SUDOKUWIKI-EXTENDED-RECTANGLES`, "Pieter's Type 4 EUR", "From the Start")
`007060200040103070500000001090602080100000004060705020400000002020901030001070600`
- Double Locked Pairs on cells over D/F, rows 3&5 (locked by the 4s) resolve to a virtual
  1/3 locked pair; this forms a UR Type 4 with D7/F7 (locked by the 1s).
- Elimination: **remove the 3s** from the roof cells (no other 1s in column 7 or box 6).

## Soundness

**Single-solution assumption (stated explicitly):** valid *only* under the premise of
exactly one solution. The extended deadly pattern is legal arithmetic — six cells over
three rows/columns/boxes holding only `{a,b,c}` can be filled as several Latin-square-like
permutations of the three digits, each a valid completion. Proof by contradiction: *suppose*
the eliminated digit(s) were true; then the six cells reduce to only `{a,b,c}` (the full
2×3 pattern), which admits more than one completion; that contradicts uniqueness; therefore
the candidate(s) are false. As with all uniqueness logic, this is **unsound on
multi-solution or unverified grids**. ∎

## Sources

SUDOKUWIKI-EXTENDED-RECTANGLES, HODOKU-UNIQUENESS
