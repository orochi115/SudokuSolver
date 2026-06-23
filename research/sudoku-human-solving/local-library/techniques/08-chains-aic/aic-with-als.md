---
id: technique.aic-with-als
name_en: AIC with ALS Node
name_zh: 含 ALS 节点的交替推理链
family: chains-aic
difficulty: extreme
strategyId:
  - aic-with-als
sources:
  - SUDOKUWIKI-AIC-ALSS
  - SUDOKUWIKI-AIC
  - HODOKU-CHAINS
  - CHINESE-JWANGL5-ADVANCED
---

# AIC with ALS Node / 含 ALS 节点的交替推理链

## One-Sentence Rule

An AIC with an ALS node is an ordinary AIC / Nice Loop in which one node is an **Almost Locked Set** (N cells holding N+1 digits): the chain enters by turning **OFF the one "extra" digit** of the ALS — which collapses it into a genuine locked (naked) set — and then **leaves on any of the set's now-locked digits**, giving the chain a strong link "through" the ALS that no single cell could provide; the same Rule 1/2/3 outcomes apply.

## 精确模式定义

**单节点 single node.** `digit[cell]`, as in plain AIC.

**ALS (Almost Locked Set).** A group of N cells that all see each other, holding exactly **N+1** distinct candidates. (A locked set is N cells / N digits; an ALS is "one digit short of locked".) The smallest useful ALS is **N=2 with 3 digits** — two cells whose union is three candidates, e.g. `{H6,G6}` holding `5/7/9`. Larger ALS (N=3 with 4 digits, …) are valid in principle.

**ALS-as-node.** An ALS contributes a node *per digit* it contains. Write the ALS node with **curly braces**: `7{H6|G6}` means "digit 7, supported across the ALS cells H6,G6" (distinguishing it from the square-bracket group-node notation `7[H6|G6]` used for box-line group nodes). The semantics that make it a chain node:
- **Entry (weak link IN):** if a chain turns ON some digit X that sees **the ALS's extra digit** in all its cells, that extra digit goes OFF. With its extra digit gone, the N cells now hold exactly N digits → they become a **genuine locked (naked) set**.
- **Exit (strong link OUT):** once locked, the N cells *must* contain each of their N remaining digits. So **any** of those N digits is now guaranteed present in the set. Picking one such digit Y, "Y is ON somewhere in the ALS" is forced — and Y in the ALS sees (and so turns OFF) any Y outside the set in the shared unit. The chain continues from there. "You get two cracks of the whip" (Stuart): for a 2-cell/3-digit ALS the pseudo-naked-pair has **two** locked digits, either of which can carry the chain or off-chain eliminations.

**Strong link supplied by the ALS.** Concretely, `¬(extra digit) ⇒ (each remaining digit present)`. So the ALS provides the strong inference `(extra-digit OFF) ⇒ (locked-digit forced)` — a strong link the chain rides through.

## 触发判定

1. Build an alternating AIC/loop. At a point where a single cell cannot supply the needed strong link, look for an ALS adjacent to the chain.
2. **Admissibility of the ALS node:**
   - the N cells mutually see each other (share a common house / are a valid locked-set candidate region);
   - they hold exactly N+1 candidates;
   - the chain's incoming weak link removes the **single extra digit** (the (N+1)-th) from the whole ALS — i.e. the entering node sees that digit in every ALS cell of which it is a candidate, so the extra digit is fully eliminated *for the duration of the chain*;
   - the outgoing link is a strong link on one of the remaining N (now-locked) digits.
3. Classify the result exactly as a Nice Loop: continuous (Rule 1), discontinuous-two-strong (Rule 2), discontinuous-two-weak (Rule 3).

## 消除/落子规则（全部情形）

Outcomes are the standard AIC / Nice Loop outcomes (see `aic.md`, `nice-loops.md`); the ALS node only changes *how* one strong link is justified.

**Rule 1 — Continuous loop (off-chain elimination).**
On each weak link remove the off-chain candidates of that link's shared unit. **ALS-specific bonus:** because the locked set is forced to contain *all* N of its digits, each of those digits can drive off-chain eliminations along the unit the set is aligned on — not only the single digit the chain literally exits on. (Source note: Stuart's solver does not always harvest every such pair-driven elimination, but they are logically valid — e.g. once the pair must hold 2, the partner digit 8 is also forced and can clear 8s the pair sees.)

**Rule 2 — Discontinuity, two strong links → placement.**
Asserting the discontinuity candidate OFF forces it ON via the loop (the ALS supplying one of the two strong links). **Place the digit** in the discontinuity cell, removing its other candidates.

**Rule 3 — Discontinuity, two weak links → elimination.**
Asserting the discontinuity candidate ON forces it OFF. **Eliminate** that candidate from the discontinuity cell.

## 退化与边界

