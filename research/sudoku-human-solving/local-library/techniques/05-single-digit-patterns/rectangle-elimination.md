---
id: technique.rectangle-elimination
name_en: Rectangle Elimination
name_zh: 矩形删减
family: single-digit-patterns
difficulty: tough
strategyId: rectangle-elimination
sources:
  - SUDOKUWIKI-RECTANGLE-ELIMINATION
  - HODOKU-SDP
  - SUDOKUWIKI-X-CYCLES
---

# Rectangle Elimination / 矩形删减

## One-Sentence Rule

For one digit `d`, if turning on a weakly linked rectangle wing forces another wing on and those two truths would remove every `d` from a fourth-corner house, the assumed wing cannot be `d` and is eliminated.

## 精确模式定义

Terms, all for one fixed digit `d`:

- **Hinge** `h`: a candidate cell for `d` at one corner of a row/column rectangle.
- **Strong wing** `s`: the other candidate in a row or column conjugate pair with `h` (`h =d= s`).
- **Weak wing** `w`: another candidate for `d` in the perpendicular line through `h`, outside the hinge box, where `h -d- w` is only weak.
- **Fourth-corner house** `F`: the box or line whose remaining `d` candidates would all be seen by `w` and `s` if both were true.

The classic SudokuWiki form uses one strong link from `h` to `s`, one weak link from `h` to `w`, and a fourth-corner box. HoDoKu's Empty Rectangle notation describes the same proof as an ERI/grouped-node X-Chain. SudokuWiki explicitly says Rectangle Elimination replaces Empty Rectangles and can be expressed as AIC with at least one grouped cell.

## 触发判定

For every digit `d`:

```text
for each candidate hinge h:
  for each row/column line L1 through h with exactly two d-candidates {h, s}:
    let L2 be the perpendicular line through h
    for each d-candidate weak wing w in L2 outside h's box:
      choose a fourth-corner house F not containing h
      require every d-candidate in F sees w or s
      require at least one d-candidate in F exists before applying the test
      => eliminate d from w
```

The symmetric orientation swaps row/column. In a grouped-AIC implementation, the predicate can be expressed as a discontinuous loop in which `w` being true implies `s` true, and `w + s` empties `F` of `d`.

## 消除/落子规则（全部情形）

- **Single Rectangle Elimination**: remove `d` from the weak wing `w`.
- **Multiple eliminations from one hinge**: after one valid `h, s` pair is found, scan every weak wing `w_i` in the perpendicular line that empties a fourth-corner house with `s`; each `w_i<>d` may be emitted as one step or as multiple same-pattern eliminations.
- **Double-number Rectangle Elimination**: if the same geometric hinge/wing layout works for two digits, emit one deduction per digit unless the trace format explicitly supports multi-digit grouped presentation.
- **Two-strong-link variant**: if both sides are strong, the conclusion may be expressed either as removing `d` from a wing or as placing/removing the hinge candidate through a discontinuous grouped X-Cycle. Prefer the shorter named presentation if it maps cleanly to the same target.
- **Extended Rectangle Elimination**: inserting longer chains between wing and fourth-corner proof is not part of this base card; route it through grouped AIC / AIC with exotic links.

## 退化与边界

- **Equivalent to Empty Rectangle for classic 9x9**: treat as a presentation-level alias/replacement, not independent solving power, unless the project wants a separate `strategyId` for teaching order.
- **Jigsaw and Sudoku X variants**: SudokuWiki shows extensions using irregular regions or diagonals; excluded from this classic 9x9 roadmap.
- **No fourth-corner depletion**: if `w` and `s` do not see all candidates in the target house, there is no elimination.
- **No strong hinge side**: if `h` and `s` are not a conjugate pair or equivalent grouped strong inference, use a general AIC search instead.

## 与其他技巧的关系

- **Empty Rectangle**: exact replacement/alias in SudokuWiki's current presentation; HoDoKu's Empty Rectangle is an ERI plus a conjugate pair.
- **Grouped X-Cycle / Grouped AIC**: the same logic can be emitted as a grouped single-digit discontinuous loop.
- **Turbot family**: belongs in the single-digit strong-link chain family; if the engine already supports grouped X-Chains, this is a naming and detection predicate specialization.
- **Finned Mutant X-Wing**: HoDoKu describes Empty Rectangle as equivalent to Finned Mutant X-Wing in one reading; do not emit both.

## Worked example

Source: SudokuWiki Rectangle Elimination, multiple-elimination exemplar.

Puzzle from start, 81-char givens:

```text
200709006190000002080002030070503040000000000050904060060300090800000053900407001
```

SudokuWiki reports multiple Rectangle Eliminations for this puzzle. The source page's first canonical explanation uses digit `9` with hinge `G2`, strong wing `G6`, weak wing `A2`, and fourth-corner box 2. If `A2=9`, then `G6=9`; together those truths remove every `9` from the fourth-corner box, so `A2<>9`.

Concrete restored-state use case for implementation:

- digit: `9`
- hinge: `r7c2` (`G2` in SudokuWiki's row-letter notation)
- strong wing: `r7c6` (`G6`)
- weak wing / elimination target: `r1c2` (`A2`)
- deduction: `r1c2<>9`

Verified (2026-06-23, `packages/engine/test/worked-examples.test.ts`): `r1c2<>9` is sound against the brute-force solution of the givens above. Restored-state candidate grid at the exact step still TBD for regression fixtures.

## Soundness

Assume the weak wing `w` is true. Because `w` sees the hinge `h`, `h` is false. Because `h =d= s` is a strong link, `s` is true. By the trigger predicate, the pair `{w, s}` sees every candidate for `d` in the fourth-corner house `F`. That leaves no legal position for `d` in `F`, contradicting Sudoku's requirement that each house contain `d` exactly once. Therefore `w` is false and `d` can be removed from `w`. No uniqueness assumption is used.

## Sources

SUDOKUWIKI-RECTANGLE-ELIMINATION (definition, examples, Empty Rectangle replacement note, grouped-AIC equivalence). HODOKU-SDP (Empty Rectangle / Turbot / grouped loop relationships). SUDOKUWIKI-X-CYCLES (single-digit grouped-loop interpretation).
