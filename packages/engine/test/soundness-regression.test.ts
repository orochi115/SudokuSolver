import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthRecord {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

function load(diff: (typeof DIFFICULTIES)[number]): GroundTruthRecord[] {
  return JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as GroundTruthRecord[];
}

describe('soundness regression over ground-truth corpus (AC-3)', () => {
  it(
    'produces zero soundness violations on all 400 puzzles',
    { timeout: 180_000 },
    () => {
      const violations: string[] = [];

      for (const diff of DIFFICULTIES) {
        const records = load(diff).filter((r) => r.solution !== null && r.unique);
        for (let i = 0; i < records.length; i++) {
          const rec = records[i]!;
          const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
          const sound = checkTraceSoundness(trace, rec.solution!);
          if (!sound.sound) {
            violations.push(`${diff}[${i}] -> ${sound.violations[0]!.strategyId}`);
          }
        }
      }

      expect(violations).toEqual([]);
    },
  );
});
