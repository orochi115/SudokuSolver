/**
 * AC-3 Soundness Regression Test.
 *
 * For all 400 ground-truth puzzles (100 per difficulty tier), solve each with
 * the full STRATEGIES array and verify that every step in the trace is sound —
 * no bad placements, no bad eliminations.
 *
 * Zero violations is the acceptance criterion.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

function loadGroundTruth(difficulty: string): GroundTruthEntry[] {
  const path = resolve(GT_DIR, `${difficulty}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as GroundTruthEntry[];
}

describe('AC-3 Soundness Regression — all 400 ground-truth puzzles', () => {
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];

  for (const diff of difficulties) {
    it(`${diff}: all puzzles produce zero soundness violations`, () => {
      const entries = loadGroundTruth(diff);
      expect(entries.length).toBe(100);

      const violations: Array<{ puzzle: string; step: number; kind: string; cell: number; digit: number }> = [];

      for (const entry of entries) {
        if (!entry.unique) continue; // skip non-unique (shouldn't exist in GT)

        const grid = Grid.fromString(entry.puzzle);
        const trace = solve(grid, STRATEGIES);

        const result = checkTraceSoundness(trace, entry.solution);
        if (!result.sound) {
          for (const v of result.violations) {
            violations.push({
              puzzle: entry.puzzle,
              step: v.stepIndex,
              kind: v.kind,
              cell: v.cell,
              digit: v.digit,
            });
          }
        }
      }

      if (violations.length > 0) {
        console.error(`${diff}: found ${violations.length} violation(s):`);
        for (const v of violations.slice(0, 5)) {
          console.error(`  puzzle=${v.puzzle.slice(0, 20)}... step=${v.step} kind=${v.kind} cell=${v.cell} digit=${v.digit}`);
        }
      }

      expect(violations).toHaveLength(0);
    });
  }
});
