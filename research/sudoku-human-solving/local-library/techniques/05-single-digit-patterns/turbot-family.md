---
id: technique.turbot-family
name_en: Turbot Family (Single-Digit Strong-Link Chains)
name_zh: 多宝鱼家族（单数字强链）
family: single-digit-patterns
difficulty: tough
strategyId: turbot-fish
sources:
  - HODOKU-SDP
  - SUDOKUWIKI-X-CYCLES
  - SUDOKUWIKI-RECTANGLE-ELIMINATION
  - CHINESE-JWANGL5-ADVANCED
---

# Turbot Family / 多宝鱼家族

## One-Sentence Rule

For a single digit, a short alternating chain of strong and weak links (Skyscraper, 2-String Kite, Empty Rectangle / Rectangle Elimination, generic Turbot Fish, and longer X-Cycles) proves that one of two endpoint cells must hold the digit, so the digit is eliminated from every cell that sees both endpoints (discontinuous case) or from off-chain cells sharing a weak-link unit (continuous case).

## 精确模式定义

Terms (all relative to a single fixed digit `d`):

- **Candidate cell**: a cell whose pencilmark set contains `d`.
- **House / unit**: a row, column, or box (9 of each).
- **Conjugate pair (strong link)**: a house in which `d` appears in **exactly two** candidate cells `a`, `b`. Notation `a =d= b`. Truth: NOT(a) => b and NOT(b) => a (at least one is true).
- **Weak link**: two candidate cells `a`, `b` of `d` that share a house and where `d` may appear elsewhere in that house too. Notation `a -d- b`. Truth: a => NOT(b) (at most one is true).
- **Grouped node**: a set of candidate cells of `d` that all lie in one box AND one line (row or column); the group behaves as a single chain node. Used by Empty Rectangle and grouped X-Cycles.

A **single-digit chain** is an alternating sequence of nodes `n0 ~ n1 ~ … ~ nk` for digit `d` in which links strictly alternate strong / weak. The family members are exactly the following chain shapes:

| Member | Chain length (links) | Node shape | Defining geometry |
|---|---|---|---|
| Skyscraper | 3 (strong-weak-strong) | 4 single cells | two parallel lines (both rows or both cols) each a conjugate pair on `d`; the two "base" ends share one line (the cross-line) |
| 2-String Kite | 3 (strong-weak-strong) | 4 single cells | one row conjugate pair + one column conjugate pair; one end of each lies in a common box (the weak link is inside that box) |
| Empty Rectangle (ER) | 3 (strong-weak-strong) | 1 grouped node + 2 single cells | in one box `d` is confined to exactly one row AND one column (their intersection cells = the ER "hinge"); a conjugate pair in a crossing line links to it |
| Rectangle Elimination (RE) | 3+ (grouped discontinuous chain) | hinge + weak wing + strong wing + fourth-corner house | SudokuWiki's current presentation/replacement for Empty Rectangle; assuming a weak wing true forces a strong wing true and empties the fourth-corner house |
| Turbot Fish | 3 (strong-weak-strong) | 4 single cells (generic) | the generic two-strong-link single-digit chain: strong + weak + strong, endpoints not collinear in the obvious X-Wing way |
| X-Cycle (discontinuous) | odd, >=3 | single or grouped | alternating chain whose two ends are joined by a weak link, producing a contradiction at one node |
| X-Cycle (continuous) | even, >=4 | single or grouped | a closed loop with perfectly alternating strong/weak links |

Cardinality: Skyscraper / Kite / Turbot use exactly **two strong links and one weak link** over **four candidate cells**. ER uses **two strong links and one weak link** but one strong link is a grouped node. X-Cycles generalize to any number of strong links.

## 触发判定

Let `cells(d, H)` be the candidate cells of `d` in house `H`. Define `sees(a, b)` = a and b share at least one house and a != b.

