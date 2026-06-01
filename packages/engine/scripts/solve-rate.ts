import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { Grid } from '../src/grid.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../../');
const DATA_DIR = resolve(ROOT, 'data/ground-truth');
const OUT_DIR = resolve(ROOT, 'data/reports');

interface PuzzleEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface TierResult {
  n: number;
  solved: number;
  solveRate: number;
  violations: number;
}

interface Report {
  strategies: number;
  strategyIds: string[];
  totalPuzzles: number;
  totalViolations: number;
  report: Record<string, TierResult>;
}

const tiers = ['easy', 'medium', 'hard', 'diabolical'] as const;
const results: Record<string, TierResult> = {};
let totalViolations = 0;
let totalPuzzles = 0;

for (const tier of tiers) {
  const filePath = resolve(DATA_DIR, tier + '.json');
  const content = readFileSync(filePath, 'utf-8');
  const entries: PuzzleEntry[] = JSON.parse(content);

  let solved = 0;
  let violations = 0;

  for (const entry of entries) {
    const grid = Grid.fromString(entry.puzzle);
    const trace = solve(grid, STRATEGIES);
    const soundness = checkTraceSoundness(trace, entry.solution);
    if (!soundness.sound) {
      violations += soundness.violations.length;
    }
    if (trace.outcome === 'solved') {
      solved++;
    }
    totalPuzzles++;
  }

  const n = entries.length;
  results[tier] = { n, solved, solveRate: solved / n, violations };
  totalViolations += violations;
}

const report: Report = {
  strategies: STRATEGIES.length,
  strategyIds: STRATEGIES.map((s) => s.id),
  totalPuzzles,
  totalViolations,
  report: results,
};

const outPath = resolve(OUT_DIR, 'solve-rate.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('Report written to', outPath);
console.log(JSON.stringify(report, null, 2));