- **ALS extra digit not fully removable.** If the entering node does not see the extra digit in *every* ALS cell that contains it, the set does not collapse to locked — the strong link is not supplied. Invalid.
- **N=1 "ALS"** = a bivalue cell minus nothing; not useful (a solved cell is a trivial locked set). Smallest useful ALS is N=2 / 3 digits.
- **Plain AIC subsumes the elimination of the extra digit.** A comment thread on the source notes that a normal AIC would still eliminate the (N+1)-th candidate, leaving the naked subset for a *later* step. The ALS node folds that two-step process into one chain — it does not eliminate puzzles a full AIC+naked-subset pass couldn't, but it shortens / unifies the path. (Stuart implements it as a *link type* available to every AIC, not a separate partitioned strategy.)
- **Almost-hidden-set dual.** For N=2 the construction has a conjugate "almost hidden set" form; sources treat the locked-set form as primary.
- **Larger ALS / AALS.** ALS with N≥3, and "almost-almost locked sets" (N cells / N+2 digits, needing *two* extra digits removed) are discussed as extensions but lie toward forcing-net territory (see exotic-links card).
- **Continuity parity.** As with all Nice Loops, continuous loops are even; a single discontinuity gives Rule 2/3.

## 与其他技巧的关系

These EXTEND the AIC engine of `aic.md`: the ALS node is just another way to justify one strong link, slotted into the same alternating walk and the same Rule 1/2/3 classifier.

- **Group node** (`grouped-aic.md`) and **UR node** (`aic-with-ur.md`) are sibling "exotic node" types; ALS uses curly braces `{..}`, group nodes use square brackets `[..|..]`.
- **Almost Locked Sets (ALS-XZ, ALS-XY-Wing, Death Blossom)** are the standalone ALS techniques; an ALS-XZ rule is essentially a two-ALS AIC. This card is the *single-ALS-as-chain-node* form.
- **Sue-de-Coq** can be read as an ALS interaction.
- **W-Wing / XY-Wing** are degenerate AICs whose "almost pair" reasoning the ALS node generalises.
- Plain forms: `aic.md` (engine), `nice-loops.md` (loops), `xy-chain.md` (bivalue-only).

## Worked example

**Example A — ALS node, Rule 2 placement (source grid, SUDOKUWIKI-AIC-ALSS).**
Grid (From the Start): `600070000007003900250090030005006000403000705000300800040030029002100400000040008`

ALS on cells `{G6,H6}` (curly braces = ALS), holding `5/7/9` with the **9** as the extra digit. 9s in row H are the entry point: turning 9 ON in H2 turns the 9 OFF in H6 — the extra candidate — collapsing `{G6,H6}` to a locked `[5,7]` pair, which points up column 6 and turns OFF the 7 in F6, and the chain continues.

AIC on 4 (Discontinuous Alternating Nice Loop, length 12):
```
-4[A4]+4[D4]-7[D4]+7[D2]-7[H2]+9[H2]-9[H6]+7{H6|G6}-7[F6]+4[F6]-4[A6]+4[A4]
```
Two strong links meet at the discontinuity → **place 4 in A4** (remove its other candidates 2/5). (Nice Loop Rule 2.)

**Example B — ALS node, Rule 1 continuous loop (source grid, SUDOKUWIKI-AIC-ALSS).**
Grid (From the Start): `059000030200000000010070098007250000600708003000046900530010040000000002070000650`

ALS on `{F1,F4}`: F1 = `1/3/8`, F4 = `1/3`; the **8** in F1 is the extra digit. Turning 8 OFF in F1 forms the locked `[1,3]` pair across F1/F4.

AIC Rule 1 (continuous loop):
```
-3[B5]+6[B5]-6[B8]+6[D8]-8[D8]+8[D1]-8[F1]+3{F1|F4}-3[F3]+3[B3]-3[B5]
```
Off-chain eliminations:
- **6 removed from B9** (weak link B5→B8)
- **1 removed from D8** (in-cell switch 6↔8 at D8)
- **8 removed from F2** (weak link D1→F1)
- **8 removed from F3** (weak link D1→F1)
- **8 removed from J1** (weak link D1→F1)
- **3 removed from B4** (weak link B3→B5)

(Both grids, the ALS cells/digits, chains in curly-brace notation, and the eliminations are quoted verbatim from SudokuWiki "AIC with ALSs"; grids validated as 81-char strings.)

## Soundness

The only new inference is the strong link the ALS supplies, and it is a theorem of the basic constraints:

Let the ALS be N cells (mutually seeing) with exactly N+1 candidates, the extra digit being E. The entering weak link removes E from every ALS cell *for the duration of the chain's hypothesis*. The N cells then hold only N candidates among them, and since they all see each other no digit can repeat — so by counting (pigeonhole) **each of the N remaining digits occupies exactly one cell**: every remaining digit is forced present. Hence `(E OFF) ⇒ (digit Y present in the set)` for each remaining Y — a genuine strong link. Substituting this strong link into the AIC implication chain therefore preserves every inference, and the Rule 1/2/3 derivations are identical to plain AIC / Nice Loops (`aic.md`, `nice-loops.md`). For Rule 1, because *all* N digits are forced present once locked, each can fire off-chain removals — the "pair part" eliminations. Only the puzzle's row/column/box constraints are used; no uniqueness assumption, so AIC-with-ALS is sound on every grid.

## Sources

- SUDOKUWIKI-AIC-ALSS — *AIC with ALSs*, sudokuwiki.org/AIC_with_ALSs (ALS-as-link definition, curly-brace notation, the two worked grids/chains/eliminations, the "two cracks of the whip" pair-part eliminations, and the Dec-2025 enhancement notes).
- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (Nice Loop Rules 1/2/3 the outcomes reuse).
- HODOKU-CHAINS — hodoku.sourceforge.net chains/loops documentation (ALS-in-chain terminology; the Dec-2025 enhancement examples were drawn from HoDoKu's page).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (ALS 链 terminology).
