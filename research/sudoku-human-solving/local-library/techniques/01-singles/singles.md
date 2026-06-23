---
id: technique.singles
name_en: Singles (Full House / Naked Single / Hidden Single)
name_zh: 唯一数（全房 / 显性唯一 / 隐性唯一）
family: singles
difficulty: basic
strategyId:
  - full-house
  - naked-single
  - hidden-single
sources:
  - HODOKU-SINGLES
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Singles — Full House / Naked Single / Hidden Single / 唯一数

## One-Sentence Rule

A digit can be placed immediately when a house has exactly one empty cell (Full House), or a cell has exactly one remaining candidate (Naked Single), or a digit has exactly one possible cell within a house (Hidden Single).

## 精确模式定义 (Exact pattern definition)

Let a *house* be any of the 27 units: 9 rows, 9 columns, 9 boxes. Let `cand(c)` be the candidate set of cell `c` (digits not eliminated by a placed peer). A cell is *solved* if it already holds a digit.

### Full House / Last Digit (`full-house`)
- A house `H` with **exactly one** unsolved cell `c`.
- Equivalent counts: `H` has 8 solved cells; one digit `d ∈ 1..9` is missing from `H`.
- "Last Digit" is the special case where `c` is the last empty cell of the whole grid; logically identical.

### Naked Single (`naked-single`)
- A single cell `c` with `|cand(c)| == 1`. The lone candidate `d` is *naked* (no other candidates hide it).
- Independent of any one house: it is determined by `c`'s combined peers (row ∪ column ∪ box = 20 peers).

### Hidden Single (`hidden-single`)
- A house `H` and a digit `d` such that `d` is a candidate in **exactly one** unsolved cell `c` of `H`.
- `c` itself may carry `|cand(c)| > 1` — the true digit `d` is *hidden* among the others.

## 触发判定 (Detection predicate)

- **Full House** fires for house `H` iff `count(unsolved cells in H) == 1`. Let `c` be that cell and `d` the unique missing digit of `H`.
- **Naked Single** fires for cell `c` iff `c` is unsolved ∧ `|cand(c)| == 1`. Let `d` be the lone element of `cand(c)`.
- **Hidden Single** fires for `(H, d)` iff `count({ c ∈ H : c unsolved ∧ d ∈ cand(c) }) == 1`. Let `c` be that cell.

All three predicate evaluations are O(1)–O(9) per house/cell and require no candidate-set search beyond a single house or a single cell.

## 消除/落子规则（全部情形）(Placement rule — all cases)

Singles **place** rather than eliminate. In every case the action is: set `c = d`.

1. **Full House**: place the unique missing digit `d` into the unique empty cell `c` of `H`.
2. **Naked Single**: place the lone candidate `d` into `c`.
3. **Hidden Single**: place `d` into the unique cell `c` of `H` that can host it.

After any placement, propagate: remove `d` from `cand(p)` for every peer `p` of `c` (the 20 peers across row/column/box). This propagation may expose further singles (cascade).

## 退化与边界 (Degeneracy & boundaries)

- **Full House ⊂ Naked Single ⊂ Hidden Single (as detectability tiers).** A Full House is always *also* a Naked Single (its one empty cell has one candidate) and *also* a Hidden Single for the missing digit; it is split out only because it is the cheapest to spot. Engines that grade difficulty usually emit `full-house` in preference when the count-8 condition holds.
- **Naked vs Hidden duality**: a Naked Single is about *one cell, one candidate*; a Hidden Single is about *one digit, one cell in a house*. They are the n=1 cases of the Naked/Hidden Subset family (see `03-subsets`).
- **Finding asymmetry (HoDoKu "How to find them")**: with pencil-marked candidates, Naked Singles are trivial to read but Hidden Singles require scanning each digit across a house; by hand (cross-hatching), Hidden Singles are the easy ones and Naked Singles are tedious.
- A cell with `|cand(c)| == 0` is **not** a single — it is a contradiction (the grid is broken or a prior placement was wrong).

## 与其他技巧的关系 (Relationships)

- Singles are the n=1 degenerate cases of **Naked/Hidden Subsets** (`03-subsets`).
- A Hidden Single found by cross-hatching one digit in one box is the manual form of **Locked Candidates** scanning (`02-intersections`); when the same digit is confined to a line-box intersection but to >1 cell, it is Locked Candidates instead of a Hidden Single.
- Every non-single technique ultimately works by *creating* singles: eliminations open up Naked/Hidden Singles, which the solver then cascades.

## Worked example

Source: HoDoKu "Solving Techniques – Singles" (`tech_singles.php`), Hidden Single left example (cite `HODOKU-SINGLES`).

Per HoDoKu's text: in the left Hidden-Single grid, cell **r3c4** has candidates {4,6,9}. Examining **row 3**, digit **6** can go only in r3c4 — r3c1/r3c2/r3c3 are blocked by the 6 in r2c3, and r3c6 is blocked by the 6 in r6c6. Therefore **place 6 at r3c4** (Hidden Single for digit 6 in row 3).

Full House (HoDoKu left example): box 8 has a single empty cell; the only missing digit is 6, so **place 6 at r9c6**.

Naked Single (HoDoKu left example): cell **r6c7** — every digit except 6 appears among the 20 peers of r6c7, so 6 is the sole remaining candidate; **place 6 at r6c7**. (It is *not* a Hidden Single: row 6, column 7, and box 6 each have another candidate 6.)

FLAG (constructed/paraphrased): HoDoKu publishes these examples as images, not as 81-char strings; the cell coordinates and blocking digits above are transcribed from the page prose and the grids are **not** reproduced here as a string. A self-contained Naked-Single string is given below and is **constructed** for code-mapping.

Constructed Naked-Single grid (81 chars, row-major, '0' = empty) — FLAG constructed, verify with engine:

```
123456780000000000000000000000000000000000000000000000000000000000000000000000000
```

- Row 1 has cells r1c1..r1c8 = 1..8 solved and r1c9 empty. Row 1 is a house with exactly one empty cell ⇒ **Full House**: the missing digit is 9 ⇒ **place 9 at r1c9**. (Equivalently `cand(r1c9) = {9}`, a Naked Single.)

## Soundness

- **Full House**: a house must contain each of 1..9 exactly once. With 8 cells solved, exactly one digit is unplaced and exactly one cell is empty; the missing digit can go nowhere else, so placing it is forced and cannot conflict.
- **Naked Single**: candidates are exactly the digits not yet excluded by a peer. If only one survives, every other digit is provably impossible in `c`, so the survivor is the unique legal value.
- **Hidden Single**: digit `d` must appear once in house `H`. If only one cell of `H` can still hold `d`, that placement is forced; any other location would leave `d` absent from `H`.

All three are direct consequences of the one-per-house constraint and introduce no assumption about uniqueness of the puzzle's solution.

## Sources

- HODOKU-SINGLES — `markdown/hodoku/tech_singles.md` (definitions and worked images for Full House, Hidden Single, Naked Single, plus "How to find them")
- SUDOPEDIA-SOLVING-TECHNIQUE — `markdown/sudopedia/solving_technique.md` (taxonomy: Full House = house with a single empty cell; Hidden Single = single candidate for a digit in a house; Naked Single = single candidate remaining in a cell; aliases Last Digit / Pinned Digit / Sole Candidate)
