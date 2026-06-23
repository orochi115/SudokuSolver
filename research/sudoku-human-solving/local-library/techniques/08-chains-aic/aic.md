---
id: technique.aic
name_en: X-Chain / Alternating Inference Chain
name_zh: X 链 / 交替推理链
family: chains-aic
difficulty: diabolical-extreme
strategyId:
  - x-chain
  - aic
sources:
  - SUDOKUWIKI-AIC
  - SUDOKUWIKI-X-CYCLES
  - HODOKU-CHAINS
  - CHINESE-JWANGL5-ADVANCED
---

# X-Chain / Alternating Inference Chain / X 链 · 交替推理链

## One-Sentence Rule

Build an open path of candidate nodes joined by **alternating strong and weak links**; the two endpoints (both ON in the read where the chain starts and ends with a strong link) cannot both be false, so any candidate that *sees* both endpoints — and shares their digit(s) — can be eliminated.

(An **X-Chain** is the single-digit special case: every node is the same digit X. A general **AIC** allows the digit to change at bivalue cells. They share one inference engine and one elimination rule, so they live in one card.)

## 精确模式定义

**节点 (node).** A candidate, written `digit[cell]`, e.g. `5[A7]`. Its truth state is ON (placed) or OFF (eliminated).

**强链 strong link** between nodes P, Q: `¬P ⇒ Q` ("if P is false then Q is true"). Concretely a strong link exists when:
- **bi-location**: digit X appears in exactly two cells of a unit (row/col/box) — those two `X[cell]` nodes are strongly linked; and
- **bi-value**: a cell has exactly two candidates a, b — `a[cell]` and `b[cell]` are strongly linked (different digits, same cell).
A strong link is *at least* "if not one then the other"; it may also be conjugate (exactly one true).

**弱链 weak link** between nodes P, Q: `P ⇒ ¬Q` ("if P is true then Q is false"). Concretely:
- two `X[cell]` nodes of the **same digit X** that share a unit (peers) are weakly linked; and
- two candidates **in the same cell** are weakly linked (placing one removes the other).
Every strong link is also a valid weak link; the converse is false.

**交替规则 alternation rule.** Reading the chain end-to-end, links alternate `strong, weak, strong, weak, …`. Equivalently, ON/OFF states alternate along the nodes. Because a strong link can be *used as* a weak link when parity demands it, the structural requirement is only that the links used in **strong position** really are strong links; links in **weak position** may be either.

**X-Chain restriction.** Every node carries the same digit X. Then strong links are bi-locations of X, weak links are peer pairs of X. There is no bi-value/in-cell link. (X-Chain = "X-Cycle"/Nice-Loop on one digit; see `nice-loops.md` for the closed-loop form.)

## 触发判定

Search formulation (open chain, the case handled by this card):

1. Pick a start node `s` and assert it ON. The chain must **leave** the start through a **strong link** and **arrive** at the end through a **strong link** (so both endpoints are ON in this read).
2. Walk an alternating path `s =strong= n1 –weak– n2 =strong= n3 – … =strong= e`, never reusing a node, with an **even number of links** (odd number of nodes). Strong-position links must be genuine strong links; weak-position links must be genuine weak links.
3. Endpoints `s = d_s[C_s]` and `e = d_e[C_e]` are both ON in the read, but the chain proves **at least one of `s`, `e` is true** (the standard AIC discontinuity / "Type" eliminations below).
4. **Trigger:** there exists a candidate node `t` that is weakly linked to (sees) *both* endpoints with the matching digit(s). Then `t` is eliminable.

Predicate (Type 1, single shared digit X = d_s = d_e): `∃ cell T ≠ C_s, C_e with X ∈ cand(T), T peers C_s, T peers C_e ⇒ remove X from T`.

## 消除/落子规则（全部情形）

Let the open chain start at `s = a[C_s]` (ON) and end at `e = b[C_e]` (ON), proven "at least one endpoint true".

**Type 1 AIC — endpoints share a digit (a = b = X).**
Any cell that is a peer of *both* `C_s` and `C_e` and contains candidate X: **remove X**. (Pincer/Y-Wing-style elimination; this is the only outcome for an X-Chain, where every node is X.)

