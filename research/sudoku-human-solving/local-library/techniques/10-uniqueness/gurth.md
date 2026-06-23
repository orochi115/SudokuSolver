---
id: technique.gurth-symmetrical-placement
name_en: Gurth's Theorem (Symmetrical Placement)
name_zh: 葛斯定理（对称摆放）
family: uniqueness
difficulty: extreme
strategyId: gurth-symmetrical-placement
sources:
  - SUDOKUWIKI-GURTH
---

# Gurth's Theorem / Symmetrical Placement — 葛斯定理（对称摆放）

## One-Sentence Rule

If a puzzle's **givens are symmetrical** (every clue maps to a clue under a fixed
symmetry plus a 1:1 digit permutation) and the puzzle has a **unique solution**, then the
**entire solution — and the whole candidate distribution — is symmetrical too**, so the
cells lying on the axis of symmetry must hold self-mapped digits and all non-self-mapped
candidates can be eliminated from them.

## 精确模式定义

### The theorem
> "If a puzzle's clues are symmetrical and the puzzle has a unique solution, then the
> solution will also be symmetrical."

A symmetry here is a geometric transform `σ` of the board (diagonal reflection, 180°
rotation, …) **combined with** a fixed digit permutation `π` (a 1:1 relabelling of
`1…9`). The puzzle is *Gurth-compatible* iff applying `σ` then `π` to the clue set returns
the clue set exactly (an **automorphism** of the puzzle). The consequence: the *solved*
board is invariant under `σ∘π` as well, and so is the full candidate grid.

### Strict requirements
- **Every clue must have a complement** under `σ` — no stray clue facing an empty cell.
- **Every digit must map 1:1, exactly once** — `π` is a complete permutation of `1…9`; you
  cannot have only some digits mapped.
- The puzzle must be known to have a **unique** solution.

### Self-mapped digits and the axis
Cells that `σ` sends to **themselves** (the axis) must hold digits that `π` sends to
themselves (**self-mapped digits**), because `solved = σ∘π(solved)` forces the value at a
fixed cell to be a fixed digit. This is where the useful eliminations live.

## 触发判定

1. Identify a candidate symmetry `σ` of the **givens**: top-left↔bottom-right **diagonal
   reflection**, anti-diagonal reflection, or **180° rotation** about the centre.
2. Derive the digit permutation `π`: read clue pairs across the axis and confirm a
   **consistent, complete 1:1** mapping (each digit mapped exactly once, every clue paired).
3. Confirm uniqueness is assumed. The puzzle is Gurth-compatible.

## 消除/落子规则（全部情形）

### Eliminations / placements
Because the **whole candidate grid is symmetric** under `σ∘π`, *every* off-axis cell's
candidates already mirror its partner's — so **no new elimination is possible off-axis**.
Useful deductions occur **only in cells that map to themselves under `σ`** (the axis):
- **In each self-mapping (axis) cell, eliminate every candidate that is *not* a self-mapped
  digit** of `π`. (A fixed cell must take a fixed digit.)
- Equivalently, if only one self-mapped digit can occupy an axis cell, **place it**.

### Diagonal reflection (top-left ↔ bottom-right)
The main-diagonal cells `A1, B2, …, J9` are their own complements ⇒ each must hold a
self-mapped digit. For this to crack anything, `π` must have **at least 3 self-mapped
digits** (so the diagonal cells are restricted to those few values).
- Anti-diagonal reflection works identically about the other diagonal.

### 180° rotational symmetry
Only the **centre cell E5** is fixed by a half-turn. The unique self-mapped digit must go
in E5 (e.g. if only digit 9 maps to itself, **E5 = 9**). Other deductions come from the
later-step mirrored-candidate cleanup, not from a long axis.

### Mirrored-candidate cleanup (post-step propagation)
After **any** successful ordinary strategy step, **mirror its eliminations across `σ∘π`**:
whatever was removed from a cell may be removed from its image cell. This greatly reduces
the remaining complexity of a Gurth-compatible puzzle (SudokuWiki, late-2025 improvement).

## 退化与边界

- **Vertical / horizontal reflection never works.** Its axis is an entire line (e.g. row
  E), which would force *every* digit 1…9 to lie on that axis and self-map — impossible for
  a full board. Only diagonal, anti-diagonal, and rotational symmetries qualify.
- **Diagonal needs ≥3 self-mapped digits** to be solving-useful (else the diagonal cells
  are barely constrained).
- **One missing mapping** (a digit absent from the clues, e.g. 5 not given) makes `π`
  incomplete; the only safe "ghost" mapping is a digit onto **itself at the single fixed
  cell** (E5 under rotation). Otherwise detection must be suppressed to avoid mapping a
  digit to nothing.
- **Applies only to symmetric puzzles** — and these are genuinely rare (database searches
  by the author found essentially none in the wild); the technique is esoteric but valid.

## 与其他技巧的关系

- A **uniqueness** technique, but unlike the Unique/Avoidable Rectangle and BUG
  (`unique-rectangle-bug.md`, `avoidable-rectangle.md`) it exploits **global board
  symmetry (automorphism)**, not a local deadly rectangle.
- Targets *Automorphic Sudoku* (Wikipedia "Mathematics of Sudoku").
- Independent of the rectangle/loop family; can fire when no UR/BUG/Extended-UR is present.

## Worked example

### Diagonal — "Shining Mirror" (source — cite `SUDOKUWIKI-GURTH`, "Top-Left to Bottom Right Symmetry")
`000001002003000040050060700000800070007003800900050001006080200040600007200009060`
- Symmetry `σ` = diagonal reflection (A1…J9). Digit permutation `π`: **3↔5, 6↔7, 1↔9**, and
  **2, 4, 8 map to themselves**.
- The diagonal cells A1,B2,…,J9 must each hold a **self-mapped digit ∈ {2,4,8}**.
- Eliminations: in every main-diagonal cell, **remove all candidates other than {2,4,8}**;
  this restriction to three values is exactly what cracks the puzzle (eliminations shown in
  yellow on the source). Off-diagonal cells (e.g. A7 = {3,5,6,9} mirrors G1 = {5,3,7,1})
  give nothing new.

### 180° rotational (source — cite `SUDOKUWIKI-GURTH`, "Rotational Symmetry")
`020000709400080020009020406000507000067000230000204000305070900070010005902000070`
- Symmetry `σ` = half-turn about centre. Digit permutation `π`: **1↔8, 2↔7, 3↔6, 4↔5**, and
  **9 maps to itself**.
- The only fixed cell is **E5**, which must hold the self-mapped digit. Placement:
  **E5 = 9** (also reachable as a naked single, but Gurth confirms it).

## Soundness

**Single-solution assumption (stated explicitly):** the theorem is conditional on the
puzzle having **exactly one** solution. The proof is by contradiction: applying `σ` then
`π` to the *solved* grid yields a grid that (a) satisfies all Sudoku constraints — because
`σ` permutes rows/columns/boxes and `π` relabels digits, both of which preserve validity —
and (b) agrees with the original clues, because the clues are `σ∘π`-invariant by hypothesis.
So `σ∘π(solution)` is *also* a valid completion of the same clues. If the solution were
**not** symmetric, `σ∘π(solution) ≠ solution`, giving **two** solutions — contradicting
uniqueness. Hence the solution is symmetric, every fixed cell carries a self-mapped digit,
and the candidate grid mirrors itself. The technique is **unsound on multi-solution or
unverified grids**, and additionally requires a **complete, consistent 1:1 digit mapping**
with **every clue paired** — any stray or unmapped clue voids it. ∎

## Sources

SUDOKUWIKI-GURTH
