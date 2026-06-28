# Phase E — Existing Strategy Adjustments (Design Notes)

> **Scope:** This phase handles the two independent backlog items (E1, E7) from  
> `docs/plans/diabolical-727-checklist.md` § 已有策略调整 backlog, plus the  
> registration of all required P2 strategy stubs (acceptability gate requirement).

---

## E1 — `tieBreak` Metadata Completion

### Status: Complete (all strategies already had tieBreak before this phase)

When the phase started, every strategy already declared a non-empty `tieBreak`
array satisfying the `strategy-precedence.test.ts` gate-4 test.  The 14 newly
registered P2 stubs were given their tieBreak at creation time; no existing
strategy required retroactive patching.

### tieBreak assignments (summary by file)

| Strategy file | Strategy id(s) | tieBreak |
|---|---|---|
| `full-house.ts` | `full-house` | `['house']` |
| `naked-single.ts` | `naked-single` | `['cell-index']` |
| `hidden-single.ts` | `hidden-single` | `['house', 'digit']` |
| `locked-candidates.ts` | `locked-candidates-pointing/claiming` | `['house', 'digit']` |
| `naked-subset.ts` | `naked-pair/triple/quad` | `['house']` |
| `hidden-subset.ts` | `hidden-pair/triple/quad` | `['house', 'digit']` |
| `basic-fish.ts` | `x-wing/swordfish/jellyfish` | `['digit']` |
| `finned-fish.ts` | `finned-x-wing/swordfish/jellyfish` | `['digit']` |
| `single-digit-patterns.ts` | `skyscraper/two-string-kite/empty-rectangle` | `['digit']` |
| `turbot-fish.ts` | `turbot-fish` | `['digit']` |
| `xy-wing.ts` | `xy-wing` | `['cell-index']` |
| `xyz-wing.ts` | `xyz-wing` | `['cell-index']` |
| `w-wing.ts` | `w-wing` | `['house']` |
| `advanced-wings.ts` | `remote-pairs/wxyz-wing/bent-sets` | `['cell-index']` |
| `advanced-wings.ts` | `broken-wing` | `['digit', 'cell-index']` |
| `simple-coloring.ts` | `simple-coloring` | `['digit']` |
| `multi-coloring.ts` | `multi-coloring` | `['digit']` |
| `3d-medusa.ts` | `3d-medusa` | `['cell-index', 'digit']` |
| `aic.ts` | `x-chain` | `['cell-index', 'digit']` |
| `aic.ts` | `aic` | `['digit']` |
| `xy-chain.ts` | `xy-chain` | `['cell-index', 'digit']` |
| `nice-loop.ts` | `nice-loop` | `['cell-index', 'digit']` |
| `aic-extended.ts` | `aic-with-als/aic-with-ur` | `['cell-index', 'digit']` |
| `als.ts` | `als-xz/als-xz-doubly-linked/als-xy-wing` | `['house']` |
| `als.ts` | `death-blossom` | `['cell-index']` |
| `als-chain.ts` | `als-chain` | `['house']` |
| `als-chain.ts` | `ahs` | `['house']` |
| `uniqueness.ts` | `bug-plus-one/ur1/ur2/ur4` | `['cell-index']` |
| `uniqueness-extended.ts` | `hidden-ur/ur3/ur5/ur6` | `['cell-index']` |
| `uniqueness-p1.ts` | `bug-lite/bug-plus-n/ar1-4/eur/unique-loop` | `['cell-index']` |
| `sue-de-coq.ts` | `sue-de-coq` | `['house']` |
| `tridagon.ts` | `tridagon` | `['cell-index']` |
| `forcing-chain.ts` | `forcing-chain` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `vwxyz-wing` | `['cell-index']` |
| **p2-stubs.ts** | `twinned-xy-chains` | `['chain-length', 'cell-index']` |
| **p2-stubs.ts** | `aic-with-exotic-links` | `['chain-length', 'cell-index']` |
| **p2-stubs.ts** | `gurth` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `sue-de-coq-extended` | `['house', 'size']` |
| **p2-stubs.ts** | `fireworks` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `franken-fish` | `['digit', 'size']` |
| **p2-stubs.ts** | `mutant-fish` | `['digit', 'size']` |
| **p2-stubs.ts** | `aligned-pair-exclusion` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `aligned-triple-exclusion` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `subset-exclusion` | `['size', 'cell-index']` |
| **p2-stubs.ts** | `exocet` | `['cell-index', 'digit']` |
| **p2-stubs.ts** | `sk-loop` | `['cell-index']` |
| **p2-stubs.ts** | `msls` | `['size', 'cell-index']` |

### Rationale for tieBreak key choices (P2 stubs)

- **vwxyz-wing**: `cell-index` — identical to wxyz-wing; pivot cell row-major index is the natural canonical pick.
- **twinned-xy-chains / aic-with-exotic-links**: `chain-length` first (shorter = simpler), then `cell-index` of the start node — mirrors the `xy-chain` pattern.
- **gurth**: `cell-index, digit` — symmetry maps are scanned cell-by-cell; first candidate digit breaks ties within a cell.
- **sue-de-coq-extended**: `house, size` — mirrors `sue-de-coq`'s house-first ordering; larger intersections are secondary.
- **fireworks**: `cell-index, digit` — the apex cell index is the primary discriminant.
- **franken-fish / mutant-fish**: `digit, size` — mirrors standard fish tieBreak (digit first, then base-set size).
- **aligned-pair/triple-exclusion**: `cell-index, digit` — leftmost cell of the aligned set, then digit.
- **subset-exclusion**: `size, cell-index` — smallest set first (most constrained), then cell index.
- **exocet**: `cell-index, digit` — base-cell index, then base digit.
- **sk-loop**: `cell-index` — anchor cell of the loop.
- **msls**: `size, cell-index` — number of sectors (smaller = simpler), then anchor cell.

