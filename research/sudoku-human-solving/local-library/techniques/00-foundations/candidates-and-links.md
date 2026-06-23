---
id: technique.candidates-and-links
name_en: Candidates and Links
name_zh: 候选数与链关系
family: foundations
difficulty: foundation
strategyId: []
sources:
  - HODOKU-INTRO
  - HODOKU-CHAINS
  - SUDOKUWIKI-AIC
---

# Candidates and Links / 候选数与链关系

> **定位：** 基础概念卡，**不是**可独立触发的策略。所有高级技巧卡（fish / wings / chains / ALS …）都建立在本卡术语之上。实现引擎时读一次即可；无需 restored-state 测试。

## One-Sentence Rule

Human solving is candidate elimination: every technique either places a forced value or removes candidates until forced values appear.

## 精确模式定义

- **House** `H`: a row, column, or box (27 houses total).
- **Cell** `c`: index 0..80, row-major; empty cells carry a candidate bitmask, solved cells carry a value 1..9.
- **Peer** relation: two cells *see* each other iff they share a house.
- **Candidate entity** `(c, d)`: digit `d` is still possible in empty cell `c`.
- **Strong link** on digit `d`: two entities `(a,d)` and `(b,d)` such that **at least one must be true** — typically a conjugate pair (exactly two `d` in a house) or a bivalue cell.
- **Weak link** on digit `d`: two entities such that **at most one can be true** — peers sharing `(c,d)`.
- **AIC / Nice Loop**: an alternating chain of strong and weak inferences on candidate entities.

## 触发判定

This card defines vocabulary only. Individual strategies supply their own detection predicates (see per-family cards under `01`–`12`).

Engine prerequisite: after every placement, recompute peer eliminations; strategies read the resulting candidate grid.

## 消除/落子规则（全部情形）

Not applicable at this layer — delegated to concrete strategies.

## 退化与边界

- Bivalue cell strong link degenerates to a length-1 XY node.
- Conjugate pair in a house is the smallest strong link (also an AHS of size 1).
- Grouped strong link: N peers of a house that are the only N places for digit `d` in that house.

## 与其他技巧的关系

Every technique card in `01`–`12` is an instance of candidate/link reasoning. Chains subsume wings and many single-digit patterns; fish are cover-set counting; ALS/AHS are almost-locked counting in naked/hidden dual spaces.

## Worked example

Minimal conjugate-pair / strong-link illustration (no strategy fired — vocabulary only):

Givens:

```
034678912672195348198342567859761423426853791713924856961537284287419635345286179
```

After candidate propagation, row 1 has exactly one empty cell (`r1c1`). Digit **5** is the only candidate there (hidden single in row 1 / full house). This is the same fixture as `01-singles/singles.md` Full House example, verified in `packages/engine/test/worked-examples.test.ts`.

## Soundness

Candidate propagation is sound because it only removes digits already placed in a peer house. Strong/weak link definitions are one-directional implications provable from the grid constraints; chains built from them inherit soundness by case analysis.

## Sources

HODOKU-INTRO, HODOKU-CHAINS, SUDOKUWIKI-AIC