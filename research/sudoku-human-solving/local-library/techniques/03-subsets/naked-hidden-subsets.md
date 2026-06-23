---
id: technique.naked-hidden-subsets
name_en: Naked and Hidden Subsets (Pair / Triple / Quad)
name_zh: 显性与隐性数组（对 / 三 / 四）
family: subsets
difficulty: basic-medium
strategyId:
  - naked-pair
  - naked-triple
  - naked-quad
  - hidden-pair
  - hidden-triple
  - hidden-quad
sources:
  - SUDOKUWIKI-NAKED
  - SUDOKUWIKI-HIDDEN
  - HODOKU-NAKED
  - HODOKU-HIDDEN
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Naked & Hidden Subsets — Pair / Triple / Quad / 数组

## One-Sentence Rule

If `N` cells of a house together hold only `N` distinct candidates, those `N` digits are eliminated from the rest of the house (Naked Subset); dually, if `N` digits of a house appear only within `N` cells, all *other* digits are eliminated from those `N` cells (Hidden Subset).

## 精确模式定义 (Exact pattern definition)

Fix a house `H` (row, column, or box). Let `cand(c)` be the candidate set of unsolved cell `c`. `N = 2` → Pair, `N = 3` → Triple, `N = 4` → Quad.

### Naked Subset (`naked-pair` / `naked-triple` / `naked-quad`)
- A set `S` of `N` unsolved cells in `H` with `|⋃_{c∈S} cand(c)| == N`.
- Each cell of `S` may carry **2..N** candidates; only the *union* must be exactly `N` (per cell counts e.g. for a triple: 3/3/3, 3/3/2, 3/2/2, 2/2/2 — SudokuWiki).
- No cell of `S` may carry a candidate outside the size-`N` union (else it is not part of the subset).

### Hidden Subset (`hidden-pair` / `hidden-triple` / `hidden-quad`)
- A set `D` of `N` digits and a set `S` of `N` cells in `H` such that **within `H`** every cell that can hold any digit of `D` is in `S`, and each digit of `D` is a candidate in 2..N of those cells, with `D` collectively confined to exactly `S`.
- Predicate form: the `N` digits of `D` appear (within `H`) only in the `N` cells of `S`. The cells of `S` typically also carry *extra* candidates that "hide" the subset.

## 触发判定 (Detection predicate)

Let `U` = unsolved cells of `H`. Search smallest `N` first (`2 → 3 → 4`).

### Naked Subset
For each `N`-subset `S ⊆ U`:
`union = ⋃_{c∈S} cand(c)`; fires iff `|union| == N` ∧ `∃ c ∈ (U \ S)` with `cand(c) ∩ union ≠ ∅`
(the last conjunct guarantees a non-empty elimination).

### Hidden Subset
For each `N`-subset of digits `D` (each digit still placeable in `H`):
`cells(D) = { c ∈ U : cand(c) ∩ D ≠ ∅ }`; fires iff `|cells(D)| == N` ∧ each `d ∈ D` occupies ≥ 2 of those cells ∧ `∃ c ∈ cells(D)` with `cand(c) \ D ≠ ∅`
(the last conjunct guarantees a non-empty elimination).

## 消除/落子规则（全部情形）(Elimination rule — all cases)

Subsets only eliminate; they never place a digit.

1. **Naked Pair/Triple/Quad** with union `union` over cells `S`:
   remove every digit of `union` from every cell in `H \ S`.
   (If `S` also shares a *second* common house — e.g. all in one box-line — the elimination applies in both houses; this is a "Locked Pair/Triple", see `02-intersections`.)
2. **Hidden Pair/Triple/Quad** with digit set `D` over cells `S`:
   remove every candidate **not** in `D` from each cell of `S` (i.e. set `cand(c) ← cand(c) ∩ D` for `c ∈ S`). The cells of `H \ S` are untouched.

A Hidden Subset, once processed, leaves the `N` cells carrying exactly the `N` digits of `D` — i.e. it *creates* the complementary Naked Subset on those cells (Didi/Ymiros comments, SudokuWiki).

## 退化与边界 (Degeneracy & boundaries)

- **N = 1 is the singles case**: a Naked Single (one cell, one candidate) / Hidden Single (one digit, one cell) — handled in `01-singles`.
- **Naked ↔ Hidden complement (precise)**: in a house with `S₀` solved cells, the unsolved cells split so that
  `S₀ + Σ(naked tuple sizes) + Σ(hidden tuple sizes) = 9`.
  A **Hidden** `N`-subset is *always* accompanied by a complementary **Naked** `(9 − S₀ − N)`-subset on the remaining unsolved cells, and vice versa — but the two are only *simultaneously* both "interesting" when neither complement is the whole remainder (SudokuWiki "Jim" 2026 comment; Ymiros). Concretely: a Hidden Pair in a house with 0 solved cells coexists with a Naked-7 on the other 7 cells (both delete the same candidates).
