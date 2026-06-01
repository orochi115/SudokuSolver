/**
 * Judge gate — runs the engine (with whatever strategies the worker registered)
 * over the frozen ground-truth set and reports:
 *   - soundness: zero trace violations is a HARD requirement (exit 1 otherwise);
 *   - solve rate per difficulty (non-brute-force).
 *
 * This file lives only on the `orchestration` branch. verify.sh copies it to the
 * target worktree root and runs it there with `npx tsx`, so the relative import
 * below resolves to that worktree's engine. The worker never sees this file in
 * its own tree (it is copied in after the worker's turn and removed afterwards).
 */

import { readFileSync } from 'node:fs';
// Resolved relative to the worktree root where this file is copied.
import { Grid, solve, STRATEGIES, checkTraceSoundness } from './packages/engine/src/index.js';

interface GroundTruth {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

const report: Record<string, { n: number; solved: number; solveRate: number; violations: number }> = {};
let totalViolations = 0;
let totalPuzzles = 0;

for (const diff of DIFFICULTIES) {
  let records: GroundTruth[];
  try {
    records = JSON.parse(readFileSync(`data/ground-truth/${diff}.json`, 'utf8')) as GroundTruth[];
  } catch {
    continue; // difficulty file not present
  }

  let solved = 0;
  let violations = 0;
  for (const rec of records) {
    if (!rec.solution) continue;
    const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
    if (trace.outcome === 'solved') solved++;
    const result = checkTraceSoundness(trace, rec.solution);
    violations += result.violations.length;
  }

  totalViolations += violations;
  totalPuzzles += records.length;
  report[diff] = {
    n: records.length,
    solved,
    solveRate: records.length ? Number((solved / records.length).toFixed(3)) : 0,
    violations,
  };
}

console.log(
  JSON.stringify(
    { strategies: STRATEGIES.length, totalPuzzles, totalViolations, report },
    null,
    2,
  ),
);

if (totalViolations > 0) {
  console.error(`SOUNDNESS FAIL: ${totalViolations} violation(s) across the ground-truth set.`);
  process.exit(1);
}
console.error('SOUNDNESS OK (0 violations).');
