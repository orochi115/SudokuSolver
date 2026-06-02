# Opus Sonnet Trace Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only analysis workflow that compares `opus48` and `sonnet46` on mutually failed/succeeded full-corpus cases, starting with the 4 hard cases where `sonnet46` failed and `opus48` succeeded.

**Architecture:** Add orchestration-only analysis scripts that read the archived full-corpus result bundle, create temporary worktrees from `archive/final/<model>`, run solver traces with a canonical strategy order, and emit Markdown/JSON reports. Do not edit archived model branches directly; any investigation that needs model-code edits must create a new branch/worktree derived from the archive snapshot.

**Tech Stack:** Node.js ESM (`.mjs`), `tsx` for executing TypeScript inside archive worktrees, Git worktrees, Git LFS archived result bundle, Node built-in `node:test`.

---

## Scope And Safety Rules

This work is analysis-only. The scripts may inspect `archive/final/opus48` and `archive/final/sonnet46`, but must not modify those branches or their commits.

If a later investigation needs to edit a model implementation, create a new branch first, for example:

```bash
git branch analysis/sonnet46-hard-52302 archive/final/sonnet46
git worktree add ../sudoku-analysis-sonnet46-hard-52302 analysis/sonnet46-hard-52302
```

Never commit changes to `archive/final/*`, never rename archive branches, and never run `git reset --hard` or checkout over user work. Temporary worktrees created by scripts must be removed or clearly documented if `--keep-worktrees` is used.

## Existing Inputs

- Full-corpus archive: `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
- Full-corpus result inside archive: `20260602-064418/results.json`
- Existing runner pattern: `orchestration/run-archive-full-corpus.mjs`
- Target archive branches: `archive/final/opus48`, `archive/final/sonnet46`
- Known sonnet-hard failures where opus succeeds:
  - hard #52302: `000010000053204960600050002000000000000908000039020480800030004046000310005401800`
  - hard #114282: `900000006004907800070000050100000009007106500005080200000302000010509030300010005`
  - hard #272709: `009400010200005700060020009020050001003204800600090050300080020002300004080002100`
  - hard #305612: `300200008000008300061059400048000001003000500600000840009730610006100000100006003`

## File Structure

- Create: `orchestration/analyze-full-corpus-results.mjs`
  - Reads `full-corpus-20260602-064418.tar.gz`.
  - Summarizes overlap and complement cases between models.
  - Emits machine-readable JSON and human-readable Markdown.

- Create: `orchestration/analyze-full-corpus-results.test.mjs`
  - Unit tests for overlap calculations using small in-memory fixtures.
  - Tests no real archive branches are required.

- Create: `orchestration/trace-archive-case.mjs`
  - Runs one puzzle against selected archive model branches.
  - Uses canonical `strategyId` order.
  - Produces canonical trace, per-strategy saturation report, stuck-grid rescue report, and first divergence summary.

- Create: `orchestration/trace-archive-case.test.mjs`
  - Unit tests for pure trace comparison helpers, not archive execution.
  - Tests canonical ordering, step normalization, first divergence detection, and fixed-point summary comparison.

- Create output at runtime only: `orchestration/reports/analysis/opus-sonnet-<timestamp>/`
  - Ignored by existing `orchestration/reports/.gitignore`.
  - Contains `summary.md`, `cases.json`, per-case trace files, and optional `worktrees.json` if retained.

- Optional later docs update: `orchestration/report-final.md`
  - Only after analysis is complete and verified.
  - Add a concise interpretation section, not raw trace dumps.

## Canonical Strategy Order

Use this order for both models, independent of each branch's local `STRATEGIES` registration order:

```text
full-house
naked-single
hidden-single
locked-candidates
naked-subset
hidden-subset
basic-fish
single-digit-patterns
xy-wing
xyz-wing
w-wing
simple-coloring
aic
als
uniqueness
sue-de-coq
forcing-chain
```

Implementation detail: inside each archive worktree, build a map from `STRATEGIES` by `id`, then create `orderedStrategies = canonicalIds.map(id => map.get(id)).filter(Boolean)`. The script must report any missing canonical IDs for each model.

For runner execution inside detached archive worktrees, reuse the existing `orchestration/run-archive-full-corpus.mjs` pattern: prepend the main repository `node_modules/.bin` to `PATH` before invoking `npx tsx`. Do not rely on archive worktrees having their own installed dependencies.

## Analysis Modes

### Mode A: Canonical Solver Trace

Run the normal solver loop, but with canonical strategy order. At each step, record:

- `stepIndex`
- `strategyId`
- `beforeGrid`
- `placements`
- `eliminations`
- `afterGrid`
- `explanation.en`
- `explanation.zh`

Then compare the two model traces to find the first divergence:

- Different `strategyId`
- Same `strategyId` but different placements/eliminations
- Same action but different final grid
- One model stuck while the other still has steps
- Both stuck or both solved with identical trace prefix

### Mode B: Per-Strategy Saturation Probe

For the same initial grid, process canonical strategies one at a time. For a single `strategyId`, repeatedly apply that strategy until it produces no new step, then move to the next strategy.

For each strategy, record:

- `strategyId`
- `steps`
- `placements`
- `eliminations`
- `beforeGrid`
- `afterGrid`
- `beforeCandidateHash`
- `afterCandidateHash`
- `changedCells`
- `changedCandidates` if cheaply available; otherwise omit initially

Compare opus and sonnet after each strategy fixed point. The first strategy whose fixed-point grid or candidate hash differs is the primary suspect for implementation coverage or tie-break differences. If candidate hash serialization is deferred, explicitly mark the result as grid-only and state that candidate-state divergence may be hidden.

### Mode C: Stuck-Grid Rescue Probe

For a loser model's stuck final grid:

- Load the stuck grid in the winner archive worktree.
- Scan winner strategies in canonical order.
- Record the first strategy that can produce a step.
- Also scan loser strategies in canonical order to confirm no step exists.

Interpretation:

- Winner can rescue loser stuck grid: loser likely has missing detection in the rescue strategy or earlier candidate state representation differs.
- Winner cannot rescue loser stuck grid: the decisive difference likely happened earlier in the path.

## Classification Labels

Each case should receive one primary label:

- `missing-detection`: winner can advance from loser stuck grid with a specific strategy.
- `same-strategy-different-effect`: first divergence uses the same `strategyId` but different placements/eliminations.
- `different-strategy-selection`: first divergence uses different `strategyId` under canonical ordering.
- `early-path-dependency`: winner cannot rescue loser stuck grid; first divergence must be inspected earlier.
- `invalid-solved-risk`: solved trace fails final grid validation.
- `inconclusive`: trace data is insufficient or branch execution fails.

## Plan Status

Current location: keep this document at `docs/superpowers/plans/2026-06-02-opus-sonnet-trace-analysis.md`. This is the expected Superpowers plan directory and existing commits/reference paths already point here; moving it now would add churn without improving execution.

Phase 1 is complete on `orchestration` through commit `daaf03e`:

- Completed Task 1: `39033de Add full-corpus overlap analysis`
- Completed Task 2: `e571c25 Add archive trace case analyzer`, plus hardening/follow-up commits `b3ca755`, `24d6106`
- Completed Task 3: `306dd5b Add per-strategy saturation analysis`
- Completed Task 4: `cbbc6a3 Add stuck-grid rescue analysis`, plus correctness commits `3de02b5`, `909be4c`
- Completed Task 5: `5e80766 Add opus-sonnet batch case analysis`, plus archived-puzzle fix `3b8cf30`
- Completed Task 6: `d26bb73 Analyze opus and sonnet hard failures`, plus packaged artifact commit `daaf03e`

Phase 1 result summary:

- The 4 hard cases where `sonnet46` failed and `opus48` succeeded are `52302`, `114282`, `272709`, and `305612`.
- `aic` is the strongest suspect: first trace/saturation divergence in hard #52302, #114282, and #305612.
- `single-digit-patterns` is the strongest suspect for hard #272709.
- Stuck-grid rescue is `inconclusive` for all 4 cases because rescue reconstructs candidates from grid values only; both models can find `locked-candidates` in that reconstructed state.
- Detailed Phase 1 artifacts are packaged at `orchestration/run-logs/opus-sonnet-hard-analysis-20260602.tar.gz`.

## Task 1: Add Full-Corpus Overlap Analysis (Completed)

**Files:**
- Create: `orchestration/analyze-full-corpus-results.mjs`
- Create: `orchestration/analyze-full-corpus-results.test.mjs`

- [x] **Step 1: Write failing tests for overlap helpers**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFailureIndex, compareFailureOverlap } from './analyze-full-corpus-results.mjs';

test('compareFailureOverlap identifies loser failures solved by winner', () => {
  const results = [
    { name: 'opus48', report: { hard: { failures: [{ index: 1 }, { index: 3 }] } } },
    { name: 'sonnet46', report: { hard: { failures: [{ index: 2 }, { index: 3 }] } } },
  ];
  const index = buildFailureIndex(results, 'hard');
  assert.deepEqual(compareFailureOverlap(index, 'sonnet46', 'opus48'), {
    loser: 'sonnet46',
    winner: 'opus48',
    loserFailures: 2,
    bothFailed: [3],
    winnerSolvedLoserFailed: [2],
  });
});
```

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test orchestration/analyze-full-corpus-results.test.mjs`

Expected: FAIL because `analyze-full-corpus-results.mjs` does not exist or exports are missing.

- [x] **Step 3: Implement minimal overlap helpers**

Implement pure functions first:

```js
export function buildFailureIndex(results, difficulty) {
  return Object.fromEntries(
    results.map((r) => [r.name, new Map((r.report[difficulty]?.failures ?? []).map((f) => [f.index, f]))]),
  );
}