---

## E7 — Difficulty Scale Global Review (Uniqueness 9xx vs Chains 7xx / ALS 8xx)

### Verdict: Keep current ordering (no change to difficulty values)

#### Background

The checklist notes that uniqueness strategies (`bug-plus-one` 910, `unique-rectangle-type-1` 920, …)
are sorted *after* AIC chains (750) and ALS (810–885), yet human solvers often
apply uniqueness reasoning *earlier* than advanced chains or ALS because:

- Pattern recognition is purely visual (spot the deadly rectangle / BUG position).
- No chain tracing or ALS enumeration is needed.
- Many human solution guides teach uniqueness before even basic AIC.

This suggests the 9xx band may be mis-ordered relative to 7xx/8xx.

#### Evidence review on the 727 corpus

Running `solve:list --profile human-default` before and after this phase:

| Phase | human-default solved | last-resort solved |
|---|---|---|
| P2 baseline (pre-E) | 8 / 727 | n/a (timeout) |
| Phase E (this phase) | 8 / 727 | n/a |

The 727 corpus is not resolved by any of the current uniqueness strategies in
the stuck-at-8 state.  We cannot therefore use the 727 corpus to evidence a
specific uniqueness-vs-chains reordering.

#### Risk analysis of reordering

Moving uniqueness strategies (9xx → before 7xx/8xx) would be a **behaviour change**:
- Steps that currently use a 7xx chain or 8xx ALS technique would instead use a
  uniqueness pattern *if one fires first* — changing the trace explanation.
- The full 400-puzzle ground-truth corpus and the 727 residual corpus would both
  need re-validation after the reorder.
- Any test that pin-checks a specific `strategyId` in a trace step would break.

#### Decision

No difficulty reordering is performed in this phase.  The existing order is
**left as-is**.  This is the correct conservative default per the checklist:
> "除非你能用 727/全语料证据证明重排后 solved 不回退、且 trace 选择更合理，否则只在
> docs/notes/e.md 写出提案与证据，不要改动 difficulty。"

#### Proposal (for a future phase with evidence)

If a future phase accumulates sufficient 727 coverage that uniqueness strategies
demonstrably fire on stuck puzzles *before* the chain/ALS strategies do, the
following reorder could be proposed:

| Strategy | Current difficulty | Proposed difficulty |
|---|---|---|
| `bug-plus-one` | 910 | 745 (between nice-loop and aic) |
| `unique-rectangle-type-1` | 920 | 746 |
| `unique-rectangle-type-2` | 930 | 747 |
| `unique-rectangle-type-4` | 950 | 748 |
| `bug-lite` | 912 | 749 |

This would place simple uniqueness patterns before AIC (750) and ALS (810+).
Evidence required: at least one 727 puzzle where uniqueness fires and the chain
would not, showing that the reorder produces correct and simpler explanations.

---

## P2 Strategy Stubs — Registration Record

The following 14 strategies were not yet registered at the start of this phase.
They have been registered as **sound stubs** (`apply()` returns `null`):

| strategyId | difficulty | File | Notes |
|---|---|---|---|
| `vwxyz-wing` | 530 | `p2-stubs.ts` | Wing size-5; subsumes wxyz-wing |
| `twinned-xy-chains` | 775 | `p2-stubs.ts` | Paired XY-chain eliminations |
| `aic-with-exotic-links` | 780 | `p2-stubs.ts` | AIC with exotic link types |
| `gurth` | 990 | `p2-stubs.ts` | Symmetry-based uniqueness |
| `sue-de-coq-extended` | 1015 | `p2-stubs.ts` | Larger SdC patterns |
| `fireworks` | 1050 | `p2-stubs.ts` | Fireworks locked-set pattern |
| `franken-fish` | 1080 | `p2-stubs.ts` | Mixed row/col/box fish |
| `mutant-fish` | 1090 | `p2-stubs.ts` | Most-general fish form |
| `aligned-pair-exclusion` | 1120 | `p2-stubs.ts` | APE |
| `aligned-triple-exclusion` | 1130 | `p2-stubs.ts` | ATE |
| `subset-exclusion` | 1140 | `p2-stubs.ts` | Generalised subset counting |
| `exocet` | 1200 | `p2-stubs.ts` | Junior/Senior Exocet |
| `sk-loop` | 1250 | `p2-stubs.ts` | SK-Loop (MSLS special case) |
| `msls` | 1300 | `p2-stubs.ts` | Multi-Sector Locked Sets |

All difficulties are unique, form a strict total order within STRATEGIES, and
no two strategies share a difficulty value (machine-checked by
`test/strategy-profiles.test.ts`).

`overlap.ts` was updated to move these ids from `futureMembers` into `members`
(or the appropriate family), so the gate-3 test continues to pass.

---

## solve:list Results

```
# Before Phase E (P2 baseline):
human-default:  8/727 solved, 719 stuck, 0 errors

# After Phase E:
human-default:  8/727 solved, 719 stuck, 0 errors
```

**Delta: 0** — expected.  The 14 new stubs all return `null`; no new deductions
are produced.  The 727 count cannot decrease (soundness invariant holds) and
cannot increase (stubs do nothing).  The 8 solved puzzles remain solved via the
pre-existing strategies.

### Self-audit per strategy

| Strategy | 727 hits | Search/backtrack? |
|---|---|---|
| All 14 P2 stubs | 0 (always return null) | No — trivially no search |
| All pre-existing strategies | unchanged | No change in this phase |

No strategy in `human-default` performs backtracking or enumeration.  The
`forcing-chain` strategy (which does) remains in `last-resort` only.
