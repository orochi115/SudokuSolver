---
id: technique.simple-coloring
name_en: Simple Coloring
name_zh: 简单染色法
family: coloring
difficulty: tough-diabolical
strategyId: simple-coloring
sources:
  - SUDOKUWIKI-SIMPLE-COLOURING
  - HODOKU-COLORING
  - SUDOPEDIA-X-COLORS
---

# Simple Coloring / 简单染色法

## One-Sentence Rule

For a single digit, 2-color the conjugate-pair graph so the two colors mean "all true" vs. "all false"; eliminate the digit wherever two same-colored cells share a house (Color Wrap) or an uncolored cell sees both colors (Color Trap).

## 精确模式定义

Fix one digit `d`. Work entirely within `d`'s single-digit graph.

- **Conjugate pair (strong link / bi-location):** two cells that are the only two cells holding `d` in some house (row, column, or box). In a conjugate pair exactly one cell is true: `d` here ⇔ `not-d` there.
- **Conjugate-pair graph `G_d`:** vertices = all candidate cells for `d`; edges = conjugate pairs. Same two cells may be conjugate via two houses (e.g. row and box); that is still one edge.
- **Cluster:** one connected component of `G_d`.
- **2-coloring (染色):** pick any cell of a cluster, assign it color **A**; assign every conjugate neighbor color **B**, and alternate across every edge. Because each edge is a strong link, adjacent cells must take opposite colors. The coloring of a cluster is determined up to swapping A↔B.
- **Parity / bipartite invariant:** a valid puzzle's `G_d` is bipartite within each cluster — no edge joins two same-colored cells, and every cycle has even length. The whole point of the technique is to detect when the *board* forces a parity violation across a **non-edge** (a weak link), which is the contradiction.
- **Color semantics:** within one cluster, either **all A cells are true and all B cells are false, or all B true and all A false.** Exactly one color is the "true set." (Distinct clusters are independent and may NOT be combined in Simple Coloring.)

## 触发判定

After fully 2-coloring one cluster of `G_d`, the technique fires if either predicate holds:

- **Color Wrap (Rule 2 — twice in a unit):** ∃ two cells `x, y` of the **same** color that share a house (a weak link between same-color cells). Formally `color(x)=color(y) ∧ peers(x,y)`.
- **Color Trap (Rule 4 — two colors elsewhere):** ∃ a cell `z` (colored or uncolored) holding `d` such that `z` is a peer of some A-cell **and** some B-cell of the *same cluster*, with `z` itself not being one of those two endpoints.

If neither holds for any cluster of any digit, Simple Coloring makes no move.

## 消除/落子规则（全部情形）

Let the cluster be 2-colored A/B.

**Rule 2 — Color Wrap (color contradicts itself):**
- Trigger: two same-color cells (say color A) see each other.
- Then color A would place `d` twice in one house ⇒ **A is entirely false.**
- Eliminate `d` from **every A cell** in the cluster.
- (落子 corollary, HoDoKu/SudokuWiki): every **B cell** is then a placement of `d` for its cell — solver-equivalent to removing all other candidates from each B cell; in practice these become naked/hidden singles next pass.

**Rule 4 — Color Trap (a third cell sees both colors):**
- Trigger: cell `z` sees an A-cell and a B-cell of the cluster.
- One of A/B is the true set, so one of those two endpoints holds `d`; either way `z` would share a house with a true `d`.
- Eliminate `d` from `z`. (`z` is **not** colored on/off; only `d` leaves `z`.)
- This applies whether `z` is uncolored (the usual case) or itself belongs to a *different* cluster — but in classic Simple Coloring `z` is uncolored.

**No color is asserted true by Rule 4 alone.** Rule 4 only deletes the seeing cell's candidate. Rule 2 is the only Simple-Coloring rule that proves a whole color true/false.

Targets are always candidate `d`; never any other digit (single-digit technique).

## 退化与边界

