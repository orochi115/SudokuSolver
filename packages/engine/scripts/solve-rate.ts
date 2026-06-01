/**
 * Solve-rate statistics (AC-4).
 *
 * For each difficulty tier in data/ground-truth/, run solve() with the full
 * STRATEGIES array and report the fraction of puzzles solved without brute force
 * (i.e. trace.outcome === 'solved').
 *
 * Outputs: data/reports/solve-rate.json
 *
 * Usage: npx tsx packages/engine/scripts/solve-rate.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface TierResult {
  difficulty: string;
  total: number;
  solved: number;
  stuck: number;
  solveRate: number;
  strategiesUsed: Record<string, number>;
}

interface SolveRateReport {
  generatedAt: string;
  strategies: string[];
  results: TierResult[];
  overall: {
    total: number;
    solved: number;
    solveRate: number;
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORT_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'];

function loadGroundTruth(difficulty: string): GroundTruthEntry[] {
  const path = resolve(GT_DIR, `${difficulty}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as GroundTruthEntry[];
}

console.log('Running solve-rate analysis on ground-truth puzzles...\n');

const results: TierResult[] = [];
let grandTotal = 0;
let grandSolved = 0;

for (const diff of DIFFICULTIES) {
  const entries = loadGroundTruth(diff);
  let solved = 0;
  let stuck = 0;
  const strategyCount: Record<string, number> = {};

  process.stdout.write(`${diff}: processing ${entries.length} puzzles... `);

  for (const entry of entries) {
    if (!entry.unique) continue;
    const g = Grid.fromString(entry.puzzle);
    const trace = solve(g, STRATEGIES);

    if (trace.outcome === 'solved') {
      solved++;
      for (const step of trace.steps) {
        strategyCount[step.strategyId] = (strategyCount[step.strategyId] ?? 0) + 1;
      }
    } else {
      stuck++;
    }
  }

  const total = solved + stuck;
  const solveRate = total > 0 ? solved / total : 0;
  grandTotal += total;
  grandSolved += solved;

  const tierResult: TierResult = {
    difficulty: diff,
    total,
    solved,
    stuck,
    solveRate,
    strategiesUsed: strategyCount,
  };

  results.push(tierResult);
  console.log(`solved ${solved}/${total} (${(solveRate * 100).toFixed(1)}%)`);

  // Print top strategies used
  const topStrategies = Object.entries(strategyCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  if (topStrategies.length > 0) {
    console.log(`  Top strategies: ${topStrategies.map(([id, n]) => `${id}(${n})`).join(', ')}`);
  }
}

const overallRate = grandTotal > 0 ? grandSolved / grandTotal : 0;
console.log(`\nOverall: ${grandSolved}/${grandTotal} (${(overallRate * 100).toFixed(1)}%)`);

const report: SolveRateReport = {
  generatedAt: new Date().toISOString(),
  strategies: STRATEGIES.map((s) => s.id),
  results,
  overall: {
    total: grandTotal,
    solved: grandSolved,
    solveRate: overallRate,
  },
};

mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = resolve(REPORT_DIR, 'solve-rate.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport written to ${reportPath}`);
