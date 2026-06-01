import { describe, expect, it } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import {
  hiddenSingle,
  lockedCandidates,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
  hiddenQuad,
  xWing,
  swordfish,
  jellyfish,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  xyWing,
  xyzWing,
  wWing,
} from '../src/strategies/index.js';

function rc(r: number, c: number): number {
  return (r - 1) * 9 + (c - 1);
}

function buildGrid(entries: Array<{ cell: number; digits: number[] }>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const { cell, digits } of entries) {
    let mask = 0;
    for (const d of digits) mask |= maskOf(d);
    grid.candidates[cell] = mask;
  }
  return grid;
}

function normalize(items: Array<{ cell: number; digit: number }>): string[] {
  return items
    .map((x) => `${x.cell}:${x.digit}`)
    .sort();
}

describe('M2 strategies', () => {
  it('hidden single places the only location in a house', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2] },
      { cell: rc(1, 2), digits: [2, 3] },
      { cell: rc(1, 3), digits: [3, 4] },
      { cell: rc(1, 4), digits: [4, 5] },
      { cell: rc(1, 5), digits: [5, 6] },
      { cell: rc(1, 6), digits: [6, 7] },
      { cell: rc(1, 7), digits: [7, 8] },
      { cell: rc(1, 8), digits: [8, 9] },
      { cell: rc(1, 9), digits: [1] },
    ]);
    const step = hiddenSingle.apply(g);
    expect(step?.strategyId).toBe('hidden-single');
    expect(step?.placements).toEqual([{ cell: rc(1, 8), digit: 9 }]);
  });

  it('locked candidates finds pointing elimination', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [5] },
      { cell: rc(1, 2), digits: [5] },
      { cell: rc(1, 5), digits: [5, 9] },
    ]);
    const step = lockedCandidates.apply(g);
    expect(step?.strategyId).toBe('locked-candidates');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 5), digit: 5 }]);
  });

  it('naked pair eliminates pair digits from other cells', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2] },
      { cell: rc(1, 2), digits: [1, 2] },
      { cell: rc(1, 3), digits: [1, 2, 3] },
    ]);
    const step = nakedPair.apply(g);
    expect(step?.strategyId).toBe('naked-pair');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 3), digit: 1 },
      { cell: rc(1, 3), digit: 2 },
    ]));
  });

  it('hidden pair removes non-pair digits from pair cells', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2, 3] },
      { cell: rc(1, 2), digits: [1, 2, 4] },
      { cell: rc(1, 3), digits: [3, 4, 5] },
      { cell: rc(1, 4), digits: [5, 6] },
    ]);
    const step = hiddenPair.apply(g);
    expect(step?.strategyId).toBe('hidden-pair');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 1), digit: 3 },
      { cell: rc(1, 2), digit: 4 },
    ]));
  });

  it('naked triple works', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2] },
      { cell: rc(1, 2), digits: [2, 3] },
      { cell: rc(1, 3), digits: [1, 3] },
      { cell: rc(1, 4), digits: [1, 2, 3, 4] },
    ]);
    const step = nakedTriple.apply(g);
    expect(step?.strategyId).toBe('naked-triple');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 4), digit: 1 },
      { cell: rc(1, 4), digit: 2 },
      { cell: rc(1, 4), digit: 3 },
    ]));
  });

  it('hidden triple works', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2, 3, 7] },
      { cell: rc(1, 2), digits: [1, 2, 4] },
      { cell: rc(1, 3), digits: [1, 3, 5] },
      { cell: rc(1, 4), digits: [4, 5, 6] },
      { cell: rc(1, 5), digits: [6, 7, 8] },
    ]);
    const step = hiddenTriple.apply(g);
    expect(step?.strategyId).toBe('hidden-triple');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 1), digit: 7 },
      { cell: rc(1, 2), digit: 4 },
      { cell: rc(1, 3), digit: 5 },
    ]));
  });

  it('naked quad works', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2] },
      { cell: rc(1, 2), digits: [2, 3] },
      { cell: rc(1, 3), digits: [3, 4] },
      { cell: rc(1, 4), digits: [1, 4] },
      { cell: rc(1, 5), digits: [1, 2, 3, 4, 5] },
    ]);
    const step = nakedQuad.apply(g);
    expect(step?.strategyId).toBe('naked-quad');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 5), digit: 1 },
      { cell: rc(1, 5), digit: 2 },
      { cell: rc(1, 5), digit: 3 },
      { cell: rc(1, 5), digit: 4 },
    ]));
  });

  it('hidden quad works', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2, 8] },
      { cell: rc(1, 2), digits: [2, 3, 9] },
      { cell: rc(1, 3), digits: [3, 4, 7] },
      { cell: rc(1, 4), digits: [1, 4, 6] },
      { cell: rc(1, 5), digits: [5, 6, 7] },
    ]);
    const step = hiddenQuad.apply(g);
    expect(step?.strategyId).toBe('hidden-quad');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(1, 1), digit: 8 },
      { cell: rc(1, 2), digit: 9 },
      { cell: rc(1, 3), digit: 7 },
      { cell: rc(1, 4), digit: 6 },
    ]));
  });

  it('x-wing eliminates from cover lines', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [5] },
      { cell: rc(1, 4), digits: [5] },
      { cell: rc(3, 1), digits: [5] },
      { cell: rc(3, 4), digits: [5] },
      { cell: rc(5, 1), digits: [5] },
      { cell: rc(6, 4), digits: [5] },
    ]);
    const step = xWing.apply(g);
    expect(step?.strategyId).toBe('x-wing');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(5, 1), digit: 5 },
      { cell: rc(6, 4), digit: 5 },
    ]));
  });

  it('swordfish eliminates from cover lines', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [6] },
      { cell: rc(1, 4), digits: [6] },
      { cell: rc(1, 7), digits: [6] },
      { cell: rc(3, 1), digits: [6] },
      { cell: rc(3, 4), digits: [6] },
      { cell: rc(3, 7), digits: [6] },
      { cell: rc(5, 1), digits: [6] },
      { cell: rc(5, 4), digits: [6] },
      { cell: rc(5, 7), digits: [6] },
      { cell: rc(8, 1), digits: [6] },
      { cell: rc(9, 7), digits: [6] },
    ]);
    const step = swordfish.apply(g);
    expect(step?.strategyId).toBe('swordfish');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(8, 1), digit: 6 },
      { cell: rc(9, 7), digit: 6 },
    ]));
  });

  it('jellyfish eliminates from cover lines', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [7] },
      { cell: rc(1, 3), digits: [7] },
      { cell: rc(1, 5), digits: [7] },
      { cell: rc(1, 7), digits: [7] },
      { cell: rc(3, 1), digits: [7] },
      { cell: rc(3, 3), digits: [7] },
      { cell: rc(3, 5), digits: [7] },
      { cell: rc(3, 7), digits: [7] },
      { cell: rc(5, 1), digits: [7] },
      { cell: rc(5, 3), digits: [7] },
      { cell: rc(5, 5), digits: [7] },
      { cell: rc(5, 7), digits: [7] },
      { cell: rc(7, 1), digits: [7] },
      { cell: rc(7, 3), digits: [7] },
      { cell: rc(7, 5), digits: [7] },
      { cell: rc(7, 7), digits: [7] },
      { cell: rc(9, 1), digits: [7] },
      { cell: rc(8, 7), digits: [7] },
    ]);
    const step = jellyfish.apply(g);
    expect(step?.strategyId).toBe('jellyfish');
    expect(normalize(step?.eliminations ?? [])).toEqual(normalize([
      { cell: rc(9, 1), digit: 7 },
      { cell: rc(8, 7), digit: 7 },
    ]));
  });

  it('skyscraper eliminates via turbot pattern', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [7] },
      { cell: rc(1, 5), digits: [7] },
      { cell: rc(4, 1), digits: [7] },
      { cell: rc(4, 6), digits: [7] },
      { cell: rc(4, 5), digits: [7] },
    ]);
    const step = skyscraper.apply(g);
    expect(step?.strategyId).toBe('skyscraper');
    expect(step?.eliminations).toEqual([{ cell: rc(4, 6), digit: 7 }]);
  });

  it('2-string kite eliminates candidate', () => {
    const g = buildGrid([
      { cell: rc(2, 2), digits: [8] },
      { cell: rc(2, 8), digits: [8] },
      { cell: rc(1, 1), digits: [8] },
      { cell: rc(6, 1), digits: [8] },
      { cell: rc(6, 8), digits: [8] },
    ]);
    const step = twoStringKite.apply(g);
    expect(step?.strategyId).toBe('two-string-kite');
    expect(step?.eliminations).toEqual([{ cell: rc(6, 8), digit: 8 }]);
  });

  it('empty rectangle style turbot eliminates candidate', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [4] },
      { cell: rc(2, 2), digits: [4] },
      { cell: rc(1, 5), digits: [4] },
      { cell: rc(1, 9), digits: [4] },
      { cell: rc(2, 9), digits: [4] },
    ]);
    const step = emptyRectangle.apply(g);
    expect(step?.strategyId).toBe('empty-rectangle');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 5), digit: 4 }]);
  });

  it('xy-wing eliminates Z from common peers', () => {
    const g = buildGrid([
      { cell: rc(2, 2), digits: [1, 2] },
      { cell: rc(2, 5), digits: [1, 3] },
      { cell: rc(5, 2), digits: [2, 3] },
      { cell: rc(5, 5), digits: [3] },
    ]);
    const step = xyWing.apply(g);
    expect(step?.strategyId).toBe('xy-wing');
    expect(step?.eliminations).toEqual([{ cell: rc(5, 5), digit: 3 }]);
  });

  it('xyz-wing eliminates Z from cells seeing pivot and pincers', () => {
    const g = buildGrid([
      { cell: rc(2, 2), digits: [1, 2, 3] },
      { cell: rc(2, 3), digits: [1, 3] },
      { cell: rc(3, 2), digits: [2, 3] },
      { cell: rc(3, 3), digits: [3] },
    ]);
    const step = xyzWing.apply(g);
    expect(step?.strategyId).toBe('xyz-wing');
    expect(step?.eliminations).toEqual([{ cell: rc(3, 3), digit: 3 }]);
  });

  it('w-wing eliminates opposite digit through bridge link', () => {
    const g = buildGrid([
      { cell: rc(1, 1), digits: [1, 2] },
      { cell: rc(4, 4), digits: [1, 2] },
      { cell: rc(1, 2), digits: [1] },
      { cell: rc(4, 2), digits: [1] },
      { cell: rc(1, 4), digits: [2] },
    ]);
    const step = wWing.apply(g);
    expect(step?.strategyId).toBe('w-wing');
    expect(step?.eliminations).toEqual([{ cell: rc(1, 4), digit: 2 }]);
  });
});
