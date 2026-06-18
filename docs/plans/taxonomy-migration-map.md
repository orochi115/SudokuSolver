# Taxonomy Migration Map

This file records the human-strategy taxonomy refactor audit, old-to-new strategy ID migration, final default ordering, and explicitly deferred follow-up work.

## Baseline

- Branch/worktree check: `git status --short --branch` returned `## master` with a clean working tree.
- Fast regression baseline: `npm test` passed on 2026-06-18.
- Full-corpus baseline remains the one recorded in `taxonomy-refactor.md`:

| Difficulty | Solved | Valid solved | Stuck | Errors |
| --- | ---: | ---: | ---: | ---: |
| easy | 100000/100000 | 100000 | 0 | 0 |
| medium | 352643/352643 | 352643 | 0 | 0 |
| hard | 321592/321592 | 321592 | 0 | 0 |
| diabolical | 118954/119681 | 118954 | 727 | 0 |
| total | 893189/893916 | 893189 | 727 | 0 |

## Current Registry Audit

Current `packages/engine/src/strategies/index.ts` registry order is already sorted by `difficulty`, but several entries are broad families whose `strategyId` hides multiple human techniques.

| Current id | Difficulty | Current scope | Taxonomy concern |
| --- | ---: | --- | --- |
| `full-house` | 4 | Full house placement. | Keep as-is. |
| `naked-single` | 10 | Naked single placement. | Keep as-is. |
| `hidden-single` | 10 | Hidden single placement. | Consider ordering at 12 later; no ID split needed. |
| `locked-candidates` | 20 | Pointing and claiming; current implementation combines all found pointing instances before claiming. | Split by pointing/claiming. Cross-instance combining remains a documented exception until a later single-instance pass. |
| `naked-subset` | 30 | Naked pair, triple, quad. | Split by subset size; pair before triple before quad. |
| `hidden-subset` | 30 | Hidden pair, triple, quad. | Split by subset size; pair before triple before quad. |
| `basic-fish` | 40 | X-Wing, Swordfish, Jellyfish. | Split by fish size; X-Wing earlier, Jellyfish later. |
| `single-digit-patterns` | 45 | Skyscraper, 2-String Kite, Empty Rectangle. | Split by named pattern. |
| `xy-wing` | 50 | XY-Wing. | Keep as-is; reposition to proposed order. |
| `xyz-wing` | 50 | XYZ-Wing. | Keep as-is; reposition to proposed order. |
| `w-wing` | 50 | W-Wing. | Keep as-is; reposition to proposed order. |
| `simple-coloring` | 60 | Simple Coloring. | Keep as-is. |
| `aic` | 70 | General AIC helpers and legacy fallbacks. | Phase 4 split: separate low-risk `x-chain` first if classification is precise. |
| `als` | 80 | ALS-XZ, doubly-linked ALS-XZ, ALS-XY-Wing, Death Blossom; current implementation combines sub-technique results. | Split in Phase 3; first re-anchor regression assertions by sub-technique. |
| `uniqueness` | 90 | UR Type 1, UR Type 2, UR Type 4, BUG+1. | Split IDs; keep assumption-free default placement late. |
| `sue-de-coq` | 95 | Sue de Coq. | Keep as-is; proposed difficulty around 96. |
| `forcing-chain` | 100 | Forcing chain fallback. | Keep as broad last resort for first pass unless traces prove misleading. |

Solver behavior to preserve: `packages/engine/src/solver.ts` clones the grid, sorts supplied strategies by ascending `difficulty`, applies the first progressing step, records it, then restarts from the cheapest strategy. Strategy contract to preserve: `packages/engine/src/strategy.ts` requires `apply(grid)` to return the first deduction or `null`, and not mutate the grid.

## Old To New Mapping

