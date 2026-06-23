---
id: technique.twinned-xy-chains
name_en: Twinned XY-Chains
name_zh: 孪生 XY 链
family: chains-aic
difficulty: extreme
strategyId:
  - twinned-xy-chains
sources:
  - SUDOKUWIKI-TWINNED-XY-CHAINS
  - SUDOKUWIKI-XY-CHAINS
  - SUDOKUWIKI-AIC
  - CHINESE-JWANGL5-ADVANCED
---

# Twinned XY-Chains / 孪生 XY 链

## One-Sentence Rule

A Twinned XY-Chain is **six cells in a 3×2 / 2×3 formation holding six digits as a "giant naked set"** (every value's candidates mutually see each other, so no digit can repeat) split into **two overlapping XY-cycles that share a pivot digit**: whichever way the pivot cell resolves, *one* of the two XY-cycles activates — and because a shared digit appears in both cycles, one cycle "activates" the other, so the eliminations the cycles license hold unconditionally and candidates can be removed off-chain along every locked pair of digits.

## 精确模式定义

**节点 single node.** A bivalue cell, written by its candidate pair, as in an XY-Chain.

**The six-cell substrate.** Six cells arranged **3×2 or 2×3** (e.g. three cells in each of two rows, sharing three columns; boxes may differ — this is *not* a unique-rectangle-style box constraint). The six cells hold candidates drawn from a six-digit set `{d1..d6}`; most are bivalue, with one cell allowed a third candidate (the **pivot cell**). Crucially, **all candidates of any one value mutually see each other** within the formation — so a value can never appear twice. With six values, six cells, and no repeats, the formation is forced to contain **each of the six digits exactly once**: a *giant naked sextuple* ("a giant Naked set").

**Twin XY-cycles.** The pivot cell carries a third digit. Removing one of its candidates leaves a 4-cell **XY-cycle** on one digit-subset; removing the other leaves a *different* 4-cell XY-cycle on another subset. Exactly one resolution happens, so one cycle is real — but **a digit common to both cycles links them**, so an elimination valid under either cycle is valid outright. (Nils Leder: removing 5 from J5 makes E1,E5,J1,J5 an XY-cycle on {1,2,3,4}; removing 2 makes E5,E9,J5,J9 an XY-cycle on {3,4,5,6}; digit 4 is in both, so one cycle "activates" the other.)

**As-an-AIC-node reading.** The whole sextuple behaves like a large locked set: each digit is forced present exactly once, so for every value, that value's cells form a conjugate region the chain engine can treat as supplying strong links / off-chain weak-link removals — the "twin XY-cycles" are the two AIC loops the locked set decomposes into.

## 触发判定

1. Look for a **triple of (mostly) bivalue cells in one row or column** sharing a common digit in all three (the "spine"; e.g. 4 in E1,E5,E9).
2. Find a second parallel line contributing the remaining cells so the union is **six cells / six digits** (2 + 3, or 3 + 3 with overlaps), with **one pivot cell** carrying a third candidate.
3. **Admissibility:** verify *all candidates of each value within the six cells mutually see each other* (so no value can repeat). Then the six cells form a giant naked set and decompose into the two pivot-linked XY-cycles. (Stuart: "if they were all strong (bi-location) there would be no eliminations" — at least one weak/off-chain direction must exist.)
4. The pivot's two resolutions yield two XY-cycles sharing a digit; the locked set is therefore certain regardless of which resolves.

## 消除/落子规则（全部情形）

**Off-chain eliminations along every locked pair.** Because the six cells are a giant naked set (each digit confined to those cells), **for each digit in the set, remove that digit from every cell outside the formation that sees all the formation's positions of that digit** — i.e. eliminate "off-chain in the direction of all pairs of numbers." Concretely: take each value `d`; the cells in the sextuple that can hold `d` define a locked region for `d`; any `d` elsewhere that is seen by that region is removed. Both candidates of every locked pair contribute (as in any naked subset).

**No direct placements** are produced by the basic pattern; it is an elimination technique. (Placements only follow indirectly, once eliminations expose singles.)

## 退化与边界

- **A value appears twice within the six cells.** Then the "all same-value candidates see each other" condition fails, the set is not a naked sextuple, and the twin-cycle argument collapses. Invalid.
- **All links strong (every pair bi-location).** "If they were all strong there would be no eliminations" — a fully conjugate configuration produces nothing; you need genuine off-chain targets.
- **Not bound to one house.** Unlike URs/fish, the six cells need not lie in special box relationships; being in different boxes "does not appear to matter."
- **Rarity / tight detection.** Source author notes the implementation may be "too tightly coded," missing valid instances and historically producing false positives — flag low recall.
- **Generalisation (comment, Jan Bouwman, 27-Jan-2026).** The 3×2 shape may not be essential: *any* group of k cells with k candidates where all same-value candidates mutually see each other behaves as an extended (possibly non-house-bound) naked set — tested for k = 4,5,6,7 with no false positives. This reframes Twinned XY-Chains as a special case of a **generalised naked set / locked set in an AIC**.
- **Not a uniqueness technique** — uses only the row/col/box constraints (no deadly-pattern assumption).

## 与其他技巧的关系

These EXTEND the AIC engine of `aic.md`: the sextuple is a large locked-set node that the chain decomposes into two pivot-linked XY-cycles (XY-cycle = bivalue-only Nice Loop; see `nice-loops.md`, `xy-chain.md`).

- **XY-Chain / XY-Cycle** (`xy-chain.md`) — each "twin" is an ordinary 4-cell XY-cycle; the novelty is the *shared-pivot disjunction* that makes the elimination unconditional.
- **Naked Subsets / ALS** — the six-cell formation is a generalised naked sextuple; the ALS node card (`aic-with-als.md`) is the small-locked-set sibling, and Bouwman's comment unifies them.
- **Sue-de-Coq / SK Loops** — other "large locked structure" techniques in the same difficulty band (source navigates Fireworks → Twinned XY-Chains → SK Loops).
- Plain forms: `aic.md` (engine), `nice-loops.md` (loops). Credit: pattern by **Nils Leder** (Germany); article by Andrew Stuart, May 2025.

## Worked example

**Example A — Nils Leder's original (source grid, SUDOKUWIKI-TWINNED-XY-CHAINS).** *(FLAG: the source describes the structure and the twin XY-cycles narratively; it does not print a single linear chain string or an explicit elimination list, so the eliminations below are reconstructed from the stated naked-set logic — verify against the solver's "From the Start" board.)*
Grid (From the Start): `080402000000065001600100000070000300058200970300000002800010003500000009000907480`

