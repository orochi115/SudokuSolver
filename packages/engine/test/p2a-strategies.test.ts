import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Grid, maskOf } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

const REQUIRED_P2A_IDS = [
  'vwxyz-wing',
  'exocet',
  'sk-loop',
  'msls',
  'fireworks',
  'aligned-pair-exclusion',
  'aligned-triple-exclusion',
] as const;

const P2A_SOURCE = fileURLToPath(new URL('../src/strategies/p2a-exotic.ts', import.meta.url));

function mask(...digits: number[]): number {
  return digits.reduce((acc, digit) => acc | maskOf(digit), 0);
}

function emptyCandidateGrid(): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  return grid;
}

describe('P2a strategy registration', () => {
  it('registers every required P2a strategy id exactly', () => {
    const ids = STRATEGIES.map((s) => s.id);
    for (const id of REQUIRED_P2A_IDS) expect(ids.includes(id), id).toBe(true);
    for (const id of REQUIRED_P2A_IDS) expect(ids.filter((registered) => registered === id).length, id).toBe(1);
  });

  it('P2a strategies are pure and return named bilingual steps when they apply', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const beforeValues = [...grid.values];
    const beforeCandidates = [...grid.candidates];
    const strategies = STRATEGIES.filter((s) => REQUIRED_P2A_IDS.includes(s.id as (typeof REQUIRED_P2A_IDS)[number]));
    expect(strategies.length).toBe(REQUIRED_P2A_IDS.length);

    for (const strategy of strategies) {
      const step = strategy.apply(grid);
      if (step) {
        expect(step.strategyId).toBe(strategy.id);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
        expect(Array.isArray(step.highlights.links)).toBe(true);
      }
      expect([...grid.values], strategy.id).toEqual(beforeValues);
      expect([...grid.candidates], strategy.id).toEqual(beforeCandidates);
    }
  });

  it('does not use solver/oracle APIs in P2a human-default strategy code', () => {
    const source = readFileSync(P2A_SOURCE, 'utf8');
    expect(source).not.toMatch(/solveBruteforce|countSolutions|findGroundTruth/);
  });
});

describe('P2a aligned exclusion restored states', () => {
  it('aligned-pair-exclusion removes a base candidate absent from every surviving pairing', () => {
    const grid = emptyCandidateGrid();
    grid.candidates[0] = mask(1, 2); // r1c1 base
    grid.candidates[1] = mask(1, 3); // r1c2 aligned base
    grid.candidates[9] = mask(1, 3); // r2c1 common bivalue ALS seen by both base cells

    const step = STRATEGIES.find((s) => s.id === 'aligned-pair-exclusion')?.apply(grid);

    expect(step?.strategyId).toBe('aligned-pair-exclusion');
    expect(step?.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step?.placements).toEqual([]);
  });

  it('aligned-triple-exclusion removes a base candidate absent from every surviving triple', () => {
    const grid = emptyCandidateGrid();
    grid.candidates[0] = mask(1, 2); // r1c1 base
    grid.candidates[1] = mask(1, 3); // r1c2 aligned base
    grid.candidates[2] = mask(4, 5); // r1c3 aligned base
    grid.candidates[9] = mask(1, 3); // r2c1 common bivalue ALS seen by all three base cells

    const step = STRATEGIES.find((s) => s.id === 'aligned-triple-exclusion')?.apply(grid);

    expect(step?.strategyId).toBe('aligned-triple-exclusion');
    expect(step?.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step?.placements).toEqual([]);
  });
});
