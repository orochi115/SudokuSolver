---
id: technique.subset-exclusion
name_en: Subset Exclusion (with Subset Counting / Extended Subset Principle)
name_zh: 子集排除（含子集计数 / 扩展子集原理）
family: exotic
difficulty: extreme
strategyId: subset-exclusion
sources:
  - SUDOPEDIA-SUBSET-EXCLUSION
  - SUDOPEDIA-SUBSET-COUNTING
---

# Subset Exclusion (with Subset Counting / Extended Subset Principle)

## One-Sentence Rule

Enumerate every candidate combination of an arbitrary set of base cells; discard each combination that would leave some commonly-seen cell (or Almost Locked Set) with no candidate at all, and eliminate any candidate of a base cell that survives in none of the remaining combinations.

## 精确模式定义

**Subset Exclusion** generalises Aligned Pair Exclusion (APE) and Aligned Triple Exclusion (ATE): the base cells need **not** be aligned (need not see each other) at all.

- **Base set `B`** — a chosen set of `k` cells (`k ≥ 2`), each unsolved with its candidate list. The cells may be anywhere; alignment is optional.
- **Combination** — an assignment giving each base cell one of its own candidates: an element of `cand(B1) × cand(B2) × … × cand(Bk)`. There are `∏ |cand(Bi)|` combinations.
- **Aligned pair constraint** — for any two base cells that *see each other* (share a house), a combination assigning them the **same** value is illegal (two equal digits in one house) and is dropped immediately.
- **Witness set `W`** — the cells (or Almost Locked Sets) that are **commonly seen** by the relevant base cells, i.e. each witness is a peer of every base cell whose value can fill it. The simplest witness is a bivalue **buddy cell** `{a,b}`; an `n`-cell ALS on `n+1` digits is the general witness.
- A combination **empties a witness** `Y` iff the values it places into the base cells that `Y` sees cover **all** of `Y`'s candidates, leaving `Y` with nothing.

Cardinality: `|B| = k`; witnesses `|W| ≥ 1`; combinations `= ∏|cand(Bi)|`; a combination is *legal* iff it violates no aligned-pair constraint; *allowed* iff it is legal and empties no witness.

**Subset Counting (Extended Subset Principle)** is the dual counting form. For a selected cell set `S` (best chosen as an ALS) and each digit `d`, let `place(d)` = the **maximum number of cells of `S` that can simultaneously hold `d`**. The principle: `Σ_d place(d) ≥ |S|` always (a valid puzzle must fill all `|S|` cells); the configuration is interesting when `Σ_d place(d)` is `1` or `2` greater than `|S|` and one digit's count exceeds that surplus.

## 触发判定

Subset Exclusion fires for a base cell `Bi` and candidate `v`:

```
eliminate(Bi, v) :=
    ∀ combination C ∈ legalCombinations(B):
        ( C[Bi] == v )  ⇒  ( ∃ Y ∈ W : emptiesWitness(C, Y) )
```

i.e. **every** legal combination that assigns `v` to `Bi` empties some witness — so `v` survives in no allowed combination. Equivalently: build the list of *allowed* combinations (legal and emptying no witness); if value `v` of base cell `Bi` appears in none of them, eliminate it.

Subset Counting fires for a peer cell `z` and digit `d`:

```
eliminate(z, d) :=
    ( Σ_e place_after(e, "d removed from peers in S") )  <  |S|
```

i.e. placing `d` in `z` removes `d` from `z`'s peers inside `S`, dropping `place(d)` enough that the total maximum placement falls **below** `|S|` — impossible, so `z ≠ d`. (Focus on peers for which removing `d` drops the column-sum below `|S|`.)

## 消除/落子规则（全部情形）

1. **Subset Exclusion elimination.** For each base cell `Bi`, eliminate every candidate `v` that occurs in no allowed combination. Targets: candidates of the base cells themselves. (Multiple base cells and multiple values may be eliminated from one analysis.)

2. **Subset Counting elimination.** For each peer `z` of the selected set `S` and digit `d`, eliminate `d` from `z` when assigning `z = d` forces `Σ place < |S|`. Targets: candidates of peers of `S` (not necessarily in `S`).

3. **Boundary case `Σ place == |S|`.** No elimination, but the set is fully determined — exactly one way to fill `S`; this can itself yield placements (treat as a locked set).

4. **No standalone result.** If every value of every base cell survives in at least one allowed combination, the pattern yields nothing here (but the surviving-combination table can seed an AIC link).

## 退化与边界

- **`k = 2`, base cells aligned → Aligned Pair Exclusion (APE) Type 1.** `k = 2` not aligned → APE Type 2 (equal values allowed in both cells, changing the bookkeeping). `k = 3` → Aligned Triple Exclusion (ATE). Larger / unaligned `k` → Subset Exclusion proper.
- **Death Blossom is a special case:** Subset Exclusion where all but one of the enumerated cells fall neatly into Almost Locked Sets (the "petals"), with the remaining "stem" cell linking them.
- **Subset Counting replicates** XY-Wing, XYZ-Wing, WXYZ-Wing, APE, ATE and ALS-XZ — those named techniques are corollaries provable directly from the Extended Subset Principle.
- **Σ place < |S| is impossible** in a valid puzzle; if you ever compute it, you mis-counted (or the grid is already broken).
- **Combinatorial blow-up:** the number of combinations is the product of candidate-counts; this is why both forms are reserved for the hardest puzzles and are rarely scanned by hand for `k > 3`.
- **Witness must be fully seen:** a witness only constrains a combination via the base cells it actually sees; a base cell that does not see `Y` cannot empty it.

