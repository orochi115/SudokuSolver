---
id: technique.sk-loop
strategyId: sk-loop
name_en: SK-Loop
name_zh: SK-Loop / 多米诺环
family: exotic
difficulty: extreme
sources:
  - SUDOKUWIKI-SK-LOOP
---

# SK-Loop / 多米诺环

## One-Sentence Rule

A bi-directional continuous loop of eight strong links threaded through four
boxes (two bands × two stacks) — one link per box, per participating row and per
participating column — locks the loop's sixteen cells into one solved set, so
every loop candidate appearing outside the loop along its aligned units is
eliminated.

## 精确模式定义

- **Four boxes** forming a rectangle: pick two bands (rows of boxes) and two
  stacks (columns of boxes); the four corner boxes are `Ba, Bb, Bc, Bd`.
- In each corner box, the cell at the intersection of the loop's row-cells and
  column-cells (the **pivot**) is a **given**.
- Each box contributes a two-cell **mini-row link** and a two-cell **mini-column
  link**. Of the two cells in any row/column link, one *may* be solved but
  **neither is a given**.
- **8 links total**: one per box (×4), one per participating row, one per
  participating column — threaded so they form one continuous cycle over **16
  cells**.
- **Outer links**: two boxes sharing a band (or stack) hold a common candidate
  *pair*.
- **Inner links**: within a box, the mini-row and mini-column through the pivot
  share two *further* candidates not used by the outer links.
- **Link sizes**: single, double, or triple, with `Σ link sizes ≤ 16`. The
  classic **Easter Monster** form is eight hidden pairs over eight cell-pairs
  → sixteen digits fill the sixteen cells.

## 触发判定

```
choose 2 bands × 2 stacks -> 4 corner boxes
for each corner box: pivot cell (row∩col of the loop) is a GIVEN
for each corner box: identify mini-row link (2 cells) and mini-col link (2 cells)
   neither link cell is a given
outer links: box-pair in same band/stack share a candidate pair
inner links: mini-row and mini-col of a box share 2 candidates disjoint from outer
require: 8 links cover all 16 loop cells, forming one continuous alternating cycle
require: Σ(link sizes) <= 16
=> SK-Loop  (closed => membership locked)
```

The loop is read as alternating strong links in either direction, e.g.
`(27=38)B13- (38=16)B79- (16=39)AC8- …`; closure makes every cell's role fixed.

## 消除/落子规则（全部情形）

1. **Outer-link eliminations**: for each outer link (a candidate pair shared by
   two boxes along a band/stack), remove those candidates from the **rest of the
   shared row/column outside the pivot cells**.
2. **Inner-link eliminations**: for each inner link, remove its two candidates
   from the **rest of the box outside the mini-row and mini-column** of that box.
3. **Cumulative**: all eight links fire; the union of these two elimination
   classes is the full SK-Loop output. No direct placement (eliminations only,
   though they typically cascade into singles).

## 退化与边界

- If any pivot is *not* a given, the rigid template fails (it is the given
  pivots that pin the loop geometry).
- If a link cell is itself a given, that link is invalid.
- `Σ link sizes > 16` over-subscribes the cells → not a valid SK-Loop.
- A broken/open chain (no closure) is just an ordinary AIC fragment, not an
  SK-Loop.
- Only band/stack-symmetric puzzles realistically present the four-given-pivot
  rectangle; on asymmetric grids it essentially never appears.

## 与其他技巧的关系

- **SK-Loop ⊂ MSLS**: every SK-Loop implies an MSLS; it is the
  first-discovered, easily-recognised special case (nicknamed "virus pattern").
- "Baby SK-Loop" on two digits is Steve K's original **Hidden Pair Loop**.
- The general rank-0 set-logic engine is **MSLS**; SK-Loop is its rigid,
  hand-scannable template. Best attempted after AIC, ALS, and simpler exotics
  stall on a symmetric puzzle.

## Worked example

Easter Monster (the discovery puzzle; the canonical SudokuWiki / Steve K worked
grid — see Sources). The verified 81-char given string:

```
100007090030020008009600500005300900010080002600004000300000010040000007007000300
```

- Four corner boxes B1, B3, B7, B9 each have a given pivot; eight hidden-pair
  links (e.g. `(27=38)B13`, `(38=16)B79`, …) thread the 16 loop cells.
- Outer-link example: a candidate pair shared by B1 and B3 along the top band is
  eliminated from the rest of those rows outside the pivots.
- Inner-link example: the two inner candidates of B1's mini-row/mini-column are
  removed from the rest of B1 outside its two links.

> The 81-char string above is the well-known Easter Monster puzzle; the precise
> per-link digit assignments are reconstructed from the source narrative and
> **need engine verification** for exact candidate sets and elimination targets.

## Soundness

A continuous alternating loop of strong links is a *nice loop*: every cell on it
is forced into a definite role, so the sixteen cells form one fully-determined
locked set. Each outer link's pair is therefore confined to its two pivot rows/
columns within the loop, making any copy elsewhere in those houses impossible;
each inner link's pair is confined to its box's mini-row/mini-column, excluding
it from the rest of the box. The given pivots and the `Σ ≤ 16` budget guarantee
the count balances (rank 0), which is exactly why every SK-Loop is an MSLS.

## Sources

SUDOKUWIKI-SK-LOOP
