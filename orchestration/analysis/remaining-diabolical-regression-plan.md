# Remaining Diabolical Regression and Strategy Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:systematic-debugging before proposing fixes, and superpowers:test-driven-development for every implementation change. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the known regression and remaining model-solvable diabolical failures before starting a new strategy expansion cycle.

**Architecture:** Keep orchestration/reporting work on `orchestration`; keep implementation work on `analysis/sonnet46-strategy-fix`. Use full-corpus archive overlap to identify model-solvable failures, trace comparisons to find first divergence, then write restored-state and full-puzzle regression tests before changing strategy code.

**Tech Stack:** TypeScript engine under `packages/engine`, Vitest, orchestration scripts in `orchestration/*.mjs`, full-corpus tarball `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`.

---

## Current Evidence

Updated archive:

- `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- Member: `20260602-064418/results.json`
- Target result: `analysis-sonnet46-strategy-fix`

Current full-corpus result for `analysis-sonnet46-strategy-fix` after the Phase 1/2 repair rerun:

| Difficulty | Solved | Stuck | Errors |
| --- | ---: | ---: | ---: |
| easy | 100000/100000 | 0 | 0 |
| medium | 352643/352643 | 0 | 0 |
| hard | 321592/321592 | 0 | 0 |
| diabolical | 118954/119681 | 727 | 0 |
| total | 893189/893916 | 727 | 0 |

Remaining overlap among the 727 diabolical failures:

| Group | Count | Notes |
| --- | ---: | --- |
| Failed by all compared archive results | 727 | Requires new strategy capability or stronger variants. |
| Solved by `gemini35flash` | 0 | #38116 and #77633 are now solved after the ALS repair. |
| Solved by original `sonnet46` | 0 | #36186 regression is now solved after the locked-candidates/forcing-chain repair. |

Important indexing rule:

- Full-corpus failure `index` values are 1-based in `results.json`.
- Do not index directly into `parseOpenSudoku(...)[index]`; use archive failure objects or subtract 1 when reading the puzzle corpus directly.

## Phase 1: Fix Regression Before New Strategy Work

Status: completed on `analysis/sonnet46-strategy-fix` after the Phase 1 repair commit.

Implementation summary:

- Added #36186 restored-state and full-puzzle regression coverage in `packages/engine/test/diabolical-regressions.test.ts`.
- Fixed `locked-candidates` generically by collecting all same-phase locked-candidates deductions instead of selecting one globally ranked action. Pointing deductions are applied together; claiming deductions are applied together only when no pointing deduction exists.
- Updated forcing-chain handling generically so graph forcing and bounded contradiction deductions can be combined when both are available, and restored the legacy naked-single forcing subset as a fallback when the newer graph/contradiction paths do not produce a step.
- Removed path-specific expectations from affected regression tests. Tests now assert required sound deductions are present and that full solve paths are solved and sound, rather than requiring one historical trace path.
- No puzzle-specific guard or #36186 literal was added to implementation code.

Verification run from `/Users/sakura/LLM_Work/sudoku-trace-wt`:

```bash
npm test
npm run typecheck
```

Observed result:

- `npm test`: 8 test files passed, 117 tests passed.
- `npm run typecheck`: passed.

### Task 1: Reproduce and Lock Down Regression #36186

**Files:**

- Modify: `packages/engine/test/diabolical-regressions.test.ts`
- Candidate implementation file: `packages/engine/src/strategies/locked-candidates.ts`
- Evidence: `orchestration/reports/analysis/regression-sonnet46-case-36186/`

- [x] Step 1: Confirm trace evidence from `orchestration`

Run:

```bash
node orchestration/trace-archive-case.mjs \
  --puzzle 200900060090000500005100000306200050000030000010008207000007800002000040080004003 \
  --models sonnet46,sonnet46-fixed \
  --refs sonnet46=archive/final/sonnet46,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/regression-sonnet46-case-36186
