---
id: technique.grouped-aic
name_en: Grouped AIC / Grouped Nice Loops
name_zh: 分组交替推理链 / 分组 Nice 环
family: chains-aic
difficulty: extreme
strategyId:
  - grouped-aic
  - grouped-nice-loop
sources:
  - SUDOKUWIKI-AIC-GROUPS
  - SUDOKUWIKI-X-CYCLES
  - HODOKU-CHAINS
  - CHINESE-JWANGL5-ADVANCED
---

# Grouped AIC / Grouped Nice Loops / 分组交替推理链

## One-Sentence Rule

A Grouped AIC is an ordinary AIC / Nice Loop in which one or more nodes is a **group node** — a set of 2–3 same-digit candidates confined to a single box-line intersection and acting as one node — letting the chain link through a whole row/column segment instead of a single cell; the same Rule 1/2/3 outcomes apply.

## 精确模式定义

**单节点 single node.** `digit[cell]`, as in plain AIC.

**节点组 group node.** A group of candidates for one digit X, all in the **same box** *and* all in the **same line** (row or column) — i.e. confined to one box-line intersection — written `X[D3|F3]` (cells joined by `|`). The group behaves as a single ON/OFF node:
- It is **ON** if at least one of its candidates is true.
- It is **OFF** only if *all* its candidates are false.
A group node has an **orientation**: it is "aligned" along the line it occupies and can also be addressed from its box. Links must respect this geometry.

**强链 strong link with a group.**
- *Group ↔ single within a box*: if digit X in a box is confined to the group plus possibly other cells such that `¬(group) ⇒ X elsewhere`, or if the box's X's are exactly group + one cell — `¬P ⇒ Q` holds.
- *Group ↔ single along a line*: if the only X's in a column (or row) are the group and one further cell, that cell and the group are strongly linked.

**弱链 weak link with a group.**
- *Group → single*: if the group is ON, every X in the box or line it can see that is **not** in the group is OFF.
- *Single → group*: a single X peering the whole group turns the group OFF.

**交替规则.** Identical to AIC: strong/weak alternate; group nodes occupy a node slot like any other. A group is entered along one geometry (e.g. column) and exited along the other (e.g. box) per its orientation.

## 触发判定

1. Build an alternating AIC/loop allowing group nodes where a single cell cannot make the needed link.
2. A group node is admissible only when its candidates are genuinely confined to one box-line intersection (so "all of them OFF" / "at least one ON" is well-defined) and the incoming and outgoing links match its orientation (one link via the line, the other via the box).
3. Classify the result exactly as a Nice Loop: continuous (Rule 1), discontinuous-two-strong (Rule 2), discontinuous-two-weak (Rule 3).

## 消除/落子规则（全部情形）

Outcomes are the standard AIC / Nice Loop outcomes (see `aic.md`, `nice-loops.md`); the group node only changes *which units* a weak link covers.

**Rule 1 — Continuous Grouped loop (off-chain elimination).**
On each weak link remove the off-chain candidates of that link's shared unit. When the weak link is `single → group` the eliminated cells are the **other** X's in the box/line the group dominates (e.g. removing 8 from D2 and F2 because the group `8[D3|F3]` is ON). In-cell digit-switch weak links remove the cell's extra candidates as usual.

**Rule 2 — Discontinuity, two strong links → placement.**
Asserting the discontinuity candidate OFF forces it ON via the loop (the group node carrying part of the strong inference). **Place the digit** in the discontinuity cell, removing its other candidates.

**Rule 3 — Discontinuity, two weak links → elimination.**
Asserting the discontinuity candidate ON forces it OFF. **Eliminate** that candidate from the discontinuity cell. Most common grouped outcome (per source: Rule 3, then Rule 1 off-chains).

## 退化与边界

- **Group of size 1** = ordinary single node (no grouping needed).
- **Group not confined to one box-line intersection** is invalid — "at least one ON" no longer follows from a single strong-link source; do not group.
- **Orientation violated.** Entering and leaving a group along the *same* geometry, or via a unit the group does not jointly see, is unsound — both incoming and outgoing geometry must be respected.
- **Forcing Nets interaction (source note).** SudokuWiki only surfaces these examples when Forcing Nets are turned off; otherwise a net may pre-empt the grouped loop.
- **Continuity parity.** As with all Nice Loops, continuous loops are even; a single discontinuity gives Rule 2/3.

