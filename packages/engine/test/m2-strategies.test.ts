import { describe, expect, it } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidatesPointing } from '../src/strategies/locked-candidates-pointing.js';
import { lockedCandidatesClaiming } from '../src/strategies/locked-candidates-claiming.js';
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

function mask(digits: number[]): number {
  return digits.reduce((m, d) => m | maskOf(d), 0);
}

function gridWith(candidates: Record<number, number[]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  grid.candidates.fill(0);
  for (const [cellIndex, digits] of Object.entries(candidates)) {
    grid.candidates[Number(cellIndex)] = mask(digits);
  }
  return grid;
}

function expectEliminations(actual: { cell: number; digit: number }[], expected: { cell: number; digit: number }[]): void {
  expect(actual.map((e) => `${e.cell}:${e.digit}`).sort()).toEqual(expected.map((e) => `${e.cell}:${e.digit}`).sort());
}

describe('M2 human strategies', () => {
  it('finds a hidden single', () => {
    const grid = gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(0, 1)]: [1, 2],
      [cell(0, 2)]: [5, 6],
      [cell(0, 3)]: [6, 7],
      [cell(0, 4)]: [6, 7],
    });

    const step = hiddenSingle.apply(grid)!;

    expect(step.strategyId).toBe('hidden-single');
    expect(step.placements).toEqual([{ cell: cell(0, 2), digit: 5 }]);
    expect(step.eliminations).toEqual([]);
    expect(step.highlights.candidates).toContainEqual({ cell: cell(0, 2), digit: 5 });
  });

  it('applies locked candidates pointing', () => {
    const grid = gridWith({
      [cell(0, 0)]: [5],
      [cell(0, 1)]: [5],
      [cell(0, 3)]: [5, 8],
      [cell(0, 4)]: [5, 9],
    });

    const step = lockedCandidatesPointing.apply(grid)!;

    expect(step.strategyId).toBe('locked-candidates-pointing');
    expectEliminations(step.eliminations, [
      { cell: cell(0, 3), digit: 5 },
      { cell: cell(0, 4), digit: 5 },
    ]);
  });

  it('applies locked candidates claiming', () => {
    const grid = gridWith({
      [cell(0, 0)]: [6],
      [cell(0, 1)]: [6],
      [cell(1, 0)]: [6, 8],
      [cell(2, 2)]: [6, 9],
    });

    const step = lockedCandidatesClaiming.apply(grid)!;

    expect(step.strategyId).toBe('locked-candidates-claiming');
    expectEliminations(step.eliminations, [
      { cell: cell(1, 0), digit: 6 },
      { cell: cell(2, 2), digit: 6 },
    ]);
  });

  it('applies naked pair, triple, and quad eliminations', () => {
    expectEliminations(nakedPair.apply(gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(0, 1)]: [1, 2],
      [cell(0, 2)]: [1, 2, 3],
    }))!.eliminations, [
      { cell: cell(0, 2), digit: 1 },
      { cell: cell(0, 2), digit: 2 },
    ]);

    expectEliminations(nakedTriple.apply(gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(0, 1)]: [2, 3],
      [cell(0, 2)]: [1, 3],
      [cell(0, 3)]: [1, 2, 3, 4],
    }))!.eliminations, [
      { cell: cell(0, 3), digit: 1 },
      { cell: cell(0, 3), digit: 2 },
      { cell: cell(0, 3), digit: 3 },
    ]);

    expectEliminations(nakedQuad.apply(gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(0, 1)]: [2, 3],
      [cell(0, 2)]: [3, 4],
      [cell(0, 3)]: [1, 4],
      [cell(0, 4)]: [1, 2, 3, 4, 5],
    }))!.eliminations, [
      { cell: cell(0, 4), digit: 1 },
      { cell: cell(0, 4), digit: 2 },
      { cell: cell(0, 4), digit: 3 },
      { cell: cell(0, 4), digit: 4 },
    ]);
  });

  it('applies hidden pair, triple, and quad eliminations', () => {
    expectEliminations(hiddenPair.apply(gridWith({
      [cell(0, 0)]: [1, 2, 3],
      [cell(0, 1)]: [1, 2, 4],
      [cell(0, 2)]: [3, 4],
    }))!.eliminations, [
      { cell: cell(0, 0), digit: 3 },
      { cell: cell(0, 1), digit: 4 },
    ]);

    expectEliminations(hiddenTriple.apply(gridWith({
      [cell(0, 0)]: [1, 2, 4],
      [cell(0, 1)]: [2, 3, 5],
      [cell(0, 2)]: [1, 3, 6],
      [cell(0, 3)]: [4, 5, 6],
    }))!.eliminations, [
      { cell: cell(0, 0), digit: 4 },
      { cell: cell(0, 1), digit: 5 },
      { cell: cell(0, 2), digit: 6 },
    ]);

    expectEliminations(hiddenQuad.apply(gridWith({
      [cell(0, 0)]: [1, 2, 5],
      [cell(0, 1)]: [2, 3, 6],
      [cell(0, 2)]: [3, 4, 7],
      [cell(0, 3)]: [1, 4, 8],
      [cell(0, 4)]: [5, 6, 7, 8],
    }))!.eliminations, [
      { cell: cell(0, 0), digit: 5 },
      { cell: cell(0, 1), digit: 6 },
      { cell: cell(0, 2), digit: 7 },
      { cell: cell(0, 3), digit: 8 },
    ]);
  });

  it('applies base-cover fish eliminations', () => {
    expectEliminations(xWing.apply(gridWith({
      [cell(0, 2)]: [5], [cell(0, 5)]: [5],
      [cell(1, 2)]: [5], [cell(1, 5)]: [5],
      [cell(2, 2)]: [5, 8],
    }))!.eliminations, [{ cell: cell(2, 2), digit: 5 }]);

    expectEliminations(swordfish.apply(gridWith({
      [cell(0, 1)]: [5], [cell(0, 4)]: [5],
      [cell(1, 4)]: [5], [cell(1, 7)]: [5],
      [cell(2, 1)]: [5], [cell(2, 7)]: [5],
      [cell(3, 1)]: [5, 8],
    }))!.eliminations, [{ cell: cell(3, 1), digit: 5 }]);

    expectEliminations(jellyfish.apply(gridWith({
      [cell(0, 0)]: [5], [cell(0, 2)]: [5],
      [cell(1, 2)]: [5], [cell(1, 4)]: [5],
      [cell(2, 4)]: [5], [cell(2, 6)]: [5],
      [cell(3, 0)]: [5], [cell(3, 6)]: [5],
      [cell(4, 0)]: [5, 8],
    }))!.eliminations, [{ cell: cell(4, 0), digit: 5 }]);
  });

  it('applies single-digit pattern eliminations', () => {
    expectEliminations(skyscraper.apply(gridWith({
      [cell(0, 0)]: [5], [cell(0, 3)]: [5],
      [cell(1, 0)]: [5], [cell(1, 4)]: [5],
      [cell(2, 5)]: [5, 8],
    }))!.eliminations, [{ cell: cell(2, 5), digit: 5 }]);

    expectEliminations(twoStringKite.apply(gridWith({
      [cell(0, 1)]: [5], [cell(0, 8)]: [5],
      [cell(1, 0)]: [5], [cell(8, 0)]: [5],
      [cell(8, 8)]: [5, 9],
    }))!.eliminations, [{ cell: cell(8, 8), digit: 5 }]);

    expectEliminations(emptyRectangle.apply(gridWith({
      [cell(0, 0)]: [5], [cell(1, 1)]: [5],
      [cell(0, 8)]: [5], [cell(8, 1)]: [5],
      [cell(8, 8)]: [5, 9],
    }))!.eliminations, [{ cell: cell(8, 8), digit: 5 }]);
  });

  it('applies wing eliminations', () => {
    expectEliminations(xyWing.apply(gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(0, 4)]: [1, 3],
      [cell(4, 0)]: [2, 3],
      [cell(4, 4)]: [3, 9],
    }))!.eliminations, [{ cell: cell(4, 4), digit: 3 }]);

    expectEliminations(xyzWing.apply(gridWith({
      [cell(0, 0)]: [1, 2, 3],
      [cell(0, 1)]: [1, 3],
      [cell(1, 0)]: [2, 3],
      [cell(1, 1)]: [3, 9],
    }))!.eliminations, [{ cell: cell(1, 1), digit: 3 }]);

    expectEliminations(wWing.apply(gridWith({
      [cell(0, 0)]: [1, 2],
      [cell(4, 4)]: [1, 2],
      [cell(0, 8)]: [1],
      [cell(4, 8)]: [1],
      [cell(0, 4)]: [2, 9],
    }))!.eliminations, [{ cell: cell(0, 4), digit: 2 }]);
  });
});
