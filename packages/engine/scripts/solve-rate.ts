/**
 * Solve-rate statistics (AC-4 / M2).
 *
 * For each difficulty level in data/ground-truth/, runs solve() with all
 * registered human strategies and reports:
 *   - total puzzles
 *   - how many were fully solved (non-brute-force)
 *   - solve rate (%)
 *   - strategy usage counts
 *   - any soundness violations (should be 0)
 *
 * Output is written to data/reports/solve-rate.json.
 *
 * Usage:
 *   npm run solve:rate
 *   # or
 *   npx tsx packages/engine/scripts/solve-rate.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORTS_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface DifficultyReport {
  difficulty: string;
  total: number;
  solved: number;
  solveRate: number;
  soundViolations: number;
  strategyUsage: Record<string, number>;
  /** Puzzles that got stuck (partially solved or untouched) */
  stuckCount: number;
  /** Average steps taken */
  avgSteps: number;
}

interface SolveRateReport {
  generatedAt: string;
  strategies: Array<{ id: string; difficulty: number }>;
  results: DifficultyReport[];
  overall: {
    total: number;
    solved: number;
    solveRate: number;
    soundViolations: number;
  };
}

function main(): void {
  mkdirSync(REPORTS_DIR, { recursive: true });

  const report: SolveRateReport = {
    generatedAt: new Date().toISOString(),
    strategies: STRATEGIES.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    results: [],
    overall: { total: 0, solved: 0, solveRate: 0, soundViolations: 0 },
  };

  let overallTotal = 0;
  let overallSolved = 0;
  let overallViolations = 0;

  for (const diff of DIFFICULTIES) {
    const file = resolve(GT_DIR, `${diff}.json`);
    if (!existsSync(file)) {
      console.warn(`skip ${diff}: ${file} not found`);
      continue;
    }

    const records: Array<{ puzzle: string; solution: string | null; unique: boolean }> =
      JSON.parse(readFileSync(file, 'utf8'));

    let solved = 0;
    let stuck = 0;
    let violations = 0;
    let totalSteps = 0;
    const strategyUsage: Record<string, number> = {};

    // Initialize counters for all strategies
    for (const s of STRATEGIES) strategyUsage[s.id] = 0;

    for (const rec of records) {
      if (!rec.solution) continue;

      const g = Grid.fromString(rec.puzzle);
      const trace = solve(g, STRATEGIES);

      // Count strategy usage
      for (const step of trace.steps) {
        strategyUsage[step.strategyId] = (strategyUsage[step.strategyId] ?? 0) + 1;
      }
      totalSteps += trace.steps.length;

      if (trace.outcome === 'solved') {
        solved++;
      } else {
        stuck++;
      }

      // Soundness check
      const soundResult = checkTraceSoundness(trace, rec.solution);
      if (!soundResult.sound) {
        violations += soundResult.violations.length;
        const v = soundResult.violations[0]!;
        console.error(
          `[${diff}] VIOLATION: strategy=${v.strategyId} kind=${v.kind} cell=${v.cell} digit=${v.digit} expected=${v.expected}`,
        );
      }
    }

    const total = records.filter((r) => r.solution !== null).length;
    const solveRate = total > 0 ? Math.round((solved / total) * 10000) / 100 : 0;
    const avgSteps = total > 0 ? Math.round((totalSteps / total) * 10) / 10 : 0;

    const diffReport: DifficultyReport = {
      difficulty: diff,
      total,
      solved,
      solveRate,
      soundViolations: violations,
      strategyUsage,
      stuckCount: stuck,
      avgSteps,
    };

    report.results.push(diffReport);

    overallTotal += total;
    overallSolved += solved;
    overallViolations += violations;

    console.log(
      `${diff.padEnd(12)}: ${solved}/${total} solved (${solveRate}%) | violations=${violations} | avgSteps=${avgSteps}`,
    );

    // Print top strategy usage
    const topStrategies = Object.entries(strategyUsage)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    for (const [id, count] of topStrategies) {
      console.log(`  ${id.padEnd(24)}: ${count} uses`);
    }
  }

  report.overall = {
    total: overallTotal,
    solved: overallSolved,
    solveRate: overallTotal > 0 ? Math.round((overallSolved / overallTotal) * 10000) / 100 : 0,
    soundViolations: overallViolations,
  };

  console.log('\n--- Overall ---');
  console.log(`Total: ${overallSolved}/${overallTotal} solved (${report.overall.solveRate}%)`);
  console.log(`Sound violations: ${overallViolations}`);

  const outFile = resolve(REPORTS_DIR, 'solve-rate.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nReport written to ${outFile}`);
}

main();