## 与其他技巧的关系

- **Aligned Pair / Triple Exclusion:** the `k = 2` / `k = 3` aligned specialisations; Subset Exclusion drops the alignment requirement and the size cap.
- **Death Blossom:** the ALS-structured special case (petals = ALS, stem = remaining cell).
- **ALS-XZ / ALS chains:** Subset Counting on ALSs reproduces ALS-XZ eliminations.
- **XY-/XYZ-/WXYZ-Wing:** all are Subset-Counting / Extended-Subset-Principle corollaries (the Sudopedia worked example's selected cells literally form a WXYZ-Wing).
- **Naked/Hidden Subsets:** the `Σ place == |S|` boundary is the locked-set / hidden-subset situation.
- **Workflow placement:** an extreme, last-resort-tier subset/ALS-interaction method; it overlaps heavily with ALS and wing eliminations, so it sits very late — after ordinary ALS/AIC and Sue de Coq — as a generalised fallback rather than a routine scan.

## Worked example

Primary example — faithful reproduction of the cited Sudopedia "Subset Exclusion" article (`SUDOPEDIA-SUBSET-EXCLUSION`). The source presents it as an abstract candidate scenario (no 81-char grid in the source); the enumeration below is reproduced and independently re-verified.

Base set (3 cells; treat as mutually visible, e.g. a row triple): `C1 = {5,7}`, `C2 = {2,6,7,9}`, `C3 = {4,6}` — in the source, the eliminated cell `C2 = r2c4`.

All legal (all-distinct, since aligned) combinations of `(C1, C2, C3)`:

```
5+2+4    5+2+6    5+6+4    5+7+4*   5+7+6*   5+9+4*   5+9+6*
7+2+4    7+2+6    7+6+4    7+9+4    7+9+6
```

The starred combinations (`5+7+4, 5+7+6, 5+9+4, 5+9+6`) are exactly those that empty a commonly-seen witness cell. Explicitly, two bivalue witnesses both seen by `C1` and `C2` reproduce the source's starred set:
- `Y_a = {5,7}` — emptied by any combination placing `5` in `C1` and `7` in `C2`;
- `Y_b = {5,9}` — emptied by any combination placing `5` in `C1` and `9` in `C2`.

Removing the four starred combinations leaves the allowed list:

```
5+2+4   5+2+6   5+6+4   7+2+4   7+2+6   7+6+4   7+9+4   7+9+6
```

In the allowed list, `C2` takes only `{2,6,9}` — never `7`. **Elimination: `C2 (r2c4) ≠ 7`.** (Verified by exhaustive enumeration: the starred set, and the surviving `C2` value-set `{2,6,9}`, match the source exactly.)

Secondary example — Subset Counting (faithful to `SUDOPEDIA-SUBSET-COUNTING`, abstract in source): select 4 cells `S` with candidates among `{4,5,7,8}` where `place(4)=2` (r3c2,r9c1), `place(5)=1`, `place(7)=1`, `place(8)=1`, so `Σ place = 5 = |S| + 1`. A peer (blue) cell taking `4` removes `4` from r3c2, r9c1, r9c2, dropping `place(4)` from `2` to `0` (decrease `2`): `Σ` becomes `5 − 2 = 3 < 4 = |S|` — impossible, so the blue cell `≠ 4`. (Removing `4` from r5c2 only drops `Σ` by `1` to `4 = |S|`, which is not yet a contradiction, so no elimination there.) The selected cells form a WXYZ-Wing, which gives the same elimination.

FLAG — CONSTRUCTED: the explicit witness cells `Y_a = {5,7}`, `Y_b = {5,9}` above are a constructed realisation that reproduces the source's published starred set; the source itself shows only the combination list and the conclusion (`7` eliminated from `r2c4`), not the underlying grid or the exact witness candidates. No fully self-contained 81-char grid is supplied because a faithful grid-embedded instance depends on the exact post-basics candidate state, which the cited sources do not publish.

## Soundness

**Subset Exclusion.** In any solution, the base cells `B` take some legal combination of their candidates (legality = the basic Sudoku rule that mutually-seeing cells differ). A combination that empties a witness cell/ALS `Y` cannot occur in any solution, because `Y` would have no value — a contradiction. Hence the solution's combination is one of the *allowed* combinations. If a candidate `v` of base cell `Bi` appears in **no** allowed combination, then `Bi = v` is incompatible with every possible solution, so `v` can be eliminated. The argument is purely a case analysis over a finite combination set plus the witness non-emptiness constraint; it uses **no** uniqueness assumption.

**Subset Counting (Extended Subset Principle).** For a cell set `S`, every solution fills all `|S|` cells with distinct-within-house values, so summing, over digits, the number of cells of `S` holding each digit equals `|S|`; since each digit can occupy at most `place(d)` cells of `S`, we have `Σ_d place(d) ≥ |S|` in every solution. Any candidate whose placement would force `Σ_d place(d) < |S|` therefore cannot be part of a solution and is eliminated. The named wing/ALS techniques arise as instances where `Σ place = |S| + 1` and a single peer collapses the surplus.

## Sources

- `SUDOPEDIA-SUBSET-EXCLUSION` — Sudopedia (mirror), "Subset Exclusion" http://sudopedia.enjoysudoku.com/Subset_Exclusion.html (orig. sudopedia.org/wiki/Subset_Exclusion; GFDL 1.2)
- `SUDOPEDIA-SUBSET-COUNTING` — Sudopedia (mirror), "Subset Counting" http://sudopedia.enjoysudoku.com/Subset_Counting.html (orig. sudopedia.org/wiki/Subset_Counting; GFDL 1.2)
