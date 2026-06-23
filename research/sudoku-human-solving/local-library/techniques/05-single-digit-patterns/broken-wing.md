---
id: technique.broken-wing
name_en: Broken Wing (Guardians / Oddagon)
name_zh: 断翼（守护者 / 奇环）
family: single-digit-patterns
difficulty: tough
strategyId: broken-wing
sources:
  - SUDOPEDIA-BROKEN-WING
  - SUDOKUWIKI-GUARDIANS
---

# Broken Wing / 断翼（守护者）

## One-Sentence Rule

For a single digit, an almost-closed loop made of an ODD number of strong links (which can never close in a valid Sudoku) forces at least one of the extra candidates breaking the loop — the guardians — to hold the digit, so the digit can be placed (one guardian) or eliminated from every cell that sees all the guardians (several guardians).

## 精确模式定义

All terms relative to a single fixed digit `d`.

- **Strong link / conjugate pair (perfect pair)**: a house in which `d` occurs in **exactly two** candidate cells. `a =d= b`: at least one of `a`, `b` is `d`.
- **Imperfect pair**: a house in which `d` occurs in **three or more** candidate cells.
- **Odd loop (oddagon)**: a cyclic sequence of candidate cells `c0, c1, …, c_{n-1}, c0` of `d`, where each consecutive pair shares a house and `n` is **odd**. If every one of the `n` links were a strong link the loop would be a "deadly loop" — impossible in any valid Sudoku, because an odd alternating single-digit cycle has no consistent ON/OFF colouring (it forces a candidate to be both ON and OFF).
- **Guardian set `G`**: the set of all candidate cells of `d` that lie in the imperfect-pair houses of the loop but are NOT loop cells. These are exactly the cells whose presence prevents the odd loop from being a closed strong-link loop. The pattern requires `n - (#strong links)` link(s) to be imperfect; every extra `d` in those imperfect houses is a guardian.

A **Broken Wing** = an odd loop on `d` having `k` strong links and `n - k >= 1` imperfect links, together with its guardian set `G` (|G| >= 1). The canonical / smallest case is `n = 5` (five-cell loop, "broken wing" proper) with four strong links and one or two imperfect links.

The six structural sub-patterns of the 5-cell broken wing, by number of strong links (conjugate pairs) present: from 1 up to 4 strong links (per SUDOPEDIA-BROKEN-WING); only the small-guardian cases are practically solvable by the guardian rule.

## 触发判定

```
fix digit d.
find a cyclic ordering of n candidate cells (n odd, n >= 5 typical) of d,
  loop = [c0, c1, ..., c_{n-1}], with sees(c_i, c_{i+1 mod n}) for all i.
for each consecutive link (c_i, c_{i+1}):
    let H = the shared house used by that link.
    if |cells(d,H)| == 2:  link is STRONG, contributes no guardian.
    else:                  link is IMPERFECT; guardians from this link =
                           cells(d,H) \ {c_i, c_{i+1}} restricted to the house H.
G = union over all imperfect links of their guardian cells.
TRIGGER iff  n is odd  AND  |G| >= 1  AND  Elim(G) (see §4) is non-empty
            (or |G| == 1, which always yields a placement).
```
Note the parity requirement: an EVEN such loop is a continuous X-Cycle (see Turbot Family card), not a Broken Wing.

## 消除/落子规则（全部情形）

At least one guardian in `G` must be `d` (otherwise the odd strong-link loop closes → contradiction). Consequences:

**Case 1 — Single guardian (`|G| == 1`)**: the lone guardian `g` must hold `d`. **Place** `d` in `g` (assign), and remove all other candidates from `g`.

**Case 2 — Multiple guardians, target outside the loop**:
```
Elim(G) = { x : x candidate of d, x not in G, x not in loop,
                for every g in G: sees(x, g) }
```
Remove `d` from every cell in `Elim(G)`. (When all guardians share one house, `Elim(G)` includes the other `d`-candidates of that house.)

**Case 3 — Multiple guardians, target on the loop**: a loop cell may itself see all guardians; it is then a legitimate elimination target (remove `d` from that loop cell). This is allowed because the eliminated cell is not itself a guardian.

There is no uniqueness-based variant; all three cases are direct consequences of "at least one guardian is true."

## 退化与边界

- **|G| == 0**: the odd loop would be a closed strong-link loop = impossible; this means the assumed loop cannot actually be all-strong, i.e. the search is malformed. A genuine Broken Wing always has `|G| >= 1`.
- **Too many guardians**: SUDOPEDIA notes the guardian rule is "only rarely useful" because imperfect houses often contain many `d`-candidates, making `Elim(G)` empty (no cell sees ALL of them). Pattern present but inert.
- **Single strong link / two adjacent strong links sub-patterns**: if the guardian rule yields nothing, these two of the six sub-patterns do not help solve the puzzle.
- **Even loop**: not a Broken Wing — handle as continuous X-Cycle (Nice-Loop Rule 1).
- **All five loop cells share an identical bivalue (XY) pair** (color-trap variant): the colour chain is valid for BOTH digits → the trap cell loses both candidates (dual). Outside pure single-digit scope; note but do not rely on.

## 与其他技巧的关系

