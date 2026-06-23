---
id: technique.nice-loops
name_en: Continuous & Discontinuous Nice Loops (X-Cycles / AIC Loops)
name_zh: 连续与不连续 Nice 环（X-Cycle / AIC 环）
family: chains-aic
difficulty: diabolical-extreme
strategyId:
  - continuous-nice-loop
  - discontinuous-nice-loop
sources:
  - SUDOKUWIKI-X-CYCLES
  - SUDOKUWIKI-AIC
  - HODOKU-CHAINS
  - CHINESE-JWANGL5-ADVANCED
---

# Continuous & Discontinuous Nice Loops / 连续与不连续 Nice 环

## One-Sentence Rule

A **Nice Loop** is an AIC closed back onto itself; if the alternation holds all the way round (**continuous**) every weak link becomes conjugate and you eliminate off-loop candidates on each weak link's unit, while a single break (**discontinuous**) lets you **place** (two strong links meet) or **eliminate** (two weak links meet) the candidate at the break.

(Single-digit Nice Loops are **X-Cycles**: every node is the same digit X. Generalised to multiple digits and in-cell links they are AIC loops. One engine, one card.)

## 精确模式定义

**节点 node.** `digit[cell]`, ON or OFF. Single-digit loop (X-Cycle): all nodes are digit X. AIC loop: digit may switch at bivalue cells.

**强链 strong link** `¬P ⇒ Q`: bi-location (digit X appears exactly twice in a unit) or bi-value (cell has exactly two candidates). Drawn as a solid line.

**弱链 weak link** `P ⇒ ¬Q`: two same-digit candidates sharing a unit (peers), or two candidates in one cell. Drawn dashed. Every strong link may serve as a weak link.

**节点组 group node.** A set of 2–3 same-digit candidates confined to one box-line intersection, treated as a single node aligned along that line; see `grouped-aic.md` (Grouped X-Cycles / Grouped AIC).

**交替规则 / 环 loop.** A loop is a cyclic node sequence with **alternating strong/weak links** that returns to the start. Properties of a fully-alternating loop: direction-independent, start-cell-independent, every node ON or OFF (consistently alternating). A loop never reuses a candidate.

## 触发判定

Build a cyclic alternating chain. Classify by how it closes:

- **Continuous (Nice Loop Rule 1).** Even number of nodes; alternation is unbroken all the way around (the last link back to start respects alternation). No discontinuity anywhere.
- **Discontinuous, two strong links (Rule 2).** At exactly one node `X[C]` the two adjacent links are *both strong*.
- **Discontinuous, two weak links (Rule 3).** At exactly one node `X[C]` the two adjacent links are *both weak*.

Predicate for Rule 2/3: start and end the written chain at the same cell C on digit X; if both terminal links are strong → Rule 2; if both are weak → Rule 3.

## 消除/落子规则（全部情形）

**Rule 1 — Continuous loop (off-chain eliminations).**
The loop splits all its nodes into two alternating truth-sets; one set is the solution. Therefore on **every weak link** the two endpoints "trap" the unit:
- For a between-cell weak link on digit X in unit U: **remove X from all other cells of U** (off-chain).
- For an in-cell weak link (digit switches a↔b in cell C): **remove all candidates other than a, b from C**.
No candidate *inside* the loop is removed (the loop has no flaw).

**Rule 2 — Discontinuity at two strong links → placement.**
Asserting `X OFF at C` propagates round and forces `X ON at C`; the only consistent state is `X ON`. **Place X in C** (remove every other candidate from C). Single-digit form: X-Cycle Rule 2.

**Rule 3 — Discontinuity at two weak links → elimination.**
Asserting `X ON at C` propagates round and forces `X OFF at C`; contradiction. **Eliminate X from C.** This is the most common loop outcome. Single-digit form: X-Cycle Rule 3.

**X-Chain endpoints / single-digit specifics.** With all nodes digit X, in-cell links cannot occur, so Rule 1 eliminations are only the between-cell off-chain removals, and the loop is a pure X-Cycle.

## 退化与边界

