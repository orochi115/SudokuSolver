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

## Task 1: Add Full-Corpus Overlap Analysis

**Files:**
- Create: `orchestration/analyze-full-corpus-results.mjs`
- Create: `orchestration/analyze-full-corpus-results.test.mjs`

- [ ] **Step 1: Write failing tests for overlap helpers**

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

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test orchestration/analyze-full-corpus-results.test.mjs`

Expected: FAIL because `analyze-full-corpus-results.mjs` does not exist or exports are missing.

- [ ] **Step 3: Implement minimal overlap helpers**

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

- [ ] **Step 4: Add CLI archive reader**

The CLI should accept:

```bash
node orchestration/analyze-full-corpus-results.mjs \
  --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  --models opus48,sonnet46 \
  --out orchestration/reports/analysis/opus-sonnet-$(date +%Y%m%d-%H%M%S)
```

Use `spawnSync('tar', ['-xOf', archive, '20260602-064418/results.json'], { maxBuffer: ... })` or stream extraction if buffer size becomes a problem. The current result JSON is large, so prefer streaming or set `maxBuffer` to at least `200 * 1024 * 1024`.

- [ ] **Step 5: Verify against current archive**

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

- [ ] **Step 6: Commit**

```bash
git add orchestration/analyze-full-corpus-results.mjs orchestration/analyze-full-corpus-results.test.mjs
git commit -m "Add full-corpus overlap analysis"
```

## Task 2: Add Canonical Trace Runner For One Case

**Files:**
- Create: `orchestration/trace-archive-case.mjs`
- Create: `orchestration/trace-archive-case.test.mjs`

- [ ] **Step 1: Write failing tests for trace comparison helpers**

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

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because the script or exports do not exist.

- [ ] **Step 3: Implement pure comparison helpers**

Export at least:

- `normalizeAction(step)`
- `sameAction(left, right)`
- `firstDivergence(leftSteps, rightSteps)`
- `canonicalOrder()`

Keep these independent of git worktrees so they are easy to test.

- [ ] **Step 4: Implement archive worktree runner**

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

- [ ] **Step 5: Inside the generated runner, implement canonical trace**

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

- [ ] **Step 6: Verify one known case**

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

- [ ] **Step 7: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add archive trace case analyzer"
```

## Task 3: Add Per-Strategy Saturation Probe

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [ ] **Step 1: Write failing tests for saturation comparison**

```js
import { firstDifferentFixedPoint } from './trace-archive-case.mjs';

test('firstDifferentFixedPoint finds first strategy whose afterGrid differs', () => {
  const left = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'left' }];
  const right = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'right' }];
  assert.deepEqual(firstDifferentFixedPoint(left, right), { strategyId: 'b', index: 1 });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `firstDifferentFixedPoint` is missing.

- [ ] **Step 3: Implement saturation mode in runner**

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

- [ ] **Step 4: Add output files**

For each model:

- `saturation-<model>.json`

For comparison:

- `saturation-comparison.json`
- Include `firstDifferentFixedPoint`.

- [ ] **Step 5: Verify on hard #52302**

Run the same command as Task 2.

Expected:

- `saturation-opus48.json` exists.
- `saturation-sonnet46.json` exists.
- `saturation-comparison.json` contains either a first differing strategy or states that fixed points match.

- [ ] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add per-strategy saturation analysis"
```

## Task 4: Add Stuck-Grid Rescue Probe

**Files:**
- Modify: `orchestration/trace-archive-case.mjs`
- Modify: `orchestration/trace-archive-case.test.mjs`

- [ ] **Step 1: Write failing tests for rescue classification**

```js
import { classifyCase } from './trace-archive-case.mjs';

test('classifyCase marks missing detection when winner rescues loser stuck grid', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: 'aic', firstDivergence: { kind: 'one-stuck' } }), 'missing-detection');
});

test('classifyCase marks early path dependency when rescue is impossible', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: null, firstDivergence: { kind: 'different-strategy-selection' } }), 'early-path-dependency');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/trace-archive-case.test.mjs`

Expected: FAIL because `classifyCase` is missing.

- [ ] **Step 3: Implement rescue runner mode**

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

- [ ] **Step 4: Add output files**

- `rescue-comparison.json`
- Include `winnerRescueStrategyId`, `loserRescueStrategyId`, and `classification`.

- [ ] **Step 5: Verify on hard #52302**

Expected:

