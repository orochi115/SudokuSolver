---
id: technique.remote-pairs
name_en: Remote Pairs / Chute Remote Pairs
name_zh: 远程数对 / 区块远程数对
family: wings
difficulty: tough
strategyId: remote-pairs, chute-remote-pairs
sources:
  - SUDOKUWIKI-REMOTE-PAIRS
  - SUDOKUWIKI-CHUTE-REMOTE-PAIRS
  - SUDOKUWIKI-W-WING
---

# Remote Pairs / Chute Remote Pairs — 远程数对类

## One-Sentence Rule

A Remote Pair is a chain of identical bivalue cells `{A,B}` linked by conjugate (locked)
pairs; cells at an **odd** chain-distance behave as a locked pair, so any cell seeing
both odd-distance endpoints loses both `A` and `B`. A Chute Remote Pair is the
box-restricted shortcut: two remote `{A,B}` cells in one chute let you eliminate the
digit that is *absent* from the chute's third box.

## 精确模式定义

### Remote Pairs
- **Nodes**: cells all sharing the identical pair `cand = {A,B}` (bivalue).
- **Links**: an edge of "distance 1" connects two nodes that **see each other** (they
  form a locked/conjugate pair: those two cells must between them hold `A` and `B`).
- **Chain**: a *contiguous* line of such locked pairs (disjoint groups may NOT be joined).
- **Distance**: number of links on the shortest path between two nodes.
- **Odd-distance endpoints** (distance mod 2 = 1) are themselves a **remote (locked)
  pair**: they must hold opposite digits. **Even-distance** nodes are *complementary*
  (must hold the SAME digit) and yield no elimination.
- Equivalent to 2-colouring the chain on the pair: alternate cells force `A`/`B`.

### Chute Remote Pairs (CRP)
- **Chute**: a band (3 boxes in a row) or stack (3 boxes in a column); 6 chutes total.
- **Pattern**: two bivalue cells `g1`,`g2` with the SAME pair `{A,B}`, both inside one
  chute, that do **not** see each other (Remote, not a Naked Pair). Together they occupy
  two of the chute's three boxes; the **third box's** cells in that chute are the test
  cells ("yellow" — the 3 cells of the third box lying in the chute's shared band/stack
  rows or columns... precisely the unused box of the chute).

## 触发判定

### Remote Pairs predicate
Given the graph `G` on all `{A,B}` cells with edges = mutual-sight pairs: for endpoints
`u,v` in the same connected component with shortest-path `dist(u,v)` **odd**, the pattern
fires iff `∃ T ∉ {chain}` with (`A∈cand(T)` ∨ `B∈cand(T)`) ∧ `sees(T,u)` ∧ `sees(T,v)`.

### CRP predicate
With `g1,g2` bivalue `{A,B}`, same chute, `¬sees(g1,g2)`, third-box-in-chute cells `Y`:
- **Single CRP**: fires iff exactly ONE of `{A,B}` (say `A`) appears in `Y` and the other
  (`B`) is **absent from every cell of `Y`**. Then `∃ T` with `B∈cand(T)` ∧ `sees(T,g1)`
  ∧ `sees(T,g2)`.
- **Double CRP**: fires iff **neither** `A` nor `B` appears in `Y`; then both can be
  removed from common peers of `g1,g2`.

## 消除/落子规则（全部情形）

- **Remote Pairs**: from each cell seeing both odd-distance endpoints, remove BOTH `A`
  and `B`. (Length 2 between endpoints = even = no elimination.) Remote Pairs are always
  even-length closed... — note chains have even cell-count for the simplest useful case
  (length-4 = the Double W-Wing); longer remote pairs occur at 6, 8, … cells.
- **Chute Remote Pairs (single)**: the digit absent from the chute's third box (`B`)
  is removed from every cell seeing both `g1` and `g2`.
- **Chute Remote Pairs (double)**: both `A` and `B` removed from cells seeing `g1` & `g2`.
- **CRP "either end" bonus**: when neither digit is in the third box, the two green cells
  also act as a locked pair across their boxes; you may additionally remove `A`/`B` along
  the green cells' own line outside their boxes (source: 'either end' rule). E.g. if
  `g1`,`g2` = {7,9} with 7,9 absent from box-`Y`, then in the box holding `g1` whichever
  of 7/9 it is not forces the complement into the shared band of the other box,
  permitting eliminations on the rest of that box's line.

## 退化与边界

- A distance-1 remote pair IS just a Naked Pair (handled earlier); the strategy is for
  distance ≥3 endpoints that do not see each other.
