import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const GT_DIR = resolve(ROOT, 'data/ground-truth');

function load<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(GT_DIR, name), 'utf8')) as T;
}

describe('M2 soundness regression (AC-3)', () => {
  it('produces zero violations on all 400 ground-truth puzzles', () => {
    const diffs = ['easy', 'medium', 'hard', 'diabolical'] as const;
    let totalViolations = 0;
    for (const diff of diffs) {
      const entries: { puzzle: string; solution: string }[] = load(`${diff}.json`);
      for (const { puzzle, solution } of entries) {
        const trace = solve(Grid.fromString(puzzle), STRATEGIES);
        const res = checkTraceSoundness(trace, solution);
        if (!res.sound) totalViolations += res.violations.length;
      }
    }
    expect(totalViolations).toBe(0);
  });
});
