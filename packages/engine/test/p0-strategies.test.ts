import { describe, expect, it } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

const byId = (id: string) => STRATEGIES.find((s) => s.id === id)!;
const rc = (r: number, c: number) => (r - 1) * 9 + (c - 1);
const mask = (...digits: number[]) => digits.reduce((m, d) => m | maskOf(d), 0);

function candidateGrid(entries: Array<[number, number[]]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const [cell, digits] of entries) grid.candidates[cell] = mask(...digits);
  return grid;
}

describe('P0 strategy registration', () => {
  it('registers every required P0 strategy id', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(expect.arrayContaining([
      'finned-x-wing',
      'finned-swordfish',
      'finned-jellyfish',
      'turbot-fish',
      'xy-chain',
      'nice-loop',
      'hidden-unique-rectangle',
      'unique-rectangle-type-3',
      'unique-rectangle-type-5',
      'unique-rectangle-type-6',
    ]));
  });
});

describe('P0 fish and chain strategies', () => {
  it('finned-x-wing emits the worked-example eliminations', () => {
    const d = 4;
    const grid = candidateGrid([
      [rc(1, 1), [d]], [rc(1, 4), [d]], [rc(1, 2), [d]],
      [rc(4, 1), [d]], [rc(4, 4), [d]],
      [rc(2, 1), [d]], [rc(3, 1), [d]],
    ]);
    const step = byId('finned-x-wing').apply(grid);
    expect(step?.strategyId).toBe('finned-x-wing');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 1), digit: d }]);
  });

  it('finned-swordfish emits the worked-example elimination', () => {
    const d = 7;
    const grid = candidateGrid([
      [rc(1, 1), [d]], [rc(1, 4), [d]], [rc(1, 7), [d]], [rc(1, 2), [d]],
      [rc(4, 1), [d]], [rc(4, 4), [d]], [rc(4, 7), [d]],
      [rc(7, 1), [d]], [rc(7, 4), [d]], [rc(7, 7), [d]],
      [rc(2, 1), [d]],
    ]);
    const step = byId('finned-swordfish').apply(grid);
    expect(step?.strategyId).toBe('finned-swordfish');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 1), digit: d }]);
  });

  it('finned-jellyfish removes only cover candidates that see every fin', () => {
    const d = 3;
    const grid = candidateGrid([
      [rc(1, 1), [d]], [rc(1, 4), [d]], [rc(1, 7), [d]], [rc(1, 9), [d]], [rc(1, 2), [d]],
      [rc(4, 1), [d]], [rc(4, 4), [d]], [rc(4, 7), [d]], [rc(4, 9), [d]],
      [rc(7, 1), [d]], [rc(7, 4), [d]], [rc(7, 7), [d]], [rc(7, 9), [d]],
      [rc(9, 1), [d]], [rc(9, 4), [d]], [rc(9, 7), [d]], [rc(9, 9), [d]],
      [rc(2, 1), [d]],
      [rc(2, 4), [d]],
    ]);
    const step = byId('finned-jellyfish').apply(grid);
    expect(step?.strategyId).toBe('finned-jellyfish');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 1), digit: d }]);
  });

  it('turbot-fish uses a generic single-digit strong-weak-strong chain', () => {
    const d = 1;
    const grid = candidateGrid([
      [rc(1, 1), [d]], [rc(5, 1), [d]],
      [rc(5, 9), [d]], [rc(3, 9), [d]],
      [rc(1, 7), [d]],
    ]);
    const step = byId('turbot-fish').apply(grid);
    expect(step?.strategyId).toBe('turbot-fish');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 9), digit: d }]);
    expect(step?.highlights.links.map((l) => l.type)).toEqual(['strong', 'weak', 'strong']);
  });

  it('xy-chain emits the worked-example eliminations with bivalue-only links', () => {
    const grid = candidateGrid([
      [rc(1, 7), [5, 9]],
      [rc(1, 5), [2, 9]],
      [rc(1, 1), [2, 6]],
      [rc(3, 2), [5, 6]],
      [rc(1, 3), [5]],
      [rc(3, 7), [5]],
      [rc(3, 9), [5]],
    ]);
    const step = byId('xy-chain').apply(grid);
    expect(step?.strategyId).toBe('xy-chain');
    expect(step?.eliminations).toEqual([
      { cell: rc(3, 7), digit: 5 },
      { cell: rc(3, 9), digit: 5 },
      { cell: rc(1, 3), digit: 5 },
    ]);
  });
});

describe('P0 unique rectangle extensions', () => {
  it('unique-rectangle-type-3 treats roof extras as a pseudo-cell locked subset', () => {
    const grid = candidateGrid([
      [rc(1, 1), [1, 2]], [rc(1, 2), [1, 2]],
      [rc(4, 1), [1, 2, 3]], [rc(4, 2), [1, 2, 4]],
      [rc(4, 3), [3, 4]], [rc(4, 4), [3, 4, 5]],
    ]);
    const step = byId('unique-rectangle-type-3').apply(grid);
    expect(step?.strategyId).toBe('unique-rectangle-type-3');
    expect(step?.eliminations).toEqual([{ cell: rc(4, 4), digit: 3 }, { cell: rc(4, 4), digit: 4 }]);
  });

  it('unique-rectangle-type-5 removes the shared extra digit seen by diagonal extras', () => {
    const grid = candidateGrid([
      [rc(1, 1), [1, 2, 3]], [rc(1, 2), [1, 2, 3]],
      [rc(4, 1), [1, 2, 3]], [rc(4, 2), [1, 2]],
      [rc(2, 1), [3]],
    ]);
    const step = byId('unique-rectangle-type-5').apply(grid);
    expect(step?.strategyId).toBe('unique-rectangle-type-5');
    expect(step?.eliminations).toEqual([{ cell: rc(2, 1), digit: 3 }]);
  });

  it('unique-rectangle-type-6 removes an X-Wing UR digit from diagonal roof cells', () => {
    const grid = candidateGrid([
      [rc(1, 1), [1, 2, 3]], [rc(1, 2), [1, 2]],
      [rc(4, 1), [1, 2]], [rc(4, 2), [1, 2, 4]],
    ]);
    const step = byId('unique-rectangle-type-6').apply(grid);
    expect(step?.strategyId).toBe('unique-rectangle-type-6');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 1), digit: 1 }, { cell: rc(4, 2), digit: 1 }]);
  });

  it('hidden-unique-rectangle removes the opposite UR digit from the diagonal corner', () => {
    const grid = candidateGrid([
      [rc(1, 1), [1, 2]], [rc(1, 2), [1, 2, 5]],
      [rc(4, 1), [1, 2, 6]], [rc(4, 2), [1, 2, 7]],
    ]);
    const step = byId('hidden-unique-rectangle').apply(grid);
    expect(step?.strategyId).toBe('hidden-unique-rectangle');
    expect(step?.eliminations).toEqual([{ cell: rc(4, 2), digit: 2 }]);
  });
});