- **Why no quint/sext (`N ≥ 5`) on 9×9**: a unit has 9 cells; a Naked Quint would imply a complementary Hidden Quad (5 + 4 = 9), and a Hidden Quint a complementary Naked Quad. The smaller of the pair is always found first, so the size ladder caps at **Quad** (SudokuWiki Naked/Hidden Candidates; Ing comment). Larger orders only matter on 12×12/16×16 grids.
- **Quad rarity**: a full Naked/Hidden Quad is uncommon because, if a Quad exists, the *remaining* cells are more likely to form a Pair or Triple that the solver reports first (SudokuWiki Naked Quads). A speed pruning (JohnF comment): only test for a Quad in a house with ≥ 8 unfilled cells; if a Naked Quad search fails, a Hidden Quad needs all 9 cells unfilled.
- **Not a subset**: cells whose candidates total *more* than `N` (e.g. {3,9}{3,4,9}{3,7,9}{3,4,7,9} totals 4 digits in 3 cells) are **not** a triple — that is a Quad on four cells (Davin comment). The union size must equal the cell count exactly.

## 与其他技巧的关系 (Relationships)

- **Singles** are the `N = 1` cases (`01-singles`).
- **Locked Pair/Triple** = a Naked subset confined to a box-line intersection, doubling as **Locked Candidates** (`02-intersections`).
- The `(12)(23)(13)` (2/2/2) Naked Triple is the cell pattern exploited by **XY-Wing** (`06-wings`).
- A Naked/Hidden Subset on a single digit, read across parallel houses, is the transpose of a **basic Fish** (`04-fish`): a Naked `N`-set ↔ the Fish "base", a Hidden `N`-set ↔ the Fish "cover".
- Every subset elimination is sound purely by counting and typically cascades into new **Singles**.

## Worked example

Source: SudokuWiki "Naked Candidates" (`Naked_Candidates`), first **Naked Pair** example, "From the Start" grid (cite `SUDOKUWIKI-NAKED-CANDIDATES`).

Grid (81 chars, row-major, '0' = empty):

```
400000038002004100005300240070609004020000070600703090057008300003900400240000009
```

- **Naked Pair** `{1,6}` in **row A**: cells A2 and A3 each carry exactly `{1,6}`. Therefore remove **1 and 6 from the rest of row A**, and (since A2, A3 also share box 1) remove **1 from C1** as well. The source notes a second Naked Pair `{6,7}` in row C.

Hidden Pair (SudokuWiki "Hidden Candidates", first example, "From the Start"):

```
000000000904607000076804100309701080008000300050308702007502610000403208000000000
```

- **Hidden Pair** `{6,7}` in **box 3**: 6 and 7 are placeable in box 3 only at **A8** and **A9** (pinned by the 6 and 7 already in boxes 1–2 and in column 7). Therefore remove **all candidates other than 6 and 7 from A8 and A9**, leaving a Naked Pair `{6,7}` there.

FLAG: the 81-char strings are SudokuWiki's own "From the Start" puzzle definitions; the specific subset cells and victims are transcribed from the page prose (presented as images). **Engine verification recommended** for the exact candidate grid and resulting eliminations.

## Soundness

- **Naked Subset**: `N` cells confined to `N` digits must, between them, use up all `N` of those digits (a perfect cell↔digit matching). No digit of the union can be left over for any other cell of the house, so those eliminations are forced.
- **Hidden Subset**: `N` digits confined to `N` cells of a house must occupy exactly those cells (each digit once per house, and they have nowhere else in `H` to go). The `N` digits therefore fill the `N` cells, leaving no room there for any other digit, so removing the non-subset candidates from those cells is forced.
- Both arguments are pure pigeonhole/counting within one house, contradiction-free, and assume nothing about the puzzle's solution uniqueness. The Naked/Hidden complement identity (`S₀ + naked + hidden = 9`) guarantees the two readings are logically equivalent on the same house.

## Sources

- SUDOKUWIKI-NAKED-CANDIDATES — `markdown/sudokuwiki/naked_candidates.md` (Naked Pair/Triple/Quad; per-cell formations 3/3/3…2/2/2; quad rarity; complement note; worked grids via "From the Start")
- SUDOKUWIKI-HIDDEN-CANDIDATES — `markdown/sudokuwiki/hidden_candidates.md` (Hidden Pair/Triple/Quad; hidden→naked conversion; `S + naked + hidden = 9` complement formula in comments; quad rarity)
- HODOKU-NAKED — `markdown/hodoku/` (Naked Subset definitions)
- HODOKU-HIDDEN — `markdown/hodoku/` (Hidden Subset definitions)
- SUDOPEDIA-SOLVING-TECHNIQUE — `markdown/sudopedia/solving_technique.md` (taxonomy: Naked Subset = N cells with candidates for N digits; Hidden Subset = N digits with candidates in N cells)
