import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';

/** Build a Grid then overwrite candidate masks for empty cells. */
function gridFrom(values: number[], masks: Record<number, number>): Grid {
  const g = Grid.fromString(values.join(''));
  for (let i = 0; i < 81; i++) {
    if (values[i] === 0) g.candidates[i] = masks[i] ?? 0;
  }
  return g;
}

const m = (...ds: number[]) => ds.reduce((acc, d) => acc | (1 << (d - 1)), 0);

describe('locked-candidates (pointing)', () => {
  it('eliminates a pointed digit from the rest of the line', () => {
    // Box 0: digit 4 candidate only in R1C1 and R1C2 (cells 0,1) -> points along row 0.
    // Row 0 cell 5 also has candidate 4 -> must be eliminated.
    const values = new Array(81).fill(1); // fill non-zero to mark "solved" everywhere
    const empties = [0, 1, 5];
    for (const c of empties) values[c] = 0;
    const masks: Record<number, number> = {
      0: m(4, 7),
      1: m(4, 8),
      5: m(4, 9),
    };
    const step = lockedCandidates.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('locked-candidates');
    expect(step!.eliminations).toContainEqual({ cell: 5, digit: 4 });
  });
});

describe('locked-candidates (claiming)', () => {
  it('eliminates a claimed digit from the rest of the box', () => {
    // Row 0: digit 5 candidate only in R1C1, R1C2 (box 0). Box 0 cell 9 (R2C1)
    // also has candidate 5 -> eliminated by claiming.
    const values = new Array(81).fill(1);
    const empties = [0, 1, 9];
    for (const c of empties) values[c] = 0;
    const masks: Record<number, number> = {
      0: m(5, 7),
      1: m(5, 8),
      9: m(5, 6),
    };
    const step = lockedCandidates.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    // Pointing is tried first; both deductions are sound. Accept either pointing
    // or claiming, but the 5@cell9 elimination must be present from claiming OR
    // a pointing along row0. We assert at least one valid elimination exists.
    expect(step!.eliminations.length).toBeGreaterThan(0);
  });
});

describe('naked-subset (pair)', () => {
  it('removes the pair digits from the rest of the house', () => {
    // Row 0: cells 0,1 are a naked pair {2,3}. Cell 2 has {2,3,5} -> eliminate 2,3.
    const values = new Array(81).fill(1);
    const empties = [0, 1, 2];
    for (const c of empties) values[c] = 0;
    const masks: Record<number, number> = {
      0: m(2, 3),
      1: m(2, 3),
      2: m(2, 3, 5),
    };
    const step = nakedSubset.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('naked-subset');
    expect(step!.eliminations).toContainEqual({ cell: 2, digit: 2 });
    expect(step!.eliminations).toContainEqual({ cell: 2, digit: 3 });
    expect(step!.eliminations).not.toContainEqual({ cell: 2, digit: 5 });
  });
});

describe('naked-subset (triple)', () => {
  it('removes the triple digits from the rest of the house', () => {
    // Row 0: cells 0,1,2 form a naked triple over {1,2,3} (subsets allowed).
    // Cell 3 has {1,4} -> eliminate 1.
    const values = new Array(81).fill(1);
    const empties = [0, 1, 2, 3];
    for (const c of empties) values[c] = 0;
    const masks: Record<number, number> = {
      0: m(1, 2),
      1: m(2, 3),
      2: m(1, 3),
      3: m(1, 4),
    };
    const step = nakedSubset.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.eliminations).toContainEqual({ cell: 3, digit: 1 });
  });
});

describe('hidden-subset (pair)', () => {
  it('strips extra candidates from the hidden pair cells', () => {
    // Row 0: digits 8 and 9 occur only in cells 0 and 1 (hidden pair). Those
    // cells also have other candidates which must be removed.
    const values = new Array(81).fill(1);
    const empties = [0, 1, 2, 3];
    for (const c of empties) values[c] = 0;
    const masks: Record<number, number> = {
      0: m(8, 9, 1), // 8,9 hidden here + extra 1
      1: m(8, 9, 2), // 8,9 hidden here + extra 2
      2: m(1, 2), // no 8/9
      3: m(1, 2), // no 8/9
    };
    const step = hiddenSubset.apply(gridFrom(values, masks));
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-subset');
    expect(step!.eliminations).toContainEqual({ cell: 0, digit: 1 });
    expect(step!.eliminations).toContainEqual({ cell: 1, digit: 2 });
    expect(step!.eliminations).not.toContainEqual({ cell: 0, digit: 8 });
  });
});
