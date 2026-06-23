---
id: technique.aic-with-exotic-links
name_en: AIC with Exotic Links
name_zh: 含奇异链接的交替推理链
family: chains-aic
difficulty: extreme
strategyId:
  - aic-with-exotic-links
sources:
  - SUDOKUWIKI-AIC-EXOTIC-LINKS
  - SUDOKUWIKI-AIC
  - SUDOKUWIKI-FINNED-XWING
  - CHINESE-JWANGL5-ADVANCED
---

# AIC with Exotic Links / 含奇异链接的交替推理链

## One-Sentence Rule

An AIC with an exotic link is an ordinary AIC / Nice Loop that rides through a **single-digit four-cell "XW" formation** spread across two boxes: when the chain turns ON the input digit it switches OFF *two* of the four cells, and because the remaining two form a strong link (the only two of that digit in their unit) one of them is forced — letting the chain make a link that a linear AIC, which "can't do two OFFs to make a link," could not; the same Rule 1/2/3 outcomes apply.

## 精确模式定义

**单节点 single node.** `digit[cell]`, as in plain AIC.

**Exotic link (general idea).** Any node that is not a single candidate, group, ALS or UR but a *small multi-candidate sub-pattern* acting as one strong-link node — "going beyond simple alternating single digits." The implemented case is the **XW (X-Wing-like) four-cell node** on **one digit N**.

**XW node (four-cell, one digit, two boxes).** Four candidates of the same digit N, **spread across two boxes, both different from the input's box**, arranged so that:
- **two of the four are a strong link** — they are the only two N's in some unit (a row, in the worked examples), so exactly one of them is ON;
- the **other two** N's each "see" a *third* candidate that serves as the chain's **exit**.

Written with the pattern code `(XW[...])`, the bracket spelling the internal toggle, e.g. `-8(XW[-E3/-B3+B2-E2])`. Semantics:
- **Entry:** the chain turns the input digit ON; it sees and turns **OFF two** of the four N-cells (the two not in the strong-link pair, in the relevant unit).
- **Strong link OUT:** with those two OFF, the strong-link pair must still place its single N, and the geometry forces a *specific* exit candidate ON (e.g. `+8[E1]`) — even though, link-by-link, plain AIC could only register the two OFFs and would stall. The XW node packages this mini-branch ("two OFFs ⇒ one ON") as one strong link.

This is, in Stuart's words, "the simplest possible way a 'net'-like pattern works, as opposed to the linear AIC" — a one-step forcing micro-net dressed as a chain node.

## 触发判定

1. Build an alternating AIC/loop. At a point where the chain turns a digit ON and would otherwise stall after switching off two same-digit cells, look for the XW formation.
2. **Admissibility of the XW node:**
   - four candidates of one digit N, in **two boxes**, both ≠ the input cell's box (if less separated they would simply toggle en masse — no need for the pattern);
   - within the formation, two of the N's are a **genuine strong link** (the only two N's in their unit);
   - the other two N's each see a common third candidate that becomes the **exit** node;
   - the chain's input turns OFF exactly the two non-strong-link N's, so the strong-link pair forces the exit candidate ON.
3. Classify the result exactly as a Nice Loop: continuous (Rule 1), discontinuous-two-strong (Rule 2), discontinuous-two-weak (Rule 3). The worked examples are both **Rule-3-style discontinuities returning to the start** (eliminate the start candidate).

## 消除/落子规则（全部情形）

Outcomes are the standard AIC / Nice Loop outcomes (see `aic.md`, `nice-loops.md`); the XW exotic node only changes *how* one strong link is justified.

**Discontinuity returning to start → eliminate the start candidate.** (Both source examples.)
Assert the start candidate ON; the loop (through the XW node) forces it OFF → **eliminate** that candidate from the start cell.

**Rule 2 — two strong links meet → placement.** Asserting the discontinuity OFF forces it ON → **place** the digit.

**Rule 1 — continuous loop → off-chain elimination.** On each weak link remove the off-chain candidates of that link's shared unit; the XW node simply supplies one of the strong links the loop traverses.

## 退化与边界

- **Four cells in one box (or one band/stack).** If the four N's are not split across two boxes they toggle together — the pattern is unnecessary and supplies no extra inference.
- **No genuine strong-link pair.** If the "two of four" are not the only N's in a unit, there is no forced exit — invalid.
- **No shared exit candidate.** If the other two N's do not both see a usable third candidate, the chain cannot exit the node.
- **Naming caveat.** The code `XW` is borrowed from X-Wing because it is a four-cell single-digit formation, but it "isn't quite the same" (Stuart) — it is a forcing micro-net, not a fish. A commenter argues it *is* X-Wing-like: the group is ON iff two of its cells are ON.
- **Extensions (not in scope).** The same idea extends to larger single-digit groups (a 3-row "swordfish-like" node needing three cells ON) and to **finned X-Wing** formations; broadly it folds into Forcing Nets once those are implemented.
- **Not a uniqueness technique** — uses only row/col/box constraints (contrast the UR node).
- **Frequency.** 169 instances in Ruud's top-50k corpus — reasonably common.

