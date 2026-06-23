---
id: technique.wings
name_en: XY-Wing / XYZ-Wing / W-Wing
name_zh: XY翼 / XYZ翼 / W翼
family: wings
difficulty: tough
strategyId: xy-wing, xyz-wing, w-wing
sources:
  - SUDOKUWIKI-YWING
  - SUDOKUWIKI-XYZ-WING
  - SUDOKUWIKI-W-WING
  - HODOKU-WINGS
---

# XY-Wing / XYZ-Wing / W-Wing — 翼类技巧

## One-Sentence Rule

Each wing is a tiny fixed-shape chain of bivalue/trivalue cells in which two "pincer"
cells are forced to hold a common digit `Z` between them, so any cell that sees every
`Z` in the pattern cannot be `Z`.

## 精确模式定义

Three independent strategies share the "two pincers force a common digit" skeleton.

### XY-Wing (`xy-wing`)
- **Pivot**: one bivalue cell with candidates `{X,Y}` (X≠Y).
- **Pincers**: two bivalue cells `{X,Z}` and `{Y,Z}` (Z≠X, Z≠Y), each seeing the pivot.
- **Cardinality**: exactly 3 cells, exactly 3 digits `{X,Y,Z}`, each cell bivalue.
- **Common digit**: `Z` — the digit shared by the two pincers but absent from the pivot.
- The two pincers need NOT see each other.

### XYZ-Wing (`xyz-wing`)
- **Pivot ("hinge"/"apex")**: one trivalue cell `{X,Y,Z}` that sees BOTH pincers.
- **Pincers**: two bivalue cells `{X,Z}` and `{Y,Z}`.
- **Cardinality**: exactly 3 cells, exactly 3 digits, total candidates `= {X,Y,Z}`
  (a 3-cell, 3-digit bent set / "Bent Triple"). Pivot is trivalue; pincers bivalue.
- **Common digit**: `Z` — present in the pivot AND both pincers.

### W-Wing (`w-wing`)
- **Endpoints**: two bivalue cells with the IDENTICAL pair `{A,B}` that do NOT see each
  other (if they saw each other they would be a Naked Pair).
- **Strong-link bridge (the load-bearing requirement)**: a *conjugate pair* on one of
  the two digits — say `B` — i.e. a house `H` in which `B` appears in exactly two cells
  `p` and `q`. Cell `p` must see endpoint-1 and cell `q` must see endpoint-2 (one strong
  link cell linked to each endpoint by a weak link on `B`). House `H` may be a row,
  column, or box; what matters is that `B` is bilocal in `H` (a conjugate/strong link),
  not merely that two `B`s exist.
- **Cardinality**: 2 bivalue endpoints + the 2-cell strong link on `B` (4 cells, the
  bridge cells may carry extra candidates).
- **Common digit**: `A` — the digit NOT carried by the strong link. One endpoint or the
  other must be `A`.

Define **"sees"** as: two cells share a row, column, or box.

## 触发判定

### XY-Wing predicate
There exist cells `P` (pivot), `R1`, `R2` and digits `X,Y,Z` (distinct) such that:
`cand(P)={X,Y}` ∧ `cand(R1)={X,Z}` ∧ `cand(R2)={Y,Z}` ∧ `sees(P,R1)` ∧ `sees(P,R2)`.
Fires iff `∃` a cell `T ∉ {P,R1,R2}` with `Z∈cand(T)` ∧ `sees(T,R1)` ∧ `sees(T,R2)`.

### XYZ-Wing predicate
There exist cells `P,R1,R2` and digits `X,Y,Z` with `cand(P)={X,Y,Z}`,
`cand(R1)={X,Z}`, `cand(R2)={Y,Z}`, `sees(P,R1)`, `sees(P,R2)`.
Fires iff `∃ T ∉ {P,R1,R2}` with `Z∈cand(T)` ∧ `sees(T,P)` ∧ `sees(T,R1)` ∧ `sees(T,R2)`.

### W-Wing predicate
There exist bivalue cells `E1,E2` with `cand(E1)=cand(E2)={A,B}`, `¬sees(E1,E2)`, and a
house `H` where digit `B` is bilocal in cells `{p,q}` with `sees(p,E1)` ∧ `sees(q,E2)`
(and `p≠E1`, `q≠E2`; `{p,q}` is the conjugate pair).
Fires iff `∃ T ∉ {E1,E2}` with `A∈cand(T)` ∧ `sees(T,E1)` ∧ `sees(T,E2)`.

## 消除/落子规则（全部情形）

- **XY-Wing**: remove `Z` from every cell that sees BOTH pincers `R1` and `R2`
  (target set = `peers(R1) ∩ peers(R2)`, excluding the three pattern cells). The pivot
  is NOT required to be seen.
- **XYZ-Wing**: remove `Z` from every cell that sees ALL THREE of pivot `P`, `R1`, `R2`
  (`peers(P) ∩ peers(R1) ∩ peers(R2)`, minus the pattern). Because `Z` lives in the
  pivot too, the target must also see the pivot — strictly tighter than XY-Wing.
- **W-Wing**: remove `A` from every cell seeing BOTH endpoints `E1` and `E2`
  (`peers(E1) ∩ peers(E2)`, minus pattern). The eliminated digit is the one NOT on the
  strong link.
