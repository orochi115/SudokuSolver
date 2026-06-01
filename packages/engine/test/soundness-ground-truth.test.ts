import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

type GroundTruthRecord = {
  puzzle: string;
  solution: string | null;
  unique: boolean;
};

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const files = ['easy', 'medium', 'hard', 'diabolical'] as const;

describe('ground-truth soundness regression (AC-3)', () => {
  it('has zero soundness violations across all 400 puzzles', () => {
    const violations: string[] = [];

    for (const diff of files) {
      const data = JSON.parse(
        readFileSync(resolve(root, `data/ground-truth/${diff}.json`), 'utf8'),
      ) as GroundTruthRecord[];

      for (let i = 0; i < data.length; i++) {
        const item = data[i]!;
        if (!item.solution || !item.unique) continue;
        const trace = solve(Grid.fromString(item.puzzle), STRATEGIES);
        const result = checkTraceSoundness(trace, item.solution);
        if (!result.sound) {
          violations.push(`${diff}[${i}] ${result.violations[0]!.kind} @ step ${result.violations[0]!.stepIndex}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
