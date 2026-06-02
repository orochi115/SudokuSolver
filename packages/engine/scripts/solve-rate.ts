/**
 * Solve-rate reporter.
 *
 * Runs the solver against the ground-truth corpus and reports non-brute-force
 * solve rates per difficulty level. Outputs data/reports/solve-rate.json.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const DATA_DIR = resolve(REPO_ROOT, 'data');
const REPORT_DIR = resolve(DATA_DIR, 'reports');

interface Puzzle {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface SolveRateResult {
  difficulty: string;
  total: number;
  solved: number;
  stuck: number;
  solveRate: number;
  soundViolations: number;
}

async function main() {
  mkdirSync(REPORT_DIR, { recursive: true });

  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
  const results: SolveRateResult[] = [];

  for (const diff of difficulties) {
    const filePath = resolve(DATA_DIR, 'ground-truth', `${diff}.json`);
    let puzzles: Puzzle[] = [];
    try {
      const raw = readFileSync(filePath, 'utf8');
      puzzles = JSON.parse(raw);
    } catch {
      console.warn(`Could not load ${filePath}, skipping.`);
      continue;
    }

    let solved = 0;
    let stuck = 0;
    let soundViolations = 0;

    for (const { puzzle, solution } of puzzles) {
      try {
        const trace = solve(Grid.fromString(puzzle), STRATEGIES);

        if (trace.outcome === 'solved') {
          solved++;
          const soundResult = checkTraceSoundness(trace, solution);
          if (!soundResult.sound) {
            soundViolations += soundResult.violations.length;
          }
        } else {
          stuck++;
        }
      } catch (e) {
        console.error(`Error solving puzzle: ${puzzle.slice(0, 20)}...`, e);
        stuck++;
      }
    }

    const total = puzzles.length;
    const solveRate = total > 0 ? solved / total : 0;

    results.push({
      difficulty: diff,
      total,
      solved,
      stuck,
      solveRate,
      soundViolations,
    });

    console.log(`${diff}: ${solved}/${total} solved (${(solveRate * 100).toFixed(1)}%), violations: ${soundViolations}`);
  }

  const report = { generated: new Date().toISOString(), results };
  writeFileSync(resolve(REPORT_DIR, 'solve-rate.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${resolve(REPORT_DIR, 'solve-rate.json')}`);
}

main().catch(console.error);