## 与其他技巧的关系

These EXTEND the AIC engine of `aic.md`: the exotic XW node is yet another way to justify one strong link in the same alternating walk and Rule 1/2/3 classifier.

- **Sibling exotic nodes:** group nodes (`grouped-aic.md`, `[..|..]`), ALS nodes (`aic-with-als.md`, `{..}`), UR nodes (`aic-with-ur.md`, `(UR[..])`). The XW node uses `(XW[..])`.
- **Finned X-Wing / Finned Swordfish** — the fin's "either the base set or the fin" disjunction is exactly the kind of strong link an exotic node can ride; the source flags finned X-Wing as a natural extension.
- **Forcing Nets** (`forcing_nets.md`) — the XW node is the minimal one-branch net; full nets generalise it. The technique exists to capture net-like inferences a strictly linear AIC ("can't do two OFFs to make a link") would miss.
- Plain forms: `aic.md` (engine), `nice-loops.md` (loops). Credit: inspired by an example from Lane Walker (USA).

## Worked example

**Example A — XW exotic node, eliminate start candidate (source grid, SUDOKUWIKI-AIC-EXOTIC-LINKS).**
Grid (From the Start): `039000008500102000007080000000090800000605004300000670003009040006020700070500900`

An AIC is found on **J3** using digit 8. Assume 8[J3] ON. The input picks up the four 8-cells in **B/E rows 2–3** (two boxes); because of the other 8s in rows B and E, two are switched OFF and the strong-link pair forces **8 ON at E1**. The chain then continues on 7 (E1→E5→G5→G4) and back through 8 (G1|G2) to J3.

AIC on 8 (with XW exotic node):
```
+8[J3] -8(XW[-E3/-B3+B2-E2]) +8[E1]-7[E1]+7[E5]-7[G5] +7[G4]-8[G4]+8[G1|G2]-8[J3]
```
- Contradiction: assuming 8 at J3 the chain implies it cannot be 8 → **eliminate 8 from J3**.

**Example B — XW exotic node, eliminate start candidate (source grid, SUDOKUWIKI-AIC-EXOTIC-LINKS).**
Grid (From the Start): `690008020001700000500090100905000040020300050030000208004006002000200800050040016`

More spread out. Start on **F6** with 5 ON. This goes straight into the XW node on the four 5-cells in **boxes B and H, rows 5–6**, which spits out **+5 on B9** (row B has only three 5s; row H's two 5s are the strong link). The chain continues on 9 (B9→E9→F8) back to F6.

AIC on 5 (with XW exotic node):
```
+5[F6] -5(XW[-B6/-H6+H5-B5]) +5[B9] -9[B9]+9[E9]-9[F8] +9[F6]-5[F6]
```
- Contradiction: when F6 is set to 5 the chain implies it cannot be 5 → **eliminate 5 from F6**.

(Both grids, the `(XW[...])` node spellings, the full chains, and the eliminations are quoted verbatim from SudokuWiki "AICs with Exotic Links"; grids validated as 81-char strings.)

## Soundness

The new inference is the strong link the XW node supplies. Consider four candidates of digit N split across two boxes, two of which — call them P, Q — are the only N's in some unit U, hence form a conjugate (strong) pair: exactly one of P, Q is true. The other two N's, R and S, are positioned so that the chain's input (digit ON) sees and removes **both** R and S. With R and S gone, no constraint is yet violated, but tracing the box/line geometry, the surviving conjugate pair {P,Q} together with the now-empty R/S positions forces a *specific* third candidate (the exit, e.g. 8[E1]) to be ON — this is a one-step forcing argument over the four cells, sound because it uses only the row/col/box constraints. Packaged, this is the strong link `(input ON) ⇒ (exit ON)`. Substituting it into the AIC chain preserves every other inference, and the discontinuity/loop classification is the ordinary Nice Loop logic (`aic.md`, `nice-loops.md`): closing back on the start candidate with the wrong parity eliminates it. No uniqueness assumption is made, so AIC-with-exotic-links is sound on every grid. (It is a packaged micro-forcing-net; the same conclusion is reachable by a small Forcing Net, of which this is the minimal case.)

## Sources

- SUDOKUWIKI-AIC-EXOTIC-LINKS — *AICs with Exotic Links*, sudokuwiki.org/AICs_with_Exotic_Links (the XW four-cell exotic-link definition, both worked grids/chains/eliminations, naming caveat, finned-X-Wing extension; pattern inspired by Lane Walker; 169 corpus hits).
- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (Nice Loop Rules 1/2/3 the outcomes reuse).
- SUDOKUWIKI-FINNED-X-WING — *Finned X-Wing*, sudokuwiki.org/Finned_X_Wing (fin disjunction, the flagged extension).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (链 terminology).
