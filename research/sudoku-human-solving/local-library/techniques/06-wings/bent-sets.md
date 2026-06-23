---
id: technique.bent-sets
name_en: Bent Sets — Almost Locked Pair / Triple (Almost Locked Candidates)
name_zh: 弯曲集 — 几乎锁定对 / 几乎锁定三（几乎锁定候选）
family: wings
difficulty: tough
strategyId: almost-locked-pair, almost-locked-triple, almost-locked-candidates
sources:
  - SUDOPEDIA-ALMOST-LOCKED-CANDIDATES
  - SUDOKUWIKI-WXYZ-WING
  - SUDOKUWIKI-W-WING
---

# Bent Sets — Almost Locked Pair / Triple (ALC) — 弯曲集

## One-Sentence Rule

A Bent Set pairs an Almost Locked Set in a line with an Almost Locked Set in a box that
share the same digit set `S` and meet at a line-box intersection; because *one* of the
two ALS must "lock" no matter which value the intersection takes, the digits of `S` can
be eliminated from the cells the locking would forbid — and from the cells both ALS can
see together.

## 精确模式定义

"Bent Set" = an Almost Locked Set whose cells are NOT all in one house but bend across a
**line–box intersection** (the chute-mouth of 3 cells where a line crosses a box). The
canonical small cases are the **Almost Locked Pair** (digit set `S={X,Y}`) and the
**Almost Locked Triple** (`S={X,Y,Z}`). This is the Almost Locked Candidates (ALC)
pattern in Sudopedia's framing.

- **Intersection** `I`: the 1×3 (or 3×1) overlap of one line and one box.
- **Line-ALS** `L`: cells of the line *outside* `I` forming an ALS for digit set `S`
  (`|L| = |S| − 1` cells whose candidates ⊆ `S`).
- **Box-ALS** `B`: cells of the box *outside* `I` forming an ALS for the **same** `S`
  (`|B| = |S| − 1` cells, candidates ⊆ `S`).
- **Almost Locked Pair**: `S={X,Y}`, so `L` and `B` are each ONE bivalue `{X,Y}` cell
  (one in the line outside `I`, one in the box outside `I`). The set bends at `I`.
- **Almost Locked Triple**: `S={X,Y,Z}`, `L` and `B` are each a 2-cell ALS on `{X,Y,Z}`.
- "Almost Locked": each ALS is one digit short of being a Locked Set; the intersection
  is the shared escape valve.

## 触发判定

Let `I` be a line-box intersection, `S` a digit set, `L` the line-ALS for `S` (in the
line, outside `I`), `B` the box-ALS for `S` (in the box, outside `I`). Pattern valid iff
both ALS exist for the **same** `S`. Eliminations (either or both may fire):

- **Box-side fire**: iff every cell of the **line** that is outside `I` and outside `L`
  contains NO digit of `S` (so `S` in the line is confined to `I ∪ L`). Then `S` can be
  removed from every box cell outside `I` and outside `B`.
- **Line-side fire**: iff every cell of the **box** outside `I` and outside `B` contains
  no digit of `S`. Then `S` can be removed from every line cell outside `I` and outside
  `L`.

(Compact "see both" reading for the Almost Locked Pair: remove `X` and `Y` from any cell
seeing the line-`{X,Y}` cell, the box-`{X,Y}` cell, and lying off the intersection.)

## 消除/落子规则（全部情形）

- **Almost Locked Pair** (`S={X,Y}`, illustration cells): the line-ALS cell is `r1c4`,
  the box-ALS cell is `r2c1`, intersection `I = r1c1..r1c3`. If `r1c4=X`, all `Y` in the
  row is confined to box 1 (a Locked Candidates move ⇒ `Y` out of box-1 cells off `I`);
  this also forces `r2c1=X`. The mirror holds if `r1c4=Y`. Net: **remove both `X` and `Y`
  from every starred cell** — the box cells off `I`/`B` that both ALS jointly forbid.
- **Almost Locked Triple** (`S={X,Y,Z}`): line-ALS = the two `XYZ` cells in the line off
  `I`, box-ALS = the two `XYZ` cells in the box off `I`. **Remove `X`, `Y`, and `Z`** from
  every starred cell (the box/line cells off the intersection that both ALS forbid).
- **General ALC**: per the trigger, eliminate `S` from the box-side (or line-side)
  remainder, whichever ALS-confinement condition holds.

## 退化与边界

- If `L` or `B` actually contains all of `S` in one house it is a full Locked Set / Naked
  Subset, handled earlier; ALC needs each side to be *almost* locked (short by one digit,
  with `I` as the shared digit).
