---
id: technique.locked-candidates
name_en: Locked Candidates (Pointing / Claiming)
name_zh: 区块排除（指向 / 声明）
family: intersections
difficulty: basic-medium
strategyId:
  - locked-candidates-pointing
  - locked-candidates-claiming
sources:
  - SUDOKUWIKI-INTERSECTION
  - HODOKU-INTERSECTIONS
  - SUDOKUWIKI-FAMILIES
  - SUDOKUCOM-POINTING-PAIRS
---

# Locked Candidates — Pointing / Claiming / 区块排除

## One-Sentence Rule

If every candidate of a digit in one house is confined to that house's intersection with a second house, the digit can be eliminated from the rest of the second house.

## 精确模式定义 (Exact pattern definition)

The intersection of a box and a line (row or column) is a *box-line* of 3 cells. Fix a digit `d`. Let `cand(c)` be the candidate set of cell `c`.

### Pointing (`locked-candidates-pointing`)
- **Base house** = a **box** `B`. **Secondary house** = a **line** `L` (row or column) that crosses `B`.
- All candidates of `d` inside `B` lie within `B ∩ L` (1, 2, or 3 cells — typically a "pointing pair" or "pointing triple").
- Equivalently: `d` has **no** candidate in `B` outside row/column `L`.
- Elimination target lies in `L` *outside* `B`.

### Claiming / Box-Line Reduction (`locked-candidates-claiming`)
- **Base house** = a **line** `L`. **Secondary house** = the **box** `B` that `L` crosses.
- All candidates of `d` inside `L` lie within `B ∩ L`.
- Equivalently: `d` has **no** candidate in `L` outside box `B`.
- Elimination target lies in `B` *outside* `L`.

Candidate count in the intersection is `k ∈ {2, 3}` for a genuine, useful pattern (a single candidate would already be a Hidden Single in the base house). The number `k` is **incidental** to the logic — what matters is the *absence* of `d` in the rest of the base house (SudokuWiki commentary, AlexB / Konrad Kritzinger).

## 触发判定 (Detection predicate)

For each box `B`, each line `L` crossing `B`, and each digit `d`, define
`I = B ∩ L` (3 cells), `restB = B \ I`, `restL = L \ I`,
`inI = { c ∈ I : d ∈ cand(c) }`.