```

Expected evidence:

- `sonnet46`: solved, 77 steps.
- `sonnet46-fixed`: stuck, 16 steps.
- First divergence: step 3, both `locked-candidates`, same candidate state, different effect.

- [x] Step 2: Write a failing restored-state test

Add a test using the `winnerProbe.probeGrid` and `candidateHashBefore` from `divergence-probe.json`.

Expected `locked-candidates` action from original `sonnet46`, now treated as required included deductions rather than an exclusive exact step:

```ts
expect(step?.eliminations).toEqual(expect.arrayContaining([
  { cell: 54, digit: 5 },
  { cell: 63, digit: 5 },
  { cell: 72, digit: 5 },
]));
```

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "36186"
```

Expected RED:

- Current repaired branch returns `{ cell: 13, digit: 2 }` and `{ cell: 22, digit: 2 }` instead.

- [x] Step 3: Write a full-puzzle regression test

Add a test that solves puzzle #36186 with `STRATEGIES`, asserts `outcome === 'solved'`, and verifies `checkTraceSoundness(...).sound === true`.

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "36186"
```

Expected RED:

- Current repaired branch gets stuck.

- [x] Step 4: Fix `locked-candidates` selection root cause

Root cause confirmed:

- The current global lowest-digit ranking fixed #78760/#103170 but changed the solve path by choosing one action and discarding other sound same-phase locked-candidates deductions.
- The generic fix is not another ranking rule. It returns all pointing deductions from the current candidate state, or all claiming deductions if no pointing deduction exists. This removes the single-action path dependency for `locked-candidates`.
- #36186 also exposed a later forcing-chain path dependency after the locked-candidates fix. The generic follow-up combines available graph-forcing and bounded-contradiction deductions, and falls back to the legacy naked-single forcing subset when neither newer forcing path produces a step.

The final implementation avoids any puzzle-specific guard.

- [x] Step 5: Verify regression fix

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "locked-candidates|36186"
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/diabolical-regressions.test.ts
npm run typecheck
```

Expected GREEN:

- #36186 solved and sound.
- #78760 and #103170 locked-candidates regressions remain green.

- [x] Step 6: Commit

```bash
git add packages/engine/src/strategies/locked-candidates.ts packages/engine/src/strategies/forcing-chain.ts packages/engine/test/diabolical-regressions.test.ts
git commit -m "fix: resolve diabolical regression path dependency"
```

## Phase 2: Finish Model-Solvable Remaining Cases

Status: completed on `analysis/sonnet46-strategy-fix` in commit `1c18734`.

Implementation summary:

- Fresh traces for #38116 and #77633 initially showed same-state `locked-candidates` different-effect divergences, but candidate-hash alignment proved these were only step-batching differences: the fixed branch applied deductions in one `locked-candidates` step that `gemini35flash` applied as consecutive steps.
- The first true same-candidate-state divergences were later ALS/AIC-family path differences. #38116 needed ALS coverage for the winner ALS eliminations `{ cell: 53, digit: 3 }` and `{ cell: 9, digit: 4 }`; #77633 needed the larger winner ALS elimination set that includes cells 38, 46, 47, 42, and 44.
- Added restored-state ALS regression coverage and full-puzzle solved/sound coverage for #38116 and #77633 in `packages/engine/test/diabolical-regressions.test.ts`.
- Fixed `packages/engine/src/strategies/als.ts` generically by tracking the originating ALS house, implementing doubly-linked ALS-XZ elimination, and combining deductions from ALS-XZ, ALS-XY-Wing, and Death Blossom instead of returning the first ALS-family hit.
- No puzzle-specific guard or literal case handling was added to implementation code.

