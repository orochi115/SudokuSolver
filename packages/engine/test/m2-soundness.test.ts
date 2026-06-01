import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

function loadGroundTruth(difficulty: string): GroundTruthEntry[] {
  return JSON.parse(readFileSync(resolve(repoRoot, `data/ground-truth/${difficulty}.json`), 'utf8')) as GroundTruthEntry[];
}

describe('M2 corpus soundness regression', () => {
  it('keeps every step sound across all frozen ground-truth puzzles', () => {
    const violations: string[] = [];

    for (const difficulty of difficulties) {
      for (const [index, entry] of loadGroundTruth(difficulty).entries()) {
        const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
        const result = checkTraceSoundness(trace, entry.solution);
        for (const violation of result.violations) {
          violations.push(`${difficulty}[${index}] step ${violation.stepIndex} ${violation.strategyId} ${violation.kind} c${violation.cell} d${violation.digit} expected ${violation.expected}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
