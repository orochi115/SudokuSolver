# Sonnet46 Strategy Fix Results

## Scope

This report records the repair attempt for the four hard cases where `archive/final/sonnet46` failed and `archive/final/opus48` solved.

Repair branch:

- `analysis/sonnet46-strategy-fix`

Repair branch commits:

- `ae2465d Fix empty rectangle crossing links`
- `7b53121 Add grouped AIC link detection`
- `8471467 Preserve legacy AIC fallback search`
- `fbcdf2a Fix forcing-chain implication deductions for diabolical regressions`
- `21b7961 Cover remaining forcing-chain divergences`
- `0e10960 Stabilize locked-candidates selection`
- `ee13e3e Add AIC peer endpoint coverage`
- `17464c6 Update solve-rate report`
- `96e984b Resolve diabolical regression path dependency`
- `1c18734 Resolve remaining gemini diabolical ALS paths`

Supporting orchestration commits:

- `57e86d0 Document sonnet46 strategy fix plan`
- `46c2a60 Allow archive traces from explicit refs`

The archive refs remain read-only and were not modified.

## What Changed

### Empty Rectangle

`packages/engine/src/strategies/single-digit-patterns.ts` now scans crossing external columns/rows for Empty Rectangle interactions. This covers the hard #272709 pattern:

- digit 4
- ER in box 3 with hinge row R3 and hinge column C8
- external column strong link R3C1-R4C1
- elimination R4C8=4

### AIC

`packages/engine/src/strategies/aic.ts` now uses a grouped strong/weak link graph and bounded AIC search:

- `packages/engine/src/chain/graph.ts`
- `packages/engine/src/chain/aic-search.ts`
- `packages/engine/src/chain/policy.ts`

This covers grouped X-Chain-style AIC eliminations for hard #52302, #114282, and #305612.

The original `sonnet46` single-node AIC search is retained as a fallback when grouped search finds no result. This preserves legacy discontinuous-loop, placement, and non-grouped chain behavior while adding grouped-link coverage.

## TDD Evidence

### Empty Rectangle RED

Command:

```bash
npm test -- packages/engine/test/strategies.test.ts -t "detects empty rectangle with a crossing external column link"
```

Expected RED result before implementation:

- Failed because `singleDigitPatterns.apply(grid)` returned `undefined` instead of `single-digit-patterns`.

### Empty Rectangle GREEN

Commands:

```bash
npm test -- packages/engine/test/strategies.test.ts -t "detects empty rectangle with a crossing external column link"
npm run typecheck
npm test -- packages/engine/test/strategies.test.ts
npm test
```

Observed GREEN result:

- Target test passed.
- Typecheck passed.
- `strategies.test.ts`: 49 tests passed.
- Full suite: 7 files / 103 tests passed after the ER fix.

### AIC RED

Command:

```bash
npm test -- packages/engine/test/strategies-m3.test.ts -t "detects grouped X-Chain eliminations"
```

Expected RED result before implementation:

- Failed because `aic.apply(grid)` returned `undefined` instead of `aic`.

### AIC GREEN

Commands:

```bash
npm test -- packages/engine/test/strategies-m3.test.ts -t "detects grouped X-Chain eliminations"
npm run typecheck
npm test -- packages/engine/test/strategies-m3.test.ts
npm test
```

Observed GREEN result:

- Target test passed.
- Typecheck passed.
- `strategies-m3.test.ts`: 34 tests passed.
- Full suite: 7 files / 104 tests passed after the AIC fix.

### AIC Fallback Review Fix

Code review identified that the first grouped AIC rewrite dropped legacy AIC fallback behavior. A follow-up regression test bounds grouped search to one node and asserts the legacy AIC search still produces a step.

Commands:

```bash
npm test -- packages/engine/test/strategies-m3.test.ts -t "falls back to legacy AIC search"
npm test -- packages/engine/test/strategies-m3.test.ts -t "detects grouped X-Chain eliminations"
npm run typecheck
npm test -- packages/engine/test/strategies-m3.test.ts
npm test
```

