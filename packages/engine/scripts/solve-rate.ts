/**
 * M2 solve-rate report.
 *
 * Runs the human-strategy solver over the frozen ground-truth corpus and writes
 * data/reports/solve-rate.json. The brute-force solutions are used only for
 * soundness validation, not for solving.
 *
 * Usage: npx tsx packages/engine/scripts/solve-rate.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GROUND_TRUTH_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORT_DIR = resolve(REPO_ROOT, 'data/reports');
const REPORT_FILE = resolve(REPORT_DIR, 'solve-rate.json');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface GroundTruthEntry {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  unique: number;
  solved: number;
  stuck: number;
  solveRate: number;
  averageSteps: number;
  maxSteps: number;
  soundnessViolations: number;
  strategyUsage: Record<string, number>;
}

interface SolveRateReport {
  generatedAt: string;
  strategyOrder: string[];
  difficulties: Record<string, DifficultyReport>;
  overall: DifficultyReport;
}

function emptyReport(): DifficultyReport {
  return {
    total: 0,
    unique: 0,
    solved: 0,
    stuck: 0,
    solveRate: 0,
    averageSteps: 0,
    maxSteps: 0,
    soundnessViolations: 0,
    strategyUsage: {},
  };
}

function addStrategyUsage(usage: Record<string, number>, strategyId: string): void {
  usage[strategyId] = (usage[strategyId] ?? 0) + 1;
}

function finalize(report: DifficultyReport, stepTotal: number): void {
  report.stuck = report.unique - report.solved;
  report.solveRate = report.unique === 0 ? 0 : Number((report.solved / report.unique).toFixed(4));
  report.averageSteps = report.unique === 0 ? 0 : Number((stepTotal / report.unique).toFixed(2));
}

function loadDifficulty(diff: string): GroundTruthEntry[] {
  const file = resolve(GROUND_TRUTH_DIR, `${diff}.json`);
  if (!existsSync(file)) throw new Error(`Missing ground-truth file: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8')) as GroundTruthEntry[];
}

function main(): void {
  const difficulties: Record<string, DifficultyReport> = {};
  const overall = emptyReport();
  let overallSteps = 0;

  for (const diff of DIFFICULTIES) {
    const entries = loadDifficulty(diff).filter((entry) => entry.unique && entry.solution !== null);
    const report = emptyReport();
    let stepTotal = 0;
    report.total = entries.length;
    report.unique = entries.length;

    for (const entry of entries) {
      const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
      const steps = trace.steps.length;
      stepTotal += steps;
      report.maxSteps = Math.max(report.maxSteps, steps);
      if (trace.outcome === 'solved') report.solved++;
      for (const step of trace.steps) addStrategyUsage(report.strategyUsage, step.strategyId);

      const soundness = checkTraceSoundness(trace, entry.solution!);
      report.soundnessViolations += soundness.violations.length;
    }

    finalize(report, stepTotal);
    difficulties[diff] = report;

    overall.total += report.total;
    overall.unique += report.unique;
    overall.solved += report.solved;
    overall.maxSteps = Math.max(overall.maxSteps, report.maxSteps);
    overall.soundnessViolations += report.soundnessViolations;
    overallSteps += stepTotal;
    for (const [strategyId, count] of Object.entries(report.strategyUsage)) {
      overall.strategyUsage[strategyId] = (overall.strategyUsage[strategyId] ?? 0) + count;
    }

    console.log(`${diff}: solved=${report.solved}/${report.unique} rate=${(report.solveRate * 100).toFixed(1)}% avgSteps=${report.averageSteps} violations=${report.soundnessViolations}`);
  }

  finalize(overall, overallSteps);
  const output: SolveRateReport = {
    generatedAt: new Date().toISOString(),
    strategyOrder: STRATEGIES.map((strategy) => strategy.id),
    difficulties,
    overall,
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`report written to ${REPORT_FILE}`);
}

main();
