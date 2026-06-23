---
id: technique.aligned-exclusion
strategyId:
  - aligned-pair-exclusion
  - aligned-triple-exclusion
name_en: Aligned Pair/Triple Exclusion
name_zh: 对齐数对/三数排除 (APE/ATE)
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-APE
---

# Aligned Pair/Triple Exclusion (APE/ATE)

## One-Sentence Rule

Enumerate every candidate combination a base set of two (APE) or three (ATE)
cells could take; cross out any combination that would empty a cell or Almost
Locked Set the whole base sees, and any digit surviving in no remaining
combination is eliminated from its base cell.

## 精确模式定义

- **Base set** `K`: a set of cells, `|K| = 2` (APE) or `|K| = 3` (ATE). The
  cells are "aligned" when they lie pairwise in a common house (so they
  additionally cannot repeat a value).
- **Candidate combination**: an assignment of one distinct candidate to each
  cell of `K`, where cell `k` is assigned a value from `cand(k)`. A combination
  is `(d1, …, d|K|)` with `di ∈ cand(Ki)`.
- **Common ALS** `A`: an Almost Locked Set (a set of `m` cells whose candidate
  union has size `m + 1`) such that *every* cell of `K` sees *every* cell of
  `A`. The minimal ALS is a single **bivalue cell** (`m = 1`, two candidates)
  seen by all base cells.
- A combination "**kills**" an ALS `A` if the combination's assigned digits
  occupy all but the last degree of freedom of `A` — i.e. they cover `|A|`
  distinct candidates of `A`'s `(|A|+1)`-value union, leaving `A` with no legal
  value. For a bivalue buddy `{x,y}`, the killing combinations are exactly those
  assigning `x` to one base cell and `y` to another (or to the only base cell
  that sees, in Type-2 bookkeeping).

## 触发判定

```
choose base K (|K| ∈ {2,3})
combos = { (d1..dk) : di ∈ cand(Ki) }
# alignment filter:
for each combo: if two base cells share a house and got the same digit -> drop
# ALS-kill filter:
for each common ALS A (seen entirely by all base cells):
    for each combo: if combo covers |A| distinct values of cand(A) -> mark excluded
allowed = combos not dropped and not excluded
# elimination test:
for each base cell Ki, for each value d in cand(Ki):
    if no allowed combo assigns d to Ki:  eliminate d from Ki
```

APE/ATE fires iff at least one base candidate appears in zero `allowed`
combinations.

## 消除/落子规则（全部情形）

1. **Surviving-elimination** (the only output): for each base cell `Ki` and each
   `d ∈ cand(Ki)`, if every `allowed` combination omits `d` at `Ki`, remove `d`
   from `Ki`.
2. **Aligned-pair self-exclusion** (Type 1): when two base cells share a house,
   any combination repeating a digit between them is dropped *before* ALS
   testing — this alone can eliminate.
3. **Multiple-ALS accumulation**: combinations may be excluded by *different*
   common ALSs; all exclusions accumulate before the surviving test.
4. **No placement**: APE/ATE never directly places a digit; it only prunes
   candidates from the base cells (a placement may follow if a base cell drops to
   one candidate).

## 退化与边界

- **Type 1 vs Type 2**: Type 1 base cells see each other → cannot share a value
  (extra exclusions). Type 2 base cells do not see each other → identical
  candidates in both are allowed, so the same-unit drop does not apply and only
  ALS-kills exclude.
- If no cell/ALS is seen completely by *all* base cells, there is nothing to
  exclude → no fire.
- A common bivalue cell with candidates not appearing in the base set excludes
  nothing.
- ATE combinatorics grow as `∏|cand(Ki)|`; this is why it is rare by hand. With
  3 trivalue cells that is up to 27 combinations to test.
- If *every* combination is excluded, the puzzle is contradictory (a backtrack
  signal), not a normal APE.

## 与其他技巧的关系

- **APE/ATE ⊂ Subset Exclusion** (the general name on SudokuWiki); both are
  instances of **ALS-interaction** logic.
- A single-ALS APE is reproducible as an **ALS-XZ** or short **AIC** through the
  common ALS; APE is the brute-combination framing of the same inference.
- Overlaps with **Sue de Coq** when the base pair sits at a box-line
  intersection and the common sets are the line/box wings.
- Placed late in a workflow (after ALS/AIC and SdC) because its eliminations are
  usually also reachable by those cheaper methods.

## Worked example

**Verified — SudokuWiki APE Type 1** (Example 1, From the Start):
Grid: `090000040030040700000670003200900506006000100104008007700091000009030050060000070`

- Base pair `G2/G3`; combo enumeration kills all pairings with 8 → `r7c2<>8`,
  `r7c3<>8`.

**Verified — SudokuWiki APE Type 2** (Example 4, From the Start):
Grid: `004003600000040002900600005700500030000367000050004001200005009500010000003200800`

- Non-aligned pair `A4/B1`; `r2c1<>8`.

**Verified — SudokuWiki APE Example 3** (From the Start):
Grid: `000000370706000000000102009007030500530406028004010900600305000000000403083000000`

- 3-cell ALS attack on `A3/B3` → `r2c3<>7`.

**Verified — SudokuWiki APE Example 6** (From the Start):
Grid: `000000106002590000308040000080000070000204000090070040000050603000038900105000000`

- Bi-value + 3-cell ALS → `r4c1<>6`.

**Verified — Brenner 8-cell APE** (SudokuWiki Load Example `S9B`, restored state):
Givens: `072080640096700800008600001000300084681000000004058060210839406840200013063001008`

Base pair `D5/E5`; eight ALS cells cross-reference all pairings ⇒ **`r4c5<>1`**, **`r5c5<>4`**
(at the Load Example candidate state; diagram also marks 3 on both cells but those are absent
from the decoded `S9B` masks).

## Soundness

Each `allowed` combination is a candidate state the base set could genuinely
realise without immediately emptying a fully-seen ALS or repeating a digit
between aligned cells. If a digit `d` at base cell `Ki` never co-occurs with any
completion that leaves all common ALSs alive, then placing `d` at `Ki` forces a
common ALS to lose its last value — a contradiction. Hence `d` can be removed
soundly. The argument is exhaustive over the finite combination space, so it is
complete for the chosen base and common sets.

## Sources

SUDOKUWIKI-APE