**Type 2 AIC — endpoints carry different digits (a ≠ b).**
- If `a[C_e]` exists (digit a is a candidate in the *other* endpoint's cell) **and** `C_s` peers `C_e`: remove `a` from `C_e`. Symmetrically remove `b` from `C_s` if `b ∈ cand(C_s)` and they peer.
- General target: a candidate `a` in any cell peering `C_s` that *also* sees the b-end appropriately — in practice the two cross-eliminations above plus the "crossed candidate" removals when `C_s` and `C_e` themselves see each other.

**Discontinuous loop, two strong links join (Nice Loop Rule 2).**
If you close the chain back to the start cell and the discontinuity is where **two strong links meet** at node `X[C]`: the assertion "X OFF at C" forces "X ON at C" — contradiction — so **place X in C** (remove all other candidates of that cell). Example below, AIC Rule 2. (Rarer.)

**Discontinuous loop, two weak links join (Nice Loop Rule 3).**
If the discontinuity is where **two weak links meet** at `X[C]`: asserting "X ON at C" forces "X OFF at C" — contradiction — so **eliminate X from C**. This is the most common AIC outcome. Example below, AIC Rule 3.

**Continuous loop (Nice Loop Rule 1).**
Fully alternating closed loop, even node count, no discontinuity → every weak link becomes effectively conjugate. **Off-chain eliminations** on each weak link's shared unit, plus removal of extra candidates in any cell where the loop switches digit. (See `nice-loops.md`.)

**X-Chain endpoints.** Because all nodes are digit X, only Type 1 / single-digit loop outcomes apply: open X-Chain → remove X from cells peering both ends; closed X-Chain → X-Cycle Rule 1/2/3.

## 退化与边界

- **Length-3 cell chain (= XY-Wing).** An XY-Chain of three bivalue cells is exactly a Y-Wing / XY-Wing. An open X-Chain of the shortest single-digit form (two strong links + connecting weak link, 4 nodes) is a **Skyscraper / 2-String Kite / Turbot Fish**.
- **Both endpoints true.** Testing shows in ~57% of XY-Chains *both* ends hold the digit; the technique only guarantees *at least one*, which still licenses the pincer elimination.
- **No eliminating cell.** A perfectly valid alternating chain with no cell seeing both ends yields nothing; extend or discard.
- **Reusing a node** invalidates the chain. Nodes must be distinct.
- **Strong-as-weak parity error.** A common mistake is entering a strong link "with the wrong parity" (using it as the chain's strong link when the incoming state was ON). Then the chain does not propagate — abandon that branch.
- **Even/odd.** Open Type-1 chains have an even number of links; continuous loops have an even number of nodes.

## 与其他技巧的关系

Nesting of the chain family (each is a restriction of the next):

`Remote Pairs ⊂ XY-Chain ⊂ AIC` and `Simple Colouring ⊂ X-Chain (X-Cycle) ⊂ AIC`.

- **X-Wing** = continuous single-digit X-Cycle of length 4 (`x-chain` special case).
- **Swordfish (2-2-2)** = continuous X-Cycle of length 6.
- **Skyscraper / 2-String Kite / Turbot Fish** = short open X-Chains.
- **Y-Wing / XYZ-Wing** = shortest XY-Chains / AICs.
- **W-Wing** = a short AIC: two bivalue `XY` cells linked by a strong link on one digit.
- **3D Medusa, Simple Colouring** = AIC read as a colouring on a connected strong-link cluster.
- See `xy-chain.md` (bivalue-only AIC), `nice-loops.md` (closed loops), `grouped-aic.md` (group nodes). AICs further extend to ALS and UR links (out of scope here).

## Worked example

**Example A — AIC Rule 1, continuous loop (source grid, SUDOKUWIKI-AIC).**
Grid (from the start): `000040030207009600000236070900000207000000000802000004050972000006400309020080000`

After basics the loop is (digits switch between 5/8 and 4/5, all cross-unit links strong):

```
-5[A3]+8[A3]-8[A6]+8[D6]-4[D6]+4[E6]-4[E3]+5[E3]-5[A3]
```

Continuous (Rule 1) → off-chain eliminations on each weak link:
- **8 removed from A4** (weak link 8[A3]–8[A6])
- **5 removed from D6** (in-cell switch 8/4 at D6)
- **4 removed from E2** (weak link 4[E6]–4[E3])
- **5 removed from C3** (weak link 5[E3]–5[A3])

**Example B — AIC Rule 2, two strong links join (source grid, SUDOKUWIKI-AIC).**
Grid: `543000006000000100000702000700090004001608000600030501000803000002000000100000328`

```
-9[B9]+9[G9]-5[G9]+5[G3]-5[D3]+8[D3]-8[D7]+8[C7]-9[C7]+9[B9]
```

Setting 9 OFF in B9 forces 9 ON in B9 (contradiction at the two-strong-link discontinuity) → **place 9 in B9** (remove the other candidate, 5).

**Example C — AIC Rule 3, two weak links join (source grid, SUDOKUWIKI-AIC).**
Grid: `006030020030002640700000001260501800008000200003208065300000006097300080010040900`

```
+5[A2]-5[A7]+7[A7]-7[F7]+7[F2]-7[E2]+5[E2]-5[A2]
```

Setting A2 = 5 forces 5 OFF in A2 (contradiction at the two-weak-link discontinuity) → **eliminate 5 from A2**.

(All three grids are SudokuWiki "Load/From the Start" examples for Alternating Inference Chains; chains quoted verbatim from the page.)

## Soundness

Each link is a one-directional implication that is *always true* given the current candidate grid:
- Strong link `¬P ⇒ Q`: if the unit had only two X's (bi-location) or the cell had only two candidates (bi-value), removing one forces the other — a theorem of the constraints.
- Weak link `P ⇒ ¬Q`: a placed digit removes its peers and its cell-mates — the basic Sudoku rule.

Chaining alternating implications from an ON endpoint, the standard case-split is: either `s` is true, or `s` is false. If `s` is false, the strong link out of `s` makes `n1` true, the weak link makes `n2` false, …, and the terminal strong link makes `e` true. Hence **`s ∨ e`** is a tautology. Any candidate `t` seeing both `s` and `e` on the shared digit is then killed by whichever endpoint is true (weak link from the true endpoint removes `t`). For discontinuous loops the same case-split closes on the start cell, producing the contradiction that fixes (Rule 2) or removes (Rule 3) the candidate. No assumption about the solution is made beyond the puzzle's constraints, so the deduction is constraint-preserving and uniqueness-independent (X-Chain/AIC are not uniqueness techniques).

## Sources

- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (Rules 1/2/3, all three worked grids and chains).
- SUDOKUWIKI-X-CYCLES — *X-Cycles (Part 1)*, sudokuwiki.org/X_Cycles (strong/weak link definitions, single-digit Nice Loops, X-Wing/Swordfish as continuous cycles).
- HODOKU-CHAINS — hodoku.sourceforge.net chains documentation (Type 1 / Type 2 AIC terminology).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced-technique reference (链 terminology).
