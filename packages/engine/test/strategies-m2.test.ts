import { describe, expect, it } from 'vitest';
import { ALL_CANDIDATES, Grid, maskOf } from '../src/grid.js';
import type { Strategy } from '../src/strategy.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { pointing } from '../src/strategies/pointing.js';
import { claiming } from '../src/strategies/claiming.js';
import { nakedPair } from '../src/strategies/naked-pair.js';
import { nakedTriple } from '../src/strategies/naked-triple.js';
import { nakedQuad } from '../src/strategies/naked-quad.js';
import { hiddenPair } from '../src/strategies/hidden-pair.js';
import { hiddenTriple } from '../src/strategies/hidden-triple.js';
import { hiddenQuad } from '../src/strategies/hidden-quad.js';
import { xWing } from '../src/strategies/x-wing.js';
import { swordfish } from '../src/strategies/swordfish.js';
import { jellyfish } from '../src/strategies/jellyfish.js';
import { skyscraper } from '../src/strategies/skyscraper.js';
import { twoStringKite } from '../src/strategies/two-string-kite.js';
import { emptyRectangle } from '../src/strategies/empty-rectangle.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';

function cell(row: number, col: number): number {
  return row * 9 + col;
}

function mask(...digits: number[]): number {
  return digits.reduce((acc, digit) => acc | maskOf(digit), 0);
}

function candidateGrid(entries: Array<[number, number[]]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const [c, digits] of entries) grid.candidates[c] = mask(...digits);
  return grid;
}

function expectPure(strategy: Strategy, grid: Grid): void {
  const before = grid.toString();
  const beforeCandidates = Array.from(grid.candidates);
  strategy.apply(grid);
  expect(grid.toString()).toBe(before);
  expect(Array.from(grid.candidates)).toEqual(beforeCandidates);
}

