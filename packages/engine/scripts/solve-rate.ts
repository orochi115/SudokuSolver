import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORT_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface DifficultyReport {
  n: number;
  solved: number;
  solveRate: number;
  violations: number;
}

function main(): void {
  mkdirSync(REPORT_DIR, { recursive: true });

  const strategyIds = STRATEGIES.map(s => s.id);
  const report: Record<string, DifficultyReport> = {};
  let totalViolations = 0;
  let totalPuzzles = 0;

  for (const diff of DIFFICULTIES) {
    const file = resolve(GT_DIR, `${diff}.json`);
    if (!existsSync(file)) {
      console.warn(`skip ${diff}: ${file} not found`);
      continue;
    }
    const records = JSON.parse(readFileSync(file, 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
    const uniqueRecords = records.filter(r => r.unique);

    let solved = 0;
    let violations = 0;
    for (const rec of uniqueRecords) {
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      if (trace.outcome === 'solved') solved++;
      const result = checkTraceSoundness(trace, rec.solution);
      violations += result.violations.length;
    }

    const n = uniqueRecords.length;
    totalPuzzles += n;
    totalViolations += violations;
    report[diff] = { n, solved, solveRate: solved / n, violations };
    console.log(`${diff}: n=${n} solved=${solved} rate=${(solved/n*100).toFixed(1)}% violations=${violations}`);
  }

  const output = {
    strategies: STRATEGIES.length,
    strategyIds,
    totalPuzzles,
    totalViolations,
    report,
  };

  writeFileSync(resolve(REPORT_DIR, 'solve-rate.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(`\nTotal: ${totalPuzzles} puzzles, ${totalViolations} violations`);
  console.log(`Report written to data/reports/solve-rate.json`);
}

main();