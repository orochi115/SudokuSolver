import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthItem {
  puzzle: string;
  solution: string | null;
  unique: boolean;
}

function readGroundTruth(path: string): GroundTruthItem[] {
  return JSON.parse(readFileSync(path, 'utf8')) as GroundTruthItem[];
}

describe('AC-3 soundness regression on ground-truth corpus', () => {
  it('keeps zero violations on all 400 frozen puzzles', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = resolve(here, '../../..');
    const levels = ['easy', 'medium', 'hard', 'diabolical'] as const;

    const violations: string[] = [];
    let checked = 0;

    for (const level of levels) {
      const path = resolve(root, `data/ground-truth/${level}.json`);
      const items = readGroundTruth(path);
      for (const item of items) {
        if (!item.unique || item.solution === null) continue;
        const trace = solve(Grid.fromString(item.puzzle), STRATEGIES);
        const result = checkTraceSoundness(trace, item.solution);
        checked++;
        if (!result.sound) {
          const first = result.violations[0]!;
          violations.push(
            `${level} puzzle ${item.puzzle.slice(0, 18)}... step=${first.stepIndex} strategy=${first.strategyId} ${first.kind} cell=${first.cell} digit=${first.digit} expected=${first.expected}`,
          );
        }
      }
    }

    expect(checked).toBe(400);
    expect(violations).toEqual([]);
  }, 120000);
});