- **X-Wing** = continuous X-Cycle, length 4. **Swordfish (2-2-2)** = continuous X-Cycle, length 6.
- **Skyscraper / 2-String Kite / Turbot Fish** = short single-digit loops/chains (the solver double-counts start=end, calling a 5-cell pattern "length 6").
- **Reversibility.** Every Nice Loop can be traversed either direction with ON/OFF swapped; the same eliminations result. Solvers pick one of the (up to four) equivalent writings.
- **Parity trap.** You must *leave* an OFF node through a **strong** link and an ON node through a **weak** link. Entering a strong link "with the wrong parity" (e.g. trying to continue from an ON start through a weak link expecting inference) stalls the chain — abandon that branch. Several source comments (Arno, britanico) flag this.
- **Even nodes for continuity.** A continuous loop must have an even node count; an odd alternating closure is necessarily discontinuous (Rule 2/3).
- **Three strong links in a row** is *not* an X-Cycle — it breaks alternation (Visitor comment); re-walk to restore alternation or stop.

## 与其他技巧的关系

`Simple Colouring ⊂ X-Cycle (single-digit Nice Loop) ⊂ AIC loop`.
- A continuous X-Cycle gives a result identical to a Simple Colouring solution (loop of only strong links).
- **X-Wing / Swordfish** are continuous X-Cycles (lengths 4 / 6) — the bridge from single-digit fish to chains.
- **Closed XY-Chain** (`xy-chain.md`) is a continuous AIC loop whose strong links are all in bivalue cells.
- General **AIC** (`aic.md`) is the open-chain counterpart; the three Nice Loop rules are exactly AIC Rules 1/2/3.
- **Grouped Nice Loops** (`grouped-aic.md`) add group nodes; **3D Medusa** is a colouring over the strong-link graph.

## Worked example

**Example A — Continuous X-Cycle (Rule 1) on digit 8 (source grid, SUDOKUWIKI-X-CYCLES Figure 4).**
Grid (from the start): `003000100500670000700009006034705600000000000008406930900300002000052009001000500`

```
-8[A1]+8[A6]-8[C4]+8[H4]-8[H2]+8[J1]-8[A1]
```
Continuous loop on 8 → off-chain eliminations on the weak-link units:
- **8 removed from B6** (weak link 8[A6]–8[C4])
- **8 removed from C5** (weak link 8[A6]–8[C4])
- **8 removed from H7** (weak link 8[H4]–8[H2])

**Example B — Discontinuous AIC loop, two strong links (Rule 2) (source grid, SUDOKUWIKI-AIC).**
Grid: `543000006000000100000702000700090004001608000600030501000803000002000000100000328`

```
-9[B9]+9[G9]-5[G9]+5[G3]-5[D3]+8[D3]-8[D7]+8[C7]-9[C7]+9[B9]
```
Two strong links meet at 9[B9] → **place 9 in B9** (remove 5).

**Example C — Discontinuous AIC loop, two weak links (Rule 3) (source grid, SUDOKUWIKI-AIC).**
Grid: `006030020030002640700000001260501800008000200003208065300000006097300080010040900`

```
+5[A2]-5[A7]+7[A7]-7[F7]+7[F2]-7[E2]+5[E2]-5[A2]
```
Two weak links meet at 5[A2] → **eliminate 5 from A2**.

(Example A is the SudokuWiki X-Cycles Figure-4 grid, chain and three off-chain eliminations quoted verbatim. Examples B and C are the SudokuWiki AIC Rule-2 and Rule-3 grids; their single-digit/AIC nature illustrates the discontinuous rules. All grids validated as 81-char strings.)

## Soundness

Strong link `¬P ⇒ Q` and weak link `P ⇒ ¬Q` are theorems of the unit/cell constraints (see `aic.md`). In a **continuous** loop the alternating implications form a 2-colouring: traverse from any node and the truth values are forced to alternate consistently all the way round, so exactly one colour class is the solution; every weak link therefore has one true endpoint, and any *other* candidate of that link's unit/cell would create a second true cell in a unit — impossible — hence removable. For **Rule 2**, asserting the break candidate OFF chains round to force it ON, so OFF is impossible → it must be placed. For **Rule 3**, asserting it ON chains round to force it OFF, a contradiction → it is removed. All steps use only Sudoku's constraints; loops are not uniqueness techniques and stay sound on invalid grids.

## Sources

- SUDOKUWIKI-X-CYCLES — *X-Cycles (Part 1)*, sudokuwiki.org/X_Cycles (strong/weak definitions, Nice Loop Rule 1 with Figure-4 grid/chain/eliminations, X-Wing & Swordfish as continuous cycles, reversibility, parity).
- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (Nice Loop Rules 1/2/3 generalised to AIC, Rule-2 and Rule-3 worked grids/chains).
- HODOKU-CHAINS — hodoku.sourceforge.net (Nice Loop / continuous-discontinuous terminology).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (环 terminology).
