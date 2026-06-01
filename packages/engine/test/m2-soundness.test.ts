import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

interface GroundTruthEntry {
  puzzle: string;
  solution: string;
  unique: boolean;
}

function loadGroundTruth(): GroundTruthEntry[] {
  return ['easy', 'medium', 'hard', 'diabolical'].flatMap((difficulty) => {
    const file = resolve(process.cwd(), 'data/ground-truth', `${difficulty}.json`);
    return JSON.parse(readFileSync(file, 'utf8')) as GroundTruthEntry[];
  });
}

describe('M2 ground-truth soundness regression', () => {
  it('keeps every generated step sound across all frozen ground-truth puzzles', () => {
    const groundTruth = loadGroundTruth();
    expect(groundTruth).toHaveLength(400);
    const violations = [];
    for (const entry of groundTruth) {
      const trace = solve(Grid.fromString(entry.puzzle), STRATEGIES);
      const result = checkTraceSoundness(trace, entry.solution);
      violations.push(...result.violations.map((v) => ({ puzzle: entry.puzzle, ...v })));
    }
    expect(violations).toEqual([]);
  });
});