Verification run from `/Users/sakura/LLM_Work/sudoku-trace-wt`:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "38116|77633"
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts
npm test
npm run typecheck
git diff --check
```

Observed result:

- Targeted #38116/#77633 regression run: passed, 6 tests passed / 10 skipped.
- `diabolical-regressions.test.ts`: 16 tests passed.
- Strategy regression run: 2 test files passed, 84 tests passed.
- Full suite: 8 test files passed, 121 tests passed.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

### Task 2: Re-analyze #38116 and #77633 Against `gemini35flash`

**Files:**

- Evidence output: `orchestration/reports/analysis/remaining-gemini-38116/`
- Evidence output: `orchestration/reports/analysis/remaining-gemini-77633/`
- Implementation files:
- `packages/engine/src/strategies/als.ts`
- `packages/engine/test/diabolical-regressions.test.ts`

- [x] Step 1: Generate fresh traces after regression fix

Run from `orchestration`:

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

Use the puzzle strings from updated `results.json`, not direct corpus array lookup.

- [x] Step 2: Classify first divergence

For each case, record:

- `candidateHashesMatchAtDivergence`
- first divergence strategy IDs
- winner and fixed strategy action from `divergence-probe.json`
- whether the fixed branch has a valid rescue strategy from the same restored candidate state

Fresh trace classification:

- Both cases had matching candidate hashes at the apparent `locked-candidates` divergence. Trace alignment showed that these were batching differences, not the root cause.
- #38116 first true same-state divergence: `als` chose `{ cell: 29, digit: 5 }` while `gemini35flash` chose ALS eliminations including `{ cell: 53, digit: 3 }` and `{ cell: 9, digit: 4 }`.
- #77633 first true same-state divergence after aligned prefix: current `aic` produced `{ cell: 39, digit: 7 }` while the winning path used ALS eliminations including `{ cell: 38, digit: 3 }`, `{ cell: 46, digit: 3 }`, `{ cell: 47, digit: 3 }`, `{ cell: 38, digit: 7 }`, `{ cell: 42, digit: 3 }`, `{ cell: 44, digit: 3 }`, `{ cell: 44, digit: 4 }`, `{ cell: 42, digit: 9 }`, and `{ cell: 44, digit: 9 }`.

- [x] Step 3: Write one failing test per confirmed root cause

Only write tests for the immediate first divergence, not the later stuck grid symptom.

Expected test locations:

- Restored-state tests in `packages/engine/test/diabolical-regressions.test.ts`
- Full-puzzle tests only after a restored-state fix passes and the full solve still needs path validation

Added restored-state ALS tests for #38116 and #77633, plus full-puzzle solved/sound tests for both cases.

- [x] Step 4: Implement minimal strategy fix

Keep changes narrow. If #38116/#77633 still point to AIC, fix AIC ordering/coverage. If they now point to `locked-candidates`, fix selection policy before touching AIC.

The root cause resolved in ALS, not AIC or `locked-candidates`. The generic fix adds doubly-linked ALS-XZ and combines ALS-family deductions.

- [x] Step 5: Verify and commit

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts
npm run typecheck
```

Commit each independent strategy fix separately.

Committed on `analysis/sonnet46-strategy-fix`:

```bash
git commit -m "fix: resolve remaining gemini diabolical ALS paths"
```

Commit: `1c18734`.

## Phase 3: Full-Corpus Checkpoint

Status: completed on `orchestration` after rerunning `analysis/sonnet46-strategy-fix` at commit `1c18734`.

Implementation summary:

- Verified Phase 1/2 repairs from a detached target-branch worktree before updating aggregate data.
- Reran the repaired ref across the full OpenSudoku corpus.
- Confirmed no new failures were introduced relative to the previous `analysis-sonnet46-strategy-fix` archive entry.
- Replaced only the `analysis-sonnet46-strategy-fix` entry in `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`.
- Re-ran archive overlap analysis against `sonnet46`, `gpt55`, `gemini35flash`, `opus48`, `gpt53codex`, and `deepseekv4`; no remaining target failure is solved by any compared archive branch.

Verification run from `/Users/sakura/LLM_Work/sudoku-phase3-verify-wt`:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "36186|38116|77633"
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm test
npm run typecheck
git diff --check
```

Observed result:

- Targeted #36186/#38116/#77633 run: 8 tests passed / 8 skipped.
- `diabolical-regressions.test.ts`: 16 tests passed.
- Full suite: 8 test files passed, 121 tests passed.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

Full-corpus checkpoint result:

| Difficulty | Solved | Valid solved | Stuck | Errors |
| --- | ---: | ---: | ---: | ---: |
| easy | 100000/100000 | 100000 | 0 | 0 |
| medium | 352643/352643 | 352643 | 0 | 0 |
| hard | 321592/321592 | 321592 | 0 | 0 |
| diabolical | 118954/119681 | 118954 | 727 | 0 |
| total | 893189/893916 | 893189 | 727 | 0 |

Resolved from the previous 731-failure checkpoint:

| Diabolical case | Previous archive overlap | Status after Phase 3 rerun |
| ---: | --- | --- |
| 4546 | Failed by all compared archive results | solved, sound |
| 36186 | Solved by `sonnet46` | solved, sound |
| 38116 | Solved by `gemini35flash` | solved, sound |
| 77633 | Solved by `gemini35flash` | solved, sound |

Regression gate:

- New failures relative to the previous `analysis-sonnet46-strategy-fix` archive entry: 0 across all difficulties.
- Invalid solved grids: 0.
- Errors: 0.
- Remaining cases solved by any compared archive branch: 0.

### Task 3: Rerun Full Corpus After Regression/Difference Fixes

**Files:**

- Update: `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- Update: `orchestration/analysis/fixed-remaining-diabolical-root-cause-notes.md`
- Update: `orchestration/analysis/sonnet46-strategy-fix-results.md`

