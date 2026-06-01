/**
 * Solve-rate script: run the engine against all ground-truth puzzles
 * and report non-brute-force solve rate per difficulty.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface DifficultyReport {
  total: number;
  solved: number;
  stuck: number;
  solveRate: number;
}

interface Report {
  timestamp: string;
  totalPuzzles: number;
  totalSolved: number;
  overallRate: number;
  byDifficulty: Record<string, DifficultyReport>;
}

function run(): void {
  const byDifficulty: Record<string, DifficultyReport> = {};
  let totalPuzzles = 0;
  let totalSolved = 0;

  for (const diff of difficulties) {
    const path = resolve(REPO_ROOT, 'data/ground-truth', `${diff}.json`);
    const data = JSON.parse(readFileSync(path, 'utf8')) as Array<{
      puzzle: string;
      solution: string;
      unique: boolean;
    }>;

    let solved = 0;
    for (const entry of data) {
      const grid = Grid.fromString(entry.puzzle);
      const trace = solve(grid, STRATEGIES);
      if (trace.outcome === 'solved') {
        solved++;
      }
    }

    const report: DifficultyReport = {
      total: data.length,
      solved,
      stuck: data.length - solved,
      solveRate: parseFloat(((solved / data.length) * 100).toFixed(2)),
    };

    byDifficulty[diff] = report;
    totalPuzzles += data.length;
    totalSolved += solved;
  }

  const report: Report = {
    timestamp: new Date().toISOString(),
    totalPuzzles,
    totalSolved,
    overallRate: parseFloat(((totalSolved / totalPuzzles) * 100).toFixed(2)),
    byDifficulty,
  };

  const outDir = resolve(REPO_ROOT, 'data/reports');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'solve-rate.json'), JSON.stringify(report, null, 2));

  console.log('Solve-rate report:');
  console.log(JSON.stringify(report, null, 2));
}

run();
