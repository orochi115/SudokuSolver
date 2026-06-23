---
id: technique.finned-sashimi-fish
name_en: Finned & Sashimi Fish (X-Wing / Swordfish / Jellyfish)
name_zh: 鳍鱼与寿司鱼（X翼 / 剑鱼 / 水母）
family: fish
difficulty: diabolical
strategyId:
  - finned-x-wing
  - finned-swordfish
  - finned-jellyfish
  - sashimi-x-wing
  - sashimi-swordfish
  - sashimi-jellyfish
sources:
  - SUDOKUWIKI-FINNED-XWING
  - SUDOKUWIKI-FINNED-SWORDFISH
  - SUDOPEDIA-FINNED-FISH
  - SUDOPEDIA-FISH
---

# Finned & Sashimi Fish / 鳍鱼与寿司鱼

## One-Sentence Rule

A finned fish is a basic fish that *almost* holds, spoiled by a few extra candidates of the digit ("the fin") confined to one box; you may still eliminate the digit from any cell that the plain fish would clear AND that also sees every fin cell — which in practice are the cells sharing that box with the fin.

## 精确模式定义 (Exact pattern definition)

Fix digit `d`, base orientation, and size `N ∈ {2,3,4}`.

- **Core fish**: an N-line base set `B` whose `d`-candidates would line up on N cover lines `C` — *except* that one or more extra base candidates exist outside the cover set.
- **Fin**: the set of base candidates that lie outside `C`. Constraint: **all fin cells must lie in a single box** (Sudopedia: "extra candidates in a single box"). A fin may be one cell or several cells in that box ("big fin"); all must sit in one box and in a base line.
- **Reduced fish**: if the fin candidates are deleted, `B`/`C` form a *proper* basic fish (the containment `|⋃ posⱼ| = N` then holds). The fin is precisely what breaks that equality.
- **Finned vs. Sashimi**:
  - **Finned**: the box that holds the fin *also* contains a genuine corner of the underlying fish (the fish cell in that box still carries `d`).
  - **Sashimi**: that corner is *missing* — the fish cell in the fin's box has no `d` (it is a clue or already eliminated). Removing the fin would leave a *degenerate* fish (a corner gone), so the pattern only works because of the fin. Sashimi is "finned fish without candidates for the basic pattern in the box containing the fin" (Sudopedia Fish).
- **Cardinality**: `|B| = |C| = N`; fin size ≥ 1; all fins in one box.

## 触发判定 (Detection predicate)

For each base orientation, size `N`, and N-subset `B` of base houses:

