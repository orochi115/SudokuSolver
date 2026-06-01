import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GROUND_TRUTH_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const OUT_DIR = resolve(REPO_ROOT, 'data/reports');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface GroundTruthRecord {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface DifficultyReport {
  total: number;
  solved: number;
  solveRate: string;
  violationsCount: number;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const report: Record<string, DifficultyReport> = {};

  let allSound = true;
  let totalViolations = 0;

  for (const diff of DIFFICULTIES) {
    const truthFile = resolve(GROUND_TRUTH_DIR, `${diff}.json`);
    if (!existsSync(truthFile)) {
      console.warn(`Ground truth file not found for ${diff}: ${truthFile}`);
      continue;
    }

    const records: GroundTruthRecord[] = JSON.parse(readFileSync(truthFile, 'utf8'));
    let solvedCount = 0;
    let categoryViolations = 0;

    for (const record of records) {
      const grid = Grid.fromString(record.puzzle);
      const trace = solve(grid, STRATEGIES);

      if (trace.outcome === 'solved') {
        solvedCount++;
      }

      // Perform soundness check against the ground-truth solution
      const soundness = checkTraceSoundness(trace, record.solution);
      if (!soundness.sound) {
        categoryViolations += soundness.violations.length;
        console.error(`Soundness violations found in ${diff} for puzzle: ${record.puzzle}`);
        soundness.violations.forEach((v) => {
          console.error(`  Step ${v.stepIndex} (${v.strategyId}): ${v.kind} at cell ${v.cell}, expected ${v.expected}, got ${v.digit}`);
        });
      }
    }

    totalViolations += categoryViolations;
    const rate = ((solvedCount / records.length) * 100).toFixed(2) + '%';
    report[diff] = {
      total: records.length,
      solved: solvedCount,
      solveRate: rate,
      violationsCount: categoryViolations,
    };

    console.log(`${diff}: total=${records.length} solved=${solvedCount} rate=${rate} violations=${categoryViolations}`);
  }

  const outFile = resolve(OUT_DIR, 'solve-rate.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nSolve rate report written to ${outFile}`);

  if (totalViolations > 0) {
    console.error(`\nERROR: Found ${totalViolations} soundness violations across the ground-truth set!`);
    process.exit(1);
  } else {
    console.log('\nSUCCESS: All solved steps are 100% sound (zero violations)!');
  }
}

main();