- An Almost Locked Pair with the two bivalue cells sharing the intersection collapses to
  a Naked Pair — the cells must bend across `I`, not lie within one house.
- The fire condition is asymmetric: confinement on one side licenses elimination on the
  *other* side. Both can hold simultaneously (rare) giving two-sided eliminations.
- No fire if neither remainder is `S`-free even though both ALS exist.

## 与其他技巧的关系

- **Bent Sets is the umbrella family** sudokuwiki assigns to W-Wing and the WXYZ ladder.
  The Almost Locked **Pair** (2 cells, 2 digits, bent) is the *minimal* bent set and the
  small cousin of the **W-Wing**; the Almost Locked **Triple** is the bent 3-set, kin to
  the **XYZ-Wing** ("Bent Triple") — see `xy-xyz-w-wings.md`.
- The WXYZ-Wing / VWXYZ-Wing size-ladder (`wxyz-wing.md`) is the same idea at `N` cells.
- ALC is a constrained, eye-ballable special case of **ALS-XZ** (`../09-als/als.md`):
  two ALS sharing a restricted common digit through the intersection. The intersection
  itself supplies the restricted common candidate.
- It is also a "doubled" **Locked Candidates** (Pointing/Claiming) — each branch of the
  intersection's value triggers an intersection-removal, hence "Almost Locked
  *Candidates*".

## Worked example

### Almost Locked Pair (Sudopedia ALC illustration — cite `SUDOPEDIA-ALMOST-LOCKED-CANDIDATES`; FLAG: schematic, not a full grid)
Sudopedia gives a schematic, not an 81-char puzzle. Layout (box 1 + row 1):
- Row 1: `I = r1c1,r1c2,r1c3` (intersection, marked `*`), `r1c4 = {X,Y}` (line-ALS `L`).
- Box 1: `r2c1 = {X,Y}` (box-ALS `B`), other box-1 cells off `I` marked `*`; the `/`
  cells of row 1 (r1c5..) carry no `X`/`Y`.
- Reasoning: `r1c4=X` ⇒ `Y` confined to box 1 in the row ⇒ `r2c1=X` ⇒ starred cells lose
  `X` and `Y`; symmetric for `r1c4=Y`.
- Elimination: **`X` and `Y` removed from all starred cells** (box-1 cells off `I`/`B`).

### Almost Locked Triple (Sudopedia ALC "More examples" — cite `SUDOPEDIA-ALMOST-LOCKED-CANDIDATES`; FLAG: schematic)
- `S={X,Y,Z}`. Line-ALS = `r1c4,r1c5` both `{X,Y,Z}`; box-ALS = `r2c1,r2c2` both `{X,Y,Z}`;
  intersection `I=r1c1..r1c3`; `/` = cells without `S`.
- Elimination: **`X`, `Y`, `Z` removed from all starred cells**.

> Constructed-grid note: the two examples above are reproduced from the Sudopedia
> schematic, which is the authoritative source statement of the pattern. A full 81-char
> grid instance is best taken from a live XYZ-Wing puzzle (the Bent Triple), e.g.
> `SUDOKUWIKI-XYZ-WING` Example 1 in `xy-xyz-w-wings.md`, since every XYZ-Wing is an
> Almost Locked Triple bent at a line-box intersection.

## Soundness

The intersection `I` holds at most the digits of `S` relevant to both ALS. Consider any
single digit `d∈S`. Across the line, `d` lives in `I ∪ L` only (the fire precondition);
across the box, `d` lives in `I ∪ B` only. Now case on the intersection: whichever
digit the intersection cell(s) take, exactly one of the two ALS is forced to "lock"
(become a full Locked Set over `S`), because removing the shared digit from one side
forces the other side's ALS to absorb it. A locked ALS over `S` confined to its house
forbids all `S` in the rest of that house. Equivalently (Locked-Candidates form): if the
line's `S`-digits are trapped in `I∪L`, then any value of `I` either (a) places `d` in
`I`, or (b) forces `d` into `L`, which by the line-confinement forces the complementary
digit into the box and locks `B`. Either way each starred cell is seen by a guaranteed
occurrence of every `d∈S`, so no starred cell can hold any digit of `S`. This is exactly
the W-Wing argument (pair case) and the ALS-XZ argument (general case) instantiated at a
line-box intersection. ∎

## Sources

SUDOPEDIA-ALMOST-LOCKED-CANDIDATES, SUDOKUWIKI-WXYZ-WING, SUDOKUWIKI-W-WING
