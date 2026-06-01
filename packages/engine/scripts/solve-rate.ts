import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  solved: number;
  stuck: number;
  solveRate: number;
  soundnessViolations: number;
  averageSteps: number;
  maxSteps: number;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;

function loadGroundTruth(difficulty: string): GroundTruthEntry[] {
  return JSON.parse(readFileSync(resolve(repoRoot, `data/ground-truth/${difficulty}.json`), 'utf8')) as GroundTruthEntry[];
}

const byDifficulty: Record<string, DifficultyReport> = {};

for (const difficulty of difficulties) {
  const entries = loadGroundTruth(difficulty);
  let solved = 0;
  let soundnessViolations = 0;
  let totalSteps = 0;
  let maxSteps = 0;

  for (const entry of entries) {
    const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
    if (trace.outcome === 'solved') solved++;
    const soundness = checkTraceSoundness(trace, entry.solution);
    soundnessViolations += soundness.violations.length;
    totalSteps += trace.steps.length;
    maxSteps = Math.max(maxSteps, trace.steps.length);
  }

  byDifficulty[difficulty] = {
    total: entries.length,
    solved,
    stuck: entries.length - solved,
    solveRate: entries.length === 0 ? 0 : solved / entries.length,
    soundnessViolations,
    averageSteps: entries.length === 0 ? 0 : totalSteps / entries.length,
    maxSteps,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  strategies: STRATEGIES.map((strategy) => ({ id: strategy.id, difficulty: strategy.difficulty })),
  byDifficulty,
};

const outPath = resolve(repoRoot, 'data/reports/solve-rate.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

for (const difficulty of difficulties) {
  const item = byDifficulty[difficulty]!;
  const pct = (item.solveRate * 100).toFixed(1);
  console.log(`${difficulty}: ${item.solved}/${item.total} solved (${pct}%), soundness violations ${item.soundnessViolations}, avg steps ${item.averageSteps.toFixed(1)}`);
}
console.log(`wrote ${outPath}`);
