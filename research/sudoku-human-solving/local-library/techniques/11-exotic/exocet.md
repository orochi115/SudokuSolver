---
id: technique.exocet
strategyId: exocet
name_en: Exocet
name_zh: Exocet / 飞鱼导弹
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-EXOCET
---

# Exocet / 飞鱼导弹

## One-Sentence Rule

Two aligned base cells in one box together carry a set of 3 or 4 candidate
digits, and two target cells — one in each of the other two boxes of the same
band/stack, seeing neither each other nor the base — are forced to hold exactly
the two *true* base digits, so any non-base candidate in a target is eliminated.

## 精确模式定义

Work within one band (three horizontal boxes) or stack (three vertical boxes).

- **Base cells** `B = {b1, b2}`: two unsolved cells in a single box, aligned in
  one mini-line (same row inside the box, or same column). `Bdigits =
  cand(b1) ∪ cand(b2)`, with `|Bdigits| ∈ {3, 4}`. Valid distributions include
  `{1,2,3,4}+{1,2,3,4}`, `{1,2,3}+{2,3,4}`, `{1,2,3}+{3,4}`.
- **Target cells** `T = {t1, t2}`: one cell in each of the *other two* boxes of
  the band/stack. Each `ti` contains all of `Bdigits` it can plus possibly
  extras; `t1` and `t2` must **not** see each other, and neither sees `b1` or
  `b2`. In a **Junior Exocet (JE)** the targets lie in the same band as the
  base. In a **Senior Exocet (SE)** they may sit anywhere on the two cross-lines.
- **Cross-lines**: the two lines (perpendicular to the base mini-line)
  descending from the targets through the band.
- **S-cells**: the six cells outside the base tier at the intersections of the
  three cross-lines — the supply cells for the true base digits.
- **Companion cells** `C`: one per target, the cell completing the target's
  mini-line in its box.
- **Mirror cells** `M`: two per target, in the opposite target's mini-line band
  position.

Exactly **two** of the `Bdigits` are the *true* base digits (the digits that
will actually fill the base cells); the targets are forced to host these two.

## 触发判定

```
band/stack fixed; base box fixed
B = {b1,b2} aligned in a mini-line of base box
Bdigits = cand(b1) ∪ cand(b2);  require 3 <= |Bdigits| <= 4
T = {t1,t2}, one per other box of the band
require: not sees(t1,t2)
require: not sees(t1,b*) and not sees(t2,b*)
require: Bdigits ⊆ cand(t1) ∪ cand(t2)            # targets cover base digits
# Companion rule:
require: for each companion C(ti):  cand(C(ti)) ∩ Bdigits = ∅   (not even givens)
# Cover rule:
require: each digit of Bdigits appears at most twice among the S-cells
         (coverable by at most one cross-line per digit)
=> Exocet (JE if targets in base band)
```

## 消除/落子规则（全部情形）

1. **Target purge (Rule 1)**: from each target `ti`, remove every candidate that
   is *not* in `Bdigits`.
2. **Distinct targets (inference)**: `t1` and `t2` must take *different* base
   digits; the two true base digits are exactly `{value(t1), value(t2)}`.
3. **Single-cover falsity (Rule 3)**: a base digit restricted to only one S-cell
   cover house is invalid → it is false in the base mini-line *and* removed from
   the target cells.
4. **Cross-strong-link (Rule 4)**: if a base digit must be true in the *other*
   target (reduced target acts as a strong link), it is false in *this* target →
   remove it here.
5. **Cover-line falsity (Rule 5)**: a base digit whose S-cell cover house is a
   cross-line is false in the target cell lying on that cross-line → remove it.
6. **Mirror constraint**: each mirror pair holds the same base digits as its
   opposite target plus one digit that is false in the base; this can drive
   eliminations in the mirror cells.

## 退化与边界

- `|Bdigits| < 3` collapses to a bivalue / locked pair, not an Exocet;
  `|Bdigits| > 4` is disqualified.
- A companion cell containing any base digit (even as a given) **kills** the
  pattern — the targets are no longer forced.
- If a base digit appears 3+ times among the S-cells, the cover rule fails and
  the pattern is invalid.
- Targets seeing each other or the base cells invalidates the forcing.
- **Senior Exocet** loses most JE inferences (mirror/S-cell links); typically
  only the target purge survives and it is rarely scannable by hand.
- **Double Exocet**: two Exocets sharing base digits can interlock for extra
  eliminations (an advanced compound, beyond the single-pattern rules here).

## 与其他技巧的关系

- An Exocet is a rank-0 set-logic configuration, related to **MSLS** and
  fish-family logic — the base/target/S-cell balance is a truth/link count.
- **JE ⊂ SE** as patterns (JE is the in-band special case with full inference
  set); **Double Exocet** is the compound of two Exocets.
- Sits at the extreme tier *after* AIC/ALS and other exotics; the JE form is the
  only one realistically hand-scanned.

## Worked example

Junior Exocet (Fata Morgana / JExocet Compendium family; candidate fragment):

- Base box top-left, base cells `B = {r1c1, r2c1}` aligned in column 1, with
  `cand(r1c1)={1,2,3,4}`, `cand(r2c1)={1,2,3,4}` → `Bdigits = {1,2,3,4}`.
- Targets `t1 = r4c2` (middle band, box 4) and `t2 = r7c3` (lower band, box 7),
  neither seeing the other nor the base, each containing `{1,2,3,4}` plus extras.
- Companion cells carry **no** digit of `{1,2,3,4}`; each of 1,2,3,4 appears at
  most twice among the six S-cells.

**Verified — SudokuWiki Exocet Rule 1** (From the Start):
Grid: `007020004930000600600300000000000050200010008006900400003700900020050001000008000`

- Rule 1 eliminations: `r2c4<>4`, `r3c7<>2`, `r3c7<>7` (non-base digits stripped
  from target cells `B4` and `C7`).
- Further Rules 3–5 eliminations on this puzzle require the Compatible Digit
  Check (not yet implemented in SudokuWiki solver narrative).

## Soundness

The base box must place its two true digits somewhere; aligned in a mini-line,
those two digits propagate down the band. The companion rule guarantees the base
digits cannot resolve inside the targets' own mini-lines except at the targets,
and the cover rule guarantees each true base digit has exactly the supply needed
in the S-cells. Consequently the two true base digits are forced into the two
targets (one each), so any target candidate outside `Bdigits` is impossible — a
contradiction would otherwise leave a base digit with no home in the band. Rules
3–5 are the standard strong-link refinements derived from the same band count.

## Sources

SUDOKUWIKI-EXOCET
