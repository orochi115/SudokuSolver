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

**Verified — Sudopedia X-Colors Example 1** (Multicolors / promotion trap):
Grid: `401708003000501000000002017802604071000000000140809306900200000000003000500406108`

Digit **2**; Step 3 promotes **r2c1** Blue; Step 4.1 trap ⇒ **`r2c8<>2`**.

**Verified — Sudopedia X-Colors Example 2** (promotion beyond Multi-Colors):
Grid: `000084000080309000001257800240090058108405900060728431710942086000800000804500109`

Digit **6**; iterated Step 3 promotion ⇒ **`r1c1,r1c3<>6`**.

**Verified — Sudopedia X-Colors Example 3** (wrap → placement):
Grid: `092700604040060000076020593050148762020090005061572030204030050030010000600209340`

Digit **8**; Step 4.2 green-true ⇒ **`r1c8,r7c2,r9c5=8`**; trap eliminations **`r2c7,r2c9<>8`**.

**Verified — Sudopedia X-Colors Example 4** (iterated Step 3 trap):
Grid: `401708003000501000000002017802604971000000000140809306900200000000003000500406108`

Digit **5**; conjugate pair **r5c6/r7c6** + four promotion rounds ⇒ **`r8c7,r8c8<>5`**.

**Verified — Sudopedia X-Colors Example 5** (column contradiction):
Grid: `276900001800001760031007002090002006000000000600300050700806090062500804180004600`

Digit **3**; blue contradiction in column 9 ⇒ green true ⇒ **`r8c6=3`**.

**Verified — Sudopedia X-Colors Example 6** (Step 4.3 house emptied):
Grid: `001583674437620000568074000000005400046012800005400000004250003000047520852390740`

Digit **1**; lower-left box cannot take green ⇒ blue true ⇒ **`r2c7=1`**, **`r3c4=1`**.

**Verified — Sudopedia X-Colors + Pointing Pair** (Empty Rectangle augmentation):
Grid: `300407800070063400040501370004070003200304009003100040001040530480035900530019604`

Digit **8**; pointing pair in box 4 + green peer ⇒ **`r3c1<>8`**.

**Verified — HoDoKu mc01** (Multi-Colors type 1):
Grid: `000006000007030040106080095700900850900040020400008000093050010000007000000060002`

Digit 1, colors 1a@r1c5 / 1b@r1c7 and 2a@r2c9 / 2b@r5c9; r1c7(1b) and r2c9(2a) share block 3 (weak link), so r5c2 and r5c3 (seeing 1a and 2b) lose candidate 1.

Eliminations (HoDoKu step string): `r5c23<>1`.

**Verified — HoDoKu mc02** (Multi-Colors type 2):
Grid: `.17....28.8..4...........7...4.9...696...7..15....2..............891.54...58..31.`
(dots → 0)

Digit 3, two same-color cells each see opposite colors of the other pair ⇒ **`r6c2,r7c3,r8c6<>3`**.

## Soundness

**Multi-Colors Type 1:** A1 and A2 share a house, so not both true; hence the true color of cluster 1 is B1 *or* the true color of cluster 2 is B2 (at least one). A cell `z` seeing a B1 cell and a B2 cell: in case "B1 is the true set," the seen B1 holds `d`; in case "B2 is the true set," the seen B2 holds `d`. These two cases are exhaustive (one of B1/B2 is forced true by the weak link), so in every case some peer of `z` holds `d` ⇒ `z≠d`. Valid case split, no insertion.

**Multi-Colors Type 2:** one of {A2, B2} is the true set, so one of the two same-colored cells (each seeing a different one of A2/B2) sees a true `d` and is false; sharing one color, the whole color set is false ⇒ remove `d` there.

**X-Colors promotion (Step 3):** if a house has all-but-one of its `d`-cells peered to color A, then *if A is the true set* those peers are all false, forcing `d` into the Exception Cell — so the Exception Cell is true-whenever-A-true, i.e. it carries color A's truth (a one-directional implication, which is why strict complementarity is dropped and wrap proves only "B true"). 4.1/4.2/4.3 are then the standard trap / wrap / house-empty case splits over "A is the true set vs. B is the true set," each exhaustive. The method only reads existing conjugate pairs and peer relations; it never places a trial digit, so it is purely logical.

## Sources

SUDOPEDIA-X-COLORS (X-Colors algorithm Steps 1–4, promotion, examples 1–6, Empty-Rectangle augmentation, X-Wing subsumption; http://sudopedia.enjoysudoku.com/X-Colors.html — newly mirrored); HODOKU-COLORING (Multi Colors type 1 / type 2, two-color-pair limit, Multi-Colors ≡ X-Chains; tech_col.php#mc); SUDOKUWIKI-SIMPLE-COLOURING (relationship to single coloring; Multi-Colouring deprecation note).