export function compareFailureOverlap(index, loserName, winnerName) {
  const loser = index[loserName] ?? new Map();
  const winner = index[winnerName] ?? new Map();
  const bothFailed = [];
  const winnerSolvedLoserFailed = [];
  for (const idx of [...loser.keys()].sort((a, b) => a - b)) {
    if (winner.has(idx)) bothFailed.push(idx);
    else winnerSolvedLoserFailed.push(idx);
  }
  return { loser: loserName, winner: winnerName, loserFailures: loser.size, bothFailed, winnerSolvedLoserFailed };
}
```

- [x] **Step 4: Add CLI archive reader**

The CLI should accept:

```bash
node orchestration/analyze-full-corpus-results.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-$(date +%Y%m%d-%H%M%S)
```

Use `spawnSync('tar', ['-xOf', archive, '20260602-064418/results.json'], { maxBuffer: ... })` or stream extraction if buffer size becomes a problem. The current result JSON is large, so prefer streaming or set `maxBuffer` to at least `200 * 1024 * 1024`.

- [x] **Step 5: Verify against current archive**

Run:

```bash
node orchestration/analyze-full-corpus-results.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-smoke
```

Expected summary must include:

```text
hard sonnet46 failures: 4
hard opus48 solved sonnet46 failures: 4
diabolical sonnet46 failures: 1258
diabolical opus48 solved sonnet46 failures: 86
```

Note: `86` is opus-solved among all sonnet diabolical failures, including cases also solved by other models. `72` is opus-only.

- [x] **Step 6: Commit**

```bash
git add orchestration/analyze-full-corpus-results.mjs orchestration/analyze-full-corpus-results.test.mjs
git commit -m "Add full-corpus overlap analysis"
```

## Task 2: Add Canonical Trace Runner For One Case (Completed)

**Files:**
- Create: `orchestration/trace-archive-case.mjs`
- Create: `orchestration/trace-archive-case.test.mjs`

- [x] **Step 1: Write failing tests for trace comparison helpers**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAction, firstDivergence } from './trace-archive-case.mjs';

test('firstDivergence detects same strategy with different eliminations', () => {
  const a = [{ strategyId: 'aic', placements: [], eliminations: [{ cell: 1, digit: 2 }] }];
  const b = [{ strategyId: 'aic', placements: [], eliminations: [{ cell: 1, digit: 3 }] }];
  assert.deepEqual(firstDivergence(a, b), {
    stepIndex: 0,
    kind: 'same-strategy-different-effect',
    leftStrategyId: 'aic',
    rightStrategyId: 'aic',
  });
});

test('normalizeAction sorts placements and eliminations for stable comparison', () => {
  assert.deepEqual(normalizeAction({ placements: [{ cell: 2, digit: 1 }, { cell: 1, digit: 9 }], eliminations: [] }), {
    placements: [{ cell: 1, digit: 9 }, { cell: 2, digit: 1 }],
    eliminations: [],
  });
});
```

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because the script or exports do not exist.

