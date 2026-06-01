/**
 * M2 solve-rate report (AC-4).
 *
 * Runs the registered human strategies against the frozen ground-truth set and
 * writes data/reports/solve-rate.json. Brute force is not used for solving here;
 * solutions are only read so the report stays tied to the frozen corpus.
 *
 * Usage: npx tsx packages/engine/scripts/solve-rate.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  unique: number;
  solved: number;
  stuck: number;
  solvedRate: number;
  averageSteps: number;
  strategyUsage: Record<string, number>;
}

interface SolveRateReport {
  generatedAt: string;
  strategies: Array<{ id: string; difficulty: number }>;
  difficulties: Record<string, DifficultyReport>;
}

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GROUND_TRUTH_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORT_DIR = resolve(REPO_ROOT, 'data/reports');
const OUT_FILE = resolve(REPO_ROOT, 'data/reports/solve-rate.json');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

function loadEntries(difficulty: string): GroundTruthEntry[] {
  const file = resolve(GROUND_TRUTH_DIR, `${difficulty}.json`);
  if (!existsSync(file)) throw new Error(`Missing ground-truth file: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8')) as GroundTruthEntry[];
}

function roundRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function main(): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  const report: SolveRateReport = {
    generatedAt: new Date().toISOString(),
    strategies: STRATEGIES.map((strategy) => ({ id: strategy.id, difficulty: strategy.difficulty })),
    difficulties: {},
  };

  for (const difficulty of DIFFICULTIES) {
    const entries = loadEntries(difficulty);
    let solved = 0;
    let totalSteps = 0;
    const strategyUsage: Record<string, number> = {};

    for (const entry of entries) {
      const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
      if (trace.outcome === 'solved') solved++;
      totalSteps += trace.steps.length;
      for (const step of trace.steps) strategyUsage[step.strategyId] = (strategyUsage[step.strategyId] ?? 0) + 1;
    }

    report.difficulties[difficulty] = {
      total: entries.length,
      unique: entries.filter((entry) => entry.unique).length,
      solved,
      stuck: entries.length - solved,
      solvedRate: entries.length === 0 ? 0 : roundRate(solved / entries.length),
      averageSteps: entries.length === 0 ? 0 : roundRate(totalSteps / entries.length),
      strategyUsage,
    };
  }

  writeFileSync(OUT_FILE, JSON.stringify(report, null, 2) + '\n');
  for (const [difficulty, stats] of Object.entries(report.difficulties)) {
    console.log(`${difficulty}: solved=${stats.solved}/${stats.total} rate=${(stats.solvedRate * 100).toFixed(2)}% avgSteps=${stats.averageSteps}`);
  }
  console.log(`report written to ${OUT_FILE}`);
}

main();
