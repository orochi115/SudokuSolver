import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthItem {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  solved: number;
  solveRate: number;
  avgStepsSolved: number;
}

interface SolveRateReport {
  generatedAt: string;
  strategyOrder: string[];
  byDifficulty: Record<string, DifficultyReport>;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const levels = ['easy', 'medium', 'hard', 'diabolical'] as const;

function readGroundTruth(level: (typeof levels)[number]): GroundTruthItem[] {
  const path = resolve(root, `data/ground-truth/${level}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as GroundTruthItem[];
}

function round(num: number): number {
  return Math.round(num * 10000) / 10000;
}

function main(): void {
  const byDifficulty: Record<string, DifficultyReport> = {};

  for (const level of levels) {
    const items = readGroundTruth(level).filter((it) => it.unique && it.solution !== null);
    let solvedCount = 0;
    let solvedSteps = 0;

    for (const item of items) {
      const trace = solve(Grid.fromString(item.puzzle), STRATEGIES);
      if (trace.outcome === 'solved') {
        solvedCount++;
        solvedSteps += trace.steps.length;
      }
    }

    byDifficulty[level] = {
      total: items.length,
      solved: solvedCount,
      solveRate: items.length === 0 ? 0 : round(solvedCount / items.length),
      avgStepsSolved: solvedCount === 0 ? 0 : round(solvedSteps / solvedCount),
    };
  }

  const report: SolveRateReport = {
    generatedAt: new Date().toISOString(),
    strategyOrder: STRATEGIES.map((s) => s.id),
    byDifficulty,
  };

  const outDir = resolve(root, 'data/reports');
  mkdirSync(outDir, { recursive: true });
  const out = resolve(outDir, 'solve-rate.json');
  writeFileSync(out, JSON.stringify(report, null, 2) + '\n');

  console.log(`solve-rate report written to ${out}`);
  for (const level of levels) {
    const r = byDifficulty[level]!;
    console.log(`${level}: solved ${r.solved}/${r.total} (${(r.solveRate * 100).toFixed(2)}%), avgSteps=${r.avgStepsSolved}`);
  }
}

main();
