---
id: technique.3d-medusa
name_en: 3D Medusa
name_zh: 三维美杜莎染色法
family: coloring
difficulty: diabolical
strategyId: 3d-medusa
sources:
  - SUDOKUWIKI-3D-MEDUSA
  - HODOKU-COLORING
  - SUDOPEDIA-X-COLORS
---

# 3D Medusa / 三维美杜莎染色法

## One-Sentence Rule

Build one bipartite 2-colored network of *cell-candidates* across all digits, using both bi-location strong links (same digit, two cells in a house) and bi-value strong links (same cell, two digits); then apply six contradiction/elimination rules, since exactly one whole color is the solution set.

## 精确模式定义

A vertex is a **cell-candidate** `(cell, digit)` = "digit d is the solution of this cell." Edges are **strong links**:

- **Bi-location link (2D):** digit `d` appears in exactly two cells of some house → those two `(cell, d)` vertices are conjugate (one is true).
- **Bi-value link (3D / the new dimension):** a cell has exactly two candidate digits `d1, d2` → `(cell, d1)` and `(cell, d2)` are conjugate (one is true). This is the "third dimension" lifting the 9 digit-layers off the page.

**Medusa network:** a connected component of this multi-digit strong-link graph. 2-color it (colors **Green / Blue**) by alternating across every strong link; the component is bipartite in a valid puzzle. **Either all Green cell-candidates are true (and are the solutions of their cells) or all Blue are.** Two opposite-colored cell-candidates can never both be true.

**Weak link:** two cell-candidates that exclude each other but are NOT a strong link — same digit in cells that see each other (≥3 in the house), or two digits in the same cell (≥3 candidates). Weak links are where the six rules find contradictions.

A single coherent meaning of Green/Blue spans *all digits at once* — that is the entire advantage over single-digit Simple Coloring.

## 触发判定

After 2-coloring one Medusa network, the technique fires on the first matching rule:

- **R1 Twice in a Cell:** a cell has two candidates of the **same** color.
- **R2 Twice in a Unit:** a house has two cells with the same color on the **same** digit.
- **R3 Two colors in a cell:** an *uncolored* candidate `(c, x)` sits in a cell that also holds **both** a Green and a Blue colored candidate.
- **R4 Two colors in a unit ("elsewhere"):** an uncolored candidate `(c, d)` sees (along houses) a Green `d` and a Blue `d`.
- **R5 Two colors, unit + cell:** an uncolored candidate `(c, d)` sees a colored `d` *along a house* AND has the **opposite** color present *in its own cell*.
- **R6 Cell Emptied by Color:** an *uncolored* cell whose **every** candidate is a peer of (sees) the **same** single color.

## 消除/落子规则（全部情形）

Color semantics: one full color is the solution set; the other is entirely false.

**R1 — Twice in a Cell.** Two same-color (say Green) candidates in one cell ⇒ Green would put two digits in one cell ⇒ **Green is false ⇒ remove ALL Green candidates; all BLUE candidates are solutions** (Jacobs' positive assertion — bi-value Blue cells become naked singles, others hidden singles). *Cannot occur in Simple Coloring (same number never appears twice in a cell).*

**R2 — Twice in a Unit.** Two same-color (Green) candidates of the same digit in one house ⇒ both can't be true ⇒ **Green false ⇒ remove all Green; all Blue are solutions.** (Shared with Simple Coloring's Color Wrap.)

**R3 — Two colors in a cell.** A cell holds a Green candidate, a Blue candidate, and a third uncolored candidate `(c,x)` ⇒ whichever color is true makes some candidate in `c` true, so `(c,x)` can never be ⇒ **eliminate `x` from `c`.** *Cannot occur in Simple Coloring (single digit).*