Observed result after `8471467`:

- Fallback regression passed.
- Grouped AIC regression still passed.
- Typecheck passed.
- `strategies-m3.test.ts`: 35 tests passed.
- Full suite: 7 files / 105 tests passed.

## Rerun Commands

The four cases were rerun from the `orchestration` branch using explicit git refs:

```bash
node orchestration/trace-archive-case.mjs \
  --puzzle 000010000053204960600050002000000000000908000039020480800030004046000310005401800 \
  --models opus48,sonnet46-fixed \
  --refs opus48=archive/final/opus48,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/sonnet46-fixed-hard-52302

node orchestration/trace-archive-case.mjs \
  --puzzle 900000006004907800070000050100000009007106500005080200000302000010509030300010005 \
  --models opus48,sonnet46-fixed \
  --refs opus48=archive/final/opus48,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/sonnet46-fixed-hard-114282

node orchestration/trace-archive-case.mjs \
  --puzzle 009400010200005700060020009020050001003204800600090050300080020002300004080002100 \
  --models opus48,sonnet46-fixed \
  --refs opus48=archive/final/opus48,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/sonnet46-fixed-hard-272709

node orchestration/trace-archive-case.mjs \
  --puzzle 300200008000008300061059400048000001003000500600000840009730610006100000100006003 \
  --models opus48,sonnet46-fixed \
  --refs opus48=archive/final/opus48,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/sonnet46-fixed-hard-305612
```

Runtime outputs are intentionally ignored under `orchestration/reports/analysis/`.

## Rerun Results

| Case | `opus48` | `sonnet46-fixed` | First divergence after fix | Notes |
| ---: | --- | --- | --- | --- |
| hard #52302 | solved, `finalGridValid=true`, 62 steps | solved, `finalGridValid=true`, 62 steps | identical prefix through completion | AIC gap closed. |
| hard #114282 | solved, `finalGridValid=true`, 65 steps | solved, `finalGridValid=true`, 65 steps | identical prefix through completion | AIC gap closed. |
| hard #272709 | solved, `finalGridValid=true`, 69 steps | solved, `finalGridValid=true`, 70 steps | `same-strategy-different-effect` at step 44 | Original Empty Rectangle gap closed; later path still differs but remains valid and solved. |
| hard #305612 | solved, `finalGridValid=true`, 59 steps | solved, `finalGridValid=true`, 59 steps | identical prefix through completion | AIC gap closed. |

Summary:

- All four previously failing hard cases solve after the repair.
- No repaired solved trace reports `finalGridValid=false`.
- The three AIC cases now match `opus48` through completion.
- The Empty Rectangle case no longer fails; it solves via a slightly different later path.

## Full-Corpus Rerun After Diabolical Repair

After the follow-up TDD repair pass, `analysis/sonnet46-strategy-fix` was rerun against the full OpenSudoku corpus from the `orchestration` branch:

```bash
node orchestration/run-archive-full-corpus.mjs \
  --ref analysis/sonnet46-strategy-fix \
  --name analysis-sonnet46-strategy-fix \
  --out-dir orchestration/reports/full-corpus/analysis-sonnet46-strategy-fix-rerun \
  --workers 12
```

Rerun result:

| Difficulty | Solved | Valid solved | Stuck | Errors |
| --- | ---: | ---: | ---: | ---: |
| easy | 100000/100000 | 100000 | 0 | 0 |
| medium | 352643/352643 | 352643 | 0 | 0 |
| hard | 321592/321592 | 321592 | 0 | 0 |
| diabolical | 118950/119681 | 118950 | 731 | 0 |
| total | 893185/893916 | 893185 | 731 | 0 |

This improves the prior repaired-branch full-corpus result from 904 remaining diabolical failures to 731. Seven of the nine Phase 3 candidate cases from `fixed-remaining-diabolical-root-cause-notes.md` no longer fail in the full-corpus rerun. Two `gemini35flash`-solved cases, #38116 and #77633, remain failed in the full solve path and require fresh trace comparison.

