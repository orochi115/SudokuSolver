# The Tridagon Rule (trivalue oddagon / Thor's Hammer)

Source: New Sudoku Players' Forum, "The tridagon rule" http://forum.enjoysudoku.com/the-tridagon-rule-t39859.html (Denis Berthier, eleven, 999_Springs, et al., from 2022-03-13)
Mirror captured 2026-06-23 for the SudokuSolver research library. Paraphrase/quotation for research; consult the thread for the full discussion and proofs.

## The tridagon elimination rule (denis_berthier)

Some forms of this rule have been known under the names "trivalue-oddagon" or "Thor's Hammer". "Tridagon" is the short name proposed by Berthier.

Let there be four blocks forming a rectangle in two bands and two stacks:

```
b11 b12
b21 b22
```

Let there be three digits (the **target digits**), say 1 2 3, such that:

- in each of the four blocks, there are three cells in different rows and different columns such that:
  - each of these 4×3 cells contains the three digits,
  - eleven of these cells (the **123-cells**) do not contain any other digit,
  - the twelfth cell (the **target cell**) contains at least one more digit,
- some additional conditions (below) are satisfied.

Then the 3 target digits can be eliminated from the target cell.

After isomorphisms (permuting bands/stacks/rows/columns and relabelling digits), the first three blocks can be put on their anti-diagonal with the target cell at r1c1. A T&E case analysis then shows that, with the first three blocks fixed, there are exactly **three (and only three) possible patterns of the 123-cells in the fourth block** for which the rule is valid — i.e. exactly half of the six patterns satisfying the starting conditions. In every other placement, one of the three digits is forced to appear twice in b22, a contradiction.

## eleven / 999_Springs: it is a deadly pattern (no target cell needed)

eleven: whenever you have this pattern (3 cells in 4 boxes of 2 bands/stacks, with a single cell per minirow/minicolumn in each box), it cannot be solved with only 3 digits; for each placement of one digit you are left with a bivalue oddagon for the other two (hence the name "oddagon").

999_Springs: there is no need to distinguish a target cell. The underlying logic is that if the marked cells are limited to digits 1,2,3 only, there is **no solution**:

```
+-------+-------+
| x . . | x . . |
| . x . | . x . |
| . . x | . . x |
+-------+-------+
| x . . | . . x |
| . x . | . x . |
| . . x | x . . |
+-------+-------+
```

As a corollary, if any number of these x-cells contain any number of extra digits, then **at least one of the extra (guardian) candidates among the x-cells must be true**. This is exactly a "deadly pattern" used without the uniqueness assumption (like BUG/UR). Type-1 (single cell with extras) gives a direct elimination; multi-cell cases give strong links usable in chains, and same-digit guardians that see a common cell allow eliminations there (e.g. a hidden pair / pointing argument).

999_Springs's multi-guardian example: `........1....12.3..13.45....34...16.1.74.63.886..31..4.81.6...33.61.48.747....61.` (mith's 37-clue, SER 11.5). The x-cells form a trivalue oddagon in digits 2/5/9 with an extra 7 in r6c7 and an extra 4 in r7c7; at least one of 7r6c7 / 4r7c7 is true, whichever forms a hidden pair with 8 in r1/r3 c8, eliminating from r1c8 and r3c8.

## Example: Loki (denis_berthier)

Loki (created by mith) was the first puzzle found not to be in T&E(2) and the 10th known puzzle with SER 11.9. In Berthier's SudoRules trace, after singles/whips, the move applied is:

> tridagon in blocks b9, b8, b6 and b5 for digits 3, 5 and 7 ==> r8c8 ≠ 3,5,7

Resolution state (after Singles and whips[1]) used for that step:

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

Here the 123-cells (digits 3,5,7) occupy boxes b5, b6, b8, b9; the target cell r8c8 = {1,3,5,7} carries guardian digit 1, so 3,5,7 are removed and r8c8 = 1, which cascades to a quick finish.

## Example 2 (denis_berthier, mith's puzzle)

`........1.....2.....3..45.6.......71.8....32..67..8.6..23..837..1..7.281.6..` (mith 26c minimal; see thread for exact string). Trace move:

> tridagon for digits 4, 5 and 9 in blocks b5 (target r6c4; r5c6, r4c5), b4 (r6c3, r5c1, r4c2), b8 (r7c4, r9c6, r8c5), b7 (r7c3, r9c2, r8c1) ==> r6c4 ≠ 4,5,9

This puzzle follows the third of the three b22 patterns (Loki follows the first).
