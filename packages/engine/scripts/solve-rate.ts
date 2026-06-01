import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

type GroundTruthRecord = {
  puzzle: string;
  solution: string | null;
  unique: boolean;
};

type DifficultyReport = {
  total: number;
  solved: number;
  solveRate: number;
  avgSteps: number;
};

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const inDir = resolve(root, 'data/ground-truth');
const outDir = resolve(root, 'data/reports');
const outFile = resolve(outDir, 'solve-rate.json');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function main(): void {
  mkdirSync(outDir, { recursive: true });

  const report: Record<string, DifficultyReport> = {};
  let total = 0;
  let solved = 0;
  let stepSum = 0;

  for (const diff of DIFFICULTIES) {
    const records = JSON.parse(
      readFileSync(resolve(inDir, `${diff}.json`), 'utf8'),
    ) as GroundTruthRecord[];

    let diffSolved = 0;
    let diffSteps = 0;
    for (const item of records) {
      if (!item.solution || !item.unique) continue;
      const trace = solve(Grid.fromString(item.puzzle), STRATEGIES);
      if (trace.outcome === 'solved') diffSolved++;
      diffSteps += trace.steps.length;
    }

    const diffTotal = records.length;
    report[diff] = {
      total: diffTotal,
      solved: diffSolved,
      solveRate: round2((diffSolved / diffTotal) * 100),
      avgSteps: round2(diffSteps / diffTotal),
    };

    total += diffTotal;
    solved += diffSolved;
    stepSum += diffSteps;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    strategies: STRATEGIES.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    byDifficulty: report,
    overall: {
      total,
      solved,
      solveRate: round2((solved / total) * 100),
      avgSteps: round2(stepSum / total),
    },
  };

  writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');
  console.log(`solve-rate report written: ${outFile}`);
}

main();
