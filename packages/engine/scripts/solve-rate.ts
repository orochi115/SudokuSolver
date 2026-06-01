/**
 * solve-rate.ts — run solve() on ground-truth tiers and report non-brute solve rate.
 * Output: data/reports/solve-rate.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { findGroundTruth } from '../src/bruteforce.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, '../../..');
const GT_DIR = resolve(REPO, 'data/ground-truth');
const OUT = resolve(REPO, 'data/reports/solve-rate.json');

const tiers = ['easy','medium','hard','diabolical'] as const;

function run() {
  mkdirSync(dirname(OUT), { recursive: true });
  const report: any = { strategies: STRATEGIES.length, strategyIds: STRATEGIES.map(s=>s.id), totalPuzzles:0, totalViolations:0, report:{} };
  for (const tier of tiers) {
    const gtFile = resolve(GT_DIR, `${tier}.json`);
    const arr: Array<{puzzle:string;solution:string;unique:boolean}> = JSON.parse(readFileSync(gtFile,'utf8'));
    let solved=0, violations=0;
    for (const item of arr) {
      const trace = solve(Grid.fromString(item.puzzle), STRATEGIES);
      if (trace.outcome==='solved') solved++;
      const res = checkTraceSoundness(trace, item.solution);
      violations += res.violations.length;
    }
    report.report[tier] = { n: arr.length, solved, solveRate: solved/arr.length, violations };
    report.totalPuzzles += arr.length;
    report.totalViolations += violations;
  }
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('solve-rate report written to', OUT);
  console.log(JSON.stringify(report, null, 2));
}
run();
