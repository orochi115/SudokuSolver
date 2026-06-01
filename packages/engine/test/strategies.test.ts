import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid } from '../src/grid.js';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { aic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { uniqueness } from '../src/strategies/uniqueness.js';
import { forcingChain } from '../src/strategies/forcing-chain.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('simple-coloring', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = simpleColoring.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('simple-coloring');
    }
  });
});

describe('aic', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = aic.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('aic');
    }
  });
});

describe('als', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = als.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('als');
    }
  });
});

describe('uniqueness', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = uniqueness.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('uniqueness');
    }
  });
});

describe('forcing-chain', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = forcingChain.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('forcing-chain');
    }
  });
});

describe('strategy registry', () => {
  it('all required strategy ids are registered', () => {
    const ids = STRATEGIES.map((s) => s.id);
    const required = [
      'full-house',
      'naked-single',
      'hidden-single',
      'locked-candidates',
      'naked-subset',
      'hidden-subset',
      'basic-fish',
      'single-digit-patterns',
      'xy-wing',
      'xyz-wing',
      'w-wing',
      'simple-coloring',
      'aic',
      'als',
      'uniqueness',
      'sue-de-coq',
      'forcing-chain',
    ];
    for (const id of required) {
      expect(ids).toContain(id);
    }
  });

  it('strategies are ordered by difficulty ascending', () => {
    for (let i = 1; i < STRATEGIES.length; i++) {
      expect(STRATEGIES[i]!.difficulty).toBeGreaterThanOrEqual(STRATEGIES[i - 1]!.difficulty);
    }
  });
});

describe('soundness: first 10 easy puzzles', () => {
  it('produces only sound traces', () => {
    const file = resolve(__dirname, '../../../data/ground-truth/easy.json');
    const records: { puzzle: string; solution: string }[] = JSON.parse(readFileSync(file, 'utf8'));
    for (let i = 0; i < 10; i++) {
      const rec = records[i]!;
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      const result = checkTraceSoundness(trace, rec.solution);
      expect(result.sound).toBe(true);
    }
  });
});