---
id: technique.fish-base-cover
name_en: Basic Fish (X-Wing / Swordfish / Jellyfish)
name_zh: 基础鱼（X翼 / 剑鱼 / 水母）
family: fish
difficulty: tough
strategyId:
  - x-wing
  - swordfish
  - jellyfish
sources:
  - SUDOKUWIKI-XWING
  - SUDOKUWIKI-SWORDFISH
  - SUDOKUWIKI-JELLYFISH
  - SUDOPEDIA-FISH
  - HODOKU-BASIC-FISH
---

# Basic Fish — X-Wing / Swordfish / Jellyfish / 基础鱼

## One-Sentence Rule

For a single digit, if N parallel lines (the **base set**, all rows or all columns) hold every candidate of that digit inside exactly N perpendicular lines (the **cover set**), then the digit can be removed from every cover-set cell that is not also in a base line.

`N = 2` → X-Wing · `N = 3` → Swordfish · `N = 4` → Jellyfish.

## 精确模式定义 (Exact pattern definition)

Fix one digit `d`.

- **Base set** `B`: a set of N houses, all of the same orientation — either N rows or N columns. (In *basic* fish the base set is purely line-based; box-containing variants are Franken/Mutant, a separate card.)
- **Cover set** `C`: a set of N houses of the *perpendicular* orientation (columns if base = rows; rows if base = columns).
- **Base candidates**: all cells in `B` that still carry `d`.
- **Cover constraint (containment)**: every base candidate lies in some cover house — i.e. the set of perpendicular indices occupied by `d` across the base lines is a subset of the N cover indices. Equivalently, the union of base candidates' perpendicular coordinates has size ≤ N.
- **Cardinality**: `|B| = |C| = N`, with `N ∈ {2, 3, 4}` on a 9×9 grid.
- **Coverage / non-degeneracy**: across the N base lines `d` occupies *exactly* N distinct cover indices (if it occupied fewer than N, the fish collapses — see 退化与边界). Each base line must contain ≥ 2 candidates of `d`. (A base line with a single `d` makes that cell a Hidden Single; the fish is then unnecessary.)
- **Fin-free**: every base candidate is inside the cover set — no leftover candidates. (If exactly one box's worth of base candidates falls outside, it is a *finned/sashimi* fish — separate card.)

Term glossary:
- *base line* — one of the N parallel houses scanned for the digit.
- *cover line* — one of the N perpendicular houses the candidates line up on.
- *eliminations* — cover-cell candidates of `d` that are not in any base line.

## 触发判定 (Detection predicate)

Choose orientation `o ∈ {rows, cols}` for the base set and a size `N ∈ {2,3,4}`. For each N-subset `B` of houses of orientation `o`:

1. `posⱼ = { perpendicular index k : cell(baseⱼ, k) has candidate d }` for each base line `baseⱼ ∈ B`.
2. Require `2 ≤ |posⱼ| ≤ N` for every `j` (a base line with 0 or 1 candidate is excluded).
3. Let `cover = ⋃ⱼ posⱼ`. The pattern fires iff `|cover| == N`.
4. `B` and the cover houses `C = { perpendicular house k : k ∈ cover }` form a basic fish of size N.

Pruning: a base line that already overlaps an X-Wing/Swordfish need not be re-tried at the larger size; search smallest N first.

## 消除/落子规则（全部情形）(Elimination rule — all cases)

Fish never place a digit; they only eliminate.

- **Target set** = `{ cell : cell lies in some cover house in C, AND cell is not in any base house in B, AND cell has candidate d }`.
- **Action**: remove `d` from every cell in the target set.

By orientation (6 enumerable cases, but only 2 are non-trivial for basic fish):

1. Base = 2/3/4 rows, cover = same count of columns → eliminate `d` from those columns in all *other* rows.
2. Base = 2/3/4 columns, cover = same count of rows → eliminate `d` from those rows in all *other* columns.

(The remaining row↔box and column↔box "generalisations" are exactly Pointing/Claiming = Locked Candidates, and are excluded from this card — see SudokuWiki "Generalising X-Wing".)

Soundness of targeting: because all `d` in the base lines are confined to the N cover lines, and each base line must hold a `d`, by the pigeonhole/permutation argument the N cover lines must absorb all N of those placements among the base intersections — leaving no room for `d` elsewhere on a cover line.

## 退化与边界 (Degeneracy & boundaries)

- **Collapse (`|cover| < N`)**: if the union of base positions is smaller than N, the candidates are over-confined; this is not a fish of size N but a smaller structure (e.g. an X-Wing hiding inside a would-be Swordfish, or a Locked Candidate). Detect at the smaller N first.
- **Swordfish/Jellyfish need not fill every cell**: a Swordfish needs `d` spread over a 3×3 footprint but each line may hold only 2 of the 3 cover columns (formations 3-3-3, 3-3-2, 3-2-2, 2-2-2, etc.; SudokuWiki). Same for Jellyfish (e.g. 2-3-3-2). Only the *union* must equal N.
- **A base line reduced to a single `d`** is a Hidden Single — solve it directly rather than as a fish.
- **Why no Squirmbag (5) / Whale (6) / Leviathan (7)+ on 9×9**: a fish of size N on N base lines is logically identical (by complementation) to a fish of size `9 − N` on the other lines. So size 5 ≡ size 4 (Jellyfish), size 6 ≡ size 3 (Swordfish), etc. Every basic fish ≥ 5 is the mirror of a fish ≤ 4 already found. Hence basic fish are capped at N = 4. (SudokuWiki Jellyfish: "Naked quints are the same as hidden quads"; Sudopedia Fish.)

## 与其他技巧的关系 (Relationships)

- **Subset duality**: a fish on a digit is the transpose of a Naked/Hidden Subset reading. A 2-2-2 Swordfish is also expressible as an X-Cycle / continuous AIC on the conjugate links (see SudokuWiki Swordfish comments).
- **X-Wing ⊂ Swordfish ⊂ Jellyfish** as the same base/cover model at growing N.
- **Box-containing "X-Wing" = Locked Candidates** (Pointing/Claiming), so those are excluded here.
- **Finned/Sashimi fish** generalise these by allowing one box of leftover base candidates (separate card `finned-sashimi.md`).
- **Franken/Mutant fish** generalise by admitting boxes into base/cover sets (separate card `franken-mutant.md`).

## Worked example

Source: SudokuWiki "Jelly Fish Strategy", *Jellyfish Example* (grid copied from the page's "From the Start" link).

Grid (81 chars, row-major, '0' = empty):

```
000000000003024609000036501024067905000000000075041203001093704009005100000000000
```

- **Digit**: `7`.
- **Base set**: rows B, D, E, H (rows 2, 4, 5, 8).
- **Cover set**: columns 1, 5, 7, 9 — formation 2-3-3-2 (`d` occupies, in total, exactly those four columns across the four base rows).
- **Eliminations**: candidate `7` removed from all cells of columns 1, 5, 7, 9 that are NOT in rows B/D/E/H (18 eliminations of `7`, per the source).

FLAG: cell-level base coordinates and the exact 18 elimination cells are paraphrased from the SudokuWiki page text and **need engine verification** against the loaded grid.

Smaller cross-check — X-Wing (SudokuWiki "X-Wing Strategy", Example 2 "From the Start"):

```
000000004760010050090002081070050010000709000080030060240100070010090045900000000
```

- **Digit**: `2`. **Base set**: columns 5 and 8; candidate `2` appears exactly twice in each, lining up on rows E and J. **Cover set**: rows E, J.
- **Eliminations**: remove `2` from the other cells of rows E and J (the source states six 2s are removed).

## Soundness

Within the N base lines, digit `d` must be placed once per line (each base line has a `d` and `d` is unique per house). All those candidates lie in the N cover lines, so the N forced placements consume one cover line each (a perfect matching across the base∩cover intersections). Therefore no cover line can host `d` anywhere outside the base lines; eliminating those candidates removes only candidates that can never be true. The argument is exact and contradiction-free, independent of which permutation of placements is the real one. Larger sizes (≥5) are sound but redundant by complementation, so are not emitted.

## Sources

- SUDOKUWIKI-X-WING — `markdown/sudokuwiki/x_wing_strategy.md`
- SUDOKUWIKI-SWORDFISH — `markdown/sudokuwiki/sword_fish_strategy.md`
- SUDOKUWIKI-JELLYFISH — `markdown/sudokuwiki/jelly_fish_strategy.md`
- SUDOPEDIA-FISH — `markdown/sudopedia/fish.md`
- HODOKU-BASIC-FISH — `markdown/hodoku/` (basic-fish reference, pre-existing)