- [x] **Step 3: Implement pure comparison helpers**

Export at least:

- `normalizeAction(step)`
- `sameAction(left, right)`
- `firstDivergence(leftSteps, rightSteps)`
- `canonicalOrder()`

Keep these independent of git worktrees so they are easy to test.

- [x] **Step 4: Implement archive worktree runner**

The CLI should accept either puzzle string or difficulty/index:

```bash
node orchestration/trace-archive-case.mjs \
  --difficulty hard \
  --index 52302 \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-hard-52302
```

Implementation requirements:

- Resolve puzzle by reading `puzzles/<difficulty>.opensudoku` from the main repo.
- Create temporary worktrees under `../sudoku-trace-wt/<timestamp>/<model>`.
- Checkout with `git worktree add --detach <path> archive/final/<model>`.
- Copy a generated `.trace-case-runner.ts` into each worktree.
- Run with `npx tsx .trace-case-runner.ts`.
- Run with `PATH=<main-repo>/node_modules/.bin:$PATH` so `tsx` resolves from the main workspace.
- Remove worktrees in `finally` unless `--keep-worktrees` is set.

- [x] **Step 5: Inside the generated runner, implement canonical trace**

The runner should:

```ts
import { Grid, STRATEGIES } from './packages/engine/src/index.js';

function applyStep(grid, step) {
  for (const p of step.placements) grid.place(p.cell, p.digit);
  for (const e of step.eliminations) grid.eliminate(e.cell, e.digit);
}

const canonicalIds = [...];
const byId = new Map(STRATEGIES.map((s) => [s.id, s]));
const ordered = canonicalIds.map((id) => byId.get(id)).filter(Boolean);
const grid = Grid.fromString(process.env.PUZZLE!);
const steps = [];

while (!grid.isSolved() && steps.length < 1000) {
  let found = null;
  for (const strategy of ordered) {
    const step = strategy.apply(grid);
    if (step && (step.placements.length || step.eliminations.length)) {
      found = step;
      break;
    }
  }
  if (!found) break;
  const beforeGrid = grid.toString();
  applyStep(grid, found);
  steps.push({ beforeGrid, afterGrid: grid.toString(), ...found });
}
```

Use the local `applyStep` helper unconditionally. Do not statically import `applyStep` from archive branches, because older snapshots may not export it and the module would fail before fallback logic can run. Do not modify the branch.

- [x] **Step 6: Verify one known case**

Run:

```bash
node orchestration/trace-archive-case.mjs \
  --difficulty hard \
  --index 52302 \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-hard-52302
```

Expected:

- `summary.md` says opus solved and sonnet stuck.
- `trace-opus48.json` exists.
- `trace-sonnet46.json` exists.
- `comparison.json` has a `firstDivergence` object.

- [x] **Step 7: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add archive trace case analyzer"
```

## Task 3: Add Per-Strategy Saturation Probe (Completed)

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [x] **Step 1: Write failing tests for saturation comparison**

```js
import { firstDifferentFixedPoint } from './trace-archive-case.mjs';

test('firstDifferentFixedPoint finds first strategy whose afterGrid differs', () => {
  const left = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'left' }];
  const right = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'right' }];
  assert.deepEqual(firstDifferentFixedPoint(left, right), { strategyId: 'b', index: 1 });
});
```

- [x] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `firstDifferentFixedPoint` is missing.

- [x] **Step 3: Implement saturation mode in runner**

For each canonical strategy:

```ts
function candidateHash(grid) {
  return Array.from(grid.candidates ?? []).join(',');
}

for (const strategy of ordered) {
  const beforeGrid = grid.toString();
  const beforeCandidateHash = candidateHash(grid);
  let steps = 0;
  let placements = 0;
  let eliminations = 0;
  while (!grid.isSolved() && steps < 1000) {
    const step = strategy.apply(grid);
    if (!step || (!step.placements.length && !step.eliminations.length)) break;
    applyStep(grid, step);
    steps++;
    placements += step.placements.length;
    eliminations += step.eliminations.length;
  }
  saturation.push({
    strategyId: strategy.id,
    beforeGrid,
    afterGrid: grid.toString(),
    beforeCandidateHash,
    afterCandidateHash: candidateHash(grid),
    steps,
    placements,
    eliminations,
  });
}
```

This is intentionally different from the normal solver loop. It measures each strategy's fixed-point reach under canonical order.

- [x] **Step 4: Add output files**

For each model:

- `saturation-<model>.json`

For comparison:

- `saturation-comparison.json`
- Include `firstDifferentFixedPoint`.

- [x] **Step 5: Verify on hard #52302**

Run the same command as Task 2.

Expected:

- `saturation-opus48.json` exists.
- `saturation-sonnet46.json` exists.
- `saturation-comparison.json` contains either a first differing strategy or states that fixed points match.

- [x] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add per-strategy saturation analysis"
```

## Task 4: Add Stuck-Grid Rescue Probe (Completed)

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [x] **Step 1: Write failing tests for rescue classification**

```js
import { classifyCase } from './trace-archive-case.mjs';

test('classifyCase marks missing detection when winner rescues loser stuck grid', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: 'aic', firstDivergence: { kind: 'one-stuck' } }), 'missing-detection');
});

test('classifyCase marks early path dependency when rescue is impossible', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: null, firstDivergence: { kind: 'different-strategy-selection' } }), 'early-path-dependency');
});
```

- [x] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `classifyCase` is missing.

- [x] **Step 3: Implement rescue runner mode**

When one model is stuck and the other solved:

- Take loser final grid.
- In winner worktree, scan canonical strategies once against loser grid.
- In loser worktree, scan canonical strategies once against loser grid.
- Save first found step for each, including `strategyId`, placements, eliminations, explanation, and before/after grid if applied.

