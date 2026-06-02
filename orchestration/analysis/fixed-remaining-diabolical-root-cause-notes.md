# Fixed-Branch Remaining Diabolical Root-Cause Notes

## Scope

This note summarizes Phase 3 analysis for the remaining full-corpus failures after `analysis-sonnet46-strategy-fix`.

Committed inputs and artifacts:

- Full-corpus archive: `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- Packaged Phase 3 traces: `orchestration/run-logs/fixed-remaining-diabolical-analysis-20260602.tar.gz`
- Expanded runtime report directory: `orchestration/reports/analysis/fixed-remaining-diabolical-comparison/`
- Loser result name: `analysis-sonnet46-strategy-fix`
- Loser trace ref: `analysis/sonnet46-strategy-fix`

The expanded report directory is ignored runtime output. The tarball preserves the generated `candidate-cases.json`, `winner-case-pairs.json`, `summary.json`, `summary.md`, and per-pair trace/probe artifacts.

## Candidate Set

Original Phase 3 input: `analysis-sonnet46-strategy-fix` had 904 remaining full-corpus failures, all in `diabolical`.

Repair follow-up rerun on 2026-06-02 after commits `fbcdf2a`, `21b7961`, `0e10960`, `ee13e3e`, and `17464c6` reduced the same ref's full-corpus failures to 731, all still in `diabolical`:

- easy: 100000/100000 solved
- medium: 352643/352643 solved
- hard: 321592/321592 solved
- diabolical: 118950/119681 solved, 731 stuck, 0 errors
- total: 893185/893916 solved

`orchestration/run-logs/full-corpus-20260602-064418.tar.gz` has been updated so `20260602-064418/results.json`, `results.partial.json`, and `summary.md` contain this rerun result for `analysis-sonnet46-strategy-fix`.

Nine unique remaining-failure cases are solved by at least one archived model, producing ten winner-case comparison pairs:

| Diabolical case | Winner(s) |
| ---: | --- |
| 13829 | `gemini35flash` |
| 23835 | `gpt55` |
| 27806 | `gpt55` |
| 38116 | `gemini35flash` |
| 77633 | `gemini35flash` |
| 78760 | `gpt55` |
| 88102 | `opus48` |
| 103170 | `opus48`, `gemini35flash` |
| 109043 | `gpt55` |

## Strategy-Level Findings

| Case | Winner | First divergence | Saturation suspect | Rescue strategy | Classification | Notes |
| ---: | --- | --- | --- | --- | --- | --- |
| 13829 | `gemini35flash` | step 6: winner `aic`, loser `als` | `aic` @ 12 | winner `naked-subset`; loser `naked-subset` | `winner-only-detection` | Candidate hashes match at divergence; `gemini35flash` can produce an `aic` step from the same restored state. |
| 23835 | `gpt55` | step 8: both `forcing-chain`, different effect | `forcing-chain` @ 16 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Candidate hashes match; compare forcing-chain action choice/effect against `gpt55`. |
| 27806 | `gpt55` | step 7: winner `forcing-chain`, loser `single-digit-patterns` | `single-digit-patterns` @ 7 | winner `forcing-chain`; loser `single-digit-patterns` | `same-strategy-different-effect` | Candidate hashes match; direct probe suspect is `forcing-chain`, while saturation first differs at `single-digit-patterns`. |
| 38116 | `gemini35flash` | step 9: winner `aic`, loser `als` | `aic` @ 12 | winner `locked-candidates`; loser `locked-candidates` | `winner-only-detection` | Candidate hashes match at divergence; second `gemini35flash` case points to AIC coverage. |
| 77633 | `gemini35flash` | step 6: both `aic`, different effect | `aic` @ 12 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Candidate hashes match; AIC exists in both, but selected action/effect differs. |
| 78760 | `gpt55` | step 5: both `locked-candidates`, different effect | `aic` @ 12 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Candidate hashes match; first action difference is `locked-candidates`, with later fixed-point drift visible at AIC. |
| 88102 | `opus48` | step 15: both `forcing-chain`, different effect | `forcing-chain` @ 16 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Highest-priority `opus48` comparison; candidate hashes match and forcing-chain behavior diverges directly. |
| 103170 | `opus48` | step 8: both `forcing-chain`, different effect | `forcing-chain` @ 16 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Second `opus48` comparison; reinforces forcing-chain as the strongest repair target for opus-aligned behavior. |
| 103170 | `gemini35flash` | step 2: both `locked-candidates`, different effect | `aic` @ 12 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Same puzzle as the opus pair but a much earlier locked-candidates divergence against `gemini35flash`. |
| 109043 | `gpt55` | step 8: both `forcing-chain`, different effect | `forcing-chain` @ 16 | winner `locked-candidates`; loser `locked-candidates` | `same-strategy-different-effect` | Candidate hashes match; another forcing-chain effect divergence against `gpt55`. |

All ten pairs have `candidateHashesMatchAtDivergence: true`. None of the Phase 3 pairs show evidence of candidate-state mismatch before the suspect strategy runs.

The stuck-grid rescue scans are not decisive in this phase. Every pair reports a winner rescue strategy and a loser rescue strategy from the reconstructed stuck grid. That means the rescue probe is useful as a sanity check but does not prove a missing final-grid detection, because it reconstructs candidates from grid values rather than preserving the losing path's candidate eliminations.

## Reusable Repair Direction

Future repair work should happen on `analysis/sonnet46-strategy-fix`; do not edit `archive/final/*` branches.

Start with these files on `analysis/sonnet46-strategy-fix`:

- `packages/engine/src/strategies/forcing-chain.ts`
- `packages/engine/src/strategies/aic.ts`
- `packages/engine/src/strategies/locked-candidates.ts`
- `packages/engine/src/strategies/single-digit-patterns.ts`

Recommended regression puzzles:

- Forcing-chain same-state different effect: diabolical #88102, #103170 (`opus48`), #23835, #109043 (`gpt55`).
- AIC winner-only or different-effect behavior: diabolical #13829, #38116, #77633 (`gemini35flash`).
- Locked-candidates different-effect behavior: diabolical #78760 (`gpt55`) and #103170 (`gemini35flash`).
- Mixed path/saturation dependency: diabolical #27806 (`gpt55`), where the direct divergence probe points at `forcing-chain` but saturation first differs at `single-digit-patterns`.

Expected behavior should be taken from the corresponding winner trace files in `orchestration/reports/analysis/fixed-remaining-diabolical-comparison/`, or from the packaged tarball if the expanded report directory is absent.

The dominant failure mode is not invalid solving and not candidate-state corruption. Phase 3 mostly shows same-candidate-state strategy coverage or tie-break/effect differences:

- `aic` has two `winner-only-detection` cases against `gemini35flash`, plus one same-strategy different-effect case.
- `forcing-chain` has four direct same-strategy different-effect comparisons across `opus48` and `gpt55`, plus one mixed path case.
- `locked-candidates` has two direct same-strategy different-effect comparisons.
- `single-digit-patterns` appears as an early fixed-point suspect in #27806, but the same-state probe for that pair points to `forcing-chain` as the immediate divergence target.

Do not implement repairs as part of this analysis task. The next repair session should add focused regression tests on `analysis/sonnet46-strategy-fix` before changing any strategy implementation.

## Repair Follow-Up Verification

The subsequent TDD repair pass added focused restored-state regression coverage in `packages/engine/test/diabolical-regressions.test.ts` on `analysis/sonnet46-strategy-fix`. The full OpenSudoku rerun shows seven of the nine original candidate cases no longer fail in the repaired branch. Two `gemini35flash`-solved cases remain failed in the full solve path, despite restored-state AIC tests passing:

| Diabolical case | Full-corpus status after repair |
| ---: | --- |
| 13829 | solved, sound |
| 23835 | solved, sound |
| 27806 | solved, sound |
| 38116 | still failed; solve-path divergence remains |
| 77633 | still failed; solve-path divergence remains |
| 78760 | solved, sound |
| 88102 | solved, sound |
| 103170 | solved, sound |
| 109043 | solved, sound |

The full-corpus result also uncovered one regression relative to the original `archive/final/sonnet46`: diabolical #36186 is solved by `sonnet46` but stuck in `analysis-sonnet46-strategy-fix`. A direct trace comparison shows the first divergence at step 3, `locked-candidates` vs `locked-candidates`, same candidate state but different effect:

- `sonnet46`: eliminates digit 5 from cells 54, 63, 72 and eventually solves.
- `analysis-sonnet46-strategy-fix`: eliminates digit 2 from cells 13, 22 and later gets stuck.

This is a real regression from the `locked-candidates` selection changes and should be fixed before adding new strategy families.

Targeted repair areas:

- `forcing-chain`: bounded graph implication plus bounded contradiction fallback for #88102, #103170, #23835, #109043, and #27806.
- `locked-candidates`: stable action collection/ranking for #78760 and #103170.
- `aic`: peer-endpoint AIC coverage and selection for #13829, #38116, and #77633.

Fresh verification before archive update:

```bash
npm test
npm run typecheck
npm run solve:rate
```

Observed local sample/corpus report from `solve:rate`: 399/400 solved, 0 sound violations. The full OpenSudoku corpus rerun then produced 893185/893916 solved with 731 remaining stuck cases and no invalid solved grids. Because full-corpus failure indexes are 1-based, use the archive failure set as the source of truth when checking case status.