The rerun also exposed one regression relative to the original `archive/final/sonnet46`: diabolical #36186 is solved by `sonnet46` but stuck in `analysis/sonnet46-strategy-fix`. The first divergence is a same-state `locked-candidates` different-effect at step 3. A later Phase 1 repair fixed this regression locally with generic strategy changes, not a puzzle-specific guard:

- `locked-candidates` now returns all same-phase deductions instead of choosing one globally ranked action.
- `forcing-chain` now combines simultaneously available graph-forcing and bounded-contradiction deductions, and falls back to the original naked-single forcing subset when newer forcing paths do not produce a step.
- #36186 has restored-state and full-puzzle regression coverage; the full-puzzle trace is asserted solved and sound.

Local verification after the Phase 1 repair:

```bash
npm test
npm run typecheck
```

Observed result:

- `npm test`: 8 test files passed, 117 tests passed.
- `npm run typecheck`: passed.

The full-corpus archive has not yet been rerun after this Phase 1 repair, so the aggregate table above remains the pre-#36186-fix full-corpus checkpoint.

`orchestration/run-logs/full-corpus-20260602-064418.tar.gz` was updated in place so the `analysis-sonnet46-strategy-fix` entry in `20260602-064418/results.json`, `results.partial.json`, and `summary.md` reflects this rerun.

## Phase 2 Repair for Remaining Gemini-Solved Diabolical Cases

After the Phase 1 regression repair, #38116 and #77633 remained the only known `gemini35flash`-solved cases still failing locally in the full solve path. Fresh trace comparisons were generated from `orchestration`:

```bash
node orchestration/trace-archive-case.mjs \
  --puzzle 706000304009000800800000002000169000060050070000207000007000400200405007300706008 \
  --models gemini35flash,sonnet46-fixed \
  --refs gemini35flash=archive/final/gemini35flash,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/remaining-gemini-38116

node orchestration/trace-archive-case.mjs \
  --puzzle 010000020600040008082030460040502010000000000900060007100050002060000080020904050 \
  --models gemini35flash,sonnet46-fixed \
  --refs gemini35flash=archive/final/gemini35flash,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/remaining-gemini-77633
```

Findings:

- Initial same-state `locked-candidates` differences were step-batching artifacts, not root causes.
- The first true path divergence was missing ALS capability: doubly-linked ALS-XZ and ALS-family deduction collection.

Phase 2 implementation in `1c18734`:

- `packages/engine/src/strategies/als.ts` now tracks each ALS house, implements doubly-linked ALS-XZ eliminations, and combines ALS-XZ, ALS-XY-Wing, and Death Blossom deductions.
- `packages/engine/test/diabolical-regressions.test.ts` now covers #38116 and #77633 with restored-state ALS tests and full-puzzle solved/sound tests.

Local verification after the Phase 2 repair:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "38116|77633"
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts
npm test
npm run typecheck
git diff --check
```

Observed result:

- Targeted #38116/#77633 regression run passed.
- `diabolical-regressions.test.ts`: 16 tests passed.
- Full suite: 8 test files passed, 121 tests passed.
- Typecheck passed.

The full-corpus archive has not yet been rerun after the Phase 2 repair. The aggregate table above remains the pre-Phase-1/Phase-2 full-corpus checkpoint.

## Remaining Risk

- This started as a targeted repair validated on the four known hard cases, then received a full-corpus rerun after the diabolical follow-up repairs. The pre-Phase-1 aggregate result was 731 diabolical stuck cases, including two still model-solvable cases and the #36186 regression. The #36186 regression and the two known `gemini35flash`-solved cases are now fixed locally, but a fresh full-corpus rerun is required to update the aggregate count.
- The grouped AIC implementation intentionally imports more strategy strength from `opus48`. Treat this as a strategy-strength repair branch, not as a minimal patch to the original `sonnet46` search style.
- Further work should start with a full-corpus checkpoint for the Phase 1 and Phase 2 repairs before broader strategy expansion.
