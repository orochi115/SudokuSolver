---
id: technique.avoidable-rectangle
name_en: Avoidable Rectangle
name_zh: 可避免矩形
family: uniqueness
difficulty: tough
strategyId: avoidable-rectangle
sources:
  - SUDOKUWIKI-AVOIDABLE-RECTANGLES
  - HODOKU-UNIQUENESS
---

# Avoidable Rectangle — 可避免矩形

## One-Sentence Rule

A candidate that would complete an `a/b/b/a` rectangle across exactly two boxes whose
**other three corners are already-solved cells (not givens)** must be false, because the
puzzle maker — forced to leave a clue to *avoid* that interchangeable set — left none, so
the solver may eliminate it.

## 精确模式定义

### The deadly pattern, read from the maker's side
Avoidable Rectangles use the *same* deadly pattern as the Unique Rectangle — four cells in
**exactly two rows, two columns, and two boxes** that could hold `{a,b}` in an `a/b/b/a`
arrangement — but they are detected using **solved cells** instead of pencilmark floors.
This is, to SudokuWiki's knowledge, the **only strategy that makes use of solved cells**.

The reasoning is the puzzle creator's: such an interchangeable four-cell set is an
**"unavoidable set."** To guarantee a unique solution, the maker **cannot remove all four**
of those cells — at least one must remain as a **given (clue)**. Therefore, if a solver
sees a rectangle whose **three resolved corners are *solved* cells (filled in during
solving, not original clues)**, the fourth corner *cannot* complete the swappable set.

### The four corners
- Three corners: **solved** values `b, a, b` (an interchangeable trio), none of them a
  **given**.
- Fourth corner: still has candidates, including the UR digit that would complete `a/b/b/a`.

### Why givens vs. solved cells is the crux
If **any** of the four corners is an original **given**, the swap is blocked (a clue is
fixed), uniqueness is not threatened, and there is **no** avoidable rectangle. Only when
**all three resolved corners are solved (derived) cells** does the "maker was forced to
leave a clue, but didn't" contradiction apply. (HoDoKu states the identical condition: "if
none of the already-placed UR cells are givens, all UR Type x rules apply without change.")

## 触发判定

1. Find four cells in **2 rows ∩ 2 columns ∩ 2 boxes**.
2. Check that **three** of them are **solved, non-given** cells whose values form an
   `a, b, b` interchangeable trio (two of one UR digit, one of the other on the diagonal).
3. Confirm **none** of the three is an original given.
4. The fourth cell still carries candidates; identify which candidate would complete
   `a/b/b/a`.

## 消除/落子规则（全部情形）

