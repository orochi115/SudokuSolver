---
id: technique.multi-coloring
name_en: Multi-Coloring
name_zh: 多重染色法
family: coloring
difficulty: diabolical
strategyId: multi-coloring
sources:
  - SUDOPEDIA-X-COLORS
  - HODOKU-COLORING
  - SUDOKUWIKI-SIMPLE-COLOURING
---

# Multi-Coloring / 多重染色法

## One-Sentence Rule

For a single digit, color two (or more) independent conjugate-pair clusters with separate color pairs and exploit weak links *between* clusters — or "promote" cells across weak links with a single color pair (X-Colors) — to eliminate the digit anywhere that is forced false in every surviving case.

## 精确模式定义

All work is single-digit on digit `d`, in the conjugate-pair graph `G_d` (vertices = `d`-candidates, edges = conjugate pairs / strong links). Two presentations of the same idea:

**(1) Multi-Colors (HoDoKu presentation — two color pairs).**
- Two *disjoint* clusters of `G_d`. Cluster 1 is 2-colored **A1 / B1**; cluster 2 is 2-colored **A2 / B2**. Within each pair exactly one color is the true set (as in Simple Coloring).
- **Weak link between clusters:** a pair of cells, one from each cluster, that share a house but are NOT a conjugate pair (so they are not joined by a strong-link edge). They cannot both be true.

**(2) X-Colors (Sudopedia presentation — one color pair + promotion).**
- A single color pair **A / B** seeded on one conjugate pair, expanded along strong links (Steps 1–2, = Simple Coloring), then **augmented by promotion (Step 3):** if, in some house, every `d`-candidate cell except one is a peer of cells colored the *same* color (say A), the lone "Exception Cell" is also colored **A** (same color, not opposite — that is the key difference from Step 2). Promotion is iterated to a fixed point. This bridges weak links using only two colors and reaches everything Multi-Colors reaches (and more).
- Result: three classes — A, B, uncolored — with the cluster-truth semantics: *if any A is true, all A are true; if any A is false, all B are true.* (Note: A-true and B-true are not strict complements once promotion is used — both can be false locally — but "one full color set is the solution set" still holds.)

## 触发判定

**Multi-Colors (two pairs):**
- **Type 1:** ∃ a cell `z` (holding `d`) that sees the two *opposite-of-linked* colors. Concretely, if A1-cell and A2-cell share a house (weak link), then any `z` seeing a **B1** cell and a **B2** cell can be eliminated.
- **Type 2:** ∃ two cells of the **same** color (say color X) such that one sees an A2 cell and the other sees a B2 cell (the two opposite colors of the *other* pair).

**X-Colors (one pair + promotion), fire when after Steps 1–3:**
- **4.1 (trap):** some cell has ≥2 peers colored with **both** A and B.
- **4.2 (wrap):** ≥2 cells of the same house are colored the **same** color.
- **4.3 (house-empty, rare):** in some house, **all** `d`-candidate cells are peers of cells of one single color.

## 消除/落子规则（全部情形）

**Multi-Colors Type 1.** Linked pair A1–A2 share a house ⇒ A1 and A2 cannot both be true ⇒ at least one of {B1, B2} is the true set of its cluster. Therefore any cell seeing a **B1 cell and a B2 cell** must be false ⇒ **eliminate `d`** from every such cell. (HoDoKu mc01: r1c7=color1b sees r2c9=color2b in block 3; r5c2, r5c3 see both opposite colors → remove 1.)

**Multi-Colors Type 2.** Two same-color cells (color 1b, say r6c2 and r8c6) each see an opposite color of the *other* pair (r6c9=2b and r2c6=2a). Since one of 2a/2b is true, one of the two color-1b cells must be false; as they share color 1b, **all color-1b cells are false** ⇒ eliminate `d` from every color-1b cell. (落子: the opposite color 1a is then the true set.)

**X-Colors 4.1 (trap).** Cell with peers of both A and B ⇒ **eliminate `d`** from that cell (same logic as Simple Coloring Color Trap, but the reachable colors may have come via promotion).

**X-Colors 4.2 (wrap).** Two same-color cells (color A) in one house ⇒ that color cannot be the true set ⇒ **the OTHER color B is TRUE**; place `d` in all B cells. ⚠ You may NOT conclude all A are false (with promotion the strict complement does not hold) — only that **B is true.**

**X-Colors 4.3 (house emptied).** If a house has no cell left that can take color A (all its `d`-cells are peers of color A) ⇒ A cannot be true ⇒ **the other color B is TRUE**; place `d` in all B cells.

Targets are always candidate `d`.

## 退化与边界

