---
id: technique.xy-chain
name_en: XY-Chain
name_zh: XY 链
family: chains-aic
difficulty: diabolical
strategyId:
  - xy-chain
sources:
  - SUDOKUWIKI-XY-CHAINS
  - HODOKU-CHAINS
  - CHINESE-JWANGL5-ADVANCED
---

# XY-Chain / XY 链

## One-Sentence Rule

Chain together **bivalue cells** so that consecutive cells share one digit (a "hop"); if the two free end-digits are the **same digit Z**, then at least one end of the chain is Z, so any cell seeing **both ends** can have Z eliminated.

## 精确模式定义

**节点 node.** A candidate `digit[cell]` in a **bivalue** cell. An XY-Chain uses only bivalue cells.

**强链 strong link (in-cell).** In a bivalue cell `{x, y}`, `x[cell]` and `y[cell]` are strongly linked: `¬x[cell] ⇒ y[cell]` (and vice versa). Every strong link in an XY-Chain sits **inside a cell** — this is the defining restriction.

**弱链 weak link (between cells).** Two cells linked on a shared digit X are weakly linked when they are **peers** (same row/col/box) and both hold X: `X[cell₁] ⇒ ¬X[cell₂]`. Every between-cell link in an XY-Chain is a weak link on the **hop digit**.

**节点组 group node.** Not used in plain XY-Chains (bivalue cells only). See `grouped-aic.md`.

**交替规则.** Walking the chain, links alternate strong (in-cell) and weak (cell-to-cell). Written as bivalue cells `{a,b}–{b,c}–{c,d}–…–{w,Z}` the shared digit is the hop; the two unshared digits at the ends are the **end-digits**. Standard XY-Chain requires both end-digits = same Z.

So a chain is the cell sequence with the AIC reading:
```
-Z[C₁]+a[C₁] -a[C₂]+ … +Z[Cₙ]
```
strong links inside cells, weak links across the hops.

## 触发判定

1. Start at a bivalue cell `C₁ = {Z, a}`; assert `Z[C₁]` OFF, so `a[C₁]` ON (in-cell strong link).
2. Hop via a weak link on `a` to a peer bivalue cell `C₂ = {a, b}`, turning `a[C₂]` OFF → `b[C₂]` ON; continue.
3. End at bivalue cell `Cₙ = {w, Z}` with `Z[Cₙ]` ON.
4. **Trigger:** there exists a cell `T ∉ {C₁, Cₙ}` with `Z ∈ cand(T)`, `T` peers `C₁`, and `T` peers `Cₙ`. Then remove Z from T.

Bi-directional: the same chain read from `Cₙ` proves the converse, so either end may be the Z.

Cell count may be odd or even (Y-Wing = 3 cells; the source notes total cell counts of any parity occur). What matters is that **both terminal free digits equal Z**.

## 消除/落子规则（全部情形）

