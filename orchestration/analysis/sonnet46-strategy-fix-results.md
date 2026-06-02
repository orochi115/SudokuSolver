# Sonnet46 Strategy Fix Results

## Scope

This report records the repair attempt for the four hard cases where `archive/final/sonnet46` failed and `archive/final/opus48` solved.

Repair branch:

- `analysis/sonnet46-strategy-fix`

Repair branch commits:

- `ae2465d Fix empty rectangle crossing links`
- `7b53121 Add grouped AIC link detection`
- `8471467 Preserve legacy AIC fallback search`

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

## Remaining Risk

- This is a targeted repair validated on the four known hard cases plus the existing engine test suite, not a full-corpus rerun of the repaired branch.
- The grouped AIC implementation intentionally imports more strategy strength from `opus48`. Treat this as a strategy-strength repair branch, not as a minimal patch to the original `sonnet46` search style.
- Full-corpus rerun support for arbitrary refs can be added if we need aggregate before/after counts beyond these four root-cause cases.