- **One cluster, no promotion ⇒ Simple Coloring.** Multi-Coloring strictly extends it (HoDoKu: Multi-Colors = X-Chains power; Sudopedia: "Step 3 makes the difference").
- **HoDoKu limit:** HoDoKu's Multi-Colors implements only **two color pairs**, so it misses X-Chains needing 3+ clusters. X-Colors (one pair + promotion) has no such limit and covers all of Multi-Colors plus extra positions.
- **Nishio caution:** Sudopedia notes promotion can occasionally reach Nishio-strength single-digit reasoning — still purely a static-pattern deduction, but powerful.
- **Wrap gives only one direction:** in X-Colors, contradiction on color A proves **B true**, never "A all false" (because promotion broke strict complementarity).
- **No cross-pair "same color" trap:** A1 and A2 are different colors with no shared truth set; do not treat them as one color.
- **Deprecated label:** SudokuWiki marks "Multi-Colouring" deprecated because simpler/equivalent strategies (X-Cycles, X-Colors) cover it; the *logic* is live and is the standard way to find these single-digit eliminations by hand.

## 与其他技巧的关系

- **Subsumes:** Simple Coloring (drop Step 3 / use one cluster), X-Wing (Sudopedia: X-Colors "makes the same eliminations as X-Wing"), and — augmented with Pointing Pair — Empty Rectangle.
- **Family note:** X-Colors / Weak Colors / Multi-Colors / Color Wing / Supercoloring are all the *same single-digit coloring family* at increasing cluster/promotion counts; they are subsumed here (multi-digit coloring is the separate `3d-medusa.md`).
- **Equivalent power:** HoDoKu — Multi-Colors ≡ X-Chains. Sudopedia — X-Colors ≡ Multi-Colors ∪ (extra). All are special cases of X-Cycles / AIC on a single digit.

## Worked example

**Source: Sudopedia X-Colors, Example 1 (Multicolors case) — CITED, candidate state described, not grid-pixel-verified (FLAG).**

Digit **2**. Conjugate pair seeded: **r9c2 = Blue**, **r9c8 = Green** (Step 1). Step 2 adds nothing.

- **Step 3 promotion:** **r2c1** is the only cell in its box that is *not* a peer of the blue r9c2, so r2c1 is colored **Blue** (same color). No further promotion.
- **Step 4.1 (trap):** **r2c8** holds candidate 2 and is a peer of **r2c1 (Blue)** (row 2) and of **r9c8 (Green)** (column 8) ⇒ **eliminate 2 from r2c8.**

This is precisely a Multi-Colors elimination reached with a single color pair via one promotion step.

**Source: Sudopedia X-Colors, Example 3 (contradiction → placement) — CITED (FLAG candidate state).**

Digit **8**. After coloring, **r1c8** is already Green, but Step 3 also lets it be colored **Blue** (it is the only cell of its box not a peer of the blue r2c3). The cell is simultaneously Blue and Green and there are two Blue cells sharing row 1 and column 8 — a contradiction. By **Rule 4.2**, the **Green cells are TRUE**: place **8** in r1c8, r7c2, r9c5. (Note: cannot conclude all Blue are false — only that Green is true.)

**Verified — HoDoKu mc01** (Multi-Colors type 1):
Grid: `000006000007030040106080095700900850900040020400008000093050010000007000000060002`

Digit 1, colors 1a@r1c5 / 1b@r1c7 and 2a@r2c9 / 2b@r5c9; r1c7(1b) and r2c9(2a) share block 3 (weak link), so r5c2 and r5c3 (seeing 1a and 2b) lose candidate 1.

Eliminations (HoDoKu step string): `r5c23<>1`.

## Soundness

**Multi-Colors Type 1:** A1 and A2 share a house, so not both true; hence the true color of cluster 1 is B1 *or* the true color of cluster 2 is B2 (at least one). A cell `z` seeing a B1 cell and a B2 cell: in case "B1 is the true set," the seen B1 holds `d`; in case "B2 is the true set," the seen B2 holds `d`. These two cases are exhaustive (one of B1/B2 is forced true by the weak link), so in every case some peer of `z` holds `d` ⇒ `z≠d`. Valid case split, no insertion.

**Multi-Colors Type 2:** one of {A2, B2} is the true set, so one of the two same-colored cells (each seeing a different one of A2/B2) sees a true `d` and is false; sharing one color, the whole color set is false ⇒ remove `d` there.

**X-Colors promotion (Step 3):** if a house has all-but-one of its `d`-cells peered to color A, then *if A is the true set* those peers are all false, forcing `d` into the Exception Cell — so the Exception Cell is true-whenever-A-true, i.e. it carries color A's truth (a one-directional implication, which is why strict complementarity is dropped and wrap proves only "B true"). 4.1/4.2/4.3 are then the standard trap / wrap / house-empty case splits over "A is the true set vs. B is the true set," each exhaustive. The method only reads existing conjugate pairs and peer relations; it never places a trial digit, so it is purely logical.

## Sources

SUDOPEDIA-X-COLORS (X-Colors algorithm Steps 1–4, promotion, examples 1–6, Empty-Rectangle augmentation, X-Wing subsumption; http://sudopedia.enjoysudoku.com/X-Colors.html — newly mirrored); HODOKU-COLORING (Multi Colors type 1 / type 2, two-color-pair limit, Multi-Colors ≡ X-Chains; tech_col.php#mc); SUDOKUWIKI-SIMPLE-COLOURING (relationship to single coloring; Multi-Colouring deprecation note).
