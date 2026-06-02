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

This improves the prior repaired-branch full-corpus result from 904 remaining diabolical failures to 731. The nine Phase 3 candidate cases from `fixed-remaining-diabolical-root-cause-notes.md` are all solved and sound after the repair.

`orchestration/run-logs/full-corpus-20260602-064418.tar.gz` was updated in place so the `analysis-sonnet46-strategy-fix` entry in `20260602-064418/results.json`, `results.partial.json`, and `summary.md` reflects this rerun.

## Remaining Risk

- This started as a targeted repair validated on the four known hard cases, then received a full-corpus rerun after the diabolical follow-up repairs. Remaining unsolved cases are now concentrated in 731 diabolical puzzles.
- The grouped AIC implementation intentionally imports more strategy strength from `opus48`. Treat this as a strategy-strength repair branch, not as a minimal patch to the original `sonnet46` search style.
- Further work should start from the 731 remaining stuck diabolical cases rather than the original 904-case set.