- `rescue-comparison.json` exists.
- It contains the limitation string.
- It contains `classification`.

- [ ] **Step 6: Commit**

```bash
git add orchestration/trace-archive-case.mjs orchestration/trace-archive-case.test.mjs
git commit -m "Add stuck-grid rescue analysis"
```

## Task 5: Batch Analyze Sonnet Hard Failures

**Files:**
- Create: `orchestration/analyze-opus-sonnet-cases.mjs`
- Create: `orchestration/analyze-opus-sonnet-cases.test.mjs`

- [ ] **Step 1: Write failing tests for case selection**

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

- [ ] **Step 2: Run and verify failure**

Run: `node --test orchestration/analyze-opus-sonnet-cases.test.mjs`

Expected: FAIL because the script or export does not exist.

- [ ] **Step 3: Implement batch selector**

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

- [ ] **Step 4: Invoke trace analysis per case**

The batch script may either import shared logic from `trace-archive-case.mjs` or spawn it. Prefer importing pure helpers and spawning CLI for archive worktree isolation.

For each case, create:

```text
orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures/cases/hard-52302/
```

- [ ] **Step 5: Generate summary report**

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

- [ ] **Step 6: Verify batch output**

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

- [ ] **Step 7: Commit**

```bash
git add orchestration/analyze-opus-sonnet-cases.mjs orchestration/analyze-opus-sonnet-cases.test.mjs
git commit -m "Add opus-sonnet batch case analysis"
```

## Task 6: Produce Human Analysis Report

**Files:**
- Create: `orchestration/reports/archive/<timestamp>/opus-sonnet-hard-analysis.md` or another committable path outside ignored `orchestration/reports/` if it should be versioned directly.
- Optional: Create LFS tarball under `orchestration/run-logs/` for detailed JSON traces.

- [ ] **Step 1: Decide storage format**

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

- [ ] **Step 2: Write interpretation**

The report should answer:

- Which of sonnet's 4 hard failures are solved by opus?
- For each case, where is the first canonical trace divergence?
- Which strategy fixed point first differs under saturation?
- Can opus rescue sonnet's stuck grid?
- What strategy IDs are most suspicious?
- Is this likely missing detection, same-strategy effect difference, or path dependency?

- [ ] **Step 3: Add limitations**

Include these caveats explicitly:

- Reconstructed stuck-grid rescue loses candidate eliminations because current `Grid.fromString()` only encodes placements.
- Grid-only fixed-point comparison can miss divergence if two models reach the same placements with different candidate masks; use candidate hashes where available.
- Same `strategyId` does not guarantee identical theoretical coverage for strategy families such as `aic`, `als`, and `forcing-chain`.
- Different tie-breaks can produce different but still sound traces.
- This analysis identifies likely implementation gaps; it does not prove a strategy is mathematically complete.

- [ ] **Step 4: Verify report references files that exist**

Run:

```bash
test -f orchestration/run-logs/full-corpus-20260602-064418.tar.gz
git diff --check
```

Expected: no output from `git diff --check`.

- [ ] **Step 5: Commit**

```bash
git add <analysis markdown path> <optional LFS tarball>
git commit -m "Analyze opus and sonnet hard failures"
```

## Final Verification Checklist

- [ ] `node --test orchestration/analyze-full-corpus-results.test.mjs` passes.
- [ ] `node --test orchestration/trace-archive-case.test.mjs` passes.
- [ ] `node --test orchestration/analyze-opus-sonnet-cases.test.mjs` passes.
- [ ] `npm test` passes.
- [ ] `node orchestration/analyze-full-corpus-results.mjs --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz --models opus48,sonnet46 --out orchestration/reports/analysis/opus-sonnet-smoke` produces expected overlap counts.
- [ ] `node orchestration/trace-archive-case.mjs --difficulty hard --index 52302 --models opus48,sonnet46 --out orchestration/reports/analysis/opus-sonnet-hard-52302` produces trace, saturation, rescue, and comparison files.
- [ ] `node orchestration/analyze-opus-sonnet-cases.mjs --archive orchestration/run-logs/full-corpus-20260602-064418.tar.gz --difficulty hard --loser sonnet46 --winner opus48 --out orchestration/reports/analysis/opus-sonnet-hard-sonnet-failures` analyzes exactly 4 hard cases.
- [ ] `git worktree list --porcelain` shows no leftover analysis worktrees unless intentionally retained.
- [ ] `git diff --check` reports no whitespace errors.

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
