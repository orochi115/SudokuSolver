import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = resolve(import.meta.dirname);
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const DIFFS = ['easy', 'medium', 'hard', 'diabolical'] as const;

describe('violation debug', () => {
  it('counts violations by strategy', () => {
    const stratViolations: Record<string, number> = {};
    let total = 0;

    for (const diff of DIFFS) {
      const records = JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
      for (const rec of records) {
        if (!rec.unique) continue;
        const grid = Grid.fromString(rec.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);
        for (const v of result.violations) {
          stratViolations[v.strategyId] = (stratViolations[v.strategyId] || 0) + 1;
          total++;
        }
      }
    }
    console.log('Total violations:', total);
    console.log('By strategy:', JSON.stringify(stratViolations));
    expect(total).toBeLessThan(5000); // just so it runs
  });
});