| Old strategyId | New strategyId(s) | Notes |
| --- | --- | --- |
| `locked-candidates` | `locked-candidates-pointing`, `locked-candidates-claiming` | Implemented 2026-06-18. Split by named sub-technique; current board-wide same-technique combining is retained as a temporary deferred exception. |
| `naked-subset` | `naked-pair`, `naked-triple`, `naked-quad` | Implemented 2026-06-18. Reuses existing size search; each size is registered as its own strategy. |
| `hidden-subset` | `hidden-pair`, `hidden-triple`, `hidden-quad` | Implemented 2026-06-18. Reuses existing size search; each size is registered as its own strategy. |
| `basic-fish` | `x-wing`, `swordfish`, `jellyfish` | Implemented 2026-06-18. Reuses existing fish helper by size. |
| `single-digit-patterns` | `skyscraper`, `two-string-kite`, `empty-rectangle` | Implemented 2026-06-18. Existing helper boundaries are exported as named strategies; explanations are preserved. |
| `uniqueness` | `bug-plus-one`, `unique-rectangle-type-1`, `unique-rectangle-type-2`, `unique-rectangle-type-4` | Implemented 2026-06-18. Existing helper boundaries are preserved; BUG+1 is placement-based while URs are elimination-based. Default assumption-free ordering keeps uniqueness late. |
| `als` | `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, `death-blossom` | Implemented 2026-06-18. Regression assertions for #38116/#77633 were re-anchored by sub-technique; the broad `als` strategy is no longer registered by default. |
| `aic` | `x-chain`, `aic` | Implemented 2026-06-18. Conservative first split: single-digit grouped AIC/X-Chain search is registered as `x-chain`; broad `aic` remains the peer-endpoint/general grouped/legacy fallback. |

## Final Default Order

Default ordering prefers assumption-free, lower recognition-cost techniques. The registry remains sorted by `difficulty`.

| Strategy id | Difficulty | Source |
| --- | ---: | --- |
| `full-house` | 4 | Existing `full-house`. |
| `naked-single` | 10 | Existing `naked-single`. |
| `hidden-single` | 12 | Existing `hidden-single`. |
| `locked-candidates-pointing` | 20 | Implemented; split from `locked-candidates`. |
| `locked-candidates-claiming` | 22 | Implemented; split from `locked-candidates`. |
| `naked-pair` | 30 | Split from `naked-subset`. |
| `hidden-pair` | 32 | Split from `hidden-subset`. |
| `naked-triple` | 34 | Split from `naked-subset`. |
| `hidden-triple` | 36 | Split from `hidden-subset`. |
| `naked-quad` | 38 | Split from `naked-subset`. |
| `hidden-quad` | 39 | Split from `hidden-subset`. |
| `x-wing` | 40 | Split from `basic-fish`. |
| `skyscraper` | 44 | Split from `single-digit-patterns`. |
| `two-string-kite` | 46 | Split from `single-digit-patterns`. |
| `empty-rectangle` | 48 | Split from `single-digit-patterns`. |
| `swordfish` | 50 | Split from `basic-fish`. |
| `xy-wing` | 52 | Existing `xy-wing`. |
| `xyz-wing` | 54 | Existing `xyz-wing`. |
| `w-wing` | 56 | Existing `w-wing`. |
| `jellyfish` | 58 | Split from `basic-fish`. |
| `simple-coloring` | 60 | Existing `simple-coloring`. |
| `x-chain` | 65 | Split from `aic`. |
| `aic` | 70 | Remaining general AIC. |
| `als-xz` | 80 | Split from `als`. |
| `als-xz-doubly-linked` | 82 | Split from `als`. |
| `als-xy-wing` | 85 | Split from `als`. |
| `death-blossom` | 88 | Split from `als`. |
| `bug-plus-one` | 90 | Split from `uniqueness`; default profile keeps uniqueness late. |
| `unique-rectangle-type-1` | 91 | Split from `uniqueness`. |
| `unique-rectangle-type-2` | 92 | Split from `uniqueness`. |
| `unique-rectangle-type-4` | 93 | Split from `uniqueness`. |
| `sue-de-coq` | 95 | Existing `sue-de-coq`. |
| `forcing-chain` | 100 | Existing `forcing-chain`. |

## Test Impact Audit

Tests with expected strategy IDs or direct imports that must be updated during implementation:

| Test file | Current dependency | Future action |
| --- | --- | --- |
| `packages/engine/test/strategies.test.ts` | Imports and asserts split low-risk mechanical strategies; registry required IDs include all final default IDs. | Complete. Keep soundness and no-mutation assertions when future IDs change. |
| `packages/engine/test/strategies-m3.test.ts` | Imports and asserts split `x-chain`, split ALS strategies, and split uniqueness strategies. | Complete for Roadmap ①. Future AIC fine splits need their own restored-state ID tests. |
| `packages/engine/test/diabolical-regressions.test.ts` | Anchors restored-state regressions for locked candidates, ALS split techniques, and broad AIC fallback cases. | Complete for Roadmap ①. Preserve protected deductions when future chain taxonomy changes. |

Do not delete regression intent when changing IDs: each updated test should still prove the protected deduction is sound and present in the restored candidate state.

## Explicit Deferred Exceptions

- `locked-candidates.ts` currently combines all found pointing instances into one step before looking at claiming, and combines all claiming instances if no pointing exists. Phase 2 may temporarily preserve same-technique combining to keep the pass bounded, but should document that this is not the final tutoring granularity.
- ALS cross-technique combining was removed in Phase 3. The split ALS helpers now return the first concrete pattern instance for their specific technique instead of merging unrelated ALS sub-techniques or instances.
- AIC fine-grained Type 1/Type 2/grouped split is not Phase 4 scope unless current helpers classify those cases precisely.
- Full-corpus performance remains secondary to tutoring trace quality. If split strategies become too expensive, add per-solver-iteration analysis caching as a separate optimization, not as part of strategy correctness.
- Do not introduce backtracking, template enumeration, unrestricted forcing nets, or puzzle-specific guards under human-strategy labels.
