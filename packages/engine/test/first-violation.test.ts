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

describe('first violation debug', () => {
  it('finds first diabolical violation', () => {
    const records = JSON.parse(readFileSync(resolve(GT_DIR, 'diabolical.json'), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
    for (const rec of records) {
      if (!rec.unique) continue;
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      const result = checkTraceSoundness(trace, rec.solution);
      if (result.violations.length > 0) {
        const v = result.violations[0]!;
        console.log('First diabolical violation:');
        console.log('  puzzle:', rec.puzzle.slice(0, 40));
        console.log('  step:', v.stepIndex, 'strategy:', v.strategyId, 'kind:', v.kind, 'cell:', v.cell, 'digit:', v.digit, 'expected:', v.expected);
        const step = trace.steps[v.stepIndex]!;
        console.log('  step eliminations:', JSON.stringify(step.eliminations));
        console.log('  step placements:', JSON.stringify(step.placements));
        console.log('  explanation:', step.explanation.en);
        break;
      }
    }
  });

  it('finds first hard violation', () => {
    const records = JSON.parse(readFileSync(resolve(GT_DIR, 'hard.json'), 'utf8')) as { puzzle: string; solution: string; unique: boolean }[];
    for (const rec of records) {
      if (!rec.unique) continue;
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      const result = checkTraceSoundness(trace, rec.solution);
      if (result.violations.length > 0) {
        const v = result.violations[0]!;
        console.log('First hard violation:');
        console.log('  step:', v.stepIndex, 'strategy:', v.strategyId, 'kind:', v.kind, 'cell:', v.cell, 'digit:', v.digit, 'expected:', v.expected);
        const step = trace.steps[v.stepIndex]!;
        console.log('  step eliminations:', JSON.stringify(step.eliminations));
        console.log('  step explanation:', step.explanation.en);
        break;
      }
    }
  });
});