**Skyscraper** (rows form; columns symmetric):
```
exists rows R1, R2 (R1 != R2) with |cells(d,R1)| == 2 and |cells(d,R2)| == 2:
  cells(d,R1) = {a1, b1}, cells(d,R2) = {a2, b2}
  the two "base" ends share a column: col(b1) == col(b2)   (the strong-link tops a1,a2 are the free ends)
  AND a1, a2 are NOT in the same column      (else it is a plain X-Wing, see §6)
  => endpoints = {a1, a2}
```
Trigger satisfied iff `Elim(a1,a2)` (below) is non-empty.

**2-String Kite**:
```
exists row R with |cells(d,R)| == 2, column C with |cells(d,C)| == 2,
  cells(d,R) = {rEnd, rBox}, cells(d,C) = {cEnd, cBox}:
  box(rBox) == box(cBox)  AND  rBox != cBox   (the in-box pair is the weak link)
  => endpoints = {rEnd, cEnd}
```

**Empty Rectangle**:
```
exists box B and a "crossing" line L (row or column) with |cells(d,L)| == 2:
  within B, cells(d,B) all lie in exactly one row r_B and one column c_B (ER hinge),
            and there are >= 2 candidate cells of d in B not all collinear in a single line
            (the "two-candidate ER" degenerate form is treated as Turbot Fish, see §5);
  one endpoint convCellIn of the conjugate pair on L lies in row r_B or column c_B of B;
  the other endpoint convCellOut sees, along the OTHER ER line, a target cell.
  => the target is any cell that lies in the ER's free line AND sees convCellOut.
```
(Equivalently: ER hinge box + conjugate pair; HoDoKu treats this as a Finned Mutant X-Wing or a Grouped Nice Loop.)

**Rectangle Elimination**:
See `rectangle-elimination.md` for the implementation-ready presentation. In this family card, treat RE as an Empty Rectangle / grouped X-Cycle naming specialization unless the taxonomy deliberately wants a separate teaching `strategyId`.

**Generic Turbot Fish** (covers all three above):
```
exists candidate cells s1a =d= s1b   (strong link 1)
   and candidate cells s2a =d= s2b   (strong link 2)
   with s1b -d- s2a                   (weak link joining them: sees(s1b,s2a))
  => endpoints = {s1a, s2b}
```

**X-Cycle discontinuous (odd length)**: an alternating chain `e0 ~ … ~ e_k` (k odd-ish per Nice-Loop parity) whose two ends `e0`, `ek` are the SAME cell joined by two like-type links (two weak or two strong meeting), producing a contradiction; see §4.

**X-Cycle continuous (even length, loop)**: a closed alternating loop; trigger iff at least one weak link's shared house contains an off-chain candidate cell of `d`.

## 消除/落子规则（全部情形）

