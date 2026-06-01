import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

interface GroundTruthRecord {
  puzzle: string;
  solution: string;
  unique: boolean;
}

function main() {
  const report: Record<string, { total: number; solved: number; stuck: number; rate: string; soundnessOk: boolean }> = {};

  for (const diff of DIFFICULTIES) {
    const filePath = resolve(REPO_ROOT, `data/ground-truth/${diff}.json`);
    const content = readFileSync(filePath, 'utf8');
    const records: GroundTruthRecord[] = JSON.parse(content);

    let solvedCount = 0;
    let stuckCount = 0;
    let soundnessOk = true;

    for (const record of records) {
      const grid = Grid.fromString(record.puzzle);
      const trace = solve(grid, STRATEGIES);

      if (trace.outcome === 'solved') {
        solvedCount++;
      } else {
        stuckCount++;
      }

      const soundnessResult = checkTraceSoundness(trace, record.solution);
      if (!soundnessResult.sound) {
        soundnessOk = false;
        console.error(`Soundness violation in ${diff} puzzle: ${record.puzzle}`);
        console.error(soundnessResult.violations);
      }
    }

    const rate = (solvedCount / records.length * 100).toFixed(1) + '%';
    report[diff] = {
      total: records.length,
      solved: solvedCount,
      stuck: stuckCount,
      rate,
      soundnessOk
    };

    console.log(`${diff}: total=${records.length} solved=${solvedCount} stuck=${stuckCount} rate=${rate} soundnessOk=${soundnessOk}`);
  }

  const reportDir = resolve(REPO_ROOT, 'data/reports');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(resolve(reportDir, 'solve-rate.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Report written to ${resolve(reportDir, 'solve-rate.json')}`);
}

main();