1. Compute per-line candidate positions `posⱼ` (perpendicular indices) for digit `d`.
2. Try every cover set `C` of N perpendicular houses such that the candidates NOT covered by `C` (`fin = ⋃ⱼ posⱼ-cells outside C`) are **all inside one single box**, and `fin` is non-empty.
3. Require that ignoring `fin`, the remaining base candidates satisfy the basic-fish containment on `C` (each base line still contributes, no line emptied below the structural minimum — note in Sashimi one base line may now hold only the fin's box-mate, which is allowed).
4. Compute the candidate elimination set (below); fire only if it is non-empty.

A finned fish with an empty fin is just a basic fish; with fin spanning ≥2 boxes it is invalid (no single box sees all fins → no eliminations, see boundaries).

## 消除/落子规则（全部情形）(Elimination rule — all cases)

Only eliminations, never placements.

- **Base target set of the reduced fish** `T₀` = cover cells of `C` not in any base line, carrying `d` (the cells a *plain* fish would clear).
- **Fin-visibility filter**: keep only cells of `T₀` that **see every fin cell** — i.e. share a house (box / row / column) with *all* fin cells simultaneously.
- Because all fins lie in one box, the surviving targets are exactly the cells **in that fin box** that also lie on a cover line (and may additionally include cells sharing a cover line *and* the fin's row/column with the fin when the fin is a single cell).
- **Action**: remove `d` from every surviving target cell.

Rule statement (SudokuWiki Finned X-Wing): *"If you can form an X-Wing by ignoring the fin cells, then you can keep your elimination of any cell that shares the same unit as all the cells in the fin."* Sudopedia Finned Fish: *"we can only eliminate in cells that we could eliminate with respect to the fish pattern and that can see all fins"*, and *"the eliminated candidates can only be within the box containing the fin."*

Cases by size — identical logic, larger footprint:
1. **Finned/Sashimi X-Wing** (N=2): reduced X-Wing + fin in one box → eliminate `d` from the fish's cover cell(s) lying inside the fin box.
2. **Finned/Sashimi Swordfish** (N=3): reduced Swordfish + fin in one box → same, restricted to the fin box.
3. **Finned/Sashimi Jellyfish** (N=4): reduced Jellyfish + fin in one box → same.

## 退化与边界 (Degeneracy & boundaries)

- **Fin spanning >1 box ⇒ no elimination**: no cell can see all fins at once, the target set is empty, pattern discarded.
- **Empty fin ⇒ ordinary basic fish** (handled by `fish-base-cover.md`); emit that instead.
- **Sashimi = missing corner**: the box holding the fin lacks the underlying fish candidate. Removing the fin leaves a 2-corner "X-Wing" that is really a single conjugate-pair plus a leftover — i.e. degenerate. The elimination is still valid because the chain "fin true OR fish true" both clear the same target. Many sashimi X-Wings are equivalent to a **2-String Kite / Skyscraper / Turbot Fish** (a short single-digit AIC); see relationships.
- **Cannibalistic target**: if a surviving target cell is itself a base candidate of the fish, the elimination is still valid (the cell is consumed by its own pattern) — rare for line-only finned fish, more common in Franken/Mutant.
- **Finned fish degenerating to Locked Candidates**: if the "reduced fish" is itself only a Pointing/Claiming pattern, prefer the simpler technique.

## 与其他技巧的关系 (Relationships)

- **Generalises basic fish** (`fish-base-cover.md`): a finned fish with no fin *is* the basic fish.
- **Sashimi X-Wing ≡ single-digit chains**: 2-String Kite, Skyscraper, Turbot Fish are sashimi/finned X-Wings expressed as AIC (SudokuWiki Swordfish comment: "a Finned X-Wing is a 2-string Kite ... a simple AIC chain a=b-c=d with a group node in one corner").
- **Subsumed by Franken/Mutant fish** when the fin's box is promoted into the cover/base set (`franken-mutant.md`).
- **Big fin** = multi-cell fin in one box; same rule, no new technique.

## Worked example

Source: SudokuWiki "Finned X-Wing" — Sashimi example (grid from the page's "From the Start" link).

Grid (81 chars, row-major, '0' = empty):

```
300002500000080060080700041700001300000070000008200005510008020030090000004500009
```

- **Digit**: `4`.
- **Reduced X-Wing** on `4` with a corner missing in box 5 (D6 is a clue / never a candidate → **sashimi**).
- **Fin**: cells D4 and D5 (both in box 5, on base row D).
- **Elimination**: remove `4` from E6 and F6 — they share box 5 with the fins AND lie on the cover column 6. (Per source: either `4` sits in {D4,D5} clearing E6/F6 by the box, or the plain X-Wing holds and clears them by column.)

FLAG: base/cover line identities and the exact eliminated cells are paraphrased from the SudokuWiki page; **needs engine verification** against the loaded grid.

Second example — Finned/Sashimi Swordfish (SudokuWiki "Finned Swordfish", *Finned Sashimi Example 2*, "From the Start" grid):

```
420000095000000000001903400060802010042010980090406030007604800000000000680000041
```

- **Digit**: `7`. Reduced Swordfish (1-2-2 row formation) with a double fin at A4 & A5 (one box). **Elimination**: `7` removed from A6 (the cover cell inside the fin box).

FLAG: needs engine verification.

## Soundness

Consider the disjunction forced by the fin's box: either (a) the digit `d` is placed on one of the fin cells, or (b) it is not. In case (b), the fin candidates are false, so the reduced base/cover sets form a genuine basic fish, whose normal eliminations hold. In case (a), `d` occupies a fin cell, so every cell seeing that fin cell loses `d`. A target cell that is BOTH a fish-elimination AND sees every fin is cleared in case (a) and in case (b) — hence in all worlds. The conjunction "fish-target ∧ sees-all-fins" is exactly the rule; eliminating only those cells removes solely impossible candidates. Sashimi is the same proof with the reduced fish degenerate but the disjunction intact.

## Sources

- SUDOKUWIKI-FINNED-XWING — `markdown/sudokuwiki/finned_x_wing.md`
- SUDOKUWIKI-FINNED-SWORDFISH — `markdown/sudokuwiki/finned_swordfish.md`
- SUDOPEDIA-FINNED-FISH — `markdown/sudopedia/finned_fish.md`
- SUDOPEDIA-FISH — `markdown/sudopedia/fish.md`
