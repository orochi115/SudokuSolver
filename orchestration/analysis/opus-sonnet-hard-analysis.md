# Opus48 vs Sonnet46 Hard Failure Analysis

Source archive: `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`  
Archive result member: `20260602-064418/results.json`  
Generated detail reports: `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/`

## Summary

All 4 `hard` cases where `sonnet46` failed and `opus48` succeeded were analyzed with canonical strategy order. In all 4 cases, `opus48` solves to a final grid that preserves the givens and passes Sudoku validity checks; `sonnet46` gets stuck.

The strongest suspects are `aic` and `single-digit-patterns`:

- `aic` is the first canonical trace divergence in 3 of 4 cases and the first differing saturation fixed point in 3 of 4 cases.
- `single-digit-patterns` is the first trace and saturation divergence for hard #272709.
- Stuck-grid rescue is inconclusive for all 4 cases because reconstructing a grid from values only allows both `opus48` and `sonnet46` to produce a `locked-candidates` step. That does not preserve the real candidate eliminations from the losing trace.

## Case Table

| Hard index | Opus48 outcome | Sonnet46 outcome | First divergence | First saturation difference | Rescue scan | Classification |
| ---: | --- | --- | --- | --- | --- | --- |
| 52302 | solved, 62 steps, valid | stuck, 3 steps | step 3: opus `aic`, sonnet none (`one-stuck`) | `aic` @ canonical index 12 | both find `locked-candidates` on reconstructed grid | inconclusive |
| 114282 | solved, 65 steps, valid | stuck, 15 steps | step 9: opus `aic`, sonnet `als` | `aic` @ canonical index 12 | both find `locked-candidates` on reconstructed grid | inconclusive |
| 272709 | solved, 69 steps, valid | stuck, 8 steps | step 5: opus `single-digit-patterns`, sonnet `als` | `single-digit-patterns` @ canonical index 7 | both find `locked-candidates` on reconstructed grid | inconclusive |
| 305612 | solved, 59 steps, valid | stuck, 16 steps | step 15: opus `aic`, sonnet `forcing-chain` | `aic` @ canonical index 12 | both find `locked-candidates` on reconstructed grid | inconclusive |

## Interpretation

The canonical trace and saturation probes agree on the primary divergence family in each case. That makes `aic` the top implementation area to inspect for hard #52302, #114282, and #305612, and `single-digit-patterns` the top area for hard #272709.

The rescue probe does not prove `locked-candidates` is the missing detector. It rebuilds candidates from the stuck grid values only; this can reintroduce candidates that were eliminated in the actual losing path. Because both branches can advance from that reconstructed candidate state, the safe label for each case is `inconclusive`, not `missing-detection`.

## Detail Files

- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/summary.json`
- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/summary.md`
- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-52302/`
- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-114282/`
- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-272709/`
- `orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-305612/`

Each case directory contains `comparison.json`, `saturation-comparison.json`, `rescue-comparison.json`, `trace-opus48.json`, `trace-sonnet46.json`, `saturation-opus48.json`, and `saturation-sonnet46.json`.

## Limitations

- Reconstructed stuck-grid rescue loses candidate eliminations because current `Grid.fromString()` only encodes placements.
- Grid-only fixed-point comparison can miss divergence if two models reach the same placements with different candidate masks; candidate hashes are included where available.
- Same `strategyId` does not guarantee identical theoretical coverage for strategy families such as `aic`, `als`, and `forcing-chain`.
- Different tie-breaks can produce different but still sound traces.
- This analysis identifies likely implementation gaps; it does not prove a strategy is mathematically complete.
