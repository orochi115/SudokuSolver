import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { pointing } from '../src/strategies/pointing.js';
import { claiming } from '../src/strategies/claiming.js';
import { nakedPair, nakedTriple, nakedQuad } from '../src/strategies/naked-subsets.js';
import { hiddenPair, hiddenTriple, hiddenQuad } from '../src/strategies/hidden-subsets.js';
import { xWing, swordfish, jellyfish } from '../src/strategies/fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from '../src/strategies/single-digit-patterns.js';
import { xyWing, xyzWing, wWing } from '../src/strategies/wings.js';

function makeGridWithCandidates(candMap: Record<number, number[]>): Grid {
  const g = Grid.fromString('0'.repeat(81));
  for (let i = 0; i < 81; i++) {
    g.candidates[i] = 0;
  }
  for (const [cellStr, digits] of Object.entries(candMap)) {
    const cell = Number(cellStr);
    let mask = 0;
    for (const d of digits) {
      mask |= (1 << (d - 1));
    }
    g.candidates[cell] = mask;
  }
  return g;
}

describe('M2 Strategies', () => {
  it('fullHouse', () => {
    // Fill all cells in row 0 except cell 0
    const g = Grid.fromString('0' + '12345678' + '0'.repeat(72));
    g.recomputeCandidates();
    // Cell 0 should have only candidate 9
    expect(g.candidatesOf(0)).toBe(1 << 8); // digit 9
    
    const step = fullHouse.apply(g);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ cell: 0, digit: 9 }]);
  });

  it('hiddenSingle', () => {
    // Set candidates in Row 0 such that only cell 0 has candidate 9
    const g = makeGridWithCandidates({
      0: [1, 9],
      1: [1, 2],
      2: [2, 3],
      3: [3, 4],
      4: [4, 5],
      5: [5, 6],
      6: [6, 7],
      7: [7, 8],
      8: [8, 1],
    });
    const step = hiddenSingle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ cell: 0, digit: 9 }]);
  });

  it('pointing', () => {
    // Box 0 empty cells are 0 and 1, both have candidate 9 (in Row 0).
    // Cell 3 (Row 0, outside Box 0) has candidate 9.
    const g = makeGridWithCandidates({
      0: [9],
      1: [9],
      3: [9],
    });
    const step = pointing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 3, digit: 9 }]);
  });

  it('claiming', () => {
    // Row 0 has candidates at cell 0 and 1 (both inside Box 0).
    // Cell 9 (Box 0, Row 1, outside Row 0) has candidate 9.
    const g = makeGridWithCandidates({
      0: [9],
      1: [9],
      9: [9],
    });
    const step = claiming.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 9, digit: 9 }]);
  });

  it('nakedPair', () => {
    // Row 0, cells 0 and 1 have candidates {2, 3}.
    // Cell 2 has candidate {2, 4}.
    const g = makeGridWithCandidates({
      0: [2, 3],
      1: [2, 3],
      2: [2, 4],
    });
    const step = nakedPair.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 2, digit: 2 }]);
  });

  it('nakedTriple', () => {
    // Row 0, cells 0, 1, 2 have candidates {2, 3}, {3, 4}, {2, 4}.
    // Cell 3 has candidates {2, 5}.
    const g = makeGridWithCandidates({
      0: [2, 3],
      1: [3, 4],
      2: [2, 4],
      3: [2, 5],
    });
    const step = nakedTriple.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 3, digit: 2 }]);
  });

  it('nakedQuad', () => {
    // Row 0, cells 0, 1, 2, 3 have candidates {2, 3}, {3, 4}, {4, 5}, {2, 5}.
    // Cell 4 has candidates {2, 6}.
    const g = makeGridWithCandidates({
      0: [2, 3],
      1: [3, 4],
      2: [4, 5],
      3: [2, 5],
      4: [2, 6],
    });
    const step = nakedQuad.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 4, digit: 2 }]);
  });

  it('hiddenPair', () => {
    // Row 0, candidates 2 and 3 are confined to cells 0 and 1.
    // They also contain other candidates (e.g. 4).
    const g = makeGridWithCandidates({
      0: [2, 3, 4],
      1: [2, 3, 4],
      2: [5, 6],
    });
    const step = hiddenPair.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 4 },
      { cell: 1, digit: 4 },
    ]);
  });

  it('hiddenTriple', () => {
    // Row 0, candidates 2, 3, 4 are confined to cells 0, 1, 2.
    // They also contain other candidates (e.g. 5).
    const g = makeGridWithCandidates({
      0: [2, 3, 4, 5],
      1: [2, 3, 4, 5],
      2: [2, 3, 4, 5],
      3: [6, 7],
    });
    const step = hiddenTriple.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 5 },
      { cell: 1, digit: 5 },
      { cell: 2, digit: 5 },
    ]);
  });

  it('hiddenQuad', () => {
    // Row 0, candidates 2, 3, 4, 5 are confined to cells 0, 1, 2, 3.
    // They also contain other candidates (e.g. 6).
    const g = makeGridWithCandidates({
      0: [2, 3, 4, 5, 6],
      1: [2, 3, 4, 5, 6],
      2: [2, 3, 4, 5, 6],
      3: [2, 3, 4, 5, 6],
      4: [7, 8],
    });
    const step = hiddenQuad.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([
      { cell: 0, digit: 6 },
      { cell: 1, digit: 6 },
      { cell: 2, digit: 6 },
      { cell: 3, digit: 6 },
    ]);
  });

  it('xWing', () => {
    // Row 0 has candidate 9 at col 0, col 4 (cells 0, 4)
    // Row 4 has candidate 9 at col 0, col 4 (cells 36, 40)
    // Cell 18 (Row 2, col 0) has candidate 9 (elimination target)
    const g = makeGridWithCandidates({
      0: [9],
      4: [9],
      18: [9],
      36: [9],
      40: [9],
    });
    const step = xWing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 18, digit: 9 }]);
  });

  it('swordfish', () => {
    // Rows 0, 2, 4 has candidate 9 confined to Columns 0, 2, 4.
    // Cell 54 (Row 6, col 0) has candidate 9.
    const g = makeGridWithCandidates({
      0: [9], 2: [9], 4: [9],
      18: [9], 20: [9],
      36: [9], 40: [9],
      54: [9],
    });
    const step = swordfish.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 54, digit: 9 }]);
  });

  it('jellyfish', () => {
    // Rows 0, 1, 2, 3 has candidate 9 confined to Columns 0, 1, 2, 3.
    // Cell 36 (Row 4, col 0) has candidate 9.
    const g = makeGridWithCandidates({
      0: [9], 1: [9], 2: [9], 3: [9],
      9: [9], 10: [9], 11: [9],
      18: [9], 20: [9],
      27: [9], 28: [9], 30: [9],
      36: [9],
    });
    const step = jellyfish.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 36, digit: 9 }]);
  });

  it('skyscraper', () => {
    // Row 0 has candidate 9 at cols 1 and 4. (cells 1, 4)
    // Row 3 has candidate 9 at cols 1 and 6. (cells 28, 33)
    // Cell 31 (Row 3, col 4) has candidate 9 (sees both roof cells)
    const g = makeGridWithCandidates({
      1: [9],
      4: [9],
      28: [9],
      33: [9],
      31: [9],
    });
    const step = skyscraper.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 33, digit: 9 }]);
  });

  it('twoStringKite', () => {
    // Box 0, Row 0 has exactly two 9s: cells 2 and 5.
    // Box 0, Col 0 has exactly two 9s: cells 18 and 45.
    // Intersection cell 50 (Row 5, Col 5) sees 5 and 45.
    const g = makeGridWithCandidates({
      2: [9],
      5: [9],
      18: [9],
      45: [9],
      50: [9],
    });
    const step = twoStringKite.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 50, digit: 9 }]);
  });

  it('emptyRectangle', () => {
    // Box 0 candidates for 9 at Row 0 (0, 1, 2) and Col 0 (0, 9). Pivot is 0.
    // Col 3 has strong link at Row 0 (cell 3) and Row 4 (cell 39).
    // Elimination at cell 36 (Row 4, Col 0).
    const g = makeGridWithCandidates({
      0: [9], 1: [9], 2: [9],
      9: [9],
      3: [9],
      39: [9],
      36: [9],
    });
    const step = emptyRectangle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 36, digit: 9 }]);
  });

  it('xyWing', () => {
    // Pivot at cell 0: {2, 3}
    // Pincer 1 at cell 1: {2, 4}
    // Pincer 2 at cell 9: {3, 4}
    // Elimination cell 10 has candidate 4.
    const g = makeGridWithCandidates({
      0: [2, 3],
      1: [2, 4],
      9: [3, 4],
      10: [4],
    });
    const step = xyWing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 10, digit: 4 }]);
  });

  it('xyzWing', () => {
    // Pivot at cell 0: {2, 3, 4}
    // Pincer 1 at cell 1: {2, 4}
    // Pincer 2 at cell 9: {3, 4}
    // Elimination cell 10 has candidate 4 (sees pivot cell 0, and both pincers cell 1 and 9).
    const g = makeGridWithCandidates({
      0: [2, 3, 4],
      1: [2, 4],
      9: [3, 4],
      10: [4],
    });
    const step = xyzWing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 10, digit: 4 }]);
  });

  it('wWing', () => {
    // Cell A at cell 0 (Row 0, Col 0) with candidates {2, 3}.
    // Cell B at cell 38 (Row 4, Col 2) with candidates {2, 3}.
    // Strong link on 2 in Column 1 (cells 1 and 37).
    // cell 1 (Row 0, Col 1) sees cell 0 (Row 0, Col 0).
    // cell 37 (Row 4, Col 1) sees cell 38 (Row 4, Col 2).
    // Elimination cell is at cell 2 (Row 0, Col 2, sees cell 0 and cell 38) with candidate 3.
    const g = makeGridWithCandidates({
      0: [2, 3],
      38: [2, 3],
      1: [2],
      37: [2],
      2: [3],
    });
    const step = wWing.apply(g);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual([{ cell: 2, digit: 3 }]);
  });
});