- [x] Step 1: Rerun full corpus for repaired ref

```bash
node orchestration/run-archive-full-corpus.mjs \
  --ref analysis/sonnet46-strategy-fix \
  --name analysis-sonnet46-strategy-fix \
  --out-dir orchestration/reports/full-corpus/analysis-sonnet46-strategy-fix-rerun \
  --workers 12
```

- [x] Step 2: Update existing full-corpus archive in place

Replace only the `analysis-sonnet46-strategy-fix` entry inside:

- `20260602-064418/results.json`
- `20260602-064418/results.partial.json`
- `20260602-064418/summary.md`

- [x] Step 3: Verify archive contents

```bash
tar -xOf orchestration/run-logs/full-corpus-20260602-064418.tar.gz 20260602-064418/results.json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const p=JSON.parse(s); const r=p.results.find(x=>x.name==="analysis-sonnet46-strategy-fix"); console.log(r.report.diabolical.solved, r.report.diabolical.failures.length);})'
```

- [ ] Step 4: Commit orchestration updates

```bash
git add orchestration/run-logs/full-corpus-20260602-064418.tar.gz orchestration/analysis/*.md
git commit -m "docs: update remaining diabolical regression results"
```

## Phase 4: New Strategy Expansion Cycle

Only start this after Phase 1 and Phase 2 are complete and the repaired branch has no known regression against the compared archive set.

Before adding new strategy capability, complete or explicitly defer `orchestration/analysis/human-strategy-taxonomy-refactor-plan.md`. Future strategy expansion should preserve human-learning-friendly taxonomy: specific technique IDs, ordering by human recognition cost, and one concrete pattern instance per default tutoring step.

### Task 4: Build a 700-Case Feature Analysis Pack

**Goal:** Classify the remaining shared failures by missing strategy family before writing new code.

- [ ] Step 1: Extract all remaining failures solved by no compared model.
- [ ] Step 2: For each stuck final grid, record blank count, candidate masks, last 20 strategy IDs, and available strategy probes.
- [ ] Step 3: Compute feature counts for likely families:
- AIC loops and grouped endpoints
- XY-chain/Y-chain candidate graph paths
- ALS-XZ/ALS-XY/ALS chains
- finned and sashimi fish
- X-Cycles and multi-coloring
- UR Type 2/3/4/6 and BUG+1
- [ ] Step 4: Cluster cases by first available missing-family signal.
- [ ] Step 5: Pick the highest-yield family for TDD implementation.

### Task 5: Run a New Model Comparison Round

Use this only after clustering suggests candidate families. The goal is not to rank models again, but to generate independent strategy hypotheses for the same representative stuck states.

Recommended setup:

- Keep `foundation` unchanged unless requirements need clarification.
- Create a new analysis prompt focused on explaining one stuck state and proposing human-solvable strategies.
- Run 2-4 strong models on the same clustered representatives.
- Compare proposed strategy families against local research notes under `research/sudoku-human-solving/local-library/`.
- Promote only strategies that are explainable, sound, and testable under the current engine contract.

## Stop Conditions

- Stop if a fix lowers full-corpus solved count or introduces any invalid solved grid.
- Stop after three failed attempts to tune the same strategy selection policy; reconsider architecture rather than layering more tie-break rules.
- Do not add backtracking, template enumeration, or unrestricted forcing nets under a human-strategy label.