**R4 — Two colors in a unit.** Uncolored `(c,d)` sees a Green `d` and a Blue `d` ⇒ one of them is true ⇒ **eliminate `d` from `c`.** (Shared with Simple Coloring's Color Trap; old Rule 5 folded into Rule 4 in Feb 2015.)

**R5 — Two colors, unit + cell.** Uncolored `(c,d)`: along a house it sees a colored `d` of one color, and *inside cell c* the opposite color is present on another digit ⇒ placing `d` in `c` would falsify a true colored candidate either in the house or in the cell ⇒ **eliminate `d` from `c`.** (Most common Medusa elimination.)

**R6 — Cell Emptied by Color.** Uncolored cell `c` where every candidate sees the **same** color (say Green) ⇒ if Green were true, `c` would be empty (impossible) ⇒ **Green is false ⇒ remove all Green; all Blue are solutions.** (Anton Delprado.) Community extension *Rule 7 (rafirafi/Robert):* a **house** whose every `d`-candidate is uncolored but all see the same color likewise kills that color — not in SudokuWiki's six but logically sound.

All R3/R4/R5 are *off-chain eliminations* (delete the seeing candidate only); R1/R2/R6 are *whole-color contradictions* (prove one color true, the other false).

## 退化与边界

- **Single-digit-only network ⇒ Simple Coloring.** If a Medusa component happens to use no bi-value links, R1/R3/R5/R6 cannot fire and it reduces to Rule 2 / Rule 4 of Simple Coloring.
- **Multiple disjoint networks:** color and test each independently; do NOT share Green/Blue meaning across components.
- **Odd cycle / both colors on one vertex:** indicates the chosen network already contains a contradiction (this *is* how R1/R2 manifest when re-seeded), or a board error.
- **Rule renumbering:** old Rule 5 (1995-style "elsewhere") merged into R4 (Feb 2015), old Rules 6/7 decremented — current canon is exactly 6 rules.
- **Rules collapse (Ymiros/Robert/Ralp analyses):** because a cell is "just a unit," R1≡R2 and R3≡R4≡R5; with weak-link subcolors all of R1/R2/R6 collapse to "all candidates in a cell/unit are color-X′ ⇒ remove X," and R3/R4/R5 to "candidate is Blue′ and Green′ ⇒ remove it." The six-rule split is kept for human pattern recognition.

## 与其他技巧的关系

- **Extends:** Simple Coloring into all digits (multi-digit coloring); is the multi-digit analogue of Multi-Coloring.
- **Subsumes:** single-digit colorings; many AIC / Nice-Loop and Digit/Cell-Forcing patterns. R3 is a classic Nice-Loop off-chain elimination; Medusa-without-R6 is a special case of AIC.
- **Family:** X-Colors / Weak Colors / Multi-Colors / Color Wing / Supercoloring (single-digit) are subsumed by the coloring family; 3D Medusa is the multi-digit member here. Virtual/Ultra coloring (Borrelly/Nini) and second-level coloring (Rainer) are further extensions noted in the source comments.
- **Equivalent power:** roughly AIC restricted to bi-value + bi-location strong links; TomB reports ~9.5% of cells-solved / 12.7% of candidate-eliminations across a mixed test bed.

## Worked example

**Source grid (SudokuWiki 3D Medusa, Rule 2 example, "From the Start") — CITED:**

```
300050000250300010004607500090200805070000030408005060005408300030006084000020006
```

(SudokuWiki rows A–J = r1…r9.) Per the source: build the Green/Blue network over bi-value and bi-location links across multiple digits. Ringed in the source are **two color-Green 7s in column 7** (a same-color pair on digit 7 in one house) ⇒ **Rule 2** fires: **all Green candidates are removed and all Blue candidates become solutions.** (Source note: this example needs three Rule-6 steps before Rule 2 comes into play.)

> FLAG: digit (7), the unit (column 7), the firing rule (R2), and the whole-color conclusion are from SudokuWiki's published walkthrough for this exact grid (image "Medusa2"); the per-cell colored network is reproduced from the source description, not independently pixel-verified. Cite SUDOKUWIKI-3D-MEDUSA for the canonical colored diagram.

**Second source grid (Rule 1, "From the Start") — CITED, for the cell-contradiction case:**

```
093804500005600000206070000020060040000208000070040090000010703000002600002507180
```

SudokuWiki colors from the 4s in row B; via the bi-value link in B7 (4↔9) the network grows until **cell H2 carries two same-color (Green/yellow) candidates** ⇒ **Rule 1**: that color is false, the opposite color solves its cells (e.g. the 1 in H1 becomes a hidden single). Demonstrates the 3D (bi-value) link that Simple Coloring cannot use.

## Soundness

Every edge is a strong link, so each connected network is bipartite and its two color classes are complementary truth assignments: exactly one class is the set of true cell-candidates. All six rules are exhaustive case splits over {Green true, Blue true}:

- **R1/R2:** if color X were true it would place a digit twice in one cell (R1) or one house (R2) — impossible — so X is false and the opposite color is the full solution set.
- **R3/R4/R5:** the eliminated candidate `(c,d)` is, in *both* color cases, sharing a cell or house with a true colored candidate, hence cannot itself be true.
- **R6:** if color X were true, the uncolored cell would have all candidates removed (empty cell) — impossible — so X is false.

No trial placement is made; the network is a static property of current candidates and bi-value/bi-location strong links, so the deduction is purely logical. Coloring across independent networks would be unsound and is forbidden.

## Sources

SUDOKUWIKI-3D-MEDUSA (Andrew Stuart, sudokuwiki.org/3D_Medusa — Rules 1–6, bi-value third dimension, Jacobs' positive assertion, Delprado Rule 6, rafirafi/Robert Rule-7 extension, example grids; locally mirrored markdown/sudokuwiki/3d_medusa.md); HODOKU-COLORING (coloring = chain-finding, strong/weak link definitions; tech_col.php); SUDOPEDIA-X-COLORS (multi-digit Ultracoloring contrast; "X-Colors do not replace multi-digit coloring").