Important: A grid string alone does not preserve candidate eliminations. The current `Grid.fromString()` recomputes candidates from placements only. Record this limitation in the output:

```json
"limitation": "rescue probe reconstructs candidates from grid values only; prior candidate eliminations are not preserved"
```

This limitation matters because many advanced strategies depend on candidate state. If needed later, add candidate-state serialization to the trace runner, but do not do it in this task.

- [x] **Step 4: Add output files**

- `rescue-comparison.json`
- Include `winnerRescueStrategyId`, `loserRescueStrategyId`, and `classification`.

- [x] **Step 5: Verify on hard #52302**

Expected:

- `rescue-comparison.json` exists.
- It contains the limitation string.
- It contains `classification`.

- [x] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add stuck-grid rescue analysis"
```

## Task 5: Batch Analyze Sonnet Hard Failures (Completed)

**Files:**
- Create: `orchestration/analyze-opus-sonnet-cases.mjs`
- Create: `orchestration/analyze-opus-sonnet-cases.test.mjs`

- [x] **Step 1: Write failing tests for case selection**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectMutualComparisonCases } from './analyze-opus-sonnet-cases.mjs';

test('selectMutualComparisonCases finds loser failures solved by winner', () => {
  const cases = selectMutualComparisonCases({
    loserFailures: [1, 2],
    winnerFailures: [2, 3],
  });
  assert.deepEqual(cases, [1]);
});
```

- [x] **Step 2: Run and verify failure**

Run: `node --test orchestration/analyze-opus-sonnet-cases.test.mjs`

Expected: FAIL because the script or export does not exist.

- [x] **Step 3: Implement batch selector**

Default behavior:

```bash
node orchestration/analyze-opus-sonnet-cases.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --difficulty hard \
  --loser sonnet46 \
  --winner opus48 \
  --out orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures
```

Expected selected cases:

```text
52302
114282
272709
305612
```

- [x] **Step 4: Invoke trace analysis per case**

The batch script may either import shared logic from `trace-archive-case.mjs` or spawn it. Prefer importing pure helpers and spawning CLI for archive worktree isolation.

For each case, create:

```text
orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-52302/
```

- [x] **Step 5: Generate summary report**

Create:

- `summary.md`
- `summary.json`

`summary.md` must include:

- Case table with puzzle index and winner/loser.
- First divergence step and strategy.
- First different saturation fixed point.
- Rescue strategy, if any.
- Classification label.
- Link/path to detailed JSON files.

- [x] **Step 6: Verify batch output**

Run the batch command above.

Expected:

- Four case directories exist.
- `summary.md` lists all four hard indices.
- No archive branch is modified.
- `git worktree list --porcelain` shows no leftover trace worktrees unless `--keep-worktrees` was used.

Before and after the batch run, verify archive branch SHAs are unchanged:

```bash
git rev-parse archive/final/opus48 archive/final/sonnet46 > /tmp/archive-before.txt
# run analysis
git rev-parse archive/final/opus48 archive/final/sonnet46 > /tmp/archive-after.txt
diff -u /tmp/archive-before.txt /tmp/archive-after.txt
```

Expected: `diff` produces no output.

- [x] **Step 7: Commit**

```bash
git add orchestration/analyze-opus-sonnet-cases.mjs orchestration/analyze-opus-sonnet-cases.test.mjs
git commit -m "Add opus-sonnet batch case analysis"
```

## Task 6: Produce Human Analysis Report (Completed)

**Files:**
- Create: `orchestration/reports/archive/<timestamp>/opus-sonnet-hard-analysis.md` or another committable path outside ignored `orchestration/reports/` if it should be versioned directly.
- Optional: Create LFS tarball under `orchestration/run-logs/` for detailed JSON traces.

- [x] **Step 1: Decide storage format**

If detailed trace JSON is large, package it as LFS:

```bash
tar czf orchestration/run-logs/opus-sonnet-hard-analysis-<timestamp>.tar.gz \
  -C orchestration/reports/analysis opus-sonnet-hard-sonnet-failures
git add orchestration/run-logs/opus-sonnet-hard-analysis-<timestamp>.tar.gz
```

If the Markdown summary is small and valuable, commit it directly under a tracked path such as:

```text
orchestration/analysis/opus-sonnet-hard-analysis.md
```

- [x] **Step 2: Write interpretation**

The report should answer:

- Which of sonnet's 4 hard failures are solved by opus?
- For each case, where is the first canonical trace divergence?
- Which strategy fixed point first differs under saturation?
- Can opus rescue sonnet's stuck grid?
- What strategy IDs are most suspicious?
- Is this likely missing detection, same-strategy effect difference, or path dependency?

- [x] **Step 3: Add limitations**

Include these caveats explicitly:

- Reconstructed stuck-grid rescue loses candidate eliminations because current `Grid.fromString()` only encodes placements.
- Grid-only fixed-point comparison can miss divergence if two models reach the same placements with different candidate masks; use candidate hashes where available.
- Same `strategyId` does not guarantee identical theoretical coverage for strategy families such as `aic`, `als`, and `forcing-chain`.
- Different tie-breaks can produce different but still sound traces.
- This analysis identifies likely implementation gaps; it does not prove a strategy is mathematically complete.

- [x] **Step 4: Verify report references files that exist**

Run:

```bash
test -f orchestration/run-logs/full-corpus-20260602-064418.tar.gz
git diff --check
```

Expected: no output from `git diff --check`.

- [x] **Step 5: Commit**

```bash
git add <analysis markdown path> <optional LFS tarball>
git commit -m "Analyze opus and sonnet hard failures"
```

## Phase 2 Goal: Pinpoint Root Cause More Specifically

**Goal:** Determine whether `sonnet46` fails because of a concrete strategy implementation gap, candidate-state divergence, or tie-break/path dependency.

**Current hypothesis:** `aic` is the primary suspect for hard #52302, #114282, and #305612; `single-digit-patterns` is the primary suspect for hard #272709. The existing rescue probe is not enough because it reconstructs candidates from grid values only.

**Safety rule:** Keep all archive model snapshots read-only. Instrumentation that modifies model code must be done only in new branches derived from archive snapshots, for example `analysis/sonnet46-aic-debug` and `analysis/opus48-aic-debug`.