### Avoidable Rectangle Type 1 (analogue of UR Type 1)
Three corners are solved (e.g. `a`, `b`, `b`) and the fourth corner has the UR digit that
would complete the swap plus other candidate(s). **Eliminate the completing UR digit from
the fourth corner.** Because of the placements, sometimes only the *other* UR digit
remains — i.e. the fourth corner becomes a **placement** (HoDoKu: "due to placements
sometimes only one UR candidate remains").
- SudokuWiki canonical: corners C4=5, B7=5, C7=8 solved; B4={8,9}. Placing 8 in B4 makes
  the `8/5/5/8`↔`5/8/8/5` swap; so **remove 8 from B4 ⇒ B4 = 9**.

### Avoidable Rectangle Type 2 (analogue of UR Type 2)
Two corners are solved cells (the `a/b`-type pair), and the **two remaining corners share
a single extra candidate `c`** in addition to the UR digit. One of those two cells must be
`c` to dodge the avoidable rectangle. **Eliminate `c` from every cell that sees *both* of
those two cells** (their shared row/column and shared box). Type 2 is easier to spot
because both UR digits are still visible as candidates (HoDoKu ar2).

### Higher-order (3×3 avoidable deadly pattern)
The pattern extends to **three rows, three columns, three boxes** with three solved digits
`{a,b,c}` forming a 9-cell interchangeable block. The maker is then forced to leave **at
least two** of those nine cells as givens, **and they must be two different digits**. If a
solver reaches a state where such a 9-cell block has no givens and one cell is still open,
the completing digit can be eliminated (the avoidable analogue of an Extended UR).

## 退化与边界

- **Any corner is a given** ⇒ no avoidable rectangle (the swap is blocked). This is the
  defining boundary; interactive solvers must distinguish given vs. solved cells, which is
  exactly why SudokuWiki only added it to its solver in 2026.
- Four boxes (not two) ⇒ not interchangeable ⇒ no pattern (same as UR).
- Because three corners are *solved*, the UR digits may not all appear as pencilmarks;
  AR Type 1 can therefore present as a direct placement rather than an elimination.

## 与其他技巧的关系

- **Avoidable Rectangle is the Unique Rectangle read backwards**: same deadly pattern,
  detected via solved cells rather than bivalue floors (`unique-rectangle-bug.md`). All UR
  Type-x rules transfer once you confirm no corner is a given (HoDoKu).
- The "given blocks the swap" boundary is exactly the UR card's *given-at-a-corner*
  degenerate case, here turned into the trigger.
- The 3×3 higher-order form is the avoidable counterpart of the **Extended UR**
  (`extended-ur.md`).

## Worked example

### Verified — HoDoKu ar101 (Type 1)
Grid: `.5........6.5.42....8.71...4....36.8.........89.1..7..3...........2.7.1..72.3..9.`
(dots → 0)

Avoidable Rectangle Type 1: `9/7` in `r1c19,r2c19` ⇒ **`r2c9<>9`**.

### Verified — HoDoKu ar102 (Type 1)
Grid: `086040000200000000100076090000407000800090000009683070000752008000000045700300100`

Avoidable Rectangle Type 1: `6/3` in `r5c78,r7c78` ⇒ **`r5c7<>3`**.

### Verified — HoDoKu ar201 (Type 2)
Grid: `900000600001006038706080000000000076004100000050947020200000005000250000000090001`

Avoidable Rectangle Type 2: `3/7` in `r7c37,r8c37` ⇒ **`r4c3,r78c2<>9`**.

### Verified — HoDoKu ar202 (Type 2)
Grid: `085000060000004700030000100000000050600043000070820300000459670000000000904160003`

Avoidable Rectangle Type 2: `2/8` in `r4c37,r5c37` ⇒ **`r18c7,r456c9,r56c8<>9`**.

### SudokuWiki canonical narrative (B4/C4/B7/C7) — CITED, restored-state only
SudokuWiki's B4/C4/B7/C7 example (`C4=5`, `B7=5`, `C7=8`, `B4={8,9}` ⇒ `B4=9`) is published
only as a solver screenshot / compressed `bd=` restored state (Frisbee credit, March 2026),
not a plain 81-char givens string. Logic matches Type 1 above; use HoDoKu ar102 for a
fixture-tested grid.

## Soundness

**Single-solution assumption (stated explicitly):** the elimination is valid *only* if the
puzzle is guaranteed to have **exactly one** solution. The argument is the puzzle maker's
contrapositive: an `a/b/b/a` rectangle in two boxes whose four cells are *all* derived
(non-given) is an unavoidable set — removing all four during construction would have left
two interchangeable solutions, so a unique puzzle **must** carry a given at one of those
corners. Observing that **no** corner is a given, while three are solved, means the open
corner cannot take the value that completes the swap (that would manufacture the very
ambiguity the maker was obliged to prevent). Formally: *suppose* the completing digit were
true; then the four non-given cells form a freely swappable set, yielding a second valid
solution; contradiction with uniqueness; hence it is false. The technique is **unsound on
multi-solution or unverified grids**, and **requires** distinguishing givens from solved
cells — a given at any corner voids it entirely. ∎

## Sources

SUDOKUWIKI-AVOIDABLE-RECTANGLES, HODOKU-UNIQUENESS
