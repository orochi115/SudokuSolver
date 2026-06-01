/**
 * Solve-rate report (AC-4).
 *
 * Runs the human-solving engine (no brute force) over each difficulty's
 * ground-truth set and reports the non-brute-force solve rate plus per-strategy
 * usage. Writes data/reports/solve-rate.json.
 *
 * The ground-truth solution is used ONLY to verify soundness (the engine itself
 * never sees it while solving). A puzzle counts as "solved" only if the engine
 * reaches a complete grid using the registered strategies alone.
 *
 * Usage:  npm run solve-rate
 */

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

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface GTRecord {
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
  avgSteps: number;
  strategyUsage: Record<string, number>;
}

function reportFor(records: GTRecord[]): DifficultyReport {
  let solved = 0;
  let stuck = 0;
  let violations = 0;
  let totalSteps = 0;
  const usage: Record<string, number> = {};

  for (const rec of records) {
    const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
    if (trace.outcome === 'solved') solved++;
    else stuck++;
    totalSteps += trace.steps.length;
    for (const step of trace.steps) {
      usage[step.strategyId] = (usage[step.strategyId] ?? 0) + 1;
    }
    const sound = checkTraceSoundness(trace, rec.solution);
    if (!sound.sound) violations += sound.violations.length;
  }

  const total = records.length;
  return {
    total,
    solved,
    stuck,
    solveRate: total === 0 ? 0 : Number((solved / total).toFixed(4)),
    soundnessViolations: violations,
    avgSteps: total === 0 ? 0 : Number((totalSteps / total).toFixed(1)),
    strategyUsage: usage,
  };
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const report: Record<string, DifficultyReport> = {};

  for (const diff of DIFFICULTIES) {
    const file = resolve(GT_DIR, `${diff}.json`);
    if (!existsSync(file)) {
      console.warn(`skip ${diff}: ${file} not found`);
      continue;
    }
    const records = JSON.parse(readFileSync(file, 'utf8')) as GTRecord[];
    const r = reportFor(records);
    report[diff] = r;
    console.log(
      `${diff}: solved ${r.solved}/${r.total} (${(r.solveRate * 100).toFixed(1)}%)  ` +
        `violations=${r.soundnessViolations}  avgSteps=${r.avgSteps}`,
    );
  }

  const out = {
    generatedAt: new Date().toISOString(),
    strategies: STRATEGIES.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    byDifficulty: report,
  };
  const outFile = resolve(OUT_DIR, 'solve-rate.json');
  writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');
  console.log(`report written to ${outFile}`);
}

main();