- **Pointing** fires iff `|inI| ≥ 2` ∧ `d ∉ cand(c)` for all `c ∈ restB`
  (i.e. all of `B`'s `d`-candidates are inside `I`) ∧ `∃ c ∈ restL : d ∈ cand(c)`.
- **Claiming** fires iff `|inI| ≥ 2` ∧ `d ∉ cand(c)` for all `c ∈ restL`
  (i.e. all of `L`'s `d`-candidates are inside `I`) ∧ `∃ c ∈ restB : d ∈ cand(c)`.

The third conjunct (`∃` an actual victim) is required for the move to *do* anything; the pattern may be valid yet inert without it.

## 消除/落子规则（全部情形）(Elimination rule — all cases)

Locked Candidates only eliminate; they never place a digit.

1. **Pointing** (`d` locked in `B ∩ L`, base = box): remove `d` from every cell of `restL` (line `L` outside box `B`).
2. **Claiming** (`d` locked in `B ∩ L`, base = line): remove `d` from every cell of `restB` (box `B` outside line `L`).

Both directions for both line orientations:
- box → row (pointing along a row)
- box → column (pointing along a column)
- row → box (claiming/BLR from a row)
- column → box (claiming/BLR from a column)

## 退化与边界 (Degeneracy & boundaries)

- **Pointing vs Claiming are duals over the same intersection**: pointing reads box→line, claiming reads line→box. For a given `(B, L, d)` at most one fires usefully, because they require `d` confined in *different* base houses.
- **`k = 1`** (single candidate of `d` in the intersection) is not Locked Candidates — it is a **Hidden Single** in the base house; emit that instead.
- **`k = 3` ("triple")** is allowed and common; the count never changes the logic.
- **Both conditions can hold simultaneously** when `d` in the box *and* in the line are each confined to `I` — then the digit is double-locked and either elimination set (which is empty for both `restB` and `restL`) is vacuous; this is effectively a solved/near-solved configuration.
- A common misreading (per SudokuWiki comments) is treating the *count of candidates in the intersection* as the trigger; the true trigger is the *emptiness of `d` in the rest of the base house*.
- Jigsaw-only generalisations (Double Pointing Pairs, Double Line/Box Reduction) extend this but are out of scope for classic 9×9.

## 与其他技巧的关系 (Relationships)

- Locked Candidates are the **box-line case of generalised Fish**: a box→line "X-Wing on one box" is exactly Pointing/Claiming, which is why basic Fish cards explicitly exclude box-containing base/cover sets (see `04-fish/fish-base-cover.md`).
- A Hidden Single is the `k = 1` degenerate of the same intersection scan.
- "Locked Pair / Locked Triple" (Sudopedia) = a **Naked Pair/Triple that happens to sit inside one box-line intersection**, letting it eliminate in *both* the box and the line; that is a subset (`03-subsets`) wearing an intersection's clothes.
- A claimed line frequently turns a multi-candidate box cell into a Hidden Single — the standard cascade into `01-singles`.

## Worked example

Source: SudokuWiki "Intersection Removal" (`Intersection_Removal`), **Pointing Pairs** first example, "From the Start" grid (cite `SUDOKUWIKI-INTERSECTION`).

Grid (81 chars, row-major, '0' = empty):

```
010903600000080000900000507002010430000402000064070200701000005000030000005601020
```

- **Digit** `3`. In **box 3** (rows A–C, columns 7–9) the candidate 3 is confined to row **B** (cells B7 and B9) — a **pointing pair** — with no other 3 in box 3.
- **Pointing**: 3 must lie in box 3 on row B, so remove **3 from the rest of row B** — specifically the 3s in box 1 (B1, B2, B3).
- Per the source, a second simultaneous pointing pair has the 2s in G4 and G5 (box 8, column-aligned reading) pointing along the row to eliminate the 3 at G2.

FLAG: cell coordinates and the exact victims are transcribed from the SudokuWiki page prose (which presents the position as an image); the 81-char string is the page's own "From the Start" puzzle definition. **Engine verification recommended** to confirm the candidate grid yields B1/B2/B3 as the 3-eliminations.

Claiming / Box-Line Reduction (SudokuWiki "Box/Line Reduction" first example, "From the Start"):

```
016007803000800000070001060048000300600000002009000650060900020000002000904600510
```

- **Digit** `2`, **row A**: the only 2s in row A are at **A4** and **A5**, both inside **box 2**. Therefore 2 in row A is *claimed* by box 2, so remove **2 from the rest of box 2** — B5, C4, C5 (per source).

## Soundness

The base house must contain digit `d` exactly once. If every place `d` could go in the base house lies inside the single intersection `I = B ∩ L`, then the eventual `d` of the base house is somewhere in `I` — hence in *both* the box `B` and the line `L`. Since `d` occurs once per house, no other cell of the *other* house may also be `d`. Removing `d` from the rest of that other house therefore deletes only candidates that can never be true. The argument is independent of how many candidates of `d` sit in `I` (1, 2, or 3) and assumes nothing about solution uniqueness.

## Sources

- SUDOKUWIKI-INTERSECTION — `markdown/sudokuwiki/intersection_removal.md` (Pointing Pairs/Triples; Box/Line Reduction; worked grids via "From the Start" links; comment thread clarifying that the real trigger is absence of `d` in the rest of the base house)
- HODOKU-INTERSECTIONS — `markdown/hodoku/` (Locked Candidates Type 1 = Pointing, Type 2 = Claiming)
- SUDOKUWIKI-FAMILIES — `markdown/sudokuwiki/` (family/difficulty placement)
- SUDOKUCOM-POINTING-PAIRS — `markdown/sudoku-com/` (beginner-friendly pointing-pair framing)
