# Opus/Sonnet Root-Cause Notes

## Scope

This note follows the Phase 2 probe work for the four hard puzzles where `sonnet46` failed and `opus48` solved:

| Puzzle | Suspect strategy | Probe label | Candidate hashes matched | Candidate state restored |
| ---: | --- | --- | --- | --- |
| hard #52302 | `aic` | `winner-only-detection` | yes | yes |
| hard #114282 | `aic` | `winner-only-detection` | yes | yes |
| hard #272709 | `single-digit-patterns` | `winner-only-detection` | yes | yes |
| hard #305612 | `aic` | `winner-only-detection` | yes | yes |

The Phase 2 divergence probes were generated at:

- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures-divergence-probe/`

That directory is intentionally ignored runtime output. The committed source artifacts it depends on are:

- `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- `orchestration/run-logs/opus-sonnet-hard-analysis-20260602.tar.gz`

The static implementation comparison uses the read-only archive refs `archive/round1/final/opus48` and `archive/round1/final/sonnet46`.

## Findings

### AIC: `sonnet46` lacks grouped-chain coverage

Affected cases: hard #52302, #114282, and #305612.

The divergence probe shows the decisive AIC state is not caused by candidate-state drift:

- `candidateHashesMatchAtDivergence` is `true` for all three AIC cases.
- Both `winnerProbe.candidateStateRestored` and `loserProbe.candidateStateRestored` are `true`.
- `opus48` produces an `aic` step from that restored state.
- `sonnet46` does not produce an `aic` step from the same restored candidate state.

Static review points to a strategy-strength gap rather than a path dependency. `opus48` splits AIC search into reusable chain modules and builds grouped same-digit links:

- `archive/round1/final/opus48:packages/engine/src/strategies/aic.ts` builds a graph with `{ digit, grouped: true }` before searching.
- `archive/round1/final/opus48:packages/engine/src/chain/graph.ts` represents chain nodes as one or more cells, so a grouped assertion can cover multiple candidates.
- `archive/round1/final/opus48:packages/engine/src/chain/graph.ts` creates grouped nodes from collinear candidates in a box and creates strong links between grouped row/column positions.
- `archive/round1/final/opus48:packages/engine/src/chain/aic-search.ts` can eliminate same-digit peers that see all cells of both chain endpoints.

`sonnet46` implements AIC directly in `archive/round1/final/sonnet46:packages/engine/src/strategies/aic.ts`. Its `getStrongNeighbors()` only creates same-digit strong links when a house has exactly two raw candidate cells and the current cell is the single candidate in that house. That excludes grouped conjugates where one endpoint is a multi-cell row/box or column/box group.

The probe evidence is consistent with that difference, but it does not directly print the internal AIC chain path:

- hard #52302: `opus48` finds a digit 6 X-Chain-style AIC step and eliminates `R9C9=6`; `sonnet46` finds no AIC step.
- hard #114282: `opus48` finds a digit 7 X-Chain-style AIC step and eliminates `R4C7=7`, `R4C8=7`, and `R6C4=7`; `sonnet46` finds no AIC step.
- hard #305612: `opus48` finds a digit 4 X-Chain-style AIC step and eliminates `R1C3=4`; `sonnet46` finds no AIC step.

Classification: coverage gap. The direct probe proves `sonnet46` misses AIC detections available to `opus48` from the same candidate state. Static review makes grouped-link support the strongest explanation for that gap, but confirming the exact chain nodes would require the optional internal instrumentation from Task 9.

### Single-Digit Patterns: `sonnet46` has narrower Empty Rectangle coverage

Affected case: hard #272709.

The divergence probe again rules out candidate-state mismatch:

- `candidateHashesMatchAtDivergence` is `true`.
- Both models restore candidate state successfully.
- `opus48` produces a `single-digit-patterns` step.
- `sonnet46` does not produce a `single-digit-patterns` step; it has an `als` step available later instead.

The `opus48` step explanation identifies the missing pattern:

> Empty Rectangle: in box 3, digit 4 forms an ER (hinge row R3, col C8); with the column strong link R3C1-R4C1, 4 can be removed from R4C8.

Static review shows `opus48` detects this because `archive/round1/final/opus48:packages/engine/src/strategies/single-digit-patterns.ts` scans external columns crossing the ER hinge row and external rows crossing the ER hinge column. In this case it can use the external column conjugate pair `R3C1-R4C1` to eliminate `R4C8=4`.

`sonnet46` implements Empty Rectangle in `archive/round1/final/sonnet46:packages/engine/src/strategies/single-digit-patterns.ts`, but its `tryEmptyRectangle()` only checks the ER hinge column for column conjugates and the ER hinge row for row conjugates. The needed strong link is in column `C1`, not the ER hinge column `C8`, so this implementation never considers the valid interaction that `opus48` finds.

Classification: coverage gap. `sonnet46` has a narrower Empty Rectangle detector, not a candidate-state or tie-break failure.

## Questions From The Plan

Is the divergence due to candidate-state mismatch before the suspect strategy runs?

No. All four Phase 2 probes report matching candidate hashes at the divergence point and successful candidate-state restoration for both models.

If candidate state matches, does the suspect strategy detect a step in `opus48` but not `sonnet46`?

Yes. All four cases are `winner-only-detection`: `opus48` produces the suspect strategy step and `sonnet46` does not.

If both detect a step, do they choose different effects because of tie-breaks?

No. The decisive probes do not reach a same-strategy-different-effect situation. The loser model fails to detect the suspect strategy output at all.

Which exact code path or condition explains the difference?

- AIC: `sonnet46` strong-link construction requires exactly two raw candidate cells in a house, while `opus48` can build grouped strong links and search grouped AIC/X-Chain paths. The probe proves winner-only AIC detection; grouped links are the strongest static-code explanation rather than directly emitted trace evidence.
- Single-digit patterns: `sonnet46` Empty Rectangle probing checks only the ER hinge row/column, while `opus48` scans crossing external rows/columns and can find the required external conjugate pair.

Is this a correctness bug, coverage gap, or acceptable strategy-strength difference?

These are coverage gaps relative to the `opus48` strategy set. They may be acceptable strategy-strength differences if `sonnet46` intentionally implements narrower AIC and Empty Rectangle variants. They are not evidence of invalid solving, candidate corruption, or tie-break-only behavior.

## Task 9 Decision

Task 9 debug branches were not created. The Phase 2 probes restored candidate state and produced conclusive `winner-only-detection` labels for both suspect strategy families, so internal debug instrumentation was unnecessary.