**Open XY-Chain (the standard case).** End-digits both Z, ends `C₁`, `Cₙ`.
- Remove **Z from every cell that peers both `C₁` and `Cₙ`** (and isn't an endpoint). Multiple such cells may be hit at once.
- If the two ends *share two digits* and the target cell also has both, in principle both could be cleared, but the solver/source treats each end-digit chain independently — run the chain once per shared end-digit (see Mike Hopkins / Gordon comments).

**Closed XY-Chain (ends see each other → continuous loop, Nice Loop Rule 1).**
If `C₁` and `Cₙ` are peers on the end-digit Z, the chain closes into a loop where **all strong links are in the bivalue cells** and every between-cell weak link becomes conjugate. Then:
- On **every** between-cell (weak) link, remove the hop digit from all other cells of the shared unit.
- The loop has **no start/end** (solver highlights none). This finds ~8–10% more eliminations than the open form.

**Discontinuous outcomes.** A closed XY-Chain that breaks at a single cell reduces to AIC Rule 2/3 (place or eliminate the discontinuity candidate). XY-Chains are a strict sub-family of AIC, so all AIC outcomes apply when the link pattern matches; see `aic.md`.

## 退化与边界

- **3 cells = Y-Wing / XY-Wing.** The minimal XY-Chain is the Y-Wing pivot+two pincers. (Anonymous reply confirms: "an XY-chain can contain as few as three cells, but that is the same as an XY-wing/Y-wing.")
- **No elimination.** A valid chain whose ends share no common-peer cell with Z yields nothing.
- **Stopping at first confluence.** You may extend a chain past a usable elimination, but extra length gives no extra eliminations once both ends are fixed — solvers stop at the shortest useful chain.
- **Length cap.** Online solvers cap chain length (~12 cells) for CPU reasons; longer chains exist (20+).
- **Exotic links.** Plain XY-Chains use only bivalue (in-cell) strong links; adding ALS/UR links promotes it to ALS-XY-Chain / AIC and is out of scope.
- **Closed-loop parity.** Closed XY-Chains form even-node loops; the alternating colouring forces the bi-partition.

## 与其他技巧的关系

`Remote Pairs ⊂ XY-Chain ⊂ AIC`.
- **Remote Pairs** = XY-Chain where every cell is the *same* bivalue pair `{a,b}` (so end-digits automatically match).
- **Y-Wing / XY-Wing** = length-3 XY-Chain.
- **W-Wing** = two `{X,Y}` cells joined by a strong link on one digit — an XY-Chain with a non-bivalue strong link in the middle (borderline AIC).
- XY-Chain is the **bivalue-only AIC**: every strong link is in-cell, every weak link is between cells (Robert's classification, case 3). General AIC (`aic.md`) relaxes both. Single-digit analogue is the X-Chain / Nice Loop (`nice-loops.md`).

## Worked example

**Example 1 — open XY-Chain length 4 (source grid, SUDOKUWIKI-XY-CHAINS).**
Grid (from the start): `080103070000000000001408020570001039000609000920800051030905200000000000010702060`

Chain (ends 5[A7] and 5[C2]):
```
-5[A7]+9[A7]-9[A5]+2[A5]-2[A1]+6[A1]-6[C2]+5[C2]
```
Reasoning: if A7 is 5, done; if A7 ≠ 5 it is 9 → A5 = 2 → A1 = 6 → C2 = 5. Either way one end is 5.
Eliminations (cells seeing both A7 and C2):
- **5 removed from A3**
- **5 removed from C7**
- **5 removed from C9**

**Example 2 — closed XY-Chain (continuous loop, source grid, SUDOKUWIKI-XY-CHAINS "Closed XYC example 2").**
Grid: `002000376010030500000000090900850001000304000200097003080000000003040060147000200`

Short rectangular closed chain on cells B3{8,6}, D3{4,...}, D8{2,...}, B8{8,...}. Tracing from B3: 6→D3=4→D8=2→B8=8, confirming B3=8; reversing confirms the loop. Because the loop's ends (the 8s in B3 and B8) see each other it is continuous, so three of the four cross-row/col links yield removals of the hop digit from their shared units (as highlighted on the source page).

(Both grids are SudokuWiki XY-Chain "From the Start" examples; Example 1's chain and three eliminations are quoted verbatim. The Example-2 closed loop is described qualitatively on the source — exact off-link removals depend on the full pencilmarks after basics.)

## Soundness

Each in-cell strong link `¬x[C] ⇒ y[C]` is forced by C being bivalue. Each between-cell weak link `X[C₁] ⇒ ¬X[C₂]` is the peer-elimination rule. Asserting `Z[C₁]` false and propagating the alternating implications terminates at `Z[Cₙ]` true; the contrapositive shows `Z[C₁]` true otherwise. Hence `Z[C₁] ∨ Z[Cₙ]` always holds. Any cell `T` peering both endpoints loses Z because whichever endpoint carries Z weakly links to `T`. The argument uses only the bivalue and peer constraints — no uniqueness assumption — so XY-Chain is sound on all puzzles, valid or not. (Note: a closed XY-Chain *does* require the bivalue cells to remain bivalue; it is still purely constraint-based.)

## Sources

- SUDOKUWIKI-XY-CHAINS — *XY-Chains*, sudokuwiki.org/XY_Chains (Example 1 chain + eliminations, notation, closed XY-Chains / Nice-Loop-Rule-1 connection, Y-Wing relationship, length cap).
- HODOKU-CHAINS — hodoku.sourceforge.net (XY-Chain as bivalue AIC).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (XY 链 terminology).
