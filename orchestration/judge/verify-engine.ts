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

// --- gate: soundness + real-progress floors (set by verify.sh per milestone) ---
const num = (k: string): number => Number(process.env[k] ?? '0');
const floors: Record<string, number> = {
  easy: num('MIN_EASY'),
  medium: num('MIN_MEDIUM'),
  hard: num('MIN_HARD'),
  diabolical: num('MIN_DIAB'),
};
const minStrategies = Math.max(1, num('MIN_STRATEGIES') || 1);

const reasons: string[] = [];
if (totalViolations > 0) reasons.push(`${totalViolations} soundness violation(s)`);
if (STRATEGIES.length < minStrategies)
  reasons.push(`only ${STRATEGIES.length} strategies (need >= ${minStrategies})`);
for (const [diff, floor] of Object.entries(floors)) {
  if (floor <= 0) continue;
  const got = report[diff]?.solveRate ?? 0;
  if (got < floor) reasons.push(`${diff} solveRate ${got} < ${floor}`);
}

if (reasons.length > 0) {
  console.error('GATE FAIL: ' + reasons.join('; '));
  process.exit(1);
}
console.error('GATE OK (sound + meets floors).');
