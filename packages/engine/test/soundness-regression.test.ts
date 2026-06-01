import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

const hasGT = DIFFICULTIES.every(d => existsSync(resolve(GT_DIR, `${d}.json`)));

describe.skipIf(!hasGT)('soundness regression (AC-3)', () => {
  it('all 400 ground-truth puzzles produce zero soundness violations', () => {
    let totalViolations = 0;
    for (const diff of DIFFICULTIES) {
      const records = JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
      for (const rec of records) {
        if (!rec.unique) continue;
        const grid = Grid.fromString(rec.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);
        totalViolations += result.violations.length;
        if (result.violations.length > 0) {
          const v = result.violations[0]!;
          console.error(`${diff}: violation at step ${v.stepIndex} (${v.strategyId}) ${v.kind} cell=${v.cell} digit=${v.digit} expected=${v.expected}`);
        }
      }
    }
    expect(totalViolations).toBe(0);
  });
});