- Disconnected `{A,B}` groups must NOT be chained — the elimination is illegal without a
  contiguous locked-pair path (sudokuwiki's explicit warning).
- A length-4 Remote Pair (two `{A,B}` cells linked through two intermediaries) is exactly
  a **Double W-Wing / Remote Pair Chain** — two mirrored single W-Wings on the same pair.
- CRP requires `g1,g2` to genuinely not see each other; if they do, it is a Naked Pair.
  The third-box test cell may be a clue or already-solved cell — only the absence of the
  eliminated digit there matters.

## 与其他技巧的关系

- **§6 inclusion chain: Remote Pairs ⊂ XY-Chain ⊂ AIC.** A Remote Pair is the special
  XY-Chain in which every node carries the *same* pair `{A,B}`; sudokuwiki deprecated the
  standalone Remote Pairs strategy precisely because it is "wholly a subset of XY-Chains"
  (and of Simple Colouring on a single digit-pair). XY-Chains relax the "identical pair"
  constraint; AIC relaxes further to arbitrary strong/weak links and groups.
- **Double W-Wing = length-4 Remote Pair** (see `xy-xyz-w-wings.md`).
- **Chute Remote Pairs** is a box-restricted W-Wing variant (a "break-out from W-Wings",
  per source) that needs no explicit strong/weak link reasoning — just eyeballing.

## Worked example

### Chute Remote Pairs, single (source — cite `SUDOKUWIKI-CHUTE-REMOTE-PAIRS`, Example 1, "From the Start")
`000905000000000012060000050390050060000300004040060085030000090850010000000207000`
- Green cells `A8`={4,7} and `C1`={4,7}, same (vertical) chute, do not see each other.
- Third-box test cells `Y={B4,B5,B6}`. Of `{4,7}` only one appears in `Y`; the other is
  absent — that absent digit is removable from cells seeing both `A8` and `C1`.
- Per source pattern: the candidate present in `Y` (4) stays; the absent candidate (7) is
  eliminated from the pink common-peer cells of `A8` and `C1`.

### Chute Remote Pairs, with worked proof (source — cite `SUDOKUWIKI-CHUTE-REMOTE-PAIRS`, Example 3, "From the Start")
`003000800000060053200100000050000097007208300060000000000006005590010000001000908`
- Green `D6`={7,9} and `F2`={7,9} (horizontal chute to box 6); test cells `Y={E7,E8,E9}`
  contain 9 but not 7.
- Source result: 7 cannot be in `Y`, so with the remote pair in D6/F2,
  **9 is removed from D2 and D3** (the cells seeing both green cells).

### Remote Pairs (deprecated form) / Double W-Wing (source — cite `SUDOKUWIKI-W-WING`, Remote Pair Chain, "From the Start")
`010200870050000001000076000800027006000000000100480003000850700700000030001000020`
- Many `{4,9}` cells. `A3`={4,9} and `H7`={4,9} are linked by strong links via `A9` and
  `G9` (a length-4 remote pair / double W-Wing); the endpoints are at odd distance.
- Elimination: **4 and 9 removed from H3** (sees both A3 and H7). A second step removes
  4/9 from `H2` similarly.

## Soundness

- **Remote Pairs**: 2-colour the chain on `{A,B}`. Each locked-pair edge forces adjacent
  nodes to opposite colours (one `A`, one `B`). Two nodes at odd distance therefore carry
  *opposite* colours in every solution — i.e. exactly one is `A` and one is `B`, a true
  locked pair regardless of position. Any cell seeing both then sees an `A` and a `B`
  that are mutually exclusive yet jointly exhaustive over the pair, so it can hold
  neither. Even distance ⇒ same colour ⇒ no exclusion. ∎
- **CRP**: by Locked Candidates, within the chute each of `A`,`B` must appear in some box.
  If digit `B` is absent from the third box's chute-cells, then `B` for the chute is
  confined to the two boxes holding `g1,g2`; combined with `g1,g2` being the only `{A,B}`
  carriers there, `g1` and `g2` behave as a locked pair on `{A,B}` across the chute (one
  is `B`). Hence no common peer of `g1,g2` can be `B`. The double case applies the same
  to both digits; the 'either end' bonus follows from the cross-box forcing on the
  shared band/stack. ∎

## Sources

SUDOKUWIKI-REMOTE-PAIRS, SUDOKUWIKI-CHUTE-REMOTE-PAIRS, SUDOKUWIKI-W-WING
