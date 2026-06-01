/**
 * Solve-rate reporter.
 *
 * Runs solve() with the full STRATEGIES list against data/ground-truth/*.json
 * and writes data/reports/solve-rate.json with per-difficulty non-brute success rates.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const GT_DIR = resolve(ROOT, 'data/ground-truth');
const OUT_DIR = resolve(ROOT, 'data/reports');

interface Report {
  generatedAt: string;
  totalPuzzles: number;
  byDifficulty: Record<string, { solved: number; stuck: number; rate: number; total: number }>;
  soundnessViolations: number;
}

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const diffs = ['easy', 'medium', 'hard', 'diabolical'] as const;
  const report: Report = {
    generatedAt: new Date().toISOString(),
    totalPuzzles: 0,
    byDifficulty: {},
    soundnessViolations: 0,
  };

  for (const diff of diffs) {
    const puzzles: string[] = loadJson(resolve(GT_DIR, `${diff}.json`));
    let solved = 0;
    let stuck = 0;
    let violations = 0;
    for (const entry of puzzles as any[]) {
      const puzzle = entry.puzzle ?? entry;
      const solution = entry.solution ?? solveBruteforce(puzzle)!;
      const trace = solve(Grid.fromString(puzzle), STRATEGIES);
      const sound = checkTraceSoundness(trace, solution);
      if (!sound.sound) violations++;
      if (trace.outcome === 'solved') solved++;
      else stuck++;
    }
    const total = puzzles.length;
    report.totalPuzzles += total;
    report.byDifficulty[diff] = {
      solved,
      stuck,
      rate: total ? solved / total : 0,
      total,
    };
    report.soundnessViolations += violations;
  }

  writeFileSync(resolve(OUT_DIR, 'solve-rate.json'), JSON.stringify(report, null, 2));
  console.log('Solve-rate report written to data/reports/solve-rate.json');
  console.log(JSON.stringify(report, null, 2));
}

main();
