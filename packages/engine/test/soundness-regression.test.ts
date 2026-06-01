import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;

function loadGroundTruth(diff: string): Array<{ puzzle: string; solution: string; unique: boolean }> {
  const path = resolve(REPO_ROOT, 'data/ground-truth', `${diff}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('soundness regression (AC-3)', () => {
  for (const diff of difficulties) {
    it(`has zero violations on all ${diff} puzzles`, () => {
      const puzzles = loadGroundTruth(diff);
      let totalViolations = 0;
      for (const entry of puzzles) {
        const grid = Grid.fromString(entry.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, entry.solution);
        if (!result.sound) {
          totalViolations += result.violations.length;
          // Log first few violations for debugging
          if (totalViolations <= 5) {
            console.log(`Violation in ${diff}:`, result.violations[0]);
          }
        }
      }
      expect(totalViolations).toBe(0);
    });
  }
});