Six cells, two parallel rows E and J, columns 1/5/9:
- E1 `{1,2,4}`, E5 `{1,4}`, E9 `{3,4,6}`, J1 `{2,3}`, **J5 `{2,3,5}` (pivot, 3 candidates)**, J9 `{5,6}`.
- Common spine digit **4** sits in E1,E5,E9 (and only there among the six).

Twin XY-cycles sharing digit 4:
```
remove 5 from J5  ⇒  XY-cycle on {1,2,3,4} over E1–E5–J1–J5
remove 2 from J5  ⇒  XY-cycle on {3,4,5,6} over E5–E9–J5–J9
```
Either way one cycle fires; digit 4 is common to both, so the cycles are linked and the six cells are a locked naked sextuple on `{1,2,3,4,5,6}`. **Eliminate each of these six digits from any cell outside the sextuple that sees all of that digit's positions inside it** (off-chain, "in the direction of all pairs of numbers").

**Example B — column-oriented spine (source grid, SUDOKUWIKI-TWINNED-XY-CHAINS).**
Grid (From the Start): `850900000000010000067030400020300009003050600600001070006040510000070000000003082`

Here the common candidate **6** sits in **A5, D5, J5** (a *column* spine), looking onto **A7 `{1,2,7}`, D7, J7**; the two XY-chains are traced from row A (the shared row). Found in Ruud's top-50k list; including this step drops the puzzle from extreme (659) to diabolical (223). Eliminations follow the same naked-set rule along each locked pair.

**Example C — wider, non-strict-triple form (source grid, SUDOKUWIKI-TWINNED-XY-CHAINS).**
Grid (From the Start): `270000400009120300000009080000300509000010000620007000002500000080074050040000906`

A looser instance: three 4s, three 8s and three 2s each stay within their own rows (mutually visible), while 1, 3 and 9 are paired in their columns. The "XY-chain" is now only an analogy — placing a candidate in one spot removes two in two other cells — but the giant-naked-set / mutual-visibility condition still holds, so the off-chain pair eliminations are valid.

(All three grids are quoted verbatim from SudokuWiki "Twinned XY-Chains" (Nils Leder's original plus two solver-found examples); the cell/candidate listings and twin-cycle decomposition are from the source. The source gives no single chain string or explicit elimination list, so the off-chain removals are stated by rule, not enumerated — FLAGGED. Grids validated as 81-char strings.)

## Soundness

The deduction uses only the row/col/box constraints. Within the six-cell formation, for each value the cells able to hold that value all see one another, so that value can occupy **at most one** of the six cells. There are six cells and six values; a system in which each of six values occupies at most one of six cells, and each of six cells must take one value, forces (by Hall's theorem / pigeonhole) a **perfect matching**: every value is present exactly once. Hence the six cells are a genuine (possibly non-house-bound) locked set on `{d1..d6}` — none of those digits can appear elsewhere in any unit fully seen by the set's occurrences. The "twin XY-cycle" picture is just the two ways the pivot cell can resolve: each resolution yields a 4-cell XY-cycle, and because the two cycles share a digit, the locked-set conclusion is independent of which resolves (the disjunction is exhaustive). Therefore the off-chain eliminations along each locked pair are valid unconditionally. No uniqueness assumption is used, so Twinned XY-Chains is sound on every grid. (Detection is the delicate part — the soundness of the *elimination* is not in doubt; false positives reported in the source stem from mis-detecting the mutual-visibility condition, not from the rule.)

## Sources

- SUDOKUWIKI-TWINNED-XY-CHAINS — *Twinned XY-Chains*, sudokuwiki.org/Twinned_XY_Chains (six-cell 3×2 substrate, "giant naked set", twin pivot-linked XY-cycles, all three grids, the off-chain pair-elimination rule; pattern credited to Nils Leder, Germany; Jan-2026 generalised-locked-set comment by Jan Bouwman).
- SUDOKUWIKI-XY-CHAINS — *XY-Chains*, sudokuwiki.org/XY_Chains (the XY-cycle / XY-chain primitive the twins are built from).
- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (AIC/Nice Loop engine the locked-set node plugs into).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (XY 链 / 数组 terminology).
