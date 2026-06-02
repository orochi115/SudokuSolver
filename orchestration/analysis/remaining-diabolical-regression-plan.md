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

Current full-corpus result for `analysis-sonnet46-strategy-fix`:

| Difficulty | Solved | Stuck | Errors |
| --- | ---: | ---: | ---: |
| easy | 100000/100000 | 0 | 0 |
| medium | 352643/352643 | 0 | 0 |
| hard | 321592/321592 | 0 | 0 |
| diabolical | 118950/119681 | 731 | 0 |
| total | 893185/893916 | 731 | 0 |

Remaining overlap among the 731 diabolical failures:

| Group | Count | Notes |
| --- | ---: | --- |
| Failed by all compared archive results | 728 | Requires new strategy capability or stronger variants. |
| Solved by `gemini35flash` | 2 | Original Phase 3 cases #38116 and #77633 remain failed in full solve path. |
| Solved by original `sonnet46` | 1 | Regression #36186 introduced by repair branch. |

Important indexing rule:

- Full-corpus failure `index` values are 1-based in `results.json`.
- Do not index directly into `parseOpenSudoku(...)[index]`; use archive failure objects or subtract 1 when reading the puzzle corpus directly.

## Phase 1: Fix Regression Before New Strategy Work

### Task 1: Reproduce and Lock Down Regression #36186

**Files:**

- Modify: `packages/engine/test/diabolical-regressions.test.ts`
- Candidate implementation file: `packages/engine/src/strategies/locked-candidates.ts`
- Evidence: `orchestration/reports/analysis/regression-sonnet46-case-36186/`

- [ ] Step 1: Confirm trace evidence from `orchestration`

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

- [ ] Step 2: Write a failing restored-state test

Add a test using the `winnerProbe.probeGrid` and `candidateHashBefore` from `divergence-probe.json`.

Expected `locked-candidates` action from original `sonnet46`:

```ts
expect(step?.eliminations).toEqual([
  { cell: 54, digit: 5 },
  { cell: 63, digit: 5 },
  { cell: 72, digit: 5 },
]);
```

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "36186"
```

Expected RED:

- Current repaired branch returns `{ cell: 13, digit: 2 }` and `{ cell: 22, digit: 2 }` instead.

- [ ] Step 3: Write a full-puzzle regression test

Add a test that solves puzzle #36186 with `STRATEGIES`, asserts `outcome === 'solved'`, and verifies `checkTraceSoundness(...).sound === true`.

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "36186"
```

Expected RED:

- Current repaired branch gets stuck.

- [ ] Step 4: Fix `locked-candidates` selection root cause

Hypothesis to test first:

- The current global lowest-digit ranking fixed #78760/#103170 but can choose a lower digit action that blocks old `sonnet46` solve paths.
- A safer policy likely needs local category ordering or a quality score that preserves original scan-order when a later low-digit action is not known to be stronger.

Do not blindly revert `locked-candidates`; preserve tests for #78760 and #103170.

- [ ] Step 5: Verify regression fix

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "locked-candidates|36186"
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/diabolical-regressions.test.ts
npm run typecheck
```

Expected GREEN:

- #36186 solved and sound.
- #78760 and #103170 locked-candidates regressions remain green.

- [ ] Step 6: Commit

```bash
git add packages/engine/src/strategies/locked-candidates.ts packages/engine/test/diabolical-regressions.test.ts
git commit -m "fix: resolve locked-candidates regression"
```

## Phase 2: Finish Model-Solvable Remaining Cases

### Task 2: Re-analyze #38116 and #77633 Against `gemini35flash`

**Files:**

- Evidence output: `orchestration/reports/analysis/remaining-gemini-comparison/`
- Likely implementation files:
- `packages/engine/src/strategies/aic.ts`
- `packages/engine/src/chain/aic-search.ts`
- `packages/engine/src/strategies/locked-candidates.ts`

- [ ] Step 1: Generate fresh traces after regression fix

Run from `orchestration`:

```bash
node orchestration/trace-archive-case.mjs \
  --puzzle <diabolical-38116-puzzle-from-results-json> \
  --models gemini35flash,sonnet46-fixed \
  --refs gemini35flash=archive/final/gemini35flash,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/remaining-gemini-38116

node orchestration/trace-archive-case.mjs \
  --puzzle <diabolical-77633-puzzle-from-results-json> \
  --models gemini35flash,sonnet46-fixed \
  --refs gemini35flash=archive/final/gemini35flash,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/remaining-gemini-77633
```

Use the puzzle strings from updated `results.json`, not direct corpus array lookup.

- [ ] Step 2: Classify first divergence

For each case, record:

- `candidateHashesMatchAtDivergence`
- first divergence strategy IDs
- winner and fixed strategy action from `divergence-probe.json`
- whether the fixed branch has a valid rescue strategy from the same restored candidate state

- [ ] Step 3: Write one failing test per confirmed root cause

Only write tests for the immediate first divergence, not the later stuck grid symptom.

Expected test locations:

- Restored-state tests in `packages/engine/test/diabolical-regressions.test.ts`
- Full-puzzle tests only after a restored-state fix passes and the full solve still needs path validation

- [ ] Step 4: Implement minimal strategy fix

Keep changes narrow. If #38116/#77633 still point to AIC, fix AIC ordering/coverage. If they now point to `locked-candidates`, fix selection policy before touching AIC.

- [ ] Step 5: Verify and commit

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts
npm run typecheck
```

Commit each independent strategy fix separately.

## Phase 3: Full-Corpus Checkpoint

### Task 3: Rerun Full Corpus After Regression/Difference Fixes

**Files:**

- Update: `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- Update: `orchestration/analysis/fixed-remaining-diabolical-root-cause-notes.md`
- Update: `orchestration/analysis/sonnet46-strategy-fix-results.md`

- [ ] Step 1: Rerun full corpus for repaired ref

```bash
node orchestration/run-archive-full-corpus.mjs \
  --ref analysis/sonnet46-strategy-fix \
  --name analysis-sonnet46-strategy-fix \
  --out-dir orchestration/reports/full-corpus/analysis-sonnet46-strategy-fix-rerun \
  --workers 12
```

- [ ] Step 2: Update existing full-corpus archive in place

Replace only the `analysis-sonnet46-strategy-fix` entry inside:

- `20260602-064418/results.json`
- `20260602-064418/results.partial.json`
- `20260602-064418/summary.md`

- [ ] Step 3: Verify archive contents

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
