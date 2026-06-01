import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthRecord {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  solved: number;
  stuck: number;
  solveRate: number;
  avgSteps: number;
}

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const OUT_DIR = resolve(REPO_ROOT, 'data/reports');
const OUT_FILE = resolve(OUT_DIR, 'solve-rate.json');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

function readRecords(diff: (typeof DIFFICULTIES)[number]): GroundTruthRecord[] {
  const file = resolve(GT_DIR, `${diff}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as GroundTruthRecord[];
}

function run(): void {
  const byDifficulty: Record<string, DifficultyReport> = {};
  for (const diff of DIFFICULTIES) {
    const records = readRecords(diff).filter((r) => r.solution !== null && r.unique);
    let solved = 0;
    let totalSteps = 0;
    for (const rec of records) {
      const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
      if (trace.outcome === 'solved') solved++;
      totalSteps += trace.steps.length;
    }
    const total = records.length;
    const stuck = total - solved;
    byDifficulty[diff] = {
      total,
      solved,
      stuck,
      solveRate: total === 0 ? 0 : Number(((solved / total) * 100).toFixed(2)),
      avgSteps: total === 0 ? 0 : Number((totalSteps / total).toFixed(2)),
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    strategyOrder: STRATEGIES.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    byDifficulty,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(report, null, 2) + '\n');
  console.log(`solve-rate report written to ${OUT_FILE}`);
}

run();
