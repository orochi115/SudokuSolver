import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { fullHouse, nakedSingle, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, singleDigitPatterns, xyWing, xyzWing, wWing, simpleColoring, aic, als, uniqueness, sueDeCoq, forcingChain } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import type { Strategy } from '../src/strategy.js';

const here = resolve(import.meta.dirname);
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');
const DIFFS = ['easy', 'medium', 'hard', 'diabolical'] as const;

const M2: readonly Strategy[] = [fullHouse, nakedSingle, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, singleDigitPatterns, xyWing, xyzWing, wWing];

const M3_STRATEGIES: [string, Strategy][] = [
  ['simple-coloring', simpleColoring],
  ['aic', aic],
  ['als', als],
  ['uniqueness', uniqueness],
  ['sue-de-coq', sueDeCoq],
  ['forcing-chain', forcingChain],
];

describe('per-strategy soundness', () => {
  for (const [name, strat] of M3_STRATEGIES) {
    it(`${name} + M2 produces zero violations`, () => {
      const strategies: readonly Strategy[] = [...M2, strat];
      let total = 0;
      for (const diff of DIFFS) {
        const records = JSON.parse(readFileSync(resolve(GT_DIR, `${diff}.json`), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
        for (const rec of records) {
          if (!rec.unique) continue;
          const grid = Grid.fromString(rec.puzzle);
          const trace = solve(grid, strategies);
          const result = checkTraceSoundness(trace, rec.solution);
          total += result.violations.length;
        }
      }
      console.log(`${name} violations: ${total}`);
      expect(total).toBe(0);
    });
  }
});