## Task 7: Add Candidate-State Trace Serialization

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [ ] **Step 1: Write failing tests for candidate serialization helpers**

Add pure helper tests that do not require archive worktrees:

```js
import { normalizeCandidateSnapshot, candidateSnapshotHash } from './trace-archive-case.mjs';

test('normalizeCandidateSnapshot sorts cell candidates deterministically', () => {
  assert.deepEqual(normalizeCandidateSnapshot([
    { cell: 2, candidates: [9, 1] },
    { cell: 1, candidates: [3, 2] },
  ]), [
    { cell: 1, candidates: [2, 3] },
    { cell: 2, candidates: [1, 9] },
  ]);
});

test('candidateSnapshotHash is stable for equivalent snapshots', () => {
  assert.equal(
    candidateSnapshotHash([{ cell: 1, candidates: [3, 2] }]),
    candidateSnapshotHash([{ cell: 1, candidates: [2, 3] }]),
  );
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `normalizeCandidateSnapshot` and `candidateSnapshotHash` are missing.

- [ ] **Step 3: Implement archive runner candidate snapshots**

In the generated `.trace-case-runner.ts`, add a local helper that serializes candidate state before and after every canonical trace step:

```ts
function candidateSnapshot(grid) {
  const raw = grid.candidates ?? [];
  return Array.from(raw).map((value, cell) => ({ cell, value: String(value) }));
}
```

If archive `Grid` exposes candidates as bitmasks rather than digit arrays, preserve the raw mask string. Do not infer semantics in this task; the goal is stable same-branch and cross-branch comparison.

- [ ] **Step 4: Add trace fields**

For each canonical trace step, record:

- `beforeCandidateSnapshot`
- `afterCandidateSnapshot`
- `beforeCandidateHash`
- `afterCandidateHash`

Keep the existing `beforeGrid`, `afterGrid`, placements, eliminations, and explanations.

- [ ] **Step 5: Verify hard #52302 and all four hard cases**

Run:

```bash
node orchestration/trace-archive-case.mjs \
  --difficulty hard \
  --index 52302 \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-hard-52302-candidates

node orchestration/analyze-opus-sonnet-cases.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --difficulty hard \
  --loser sonnet46 \
  --winner opus48 \
  --out orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures-candidates
```

Expected: Trace JSON contains candidate snapshot/hash fields for both models and all four cases still analyze.

- [ ] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Record candidate state in archive traces"
```

## Task 8: Add First-Divergence Same-State Probe

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [ ] **Step 1: Write failing tests for divergence probe summary**

```js
import { summarizeDivergenceProbe } from './trace-archive-case.mjs';

test('summarizeDivergenceProbe reports winner-only strategy output', () => {
  assert.deepEqual(summarizeDivergenceProbe({
    winnerProbe: { aic: { producedStep: true } },
    loserProbe: { aic: { producedStep: false } },
    suspectStrategyId: 'aic',
  }), {
    suspectStrategyId: 'aic',
    label: 'winner-only-detection',
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `summarizeDivergenceProbe` is missing.

- [ ] **Step 3: Implement same-state probe mode**

At the first divergence step, run a probe in each archive worktree against that model's actual `beforeGrid` and candidate state from the trace. Probe every canonical strategy once and record:

- `strategyId`
- `producedStep`
- `placements`
- `eliminations`
- `explanation`
- `candidateHashBefore`
- `candidateHashAfterIfApplied`

If candidate-state restoration is not possible yet, explicitly write:

```json
"candidateStateRestored": false
```

Do not silently fall back to grid-only probes.

- [ ] **Step 4: Write output files**

Create:

- `divergence-probe.json`

Include:

- `firstDivergence`
- `candidateHashesMatchAtDivergence`
- `winnerProbe`
- `loserProbe`
- `summary.label`

- [ ] **Step 5: Verify hard #52302**

Run:

```bash
node orchestration/trace-archive-case.mjs \
  --difficulty hard \
  --index 52302 \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-hard-52302-divergence-probe
```

Expected: `divergence-probe.json` exists and states whether `aic` is `winner-only-detection`, `same-strategy-different-effect`, `candidate-state-mismatch`, or `inconclusive`.

- [ ] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add first-divergence strategy probe"
```

## Task 9: Add Optional Strategy-Internal Debug Branches

**Files:**
- Create worktree only if Task 8 still cannot explain `aic` or `single-digit-patterns`.
- Do not modify `archive/final/*`.

- [ ] **Step 1: Create derived debug branches**

```bash
git branch analysis/opus48-aic-debug archive/final/opus48
git branch analysis/sonnet46-aic-debug archive/final/sonnet46
git worktree add ../sudoku-opus48-aic-debug analysis/opus48-aic-debug
git worktree add ../sudoku-sonnet46-aic-debug analysis/sonnet46-aic-debug
```

- [ ] **Step 2: Inspect strategy files before editing**

Search for `aic`, `single-digit-patterns`, `als`, and `forcing-chain` implementation files in both derived worktrees. Record exact paths in `orchestration/reports/analysis/opus-sonnet-debug-notes.md` or another ignored runtime note.

- [ ] **Step 3: Add narrow debug logging only in derived branches**

For `aic`, log:

- candidate graph node count
- strong link count
- weak link count
- chain endpoints considered
- eliminations accepted
- eliminations rejected and reason, if available

For `single-digit-patterns`, log:

- digit under consideration
- pattern type considered
- candidate positions for the digit
- eliminations accepted/rejected

- [ ] **Step 4: Run only the suspect cases**

Run a one-off debug runner directly inside the derived worktrees so the instrumented strategy code is used. Do not point `trace-archive-case.mjs` at `archive/final/*` for this step, because that would bypass the debug branches.

Example for hard #52302:

```bash
node --input-type=module -e "import { runnerSource } from './orchestration/trace-archive-case.mjs'; import { writeFileSync } from 'node:fs'; writeFileSync('../sudoku-opus48-aic-debug/.trace-case-runner.ts', runnerSource());"

(
  cd ../sudoku-opus48-aic-debug && \
  PATH=/Users/sakura/LLM_Work/SudokuSolver/node_modules/.bin:$PATH \
  MODEL_NAME=opus48-debug \
  PUZZLE=000010000053204960600050002000000000000908000039020480800030004046000310005401800 \
  npx tsx .trace-case-runner.ts \
    > /Users/sakura/LLM_Work/SudokuSolver/orchestration/reports/analysis/opus48-aic-debug-hard-52302.json
)
```