- **Complement of the X-Cycle/Turbot family**: a continuous X-Cycle is an EVEN single-digit alternating loop (consistent two-colourings, Nice-Loop Rule 1). A Broken Wing is the ODD analogue: the loop cannot be all-strong, so the imperfection (guardians) carries the deduction. Same single-digit strong/weak-link machinery; different parity. SUDOPEDIA: "A Broken Wing is a single-digit pattern similar to a Turbot Fish"; SUDOKUWIKI lists Guardians aliases as "Broken Wings, Turbot-Fish, or Oddagon."
- **Subsumed by colouring / X-chains**: SUDOPEDIA — for 4 of the 6 sub-patterns, Simple Colouring (color-wrap), Multi-Colouring (color-trap), or X-Chains on the loop solve or partially solve the pattern. SUDOKUWIKI deprecated Guardians (March 2010) as "a complicated way of looking at what is ultimately a nice loop with off-chain eliminations," superseded by X-Cycles.
- **Engine note**: do NOT implement a separate guardian search if a general single-digit AIC / X-Cycle engine already finds odd-loop contradictions. Broken Wing is a NAMED presentation of an odd X-loop discontinuity, not independent logic. Keep it as a label emitted when an odd single-digit loop with a small guardian set is detected.
- **Oddagon / BUG-lite resemblance**: the "deadly loop" impossibility is the single-digit cousin of the bivalue-universal-grave argument; both rest on "a structure that would have two solutions / no colouring is forbidden."

## Worked example

Source: SUDOPEDIA-BROKEN-WING, "Single Guardian" pattern (verbatim coordinates). Single digit `d` (the source uses a generic digit; coordinates are exact).

- Loop (four strong links already present): `r5c2 - r2c2 - r2c5 - r1c6 - r5c6`.
  - `r5c2 =d= r2c2` (column 2 conjugate pair)
  - `r2c2 =d= r2c5` (row 2 conjugate pair)
  - `r2c5 =d= r1c6`? per source the loop is the listed five-cell cycle with 4 strong links; the closing fifth link `r5c6 - r5c2` (row 5) is the imperfect one.
- Closing the odd (5-link) loop would require row 5 to be a perfect pair on `d`, but row 5 also contains a third `d`-candidate at **r5c8** — the single **guardian**.
- Because closing the all-strong odd loop is impossible, the guardian must be true.

Exact result (Case 1): **place `d` in r5c8** (`r5c8 = d`).

SUDOPEDIA single-guardian sketch (abstract, no 81-char grid): loop `r5c2,r2c2,r2c5,r1c6,r5c6`, guardian `r5c8`, deduction `r5c8=d`.

**Verified — SudokuWiki Guardian 1** (single guardian, digit 3):
Grid: `008057600000000007040903000070590040900000001020084070000409010200000000003870500`

Five-cell loop on 3 with one imperfect box-6 link ⇒ guardian **`r4c7=3`** (D7).

**Verified — SudokuWiki Guardian 2** (double guardians, digit 7):
Grid: `103896520020753010090214063010569382200437195030182070002945031350621040001378250`

Guardians `G1,H7` both see `G7` ⇒ **`r7c7<>7`**.

**Verified — SudokuWiki Guardian 3** (disruptive guardian on loop, digit 1):
Grid: `070500030804003600030000000401020003763800521920310064007000000042900308010002070`

Guardians `C4,G6` both see loop cell `G4` ⇒ **`r7c4<>1`**.

Single-digit candidate sketch (`X` = loop cell candidate of `d`, `G` = guardian, `.`/`-` = no `d`), as given by the source:
```
Col:   1 2 3 4 5 6 7 8 9
Row1:  . . . . . X . . .     (r1c6 in loop)
Row2:  . X . . X . . . .     (r2c2, r2c5 in loop)
Row5:  . X . . . X . G .     (r5c2, r5c6 in loop; r5c8 = guardian)
```
- Matched loop cells: `r5c2, r2c2, r2c5, r1c6, r5c6`.
- Guardian: `r5c8`.
- Deduction: `r5c8 = d` (placement).

Multiple-guardian variant (SUDOPEDIA "Multiple Guardians"): the same loop but row 5 contributes two guardians both in column 8; since at least one is true, eliminate `d` from the remaining `d`-candidates of column 8 (the `*` cells in the source figure). Type-2/3 from SUDOKUWIKI-GUARDIANS give: digit 7 loop with guardians G1,H7 both seeing G7 → `r7c7<>7`-style elimination (`G7<>7`); digit 1 loop with guardians C4,G6 → remove 1 from the loop cell G4 (Case 3).

## Soundness

- **Core lemma**: a single-digit cyclic chain of links has a consistent alternating ON/OFF colouring iff the cycle length is even. For an ODD cycle in which every link is a strong link, propagating ON/OFF around the loop returns the opposite state to the start cell — a contradiction. Therefore no odd loop on `d` can consist entirely of strong links in a solved grid.
- Hence in the current grid, at least one of the links must be imperfect AND carry a true `d` somewhere other than its two loop cells: at least one guardian holds `d`. This is a tautology given the lemma; no uniqueness assumption is used (unlike BUG/Unique Rectangle).
- **Case 1**: |G| = 1 ⇒ that guardian is the only way to avoid the impossible loop ⇒ it is `d`. **Case 2/3**: any cell seeing all guardians cannot be `d` (it would falsify every guardian, forcing the impossible loop). Sound.
- Validity does not depend on the puzzle having a unique solution; it only depends on the grid being a valid (consistent) Sudoku, which any solvable position is.

## Sources

SUDOPEDIA-BROKEN-WING (definition via odd strong-link loop; guardians; single/multiple-guardian rules with exact loop coordinates r5c2-r2c2-r2c5-r1c6-r5c6 and guardian r5c8; six sub-patterns and their colouring/X-chain alternatives; GFDL 1.2). SUDOKUWIKI-GUARDIANS (perfect/imperfect pair definitions; three elimination rules; Type-1/2/3 worked digits 3/7/1; deprecated in favour of X-Cycles).