describe('M2 strategies', () => {
  it('full house places the last empty cell in a house', () => {
    const grid = Grid.fromString('123456780' + '0'.repeat(72));
    const step = fullHouse.apply(grid);
    expect(step?.strategyId).toBe('full-house');
    expect(step?.placements).toEqual([{ cell: cell(0, 8), digit: 9 }]);
    expect(step?.eliminations).toEqual([]);
    expect(step?.highlights).toEqual({ cells: [0, 1, 2, 3, 4, 5, 6, 7, 8], candidates: [{ cell: cell(0, 8), digit: 9 }], links: [] });
    expectPure(fullHouse, grid);
  });

  it('hidden single places the only candidate location for a digit in a house', () => {
    const grid = candidateGrid([
      [cell(0, 0), [1, 2, 3, 4, 6, 7, 8, 9]],
      [cell(0, 1), [1, 2, 3, 4, 5, 6, 7, 8, 9]],
      [cell(0, 2), [1, 2, 3, 4, 6, 7, 8, 9]],
      [cell(0, 3), [1, 2, 3, 4, 6, 7, 8, 9]],
    ]);
    const step = hiddenSingle.apply(grid);
    expect(step?.strategyId).toBe('hidden-single');
    expect(step?.placements).toEqual([{ cell: cell(0, 1), digit: 5 }]);
    expect(step?.eliminations).toEqual([]);
    expect(step?.highlights).toEqual({ cells: [cell(0, 0), cell(0, 1), cell(0, 2), cell(0, 3)], candidates: [{ cell: cell(0, 1), digit: 5 }], links: [] });
    expectPure(hiddenSingle, grid);
  });

  it('pointing eliminates from a line outside the box', () => {
    const grid = candidateGrid([
      [cell(0, 0), [7]],
      [cell(0, 1), [7]],
      [cell(0, 3), [7]],
      [cell(0, 4), [7]],
    ]);
    const step = pointing.apply(grid);
    expect(step?.strategyId).toBe('pointing');
    expect(step?.placements).toEqual([]);
    expect(step?.eliminations).toEqual([{ cell: cell(0, 3), digit: 7 }, { cell: cell(0, 4), digit: 7 }]);
    expect(step?.highlights).toEqual({ cells: [cell(0, 0), cell(0, 1)], candidates: [{ cell: cell(0, 0), digit: 7 }, { cell: cell(0, 1), digit: 7 }], links: [] });
    expectPure(pointing, grid);
  });

  it('claiming eliminates from a box outside the line', () => {
    const grid = candidateGrid([
      [cell(0, 0), [6]],
      [cell(0, 1), [6]],
      [cell(1, 0), [6]],
      [cell(2, 0), [6]],
    ]);
    const step = claiming.apply(grid);
    expect(step?.strategyId).toBe('claiming');
    expect(step?.eliminations).toEqual([{ cell: cell(1, 0), digit: 6 }, { cell: cell(2, 0), digit: 6 }]);
    expect(step?.highlights).toEqual({ cells: [cell(0, 0), cell(0, 1)], candidates: [{ cell: cell(0, 0), digit: 6 }, { cell: cell(0, 1), digit: 6 }], links: [] });
    expectPure(claiming, grid);
  });

  it.each([
    ['naked-pair', nakedPair, [[cell(0, 0), [1, 2]], [cell(0, 1), [1, 2]], [cell(0, 2), [1, 3]], [cell(0, 3), [2, 3]]] as Array<[number, number[]]>, [{ cell: cell(0, 2), digit: 1 }, { cell: cell(0, 3), digit: 2 }]],
    ['naked-triple', nakedTriple, [[cell(0, 0), [1, 2]], [cell(0, 1), [1, 3]], [cell(0, 2), [2, 3]], [cell(0, 3), [1, 4]], [cell(0, 4), [3, 4]]] as Array<[number, number[]]>, [{ cell: cell(0, 3), digit: 1 }, { cell: cell(0, 4), digit: 3 }]],
    ['naked-quad', nakedQuad, [[cell(0, 0), [1, 2]], [cell(0, 1), [1, 3]], [cell(0, 2), [2, 4]], [cell(0, 3), [3, 4]], [cell(0, 4), [1, 5]], [cell(0, 5), [4, 5]]] as Array<[number, number[]]>, [{ cell: cell(0, 4), digit: 1 }, { cell: cell(0, 5), digit: 4 }]],
  ])('%s eliminates subset digits from other cells', (id, strategy, entries, eliminations) => {
    const grid = candidateGrid(entries);
    const step = strategy.apply(grid);
    expect(step?.strategyId).toBe(id);
    expect(step?.placements).toEqual([]);
    expect(step?.eliminations).toEqual(eliminations);
    expectPure(strategy, grid);
  });

  it.each([
    ['hidden-pair', hiddenPair, [[cell(0, 0), [1, 2, 3]], [cell(0, 1), [1, 2, 4]], [cell(0, 2), [3, 4]], [cell(0, 3), [3, 4]]] as Array<[number, number[]]>, [{ cell: cell(0, 0), digit: 3 }, { cell: cell(0, 1), digit: 4 }]],
    ['hidden-triple', hiddenTriple, [[cell(0, 0), [1, 2, 4]], [cell(0, 1), [1, 3, 5]], [cell(0, 2), [2, 3, 6]], [cell(0, 3), [4, 5, 6]]] as Array<[number, number[]]>, [{ cell: cell(0, 0), digit: 4 }, { cell: cell(0, 1), digit: 5 }, { cell: cell(0, 2), digit: 6 }]],
    ['hidden-quad', hiddenQuad, [[cell(0, 0), [1, 2, 5]], [cell(0, 1), [1, 3, 6]], [cell(0, 2), [2, 4, 7]], [cell(0, 3), [3, 4, 8]], [cell(0, 4), [5, 6, 7, 8]]] as Array<[number, number[]]>, [{ cell: cell(0, 0), digit: 5 }, { cell: cell(0, 1), digit: 6 }, { cell: cell(0, 2), digit: 7 }, { cell: cell(0, 3), digit: 8 }]],
  ])('%s removes non-subset candidates from subset cells', (id, strategy, entries, eliminations) => {
    const grid = candidateGrid(entries);
    const step = strategy.apply(grid);
    expect(step?.strategyId).toBe(id);
    expect(step?.placements).toEqual([]);
    expect(step?.eliminations).toEqual(eliminations);
    expectPure(strategy, grid);
  });

  const fishCases: Array<[string, Strategy, number, number[], number[], Array<[number, number]>]> = [
    ['x-wing', xWing, 5, [0, 1], [0, 3], [[2, 0], [3, 3]]],
    ['swordfish', swordfish, 6, [0, 1, 2], [0, 3, 5], [[3, 0], [4, 5]]],
    ['jellyfish', jellyfish, 7, [0, 1, 2, 3], [0, 2, 5, 7], [[4, 0], [5, 7]]],
  ];

  it.each(fishCases)('%s uses the base/cover fish model', (id, strategy, digit, rows, cols, extras) => {
    const entries: Array<[number, number[]]> = [];
    for (const row of rows) for (const col of cols) entries.push([cell(row, col), [digit]]);
    for (const [row, col] of extras) entries.push([cell(row, col), [digit]]);
    const grid = candidateGrid(entries);
    const step = strategy.apply(grid);
    expect(step?.strategyId).toBe(id);
    expect(step?.placements).toEqual([]);
    expect(step?.eliminations).toEqual(extras.map(([row, col]) => ({ cell: cell(row, col), digit })));
    expectPure(strategy, grid);
  });

  it('skyscraper eliminates from cells seeing both roof endpoints', () => {
    const grid = candidateGrid([[cell(0, 0), [4]], [cell(0, 5), [4]], [cell(3, 1), [4]], [cell(3, 5), [4]], [cell(1, 1), [4]]]);
    const step = skyscraper.apply(grid);
    expect(step?.strategyId).toBe('skyscraper');
    expect(step?.eliminations).toEqual([{ cell: cell(1, 1), digit: 4 }]);
    expectPure(skyscraper, grid);
  });

  it('2-string kite eliminates from cells seeing both endpoints', () => {
    const grid = candidateGrid([[cell(0, 0), [8]], [cell(0, 4), [8]], [cell(1, 1), [8]], [cell(4, 1), [8]], [cell(4, 4), [8]]]);
    const step = twoStringKite.apply(grid);
    expect(step?.strategyId).toBe('two-string-kite');
    expect(step?.eliminations).toEqual([{ cell: cell(4, 4), digit: 8 }]);
    expectPure(twoStringKite, grid);
  });

  it('empty rectangle eliminates through a box-line strong-link pattern', () => {
    const grid = candidateGrid([[cell(0, 0), [9]], [cell(1, 1), [9]], [cell(0, 4), [9]], [cell(4, 4), [9]], [cell(4, 1), [9]]]);
    const step = emptyRectangle.apply(grid);
    expect(step?.strategyId).toBe('empty-rectangle');
    expect(step?.eliminations).toEqual([{ cell: cell(0, 4), digit: 9 }]);
    expectPure(emptyRectangle, grid);
  });

  it('XY-Wing eliminates the shared pincer digit', () => {
    const grid = candidateGrid([[cell(0, 0), [1, 2]], [cell(0, 2), [1, 3]], [cell(2, 0), [2, 3]], [cell(2, 2), [3]]]);
    const step = xyWing.apply(grid);
    expect(step?.strategyId).toBe('xy-wing');
    expect(step?.eliminations).toEqual([{ cell: cell(2, 2), digit: 3 }]);
    expectPure(xyWing, grid);
  });

  it('XYZ-Wing eliminates the shared digit from cells seeing pivot and pincers', () => {
    const grid = candidateGrid([[cell(0, 0), [1, 2, 3]], [cell(0, 1), [1, 3]], [cell(1, 0), [2, 3]], [cell(1, 1), [3]]]);
    const step = xyzWing.apply(grid);
    expect(step?.strategyId).toBe('xyz-wing');
    expect(step?.eliminations).toEqual([{ cell: cell(1, 1), digit: 3 }]);
    expectPure(xyzWing, grid);
  });

  it('W-Wing eliminates the other digit from cells seeing both bivalue cells', () => {
    const grid = candidateGrid([[cell(0, 0), [1, 2]], [cell(4, 4), [1, 2]], [cell(0, 3), [1]], [cell(4, 3), [1]], [cell(0, 4), [2]]]);
    const step = wWing.apply(grid);
    expect(step?.strategyId).toBe('w-wing');
    expect(step?.eliminations).toEqual([{ cell: cell(0, 4), digit: 2 }]);
    expectPure(wWing, grid);
  });

  it('does not treat zero-candidate cells as deductions', () => {
    const grid = candidateGrid([]);
    grid.candidates[0] = ALL_CANDIDATES;
    grid.candidates[1] = ALL_CANDIDATES;
    expect(pointing.apply(grid)).toBeNull();
    expect(xWing.apply(grid)).toBeNull();
  });
});