Repeat from `../sudoku-sonnet46-aic-debug` with `MODEL_NAME=sonnet46-debug`. If a reusable debug runner is created, keep it outside `archive/final/*`; commit it only to `orchestration` if it becomes generally useful.

Do not generalize this into production tooling unless the debug output proves useful.

- [ ] **Step 5: Commit debug branches only if useful**

If debug logs are useful for review, commit them to `analysis/opus48-aic-debug` and `analysis/sonnet46-aic-debug` with messages like:

```bash
git branch --show-current
git status --short
git add <modified-debug-files>
git commit -m "Add temporary AIC debug logging"
```

Expected before commit: `git branch --show-current` prints `analysis/opus48-aic-debug` or `analysis/sonnet46-aic-debug`, never `archive/final/*` and never `orchestration`.

Do not merge these debug branches into `orchestration`.

## Task 10: Targeted Code Review And Root-Cause Report

**Files:**
- Create: `orchestration/analysis/opus-sonnet-root-cause-notes.md`
- Optional: Create LFS tarball under `orchestration/run-logs/` if Task 8/9 outputs are large.

- [ ] **Step 1: Review `aic` implementation differences**

Compare `archive/final/opus48` and `archive/final/sonnet46` or their derived debug branches. Focus on the exact failure mode from Task 8/9, not broad style differences.

- [ ] **Step 2: Review `single-digit-patterns` implementation differences**

Focus on hard #272709 and the strategy state at first divergence.

- [ ] **Step 3: Write root-cause notes**

The report must answer:

- Is the divergence due to candidate-state mismatch before the suspect strategy runs?
- If candidate state matches, does the suspect strategy detect a step in `opus48` but not `sonnet46`?
- If both detect a step, do they choose different effects because of tie-breaks?
- Which exact code path or condition explains the difference?
- Is this a correctness bug, coverage gap, or acceptable strategy-strength difference?

- [ ] **Step 4: Verify report references existing artifacts**

Run:

```bash
test -f orchestration/run-logs/full-corpus-20260602-064418.tar.gz
test -f orchestration/run-logs/opus-sonnet-hard-analysis-20260602.tar.gz
git diff --check
```

- [ ] **Step 5: Commit**

```bash
git add orchestration/analysis/opus-sonnet-root-cause-notes.md <optional LFS tarball>
git commit -m "Document opus-sonnet root cause findings"
```

## Phase 3 Goal: Analyze Remaining Fixed-Branch Failures

**Goal:** Find the cases that `analysis-sonnet46-strategy-fix` still cannot solve, identify which archived models solve them, and run the same step-by-step strategy comparison workflow against those winner branches.

**Current input archive:** `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`, after merging the full-corpus result for `analysis-sonnet46-strategy-fix` into `20260602-064418/results.json`.

**Loser branch/result:**

- Result name in archive: `analysis-sonnet46-strategy-fix`
- Git ref for trace execution: `analysis/sonnet46-strategy-fix`

**Winner candidates from the merged archive:**

| Difficulty | Puzzle index | Winner(s) | Puzzle |
| --- | ---: | --- | --- |
| diabolical | 13829 | `gemini35flash` | `700000500001500300000060098040007001000905000900800020680030000003002600009000004` |
| diabolical | 23835 | `gpt55` | `005000300070905080300060002040050060200000008000106000090040020700000009600010003` |
| diabolical | 27806 | `gpt55` | `005000200070000080012409650009000500006175300700000006000020000000594000500607004` |
| diabolical | 38116 | `gemini35flash` | `706000304009000800800000002000169000060050070000207000007000400200405007300706008` |
| diabolical | 77633 | `gemini35flash` | `010000020600040008082030460040502010000000000900060007100050002060000080020904050` |
| diabolical | 78760 | `gpt55` | `500000820030000006000705000050092080007050400040670010000106000800000030064000008` |
| diabolical | 88102 | `opus48` | `000040000000309000904000206005020800600905007000783000090070050006401700001000300` |
| diabolical | 103170 | `opus48`, `gemini35flash` | `700000003002657100001000700003471900200000001010020030060040080000906000300000005` |
| diabolical | 109043 | `gpt55` | `010705030800040005090000040107000302040000070600000001080607010000409000002050600` |

Summary of remaining failures:

- `analysis-sonnet46-strategy-fix` has 904 remaining full-corpus failures, all in `diabolical`.
- 9 unique remaining-failure puzzles are solved by at least one archived model.
- There are 10 winner-case comparison pairs because diabolical #103170 is solved by both `opus48` and `gemini35flash`.
- `sonnet46`, `gpt53codex`, and `deepseekv4` solve none of the remaining fixed-branch failures in the merged archive.

**Safety rule:** Phase 3 is analysis-first. Do not edit archive branches. If later fixes are needed, reuse `analysis/sonnet46-strategy-fix` as the repair branch and write repair notes under `orchestration/analysis/` so future fix work can reuse the same branch and evidence.

## Task 11: Generalize Remaining-Failure Winner Selection

**Files:**
- Modify: `orchestration/analyze-opus-sonnet-cases.mjs`
- Modify: `orchestration/analyze-opus-sonnet-cases.test.mjs`

- [ ] **Step 1: Write failing tests for multi-winner selection**

Add pure helper tests using small in-memory fixtures:

```js
import {
  buildWinnerCasePairs,
  selectFailuresSolvedByAnyWinner,
} from './analyze-opus-sonnet-cases.mjs';

test('selectFailuresSolvedByAnyWinner finds loser failures solved by at least one winner', () => {
  const loserFailures = [{ index: 1, puzzle: 'p1' }, { index: 2, puzzle: 'p2' }, { index: 3, puzzle: 'p3' }];
  const winnerFailuresByName = new Map([
    ['opus48', [{ index: 2 }]],
    ['gpt55', [{ index: 3 }]],
  ]);

  assert.deepEqual(selectFailuresSolvedByAnyWinner({ loserFailures, winnerFailuresByName }), [
    { index: 1, puzzle: 'p1', solvedBy: ['opus48', 'gpt55'] },
    { index: 2, puzzle: 'p2', solvedBy: ['gpt55'] },
    { index: 3, puzzle: 'p3', solvedBy: ['opus48'] },
  ]);
});

test('buildWinnerCasePairs keeps one pair per winner that solved a case', () => {
  const cases = [{ index: 10, puzzle: 'p10', solvedBy: ['opus48', 'gemini35flash'] }];
  assert.deepEqual(buildWinnerCasePairs({ cases, loser: 'analysis-sonnet46-strategy-fix' }), [
    { winner: 'opus48', loser: 'analysis-sonnet46-strategy-fix', index: 10, puzzle: 'p10' },
    { winner: 'gemini35flash', loser: 'analysis-sonnet46-strategy-fix', index: 10, puzzle: 'p10' },
  ]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/analyze-opus-sonnet-cases.test.mjs`

Expected: FAIL because the new helpers do not exist.

- [ ] **Step 3: Implement pure selection helpers**

Implement:

- `selectFailuresSolvedByAnyWinner({ loserFailures, winnerFailuresByName })`
- `buildWinnerCasePairs({ cases, loser })`

Rules:

- Preserve archived puzzle data from the loser failure object.
- Sort cases by numeric puzzle index.
- Sort `solvedBy` in the same order as the `--winners` input, not alphabetically.
- For a case solved by multiple winners, keep one trace pair per winner.

- [ ] **Step 4: Extend CLI arguments**

Add support for:

```text
--winners opus48,gpt55,gemini35flash
--refs analysis-sonnet46-strategy-fix=analysis/sonnet46-strategy-fix
```

Keep the existing single `--winner` mode working for Phase 1/2 compatibility. Do not require `--winner` when `--winners` is provided.

- [ ] **Step 5: Emit candidate and pair files**

The Phase 3 CLI run should write:

- `candidate-cases.json`: 9 unique loser-failed cases solved by at least one winner.
- `winner-case-pairs.json`: 10 winner/loser trace pairs.
- `summary.json`: full batch summary with selected cases, pairs, and per-pair analysis.
- `summary.md`: human-readable table.

- [ ] **Step 6: Verify helper tests pass**

Run: `node --test orchestration/analyze-opus-sonnet-cases.test.mjs`

Expected: all tests pass.

## Task 12: Pass Explicit Refs Through Batch Trace Analysis

**Files:**
- Modify: `orchestration/analyze-opus-sonnet-cases.mjs`
- Modify: `orchestration/analyze-opus-sonnet-cases.test.mjs`

- [ ] **Step 1: Write failing tests for ref argument propagation**

Add a test for the pure command-building helper before wiring process spawning:

```js
import { traceCommandArgs } from './analyze-opus-sonnet-cases.mjs';

test('traceCommandArgs forwards explicit refs to trace runner', () => {
  assert.deepEqual(traceCommandArgs({
    difficulty: 'diabolical',
    index: 88102,
    winner: 'opus48',
    loser: 'analysis-sonnet46-strategy-fix',
    outDir: '/tmp/case',
    refs: new Map([['analysis-sonnet46-strategy-fix', 'analysis/sonnet46-strategy-fix']]),
    keepWorktrees: false,
  }).slice(-2), [
    '--refs',
    'analysis-sonnet46-strategy-fix=analysis/sonnet46-strategy-fix',
  ]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/analyze-opus-sonnet-cases.test.mjs`

Expected: FAIL because `traceCommandArgs` does not exist or does not include `--refs`.

- [ ] **Step 3: Implement ref parsing and propagation**

Implement:

- `parseRefMap(value)` with the same `name=git-ref,name2=git-ref2` syntax used by `trace-archive-case.mjs`.
- `formatRefMap(refs)` for stable CLI propagation.
- `traceCommandArgs(...)` that builds the exact `trace-archive-case.mjs` argument list.

When tracing Phase 3, invoke:

```bash
node orchestration/trace-archive-case.mjs \
  --puzzle <archived loser failure puzzle> \
  --models <winner>,analysis-sonnet46-strategy-fix \
  --refs analysis-sonnet46-strategy-fix=analysis/sonnet46-strategy-fix \
  --out <case-pair-dir>
```

Use `--puzzle` from the archived failure object rather than `--difficulty/--index`; this protects against any future corpus-order changes.

- [ ] **Step 4: Use pair-specific output directories**

Write detailed artifacts under:

```text
orchestration/reports/analysis/fixed-remaining-diabolical-comparison/
  cases/
    diabolical-88102/
      opus48-vs-analysis-sonnet46-strategy-fix/
        comparison.json
        saturation-comparison.json
        divergence-probe.json
        rescue-comparison.json
        trace-opus48.json
        trace-analysis-sonnet46-strategy-fix.json
```

For diabolical #103170, create two sibling pair directories:

- `opus48-vs-analysis-sonnet46-strategy-fix/`
- `gemini35flash-vs-analysis-sonnet46-strategy-fix/`

- [ ] **Step 5: Verify no archive refs are modified**

Run:

```bash
git branch --list \
  archive/final/opus48 \
  archive/final/gpt55 \
  archive/final/gemini35flash \
  analysis/sonnet46-strategy-fix
```

Expected: all four refs exist. Do not create or modify `archive/final/*`.

## Task 13: Run Phase 3 Step-By-Step Strategy Analysis

**Files:**
- Runtime output only: `orchestration/reports/analysis/fixed-remaining-diabolical-comparison/`
- Optional package output: `orchestration/run-logs/fixed-remaining-diabolical-analysis-20260602.tar.gz`

- [ ] **Step 1: Run the batch analysis**

```bash
node orchestration/analyze-opus-sonnet-cases.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --difficulty diabolical \
  --loser analysis-sonnet46-strategy-fix \
  --winners opus48,gpt55,gemini35flash \
  --refs analysis-sonnet46-strategy-fix=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/fixed-remaining-diabolical-comparison
```

Expected selection counts:

- `candidate-cases.json` contains 9 cases.
- `winner-case-pairs.json` contains 10 pairs.
- `summary.md` has one row per pair.

- [ ] **Step 2: Inspect high-priority pairs first**

Start with `opus48`, because it was already used as the Phase 1/2 reference implementation:

- diabolical #88102: `opus48` vs `analysis-sonnet46-strategy-fix`
- diabolical #103170: `opus48` vs `analysis-sonnet46-strategy-fix`

Then inspect:

- `gpt55` pairs: #23835, #27806, #78760, #109043
- `gemini35flash` pairs: #13829, #38116, #77633, #103170

- [ ] **Step 3: Compare classification patterns**

For each pair, record:

- First canonical trace divergence.
- First different saturation fixed point.
- Whether candidate hashes match at divergence.
- Whether the winner can rescue the fixed branch's stuck final grid.
- Whether divergence is `winner-only-detection`, `same-strategy-different-effect`, `candidate-state-mismatch`, `early-path-dependency`, or `inconclusive`.
- Suspect `strategyId` and whether the same strategy appears across multiple winner branches.

- [ ] **Step 4: Package large runtime artifacts if useful**

If the case directory is large but worth preserving, package it:

```bash
tar -czf orchestration/run-logs/fixed-remaining-diabolical-analysis-20260602.tar.gz \
  -C orchestration/reports/analysis \
  fixed-remaining-diabolical-comparison
```

This path is under Git LFS by `.gitattributes` if committed as `orchestration/run-logs/*.tar.gz`.

- [ ] **Step 5: Verify generated files**

Run:

```bash
test -f orchestration/reports/analysis/fixed-remaining-diabolical-comparison/candidate-cases.json
test -f orchestration/reports/analysis/fixed-remaining-diabolical-comparison/winner-case-pairs.json
test -f orchestration/reports/analysis/fixed-remaining-diabolical-comparison/summary.json
test -f orchestration/reports/analysis/fixed-remaining-diabolical-comparison/summary.md
node --test orchestration/analyze-opus-sonnet-cases.test.mjs
node --test orchestration/trace-archive-case.test.mjs
git worktree list --porcelain
```

Expected: tests pass, no unintended leftover trace worktrees unless `--keep-worktrees` was used deliberately.

## Task 14: Write Phase 3 Repair Analysis Notes

**Files:**
- Create: `orchestration/analysis/fixed-remaining-diabolical-root-cause-notes.md`
- Optional: `orchestration/run-logs/fixed-remaining-diabolical-analysis-20260602.tar.gz`

- [ ] **Step 1: Summarize the candidate set**

The notes must include:

- 904 total fixed-branch failures, all `diabolical`.
- 9 unique cases solved by at least one archived model.
- 10 winner-case comparison pairs.
- Which winners solve each case.

- [ ] **Step 2: Summarize strategy-level findings**

For each case, include a compact table:

| Case | Winner | First divergence | Saturation suspect | Rescue strategy | Classification | Notes |
| ---: | --- | --- | --- | --- | --- | --- |

Keep raw trace details in `orchestration/reports/analysis/`; the `orchestration/analysis/` note should be interpretive and reviewable.

- [ ] **Step 3: Identify reusable repair direction**

If the analysis points to code changes, document exactly where future repair work should start in `analysis/sonnet46-strategy-fix`:

- Suspect strategy file path(s).
- Candidate regression puzzle(s).
- Expected behavior from winner branch traces.
- Whether the issue appears to be a coverage gap, candidate-state divergence, tie-break/path dependency, or invalid-solved risk.

Do not implement the repair in this task. The next repair session can reuse branch `analysis/sonnet46-strategy-fix` and the notes under `orchestration/analysis/`.

- [ ] **Step 4: Verify references and formatting**

Run:

```bash
test -f orchestration/run-logs/full-corpus-20260602-064418.tar.gz
test -f orchestration/analysis/fixed-remaining-diabolical-root-cause-notes.md
git diff --check
```

- [ ] **Step 5: Commit Phase 3 tooling and notes**

```bash
git add \
  orchestration/analyze-opus-sonnet-cases.mjs \
  orchestration/analyze-opus-sonnet-cases.test.mjs \
  orchestration/analysis/fixed-remaining-diabolical-root-cause-notes.md \
  <optional LFS tarball>
git commit -m "Analyze fixed branch remaining failures"
```

## Final Verification Checklist (Phase 1 Completed)

- [x] `node --test orchestration/analyze-full-corpus-results.test.mjs` passes.
- [x] `node --test orchestration/trace-archive-case.test.mjs` passes.
- [x] `node --test orchestration/analyze-opus-sonnet-cases.test.mjs` passes.
- [x] `npm test` passes.
- [x] `node orchestration/analyze-full-corpus-results.mjs --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz --models opus48,sonnet46 --out orchestration/reports/analysis/opus-sonnet-smoke` produces expected overlap counts.
- [x] `node orchestration/trace-archive-case.mjs --difficulty hard --index 52302 --models opus48,sonnet46 --out orchestration/reports/analysis/opus-sonnet-hard-52302` produces trace, saturation, rescue, and comparison files.
- [x] `node orchestration/analyze-opus-sonnet-cases.mjs --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz --difficulty hard --loser sonnet46 --winner opus48 --out orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures` analyzes exactly 4 hard cases.
- [x] `git worktree list --porcelain` shows no leftover analysis worktrees unless intentionally retained.
- [x] `git diff --check` reports no whitespace errors.

## Execution Notes For The Next Session

Start in a clean worktree. If the main workspace has unrelated work, create a dedicated implementation worktree before coding:

```bash
git fetch origin
git worktree add -b analysis/opus-sonnet-trace ../SudokuSolver-opus-sonnet-analysis orchestration
```

If `analysis/opus-sonnet-trace` already exists, use a detached worktree instead:

```bash
git worktree add --detach ../SudokuSolver-opus-sonnet-analysis orchestration
```

Use TDD for each task. Do not skip the red test step. Commit after each task so the analysis can be reviewed incrementally.

Do not update `orchestration/report-final.md` until the trace reports have been generated and reviewed. The first deliverable should be the analysis tooling plus the 4-case hard report, not model fixes.
