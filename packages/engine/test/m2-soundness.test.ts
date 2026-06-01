import { describe, expect, it } from 'vitest';
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
const repoRoot = resolve(here, '../../..');
const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;

function loadGroundTruth(difficulty: (typeof difficulties)[number]): GroundTruthEntry[] {
  return JSON.parse(readFileSync(resolve(repoRoot, `data/ground-truth/${difficulty}.json`), 'utf8')) as GroundTruthEntry[];
}

describe('M2 soundness regression', () => {
  it('all ground-truth traces have zero soundness violations', () => {
    const violations: Array<{ difficulty: string; index: number; strategyId: string; cell: number; digit: number }> = [];
    let checked = 0;
    for (const difficulty of difficulties) {
      const entries = loadGroundTruth(difficulty);
      expect(entries).toHaveLength(100);
      expect(entries.every((entry) => entry.unique)).toBe(true);
      entries.forEach((entry, index) => {
        checked++;
        const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
        const result = checkTraceSoundness(trace, entry.solution);
        for (const violation of result.violations) {
          violations.push({ difficulty, index, strategyId: violation.strategyId, cell: violation.cell, digit: violation.digit });
        }
      });
    }

    expect(checked).toBe(400);
    expect(violations).toEqual([]);
  });
});