**Case A — Discontinuous (Skyscraper, Kite, Turbot, ER, odd X-Cycle): "one of two endpoints is true".**
Given endpoints `{p, q}` such that at least one holds `d`:
```
Elim(p,q) = { cell x : x != p, x != q, x is candidate of d, sees(x,p) AND sees(x,q) }
```
Remove `d` from every cell in `Elim(p,q)`.
- Skyscraper: endpoints are the two free "tops"; targets are the cells seeing both tops (typically two cells in each top's line/box).
- 2-String Kite: endpoints are the two outer string ends; the single target is the unique cell seeing both.
- Empty Rectangle: endpoint set realized as {convCellOut, ER-free-line}; target = candidate of `d` on the ER's free line that also sees the far end of the conjugate pair.

**Case A' — Nice-Loop Rule 2 (discontinuous, two strong links meet a cell)**: when the chain returns to its start cell via strong links of the same parity such that the start digit is forced ON, **place** `d` in that cell (and remove all other candidates of that cell). When forced OFF, **eliminate** `d` from that cell.

**Case B — Continuous loop (even X-Cycle, incl. X-Wing len 4, 2-2-2 Swordfish len 6): Nice-Loop Rule 1.**
No candidate is removed from loop cells. For every **weak link** `a -d- b` in the loop, in the shared house(s) of `a` and `b`, remove `d` from every candidate cell **not on the loop**.

**Case C — Empty Rectangle / grouped X-Cycle eliminations**: when a node is a grouped node, the eliminated targets are still defined by "sees both endpoints", where a target sees a grouped node iff it shares the group's line or box with the whole group.

## 退化与边界

- **ER with only two candidates in the box**: the ER hinge is not uniquely defined; the move is still valid but is identical to a Turbot Fish / X-Chain. HoDoKu finds Turbot Fish before ER, so it reports these as Turbot Fish (supports two-candidate ER only optionally). Engine: do not emit both.
- **Skyscraper top-cell band restriction**: the two "tops" (free ends) must lie in the same band (for row-form, same set of 3 rows? — actually: the two base ends share a line; if the two free tops are ALSO in the same line it collapses to an X-Wing). If no cell sees both tops, no elimination — pattern present but inert.
- **2-String Kite degenerate**: if both string ends already share a house, the elimination set may be empty.
- **Dual forms** (Dual 2-String Kite, Dual Empty Rectangle): two distinct eliminations share the same connecting pair; HoDoKu treats each dual as one move but notes it equals two single moves. Engine MAY emit as two separate findings.
- **Empty grid / fewer than two conjugate pairs on `d`**: no pattern.
- **Continuous loop with no off-chain candidate in any weak-link house**: loop exists but yields zero eliminations (inert).

## 与其他技巧的关系

CRITICAL for the engine — these are the SAME underlying object; implement ONE single-digit alternating-chain engine, not five:

- **Turbot Fish = the generic two-strong-link single-digit chain.** Skyscraper, 2-String Kite, and (two-candidate) Empty Rectangle are all special geometric cases of the length-4 (3-link) Turbot Fish / X-Chain. HoDoKu states explicitly: "A Turbot Fish is an X-Chain that is exactly four candidates long"; Skyscraper "is a special form of Turbot Fish"; 2-String Kite "is a second special form of Turbot Fish."
- **X-Wing = a continuous X-Cycle of length 4** (SudokuWiki: "X-Wing is a Continuous X-Cycle with the length of four"). It is the single-digit fish of size 2 and belongs to the Fish family card, but its X-Cycle reading is identical.
- **2-2-2 Swordfish = a continuous X-Cycle of length 6.**
- **Fishy Cycle / Nice Loop (single digit) = X-Cycle.** "X-Cycle" is the SudokuWiki name; "Nice Loop on `d`" / "Fishy Cycle" are aliases for the same single-digit alternating loop.
- **Skyscraper / Kite = Sashimi X-Wings.** HoDoKu: a Skyscraper "can be seen as two Sashimi X-Wings."
- **Empty Rectangle = Finned Mutant X-Wing = Grouped Nice Loop** (HoDoKu's two equivalent readings).
- **Rectangle Elimination = SudokuWiki's current Empty Rectangle replacement**. SudokuWiki says it can also be expressed as AIC with at least one grouped cell. It should be implemented by the same grouped single-digit chain machinery and only surfaced separately for naming/order.
- **Simple Colouring overlap**: continuous X-Cycles produce eliminations identical to a colouring wrap/trap on `d`; many Turbot patterns are also reachable by Simple Colouring. The engine should pick the simplest/shortest explanation.
- **Broken Wing / Guardians** (see `broken-wing.md`): an ODD single-digit near-loop; complementary to the continuous (even) X-Cycle. Not the same move but the same link machinery.

Recommended engine decomposition: a single `xChain(d)` / `xCycle(d)` search over strong+weak single-digit links with grouped-node support; Skyscraper, Kite, Turbot Fish, ER, X-Wing emerge as named sub-patterns by chain length and node geometry. Name selection is presentation, not separate logic.

## Worked example

Source: HoDoKu SDP, Skyscraper example "sk01" (left example), digit 1. Cited verbatim from HODOKU-SDP: "In column 6 digit 1 can only be placed in row 1 or row 5. In column 9 digit 1 can only be placed in row 3 or row 5. r5c6 and r5c9 are in the same row (the base) … all candidates that can see both cells can be eliminated (in our example: r1c78 and r3c45)."

Pattern (digit `d = 1`):
- Strong link 1 (column 6): `r1c6 =1= r5c6`.
- Strong link 2 (column 9): `r3c9 =1= r5c9`.
- Weak link (row 5, the base): `r5c6 -1- r5c9`.
- Chain: `+1[r1c6] -1[r5c6] +1[r5c9? ...]` → Nice-Loop form `r1c6 =1= r5c6 -1- r5c9 =1= r3c9`.
- Endpoints (free tops): `{r1c6, r3c9}` — at least one is 1.

Eliminations (Case A, cells seeing both endpoints):
- `r1c7`, `r1c8` see `r1c6` (row 1) and `r3c9`? — they see r3c9 only if same col/box; HoDoKu's stated targets are the cells seeing the two tops: r1c7,r1c8 lie in row 1 with r1c6 and in box/col aligned to r3c9 via the cross-geometry. Per the cited source the eliminations are exactly: **1 removed from r1c7, r1c8, r3c4, r3c5.**

(The four eliminations `r1c78, r3c45` are reproduced exactly as stated by HODOKU-SDP. FLAG: the full 81-char grid is not reproduced by the source as text; the elimination set is authoritative. The candidate-level grid below is a CONSTRUCTED minimal illustration — needs engine verification.)

Constructed candidate sketch (only digit-1 placements shown; `1` = candidate, `.` = no 1 / filled):
```
Col:   1 2 3 4 5 6 7 8 9
Row1:  . . . . . 1 1 1 .     (r1c6 strong-top; r1c7,r1c8 = elimination targets)
Row3:  . . . 1 1 . . . 1     (r3c9 strong-top; r3c4,r3c5 = elimination targets)
Row5:  . . . . . 1 . . 1     (r5c6, r5c9 = base / weak link)
```
- Matched cells: `r1c6, r5c6, r5c9, r3c9` (chain). Base weak link `r5c6 -1- r5c9`.
- Exact eliminations: `r1c7<>1, r1c8<>1, r3c4<>1, r3c5<>1`.

A worked **continuous** example (Case B) is given by HODOKU/SUDOKUWIKI X-Cycles Figure 4 on digit 8: chain `-8[A1]+8[A6]-8[C4]+8[H4]-8[H2]+8[J1]-8[A1]`, eliminating 8 from B6, C5, H7 (off-chain cells in weak-link units). Cited from SUDOKUWIKI-X-CYCLES.

## Soundness

- **Discontinuous (Case A)**: the two strong links each guarantee "at least one of the pair is `d`". The connecting weak link guarantees "not both of the inner cells are `d`". Tracing: assume top `p` is not `d`; then by strong link 1 the inner cell is `d`; by the weak link the other inner cell is not `d`; by strong link 2 the far top `q` is `d`. Symmetrically assuming `q` not `d` forces `p = d`. Hence `p OR q` is `d`. Any cell seeing both `p` and `q` cannot be `d` without contradicting both branches. Sound (no uniqueness assumption).
- **Continuous (Case B / Nice-Loop Rule 1)**: a fully alternating closed loop has two consistent global colourings (every node ON-OFF-ON…). Each weak link's shared house therefore contains exactly one true `d` among its two loop cells, so any other `d` in that house is contradicted in both colourings. Sound.
- **Nice-Loop Rule 2 (Case A')**: returning to the start with a forced ON/OFF yields a direct contradiction unless the start cell takes the forced value; this is a valid proof by case split on a single candidate. Sound.
- All members are pure single-digit chain logic; none rely on solution uniqueness, so they remain valid for puzzles with multiple solutions.

## Sources

HODOKU-SDP (Skyscraper, 2-String Kite incl. Dual, Turbot Fish, Empty Rectangle incl. two-candidate and Dual; equivalences to Sashimi X-Wing, Finned Mutant X-Wing, Grouped Nice Loop). SUDOKUWIKI-X-CYCLES (Nice Loop Rules 1 & 2, continuous vs discontinuous, X-Wing = continuous len-4 X-Cycle, Swordfish 2-2-2 = len-6, Figure-4 digit-8 worked loop). SUDOKUWIKI-RECTANGLE-ELIMINATION (current SudokuWiki replacement/presentation for Empty Rectangle, with grouped-AIC equivalence and 81-char exemplars). CHINESE-JWANGL5-ADVANCED (Chinese terminology: 摩天楼/双线风筝/空矩形/多宝鱼).
