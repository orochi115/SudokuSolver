import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const INPUT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const OUT_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface RecordItem {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface DifficultySummary {
  total: number;
  solved: number;
  rate: number;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const report: Record<string, DifficultySummary> = {};

  for (const diff of DIFFICULTIES) {
    const filePath = resolve(INPUT_DIR, `${diff}.json`);
    let records: RecordItem[] = [];
    try {
      const content = readFileSync(filePath, 'utf8');
      records = JSON.parse(content) as RecordItem[];
    } catch (e) {
      console.warn(`Could not read ${diff}.json:`, e);
      continue;
    }

    let solvedCount = 0;
    for (const rec of records) {
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      if (trace.outcome === 'solved') {
        solvedCount++;
      }
    }

    const rate = records.length > 0 ? (solvedCount / records.length) * 100 : 0;
    report[diff] = {
      total: records.length,
      solved: solvedCount,
      rate: Number(rate.toFixed(2)),
    };
    console.log(`${diff}: ${solvedCount}/${records.length} solved (${rate.toFixed(2)}%)`);
  }

  const outFile = resolve(OUT_DIR, 'solve-rate.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`Report written to ${outFile}`);
}

main();