## 与其他技巧的关系

- **Grouped X-Cycles** = single-digit Grouped Nice Loops; Grouped AIC generalises them to multiple digits and in-cell links (analogous to how AIC generalises X-Cycles).
- `AIC ⊂ Grouped AIC` in expressive power: every AIC is a Grouped AIC with all groups of size 1.
- Group nodes are one of several "exotic" node types; ALS nodes (`+7{H6|G6}` curly-brace notation) and UR nodes extend the family further (out of scope here).
- **Empty Rectangle** / box-line interactions are the geometric primitive a group node exploits.
- Plain forms: `aic.md` (open AIC), `nice-loops.md` (loops), `xy-chain.md` (bivalue-only).

## Worked example

**Example A — Grouped continuous loop, Rule 1 (source grid, SUDOKUWIKI-AIC-GROUPS).**
Grid (from the start): `500001024020060090001700000000203006090000010200607000000009600040050030170800009`

Group node `8[D3|F3]` (the two 8s in box 4 sharing column 3):
```
+4[B1]-4[D1]+8[D1]-8[D3|F3]+8[B3]-4[B3]+4[B1]
```
Continuous → off-chain eliminations:
- **8 removed from D2** (weak link 8[D1] → group 8[D3|F3])
- **8 removed from F2** (same weak link)
- **7 removed from B3** (in-cell switch 8↔4 at B3)

**Example B — Grouped discontinuous loop, Rule 2 (source grid, SUDOKUWIKI-AIC-GROUPS).**
Grid: `901050007000002008008070000806000900000105000005000004000090800300400009200010706`

Group node `6[G6|H6]` (the 6s in box, column 6):
```
-2[H5]+2[H8]-2[A8]+6[A8]-6[A6]+6[G6|H6]-6[H5]+2[H5]
```
Two strong links meet at 2[H5] → **place 2 in H5** (remove 6).

**Example C — Grouped discontinuous loop, Rule 3 (source grid, SUDOKUWIKI-AIC-GROUPS).**
Grid: `060000050300701020200080009050270000000109000000034010700000008020305007040000090`

Group node `3[A7|C7]` (the 3s in box 3, column 7):
```
+3[J7]-2[J7]+2[J9]-1[J9]+1[A9]-3[A9]+3[A7|C7]-3[J7]
```
Two weak links meet at 3[J7] → **eliminate 3 from J7**.

(All three grids, chains, group nodes and eliminations are quoted verbatim from SudokuWiki "AIC with Groups" Rules 1/2/3; grids validated as 81-char strings.)

## Soundness

A group node `X[cells…]` confined to one box-line intersection satisfies, by the locked-candidate (intersection) constraint:
- if a strong link makes the box/line force X into that intersection, then **at least one** group candidate is true (group ON);
- if a single X peers the entire group, placing it turns **all** group candidates false (group OFF).
These are exactly the ON/OFF semantics single nodes have, so substituting a group node into the AIC implication chain preserves every inference. The Rule 1/2/3 derivations are then identical to plain AIC / Nice Loops (`aic.md`, `nice-loops.md`): continuous loops 2-colour into two truth classes (off-chain removals follow), and discontinuities force placement (two strong) or elimination (two weak). Only the constraints (units + box-line intersection) are used; no uniqueness assumption, so Grouped AIC is sound on all grids.

## Sources

- SUDOKUWIKI-AIC-GROUPS — *AIC with Groups*, sudokuwiki.org/AIC_with_Groups (Rules 1/2/3, all three grids, chains with group notation `X[..|..]`, and eliminations).
- SUDOKUWIKI-X-CYCLES — *X-Cycles*, sudokuwiki.org/X_Cycles (single-digit Nice Loop basis; group nodes introduced via Grouped X-Cycles).
- HODOKU-CHAINS — hodoku.sourceforge.net (grouped node terminology).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (分组 terminology).
