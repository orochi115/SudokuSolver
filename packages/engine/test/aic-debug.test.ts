import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { fullHouse, nakedSingle, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, singleDigitPatterns, xyWing, xyzWing, wWing, aic } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import type { Strategy } from '../src/strategy.js';

const here = resolve(import.meta.dirname);
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const DIFFS = ['easy', 'medium', 'hard', 'diabolical'] as const;

const M2_PLUS_AIC: readonly Strategy[] = [fullHouse, nakedSingle, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, singleDigitPatterns, xyWing, xyzWing, wWing, aic];

describe('aic debug', () => {
  it('finds first AIC violation', () => {
    const stratViolations: Record<string, number> = {};
    let firstViolation = null as any;
    for (const diff of DIFFS) {
      const records = JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
      for (const rec of records) {
        if (!rec.unique) continue;
        const grid = Grid.fromString(rec.puzzle);
        const trace = solve(grid, M2_PLUS_AIC);
        const result = checkTraceSoundness(trace, rec.solution);
        for (const v of result.violations) {
          stratViolations[v.strategyId] = (stratViolations[v.strategyId] || 0) + 1;
          if (!firstViolation) {
            firstViolation = { diff, puzzle: rec.puzzle.slice(0,40), ...v };
          }
        }
      }
    }
    console.log('AIC+M2 violations by strategy:', JSON.stringify(stratViolations));
    if (firstViolation) {
      console.log('First:', JSON.stringify(firstViolation));
    }
  });
});