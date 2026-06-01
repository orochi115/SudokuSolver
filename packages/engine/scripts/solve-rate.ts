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
const OUT_DIR = resolve(REPO_ROOT, 'data/reports');

interface SolveRateEntry {
  difficulty: string;
  total: number;
  solved: number;
  stuck: number;
  sound: number;
  rate: string;
}

function main(): void {
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
  const report: SolveRateEntry[] = [];

  for (const diff of difficulties) {
    const file = resolve(GT_DIR, `${diff}.json`);
    if (!existsSync(file)) {
      console.warn(`skip ${diff}: ${file} not found`);
      continue;
    }
    const records: { puzzle: string; solution: string; unique: boolean }[] = JSON.parse(readFileSync(file, 'utf8'));
    let solved = 0;
    let sound = 0;
    for (const r of records) {
      const grid = Grid.fromString(r.puzzle);
      const trace = solve(grid, STRATEGIES);
      if (trace.outcome === 'solved') solved++;
      const sr = checkTraceSoundness(trace, r.solution);
      if (sr.sound) sound++;
    }
    const rate = (solved / records.length * 100).toFixed(1);
    report.push({
      difficulty: diff,
      total: records.length,
      solved,
      stuck: records.length - solved,
      sound,
      rate: `${rate}%`,
    });
    console.log(`${diff}: ${solved}/${records.length} solved (${rate}%), sound=${sound}/${records.length}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, 'solve-rate.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Report written to data/reports/solve-rate.json');
}

main();