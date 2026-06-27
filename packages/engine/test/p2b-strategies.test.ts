import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Grid, maskOf } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

const REQUIRED_P2B_IDS = [
  'subset-exclusion',
  'sue-de-coq-extended',
  'aic-with-exotic-links',
  'twinned-xy-chains',
  'franken-fish',
  'mutant-fish',
  'gurth',
] as const;

const P2B_SOURCE = fileURLToPath(new URL('../src/strategies/p2b-exotic.ts', import.meta.url));

function mask(...digits: number[]): number {
  return digits.reduce((acc, digit) => acc | maskOf(digit), 0);
}

function emptyCandidateGrid(): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  return grid;
}

describe('P2b strategy registration', () => {
  it('registers every required P2b strategy id exactly', () => {
    const ids = STRATEGIES.map((s) => s.id);
    for (const id of REQUIRED_P2B_IDS) expect(ids.includes(id), id).toBe(true);
    for (const id of REQUIRED_P2B_IDS) expect(ids.filter((registered) => registered === id).length, id).toBe(1);
  });

  it('P2b strategies are pure and return named bilingual steps when they apply', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const beforeValues = [...grid.values];
    const beforeCandidates = [...grid.candidates];
    const strategies = STRATEGIES.filter((s) => REQUIRED_P2B_IDS.includes(s.id as (typeof REQUIRED_P2B_IDS)[number]));
    expect(strategies.length).toBe(REQUIRED_P2B_IDS.length);

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

  it('does not use solver/oracle APIs in P2b human-default strategy code', () => {
    const source = readFileSync(P2B_SOURCE, 'utf8');
    expect(source).not.toMatch(/solveBruteforce|countSolutions|findGroundTruth/);
  });
});

describe('P2b subset exclusion owner restored state', () => {
  it('subset-exclusion reuses the aligned-exclusion owner without changing the grid', () => {
    const grid = emptyCandidateGrid();
    grid.candidates[0] = mask(1, 2); // r1c1 base
    grid.candidates[1] = mask(1, 3); // r1c2 aligned base
    grid.candidates[9] = mask(1, 3); // r2c1 common bivalue ALS seen by both base cells
    const beforeValues = [...grid.values];
    const beforeCandidates = [...grid.candidates];

    const step = STRATEGIES.find((s) => s.id === 'subset-exclusion')?.apply(grid);

    expect(step?.strategyId).toBe('subset-exclusion');
    expect(step?.eliminations).toEqual([{ cell: 0, digit: 1 }]);
    expect(step?.placements).toEqual([]);
    expect([...grid.values]).toEqual(beforeValues);
    expect([...grid.candidates]).toEqual(beforeCandidates);
  });
});

describe('P2b Gurth restored state', () => {
  it('gurth places the self-mapped centre digit in a 180-degree compatible puzzle', () => {
    const grid = Grid.fromString('020000709400080020009020406000507000067000230000204000305070900070010005902000070');

    const step = STRATEGIES.find((s) => s.id === 'gurth')?.apply(grid);

    expect(step?.strategyId).toBe('gurth');
    expect(step?.placements).toEqual([{ cell: 40, digit: 9 }]);
    expect(step?.eliminations).toEqual([]);
  });
});
