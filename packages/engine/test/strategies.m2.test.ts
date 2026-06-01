import { describe, expect, it } from 'vitest';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { xWing } from '../src/strategies/x-wing.js';
import { swordfish } from '../src/strategies/swordfish.js';
import { jellyfish } from '../src/strategies/jellyfish.js';
import { skyscraper } from '../src/strategies/skyscraper.js';
import { twoStringKite } from '../src/strategies/two-string-kite.js';
import { emptyRectangle } from '../src/strategies/empty-rectangle.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { makeCandidateGrid } from './strategy-test-helpers.js';

function expectHasElim(step: ReturnType<(typeof hiddenSubset)['apply']>, cell: number, digit: number): void {
  expect(step).not.toBeNull();
  expect(step!.eliminations).toContainEqual({ cell, digit });
}

describe('M2 strategies', () => {
  it('hidden single places the only location in a house', () => {
    const grid = makeCandidateGrid({ 0: [1, 2], 1: [2, 3] });
    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ cell: 0, digit: 1 }]);
  });

  it('locked candidates eliminates by pointing/claiming logic', () => {
    const grid = makeCandidateGrid({ 0: [5], 1: [5, 6], 3: [4, 5] });
    const step = lockedCandidates.apply(grid);
    expectHasElim(step, 3, 5);
  });

  it('naked subset removes subset digits from other cells', () => {
    const grid = makeCandidateGrid({ 0: [1, 2], 1: [1, 2], 2: [1, 2, 3] });
    const step = nakedSubset.apply(grid);
    expectHasElim(step, 2, 1);
    expectHasElim(step, 2, 2);
  });

  it('hidden subset strips non-subset digits from subset cells', () => {
    const grid = makeCandidateGrid({ 0: [1, 2, 3], 1: [1, 2, 4], 2: [3, 4] });
    const step = hiddenSubset.apply(grid);
    expectHasElim(step, 0, 3);
    expectHasElim(step, 1, 4);
  });

  it('x-wing eliminates on cover houses', () => {
    const grid = makeCandidateGrid({
      1: [5],
      6: [5],
      28: [5],
      33: [5],
      46: [5, 8],
    });
    const step = xWing.apply(grid);
    expectHasElim(step, 46, 5);
  });

  it('swordfish eliminates on size-3 fish cover houses', () => {
    const grid = makeCandidateGrid({
      1: [6],
      4: [6],
      7: [6],
      28: [6],
      31: [6],
      34: [6],
      55: [6],
      58: [6],
      61: [6],
      73: [6, 9],
    });
    const step = swordfish.apply(grid);
    expectHasElim(step, 73, 6);
  });

  it('jellyfish eliminates on size-4 fish cover houses', () => {
    const grid = makeCandidateGrid({
      1: [4],
      3: [4],
      5: [4],
      7: [4],
      19: [4],
      21: [4],
      23: [4],
      25: [4],
      37: [4],
      39: [4],
      41: [4],
      43: [4],
      55: [4],
      57: [4],
      59: [4],
      61: [4],
      73: [4, 8],
    });
    const step = jellyfish.apply(grid);
    expectHasElim(step, 73, 4);
  });

  it('skyscraper eliminates from cells seeing both endpoints', () => {
    const grid = makeCandidateGrid({
      1: [7],
      5: [7],
      28: [7],
      35: [7],
      8: [7, 9],
    });
    const step = skyscraper.apply(grid);
    expectHasElim(step, 5, 7);
  });

  it('2-string kite eliminates from cross-seeing cells', () => {
    const grid = makeCandidateGrid({
      0: [8],
      1: [8],
      9: [8],
      18: [8],
      10: [1, 8],
    });
    const step = twoStringKite.apply(grid);
    expectHasElim(step, 10, 8);
  });

  it('empty rectangle style chain produces elimination', () => {
    const grid = makeCandidateGrid({
      1: [9],
      11: [9],
      13: [9],
      67: [9],
      4: [2, 9],
    });
    const step = emptyRectangle.apply(grid);
    expectHasElim(step, 67, 9);
  });

  it('xy-wing eliminates shared wing digit', () => {
    const grid = makeCandidateGrid({
      40: [1, 2],
      37: [1, 3],
      13: [2, 3],
      10: [3, 6],
    });
    const step = xyWing.apply(grid);
    expectHasElim(step, 10, 3);
  });

  it('xyz-wing eliminates shared pivot/wing digit', () => {
    const grid = makeCandidateGrid({
      40: [1, 2, 3],
      39: [1, 3],
      31: [2, 3],
      30: [3, 8],
    });
    const step = xyzWing.apply(grid);
    expectHasElim(step, 30, 3);
  });

  it('w-wing removes the non-bridge digit', () => {
    const grid = makeCandidateGrid({
      0: [4, 7],
      40: [4, 7],
      1: [4],
      37: [4],
      4: [1, 7],
    });
    const step = wWing.apply(grid);
    expectHasElim(step, 4, 7);
  });
});
