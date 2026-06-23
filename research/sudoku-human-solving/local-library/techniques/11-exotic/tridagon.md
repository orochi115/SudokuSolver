---
id: technique.tridagon
name_en: Tridagon / Anti-Tridagon (Thor's Hammer)
name_zh: 三值死环 / 反三值死环（雷神之锤）
family: exotic
difficulty: extreme
strategyId: tridagon
sources:
  - ENJOYSUDOKU-TRIDAGON
  - SUDOKUWIKI-TRIDAGON
---

# Tridagon / Anti-Tridagon (Thor's Hammer)

## One-Sentence Rule

In four boxes forming a rectangle across two bands and two stacks, if twelve cells (three per box, one in each row and column of the box) are restricted to a single set of three digits, the grid has no solution; therefore at least one "guardian" — any extra candidate appearing in one of those twelve cells — must be true, and the three digits can be eliminated from the (sole) cell carrying extra candidates.

## 精确模式定义

Let the digit set be `D = {d1, d2, d3}` (the **target digits**, three distinct digits, e.g. `{3,5,7}`).

Choose four boxes `b11, b12, b21, b22` that form a rectangle: `b11,b12` share a band, `b21,b22` share a band, `b11,b21` share a stack, `b12,b22` share a stack. (Equivalently: two distinct bands and two distinct stacks; the four boxes are their four intersections.)

In each of the four boxes select exactly **three cells**, the **pattern cells**, such that within that box:
- the three cells lie in **three different rows** and **three different columns** (one per minirow and one per minicolumn of the box — equivalently a transversal of the box);
- the union of candidates over the three cells, considered jointly, contains **only digits of `D`** and supplies each of `d1,d2,d3` exactly once when filled (a "triple"). It need not be `{D}+{D}+{D}` in every cell; like a naked/hidden triple it only matters that the three cells together carry the three digits and nothing else — the sparsest legal form is `{d1,d2}+{d1,d3}+{d2,d3}`.

This gives `4 × 3 = 12` **pattern cells**. Among them:
- **11 cells** (the **123-cells**) have candidate set ⊆ `D` (no candidate outside `D`);
- **at most one cell** (the **target cell**) carries one or more candidates **outside** `D` (its **guardian** candidates).

Cardinality summary: `|D| = 3`; pattern cells `= 12`; 123-cells `= 11`; target cells with extra candidates `= 1` for the directly-usable (Type-1) form. The general (deadly-pattern) form allows ≥1 cells with guardians.

**Terms.** *Guardian* = any candidate value `g ∉ D` present in a pattern cell. *Rising / falling parity*: a box-transversal is *rising* if, read left-to-right, the cells climb up-and-right (by relative adjacency, not value), else *falling*; there are 3 rising and 3 falling transversals. *Cyclical parity*: a property whereby, across a band/stack, all-rising transversals force a band/stack parity mismatch and all-falling force a match.

## 触发判定

The pattern (anti-tridagon, the impossible core) is present iff a quadruple of boxes, a digit set `D` of size 3, and a choice of three transversal cells per box exist such that:

```
present(D, {b11,b12,b21,b22}, cells) :=
    fourBoxesFormRectangle(b11,b12,b21,b22)
 ∧ |D| == 3
 ∧ ∀ b ∈ {b11,b12,b21,b22}:
       |cells[b]| == 3
     ∧ distinctRows(cells[b]) ∧ distinctCols(cells[b])
     ∧ jointlyCarryExactly(cells[b], D)              # the three cells supply d1,d2,d3 and no other digit
 ∧ countCellsWithExtra(allPatternCells) ≥ 1          # at least one guardian exists
```

Soundness of the impossibility additionally requires the parity condition automatically met by any genuine transversal layout: across the four boxes, the rising/falling parities make the all-`D` colouring contradictory (three boxes one parity, one the other — see Soundness). Berthier's case analysis proves that for a fixed first-three-block anti-diagonal layout with target at r1c1, **exactly 3 of the 6 possible b22 transversals** complete a valid (impossible) pattern.

The **directly-usable elimination** fires iff exactly **one** pattern cell carries guardians (Type-1). With multiple guardian cells, a usable elimination fires iff all guardians share **one digit `g`** and there is a cell `z` (outside the pattern) that sees **every** guardian cell of `g`.

## 消除/落子规则（全部情形）

Because the all-`D` configuration is unsolvable, at least one guardian among the pattern cells is true.

1. **Type-1 (single guardian cell — the target cell).** Eliminate every target digit `d ∈ D` from the target cell. (The target cell must take a non-`D` value.) Targets: the candidates `{d1,d2,d3} ∩ target cell`.

2. **Multiple guardian cells, same digit `g`, with a common peer.** All guardians are instances of the same digit `g`, and they collectively act as a locked set of `g`: at least one is true. Any cell `z ∉ pattern` that sees **all** the `g`-guardian cells cannot be `g` — eliminate `g` from `z`. (When the `g`-guardians all lie in one house this is exactly a pointing/claiming-style elimination on `g`; SudokuWiki calls the in-box case a **Pointing Pair guardian**.)

3. **Multiple guardian cells, two digits `A,B`.** At least one of `A`/`B` is true. This yields no standalone elimination but provides a **strong inference** ("A in cellX OR B in cellY") that can be used as a link in an AIC / chain.

4. **General deadly-pattern view (eleven / 999_Springs).** No target cell need be distinguished: the truth "at least one guardian is true" can be consumed exactly like a Unique-Rectangle / BUG inference of arbitrary type (Type-1 elimination, Type-2 pointing, Type-3 with a (hidden) subset, etc.).

## 退化与边界

- **Degenerate vs non-degenerate.** A *non-degenerate* tridagon needs the full 12-cell rank argument (these sit in T&E(3) puzzles). *Degenerate* forms collapse to simpler logic (a single oddagon rectangle, T&E(2)) and may be found by other deadly-pattern code; the parity proof can be problematic for some degenerate/overlapping cases (e.g. two overlapping tridagons of opposite triple-parity sharing a block).
- **Missing candidates in the 11 cells.** If a 123-cell is *missing* one of `D` it can break the "supplies each digit once" requirement; the rule must verify each box transversal genuinely carries `D`. A 123-cell that has been reduced below the needed digit invalidates the pattern.
- **More than one extra-candidate cell** disables the plain Type-1 elimination — fall back to rules 2–4.
- **Not an oddagon by name only.** "Trivalue oddagon" is justified because fixing any one `D`-digit leaves a bivalue oddagon on the other two; the contradiction is parity, not uniqueness, so the rule is **valid even in multi-solution grids** (unlike UR/BUG which assume a unique solution).
- **Rarity.** Essentially never occurs in randomly generated/published puzzles; appears in curated hardest-puzzle lists.

## 与其他技巧的关系

- **Deadly patterns (UR, BUG):** structurally a deadly pattern used **without** the uniqueness assumption — the impossibility is a hard logical contradiction (parity), so it is sound on non-unique grids. Type numbering mirrors UR/BUG types.
- **Oddagon / BUG-Lite:** the trivalue oddagon generalises the bivalue oddagon (which underlies BUG); removing one digit reduces a tridagon to a bivalue oddagon.
- **Guardians:** the surviving extra candidates are exactly the "guardians" of single-digit-pattern theory (X-loops/broken wings), reused for a 3-digit pattern.
- **AIC / forcing chains:** multi-guardian cases feed strong links into chains.
- **Pointing Pair / Locked Candidates:** the same-digit multi-guardian elimination reduces to pointing.
- **Placement in workflow:** an extreme-tier static pattern; many solvers scan it early among "diabolicals" because it is cheap to detect, but it only matters on the hardest corpus.

## Worked example

Source-cited (NOT constructed): "Loki", created by mith — the first puzzle shown not to be in T&E(2) and the 10th known SER-11.9 puzzle. Trace by Denis Berthier (SudoRules), `ENJOYSUDOKU-TRIDAGON`.

Puzzle (81-char givens, Loki, SER 11.9):

```
57....9..........8.1.........168..4......28.9..2.9416.....2.....6.9.82.4...41.6..
```

(Verified: this string is a valid puzzle with a unique solution; its singles match the resolution state below and the tridagon move resolves r8c8 = 1, which agrees with the solution.)

Resolution state after Singles and whips[1] (candidate grid, verbatim from the cited source trace):

```
+----------------------+----------------------+----------------------+
! 5      7      3468   ! 238    346    13     ! 9      123    136    !
! 23469  2349   3469   ! 2357   34567  13579  ! 3457   12357  8      !
! 234689 1      34689  ! 23578  34567  3579   ! 3457   2357   3567   !
+----------------------+----------------------+----------------------+
! 379    359    1      ! 6      8      357    ! 357    4      2      !
! 3467   345    34567  ! 1      357    2      ! 8      357    9      !
! 378    358    2      ! 357    9      4      ! 1      6      357    !
+----------------------+----------------------+----------------------+
! 134789 34589  345789 ! 357    2      6      ! 357    135789 1357   !
! 137    6      357    ! 9      357    8      ! 2      1357   4      !
! 23789  23589  35789  ! 4      1      357    ! 6      35789  357    !
+----------------------+----------------------+----------------------+
```

**Target digits:** `D = {3,5,7}`. **Four boxes:** b5 (r4–6,c4–6), b6 (r4–6,c7–9), b8 (r7–9,c4–6), b9 (r7–9,c7–9) — bands 2&3, stacks 2&3.

**Pattern cells (one per row & column in each box):**
- b5: r6c4=`357`, r5c5=`357`, r4c6=`357`
- b6: r4c7=`357`, r5c8=`357`, r6c9=`357`
- b8: r7c4=`357`, r8c5=`357`, r9c6=`357`
- b9: r7c7=`357`, r9c9=`357`, **r8c8=`1357`** (the target cell)

**123-cells:** the eleven pure-`357` cells above. **Guardian:** the extra `1` in r8c8.

**Matched cells:** all 12 listed; 11 carry only `{3,5,7}`, r8c8 additionally carries `1`.

**Elimination (Type-1):** `tridagon in blocks b5,b6,b8,b9 for digits 3,5,7 ==> r8c8 ≠ 3, r8c8 ≠ 5, r8c8 ≠ 7`. This leaves **r8c8 = 1** (naked single), which cascades: r1c9=1, r1c6=3, r1c8=2, r1c4=8, r2c6=1, r3c6=9, r3c9=6, r7c1=1, then the puzzle finishes with ordinary moves (per the source trace).

(Structure independently verified: each of b5,b6,b8 has exactly three pure-`357` transversal cells; b9 has two pure-`357` cells plus the `1357` target, all on one row & column each — 11 + 1 = 12 cells.)

A second source example confirms the multi-guardian case: mith's 37-clue SER-11.5 puzzle `........1....12.3..13.45....34...16.1.74.63.886..31..4.81.6...33.61.48.747....61.` has a 2/5/9 tridagon in boxes b4,b6,b7,b9 with two same-digit guardians (1 in r4c3, 1 in r8c3); candidate 1 in r2c3 sees both, so `r2c3 ≠ 1` (rule 2).

## Soundness

The core claim is that **twelve cells, three per box across four rectangle-boxes, each box-triple a transversal restricted to three digits, cannot be filled**. Proof (parity / Berthier's exhaustive T&E):

By relabelling and permuting bands, stacks, rows and columns we fix the first three boxes on their anti-diagonal with the would-be target at r1c1, and (by `D`-symmetry) set r1c1=`d1`, r2c2=`d2`, r3c3=`d3`. Propagating the box/line constraints forces specific contents in the band/stack, and for the fourth box `b22` only six transversal placements are possible. Case analysis shows that in **every** placement, one of `d1,d2,d3` is forced to appear **twice** inside `b22` — a direct Sudoku violation. Hence no all-`D` completion exists. Equivalent statement via cyclical parity: rising transversals make band-parity ≠ stack-parity and falling make them equal; a rectangle of four boxes restricted to `D` forces three of one parity and one of the other, which is unsatisfiable.

Because the configuration is impossible, in the real (consistent) puzzle at least one pattern cell must hold a value **outside** `D` — i.e. at least one guardian is true. When exactly one cell can do so (the target cell), that cell cannot be any `D`-digit, giving the Type-1 elimination. The argument uses **no uniqueness assumption**: it is a contradiction within the three target digits alone, so it remains valid on puzzles with multiple solutions. Multi-guardian eliminations follow from the disjunction "at least one guardian true" combined with ordinary visibility (peer) logic.

## Sources

- `ENJOYSUDOKU-TRIDAGON` — New Sudoku Players' Forum, "The tridagon rule" (Denis Berthier et al., 2022) http://forum.enjoysudoku.com/the-tridagon-rule-t39859.html
- `SUDOKUWIKI-TRIDAGON` — SudokuWiki.org, "Tridagons" (Andrew Stuart) https://www.sudokuwiki.org/Tridagons