- **Cluster of size 1 or 2:** size-1 makes no move; a bare conjugate pair (size 2) can never wrap or trap by itself (its only two cells are opposite-colored and see only each other through the strong link).
- **Two disjoint clusters:** treat independently. You may NOT color them with a shared A/B meaning, and you may NOT use an A of one cluster plus an A of the other as a "wrap." (See the SudokuWiki author's repeated warnings in comments: "they are isolated.")
- **Three 5s in a house ⇒ no edge there.** Only houses with exactly two `d`-cells yield conjugate edges; houses with ≥3 copies of `d` contribute no strong link (though Color Trap can still eliminate a third copy that sees both colors).
- **Odd cycle:** if alternation forces a cell to take both colors, the puzzle is broken (no solution) — not a normal trigger; it means an earlier error.
- **Rule 5 folded in:** SudokuWiki's historical "Rule 5" (off-chain, two cells elsewhere) was merged into Rule 4 in Feb 2015 (reader *FallsOffRocks*); there is no separate Rule 5.

## 与其他技巧的关系

- **Subsumes / unifies:** Simple Coloring is exactly a single-digit **X-Chain / Nice Loop** found by graph 2-coloring. Rule-4 traps are odd-length X-chains where the seeing cell is the discontinuity; Rule-2 wraps are even loops with a weak-link clash.
- **X-Colors / Weak Colors / Multi-Coloring (sudopedia):** these are the *extension* — they add a promotion step (Step 3) or a second color pair to bridge weak links and link clusters. Simple Coloring is X-Colors **without** Step 3 (per sudopedia: "If we eliminate Step 3, what we have is the definition of Single Coloring"). Multi-digit extension is **3D Medusa** (this group). Those richer variants are documented in `multi-coloring.md` and `3d-medusa.md` and are considered to subsume Simple Coloring.
- **Color Wing / Supercoloring:** higher-cluster-count coloring variants; subsumed by Multi-Coloring / Medusa, see the sibling cards.
- **X-Cycles / AIC:** Simple Coloring is the conjugate-pair-only sub-case of these; any Simple-Coloring elimination is reproducible by an X-Cycle with a weak-link discontinuity.
- **Turbot Fish / Skyscraper / 2-String Kite:** these are 2-strong-link Color Traps (the minimal Rule-4 patterns).

## Worked example

**Source grid (SudokuWiki Simple Colouring, Rule 4 example, "From the Start") — CITED:**

```
007000200000054009061000008300740905000000000508016002700000590800370000005000300
```

Digit of interest: **7**. (Cells in r#c# notation; SudokuWiki labels rows A–J, columns 1–9 → row A=r1 … row J=r9.)

After basic candidate reduction the 7-graph has a cluster of conjugate pairs that 2-colors into colors A (green) and B (blue). SudokuWiki's worked text states the operative Color Trap (their letters H,J = rows 8,9):

- One end of the 7-chain is at **r8c2** (color A), the other reachable end at **r9c8** (color B), linked through the conjugate-pair cluster on 7.
- The cell **r9c3** holds candidate 7 and is a peer of **r8c2** (same box / column reasoning) and of **r9c8** (same row 9).
- Color Trap (Rule 4): since either r8c2's 7 or r9c8's 7 must be true, **eliminate 7 from r9c3.** SudokuWiki notes the symmetric trap also removes 7 from the mirror cell (their "H5").

> FLAG: the *digit and the eliminated cell* (7 from r9c3) and the two colored endpoints are taken from SudokuWiki's published Rule-4 walkthrough for this grid; the full per-cell candidate grid at that step is reconstructed from the source description, not pixel-verified here. Cite SUDOKUWIKI-SIMPLE-COLOURING for the canonical diagram.

**Second source grid (Color Wrap / Rule 2, "From the Start") — CITED, for the wrap case:**

```
000000030002090500080706004900054006030000070600380009300601020007020600060000000
```

Per SudokuWiki, coloring digit **8** produces two same-colored 8s in one house (their column-6 / row-J clash), firing **Rule 2 (Color Wrap)**: all 8s of that color are removed, and the opposite color becomes the solution set — the puzzle collapses to singles. (See SUDOKUWIKI-SIMPLE-COLOURING diagram "SC_Rule2d" for the exact colored cells.)

## Soundness

Within a cluster the conjugate-pair edges are strong links, so the cluster is bipartite and its two color classes are mutually exclusive *complementary* truth assignments for the cells in the cluster: one class is the true set, the other false. Both rules are valid case-splits over the two assignments:

- **Color Wrap:** if color A were the true set, two A cells in the same house would both hold `d`, violating the house constraint. Hence A is impossible ⇒ A is the false set ⇒ remove `d` from all A cells. (B-true is the only survivor.)
- **Color Trap:** for the seeing cell `z`, take cases. If A is true, the A-endpoint it sees holds `d`, so `z≠d`. If B is true, the B-endpoint it sees holds `d`, so `z≠d`. In both exhaustive cases `z≠d`, so `d` is removed from `z`.

No assumption is ever inserted into the grid (no trial-and-error placement); both rules read a static parity property of the existing candidate graph, so the method is purely logical. The single-cluster restriction is essential: combining colors across independent clusters has no shared truth-set guarantee and would be unsound.

## Sources

SUDOKUWIKI-SIMPLE-COLOURING (Andrew Stuart, sudokuwiki.org/Simple_Colouring — Rule 2 Color Wrap, Rule 4 Color Trap, example grids); HODOKU-COLORING (Bernhard Hobiger, tech_col.php#sc — Simple Colors = Color Trap + Color Wrap, conjugate-pair definition, "coloring is a method for finding chains"); SUDOPEDIA-X-COLORS (Single Coloring = X-Colors without Step 3).
