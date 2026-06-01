import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const DATA_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const REPORT_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface SolveRateEntry {
  sampled: number;
  solved: number;
  stuck: number;
  sound: number;
  rate: string;
}

function main(): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  const report: Record<string, SolveRateEntry> = {};

  for (const diff of DIFFICULTIES) {
    const file = resolve(DATA_DIR, `${diff}.json`);
    if (!existsSync(file)) {
      console.warn(`Skip ${diff}: ${file} not found`);
      continue;
    }
    const records: { puzzle: string; solution: string }[] = JSON.parse(readFileSync(file, 'utf8'));
    let solved = 0;
    let stuck = 0;
    let sound = 0;

    for (const rec of records) {
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      if (trace.outcome === 'solved') solved++;
      else stuck++;

      const result = checkTraceSoundness(trace, rec.solution);
      if (result.sound) sound++;
    }

    report[diff] = {
      sampled: records.length,
      solved,
      stuck,
      sound,
      rate: `${((solved / records.length) * 100).toFixed(1)}%`,
    };

    console.log(`${diff}: solved=${solved}/${records.length} (${report[diff]!.rate}), sound=${sound}/${records.length}`);
  }

  const outFile = resolve(REPORT_DIR, 'solve-rate.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`Report written to ${outFile}`);
}

main();