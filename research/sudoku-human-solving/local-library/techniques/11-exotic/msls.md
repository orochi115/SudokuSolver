---
id: technique.msls
strategyId: msls
name_en: Multi-Sector Locked Sets
name_zh: MSLS / 多扇区数组
family: exotic
difficulty: extreme
sources:
  - ENJOYSUDOKU-MSLS
---

# MSLS / 多扇区数组

## One-Sentence Rule

Choose a digit subset and a collection of "sector" houses whose truths (cells
that must be filled by the subset) exactly balance the links (the houses that
can supply them) at rank 0, so the loop's cells form one giant locked set and
any subset candidate that would consume a supply without meeting a demand is
eliminated.

## 精确模式定义

- **Digit subset** `D`: a set of digits (e.g. `{1,2,4,7}`) recurring across a
  symmetric region.
- **Multiplicity** `M`: the pattern realises at most `M` copies of `D` over the
  cell set.
- **Base sets (truths)**: rows / columns / cells each of which must be filled by
  a digit of `D`, written `digits·house`, e.g. `14r5 27r6 147r8 12r9` (row 5
  supplies one of {1,4}, row 6 one of {2,7}, etc.).
- **Cover sets (links)**: the crossing houses that can *supply* those digits,
  e.g. `56c3 36c5 89c8 38c9`.
- **Truth count** `T` = number of base-set obligations (counting digit·house
  weight). **Link count** `K` = number of cover supplies.
- **Rank** = `K − T` (covers minus truths). MSLS requires **rank 0**: `T = K` —
  demands and supplies match exactly.
- **Loop cells**: the cells at base×cover incidences; in rank-0 MSLS each is
  either a **demand** (must take a `D` digit) or a **supply** (can provide one).

## 触发判定

```
choose subset D and base/cover collection
T = sum of truths (demands)         # e.g. |{14r5,27r6,147r8,12r9}| weighted
K = sum of links (supplies)         # e.g. |{56c3,36c5,89c8,38c9}|
require: rank == K - T == 0          # rank-0 set logic
require: each loop cell classifiable as exactly one of demand / supply
=> MSLS over (D, base, cover)
```

The disciplined `T == K` count (not guess-driven enumeration) is what makes the
pattern an MSLS rather than a trial.

## 消除/落子规则（全部情形）

In a rank-0 system demands and supplies match exactly, so any candidate that
reduces a supply without satisfying a demand is eliminable:

1. **Naked-side eliminations**: from each truth (demand) cell, remove every
   candidate **not** in `D` (those cells are locked to `D`).
2. **Hidden-side eliminations**: for each cover (link) house, remove every
   candidate of `D` that lies **outside** the locked set in that house (the
   subset digits are squeezed out of the rest of the supply house).
3. **General rank-0 rule**: eliminate any subset candidate whose placement would
   consume a supply while leaving some demand unmet — i.e. it lies outside the
   matched loop on a covered unit.
4. Eliminations only; placements follow when a cell drops to one candidate.

## 退化与边界

- `rank ≠ 0` (covers ≠ truths) is **not** an MSLS — a positive-rank set yields
  weaker or no eliminations and needs extra logic.
- If a loop cell is neither a clean demand nor a clean supply, the simple
  demand/supply accounting breaks and the pattern is not in canonical form.
- Community note: there is debate over the *exact* MSLS definition; some hold its
  value is the *process* for spotting rank-0 patterns, and that the found pattern
  should be reported in standard set-logic notation rather than the hybrid
  truth/link shorthand.
- Smaller rank-0 instances degenerate into named patterns (see relationships).

## 与其他技巧的关系

- MSLS is the general **rank-0 set-logic** pattern. It subsumes: simple fish,
  multi-fish, naked/hidden subsets, **Sue de Coq**, and **SK-Loops**.
- **SK-Loop ⊂ MSLS**: every SK-Loop implies an MSLS; SK-Loops are the
  first-discovered special case ("virus patterns"); "baby SK-Loop" on two digits
  = Steve K's **Hidden Pair Loops**.
- A set-addition/subtraction reformulation (add a column and a row, subtract the
  boxes) links MSLS to **Phistomefel's theorem** and Fred's intersection theory.
- Sits at the extreme tier after AIC and ALS, used on band/stack-symmetric
  bottlenecks of the hardest puzzles.

## Worked example

Canonical rank-0 MSLS (the enjoysudoku "Using MSLS" notation; candidate
fragment):

- Subset `D = {1,2,4,7}`.
- Base sets (truths): `14r5 27r6 147r8 12r9`.
- Cover sets (links): `56c3 36c5 89c8 38c9`.
- Truth count `T = 4` houses, link count `K = 4` houses → **rank 0**.

Eliminations (illustrative of the two behaviours):
- *Naked side*: in the truth rows' locked cells, strip every candidate not in
  `{1,2,4,7}`.
- *Hidden side*: in cover columns `c3,c5,c8,c9`, remove `{1,2,4,7}` candidates
  lying outside the matched loop cells — the subset is squeezed out of the rest
  of those columns.

**Verified — David P Bird Example 1** (ENJOYSUDOKU-MSLS forum thread):
Grid: `1......8......92....6.3...52....8.....5.7.....6.5....4..47...........91..3..6...7`
(dots → 0)

Home set `[1289]` / Away set `[34567]`; MS-NS `r35679c1678` (20 cells, rank 0).

Eliminations (21 candidates in 15 cells):
`2r1c6`, `8r2c1`, `47r3c2`, `4r3c4`, `1r4c7`, `9r4c8`, `4r5c2`, `346r5c4`, `36r5c9`,
`37r6c3`, `5r7c2`, `5r7c5`, `36r7c9`, `8r8c1`, `2r8c6`.

## Soundness

At rank 0 the number of cells that *must* receive a `D` digit (truths) equals the
number of independent houses that can *supply* a `D` digit (links). The loop
cells therefore form one locked set: every supply is consumed by exactly one
demand, with no slack. Placing a non-`D` digit in a truth cell would starve a
demand; placing a `D` digit outside the loop on a covered house would consume a
supply needed elsewhere — both contradict the exact balance. Hence both
elimination classes are forced. This is the same counting argument that
underlies fish and Sue de Coq, generalised across multiple sectors.

## Sources

ENJOYSUDOKU-MSLS
