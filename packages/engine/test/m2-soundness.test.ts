import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { fullHouse, nakedSingle, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, singleDigitPatterns, xyWing, xyzWing, wWing } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import type { Strategy } from '../src/strategy.js';

const here = resolve(import.meta.dirname);
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const DIFFS = ['easy', 'medium', 'hard', 'diabolical'] as const;

const M2_STRATEGIES: readonly Strategy[] = [
  fullHouse, nakedSingle, hiddenSingle, lockedCandidates,
  nakedSubset, hiddenSubset, basicFish, singleDigitPatterns,
  xyWing, xyzWing, wWing,
];

describe('M2 strategies soundness', () => {
  it('M2 strategies alone produce zero violations on all 400 puzzles', () => {
    let totalViolations = 0;
    const stratViolations: Record<string, number> = {};
    for (const diff of DIFFS) {
      const records = JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
      for (const rec of records) {
        if (!rec.unique) continue;
        const grid = Grid.fromString(rec.puzzle);
        const trace = solve(grid, M2_STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);
        totalViolations += result.violations.length;
        for (const v of result.violations) {
          stratViolations[v.strategyId] = (stratViolations[v.strategyId] || 0) + 1;
        }
      }
    }
    console.log('M2 violations:', totalViolations);
    console.log('By strategy:', JSON.stringify(stratViolations));
    expect(totalViolations).toBe(0);
  });
});