- **Double / Split W-Wing**: if both `A`-link and `B`-link exist between the same two
  endpoints (or the two endpoints share every digit and are linked both ways = a
  length-4 Remote Pair), BOTH `A` and `B` can be removed from cells seeing both endpoints.
  A "Split Double" routes the two inferences through two *different* strong links
  (`E1↔E2` via a `B`-conjugate, and via an `A`-conjugate using different bridge cells),
  permitting simultaneous `A` and `B` eliminations on the common peers.

## 退化与边界

- If the XY-Wing pivot and a pincer were both bivalue on the same two digits they'd be a
  Naked Pair; the wing requires three *distinct* digits.
- XYZ-Wing: the pivot must be the cell that sees both pincers (it is the only trivalue
  cell). If the pivot were bivalue it would collapse to an XY-Wing.
- W-Wing degenerates if the two endpoints see each other (Naked Pair) or if `B` is not
  bilocal in `H` (no strong link ⇒ the chain is unproven — the most common spec error).
- If all three XYZ cells lie in one house with only 3 candidates total, it is a Naked
  Triple, not a wing (a wing is *bent* — spans ≥2 houses).
- No elimination fires when `peers∩peers` (the target set) is empty even though the
  pattern exists; the structure is still valid but inert at this point.

## 与其他技巧的关系

- **XY-Wing = length-3 XY-Chain**; **W-Wing** = a short AIC `A=A − B=B − A=A`
  (sudokuwiki places W-Wings in the **Bent Sets** family). Both are subsets of AIC.
- **XYZ-Wing ⊂ Aligned Pair Exclusion** (every XYZ-Wing is solvable by APE, not vice
  versa) and is a 3-cell **Almost Locked Set** elimination; it is a "Bent Triple" — the
  3-cell case of the WXYZ size-ladder (see `wxyz-wing.md`).
- A mirrored pair of single W-Wings on the same digit pair is a **Double W-Wing =
  length-4 Remote Pair** (see `remote-pairs.md`).
- XY-Wing's pivot+pincers also form a 3-cell ALS / cell-forcing-chain reading.

## Worked example

### XY-Wing (source — cite `SUDOKUWIKI-YWING`, Y-Wing Example 1, "From the Start")
`034500000802060400600008000003900004050000090900005800000300008001040605000007120`
- Pivot `A1`={2,7}; pincer `A7`={2,7}-side links via 7; pincer `E1` links via 1.
  Per source: A1 links 7 (to A7) and 1 (to E1); the digit common to both pincers is `Z=2`.
- Logic: A1=7 ⇒ A7=2; A1=1 ⇒ E1=2; so one pincer is 2.
- Elimination: **2 removed from E7** (the cell seeing both pincers A7 and E1).

### XYZ-Wing (source — cite `SUDOKUWIKI-XYZ-WING`, Example 1, "From the Start")
`090001700500200008000030200070004960200060005069700030008090000700003009003800040`
- Hinge `F9`={1,2,4}; pincers `D9`={1,2}, `F1`={1,4}; common digit `Z=1`.
- Logic: if D9=2 then F1,F9 are a 1/4 naked pair; if F1=4 then D9,F9 are a 1/2 naked
  pair; if any is 1 it stays. So a 1 seen by all three is impossible.
- Elimination: **1 removed from F7** (sees F9, F1 and D9).

### W-Wing (source — cite `SUDOKUWIKI-W-WING`, single W-Wing Example 1, "From the Start")
`000020007000507800057090030008900010700040008020001900090050740002109000600080000`
- Endpoints `A6`={3,6} and `F5`={3,6}, which cannot see each other; pair `{A=3, B=6}`.
- Strong-link bridge on `B=6`: conjugate pair `A3`/`F3` (6 bilocal in that house);
  `A3` sees `A6`, `F3` sees `F5`.
- Chain: A6=6 ⇒ −6 A3 ⇒ +6 F3 ⇒ −6 F5 ⇒ F5=3, and reversed; so one endpoint is `A=3`.
- Elimination: **3 removed from D6 and E6** (cells seeing both A6 and F5).

## Soundness

- **XY-Wing**: the pivot is bivalue. If `P=X` then `R1` (={X,Z}) ⇒ `Z`. If `P=Y` then
  `R2` (={Y,Z}) ⇒ `Z`. Both branches exhaust `P`, so at least one pincer is `Z`; any
  common peer of the pincers therefore cannot be `Z`. ∎
- **XYZ-Wing**: pivot is `{X,Y,Z}`. `P=X ⇒ R1=Z`; `P=Y ⇒ R2=Z`; `P=Z ⇒ P=Z`. In all
  three cases some cell of `{P,R1,R2}` is `Z`, so a cell seeing all three cannot be `Z`.∎
- **W-Wing**: assume a common peer `T=A`. Then `E1≠A ⇒ E1=B` and `E2≠A ⇒ E2=B`. `E1=B`
  weak-links the strong-link cell `p` off `B`, forcing the conjugate cell `q=B`, which
  weak-links `E2` off `B` ⇒ `E2≠B` — contradiction with `E2=B`. Hence `T≠A`. The strong
  (conjugate) link is essential: without bilocality of `B` in `H`, `p` off does not
  force `q` on and the proof fails. ∎

## Sources

SUDOKUWIKI-YWING, SUDOKUWIKI-XYZ-WING, SUDOKUWIKI-W-WING, HODOKU-WINGS
