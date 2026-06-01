import { BOX_OF, COL_OF, HOUSES, ROW_OF, UNITS_OF, digitsOf, popcount } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, hasDigit } from './common.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性', en: 'Uniqueness' },
  difficulty: 90,

  apply(grid): Step | null {
    const ur = uniqueRectangleType1(grid, this.id);
    if (ur) return ur;
    return bugPlusOne(grid, this.id);
  },
};

function uniqueRectangleType1(grid: Parameters<Strategy['apply']>[0], strategyId: string): Step | null {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          const boxCount = new Set(cells.map((cell) => Math.floor(ROW_OF[cell]! / 3) * 3 + Math.floor(COL_OF[cell]! / 3))).size;
          if (boxCount !== 2 || cells.some((cell) => grid.get(cell) !== 0)) continue;
          for (let a = 1; a <= 8; a++) {
            for (let b = a + 1; b <= 9; b++) {
              const pair = [a, b];
              const exact = cells.filter((cell) => popcount(grid.candidatesOf(cell)) === 2 && pair.every((digit) => hasDigit(grid.candidatesOf(cell), digit)));
              const extra = cells.filter((cell) => popcount(grid.candidatesOf(cell)) > 2 && pair.every((digit) => hasDigit(grid.candidatesOf(cell), digit)));
              if (exact.length === 3 && extra.length === 1) {
                const eliminations = pair.map((digit) => ({ cell: extra[0]!, digit }));
                return {
                  strategyId,
                  placements: [],
                  eliminations,
                  highlights: { cells, candidates: candidateHighlights(cells, pair), links: [] },
                  explanation: {
                    zh: `${cells.map(cellName).join('、')} 构成唯一矩形 Type 1；为避免双解，额外格不能保留 ${pair.join('/')}。`,
                    en: `${cells.map(cellName).join(', ')} form a Unique Rectangle Type 1; the extra cell cannot keep ${pair.join('/')} under the uniqueness assumption.`,
                  },
                };
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function bugPlusOne(grid: Parameters<Strategy['apply']>[0], strategyId: string): Step | null {
  const unsolved = [];
  for (let cell = 0; cell < 81; cell++) if (grid.get(cell) === 0) unsolved.push(cell);
  const tri = unsolved.filter((cell) => popcount(grid.candidatesOf(cell)) === 3);
  if (tri.length !== 1 || unsolved.some((cell) => cell !== tri[0] && popcount(grid.candidatesOf(cell)) !== 2)) return null;
  for (const digit of digitsOf(grid.candidatesOf(tri[0]!))) {
    const extraHouses = UNITS_OF[tri[0]!]!;
    let bugShape = true;
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      for (let d = 1; d <= 9; d++) {
        const count = HOUSES[houseIndex]!.filter((cell) => grid.hasCandidate(cell, d)).length;
        if (count === 0) continue;
        const expected = d === digit && extraHouses.includes(houseIndex) ? 3 : 2;
        if (count !== expected) bugShape = false;
      }
    }
    const rowCount = unsolved.filter((cell) => ROW_OF[cell] === ROW_OF[tri[0]!] && grid.hasCandidate(cell, digit)).length;
    const colCount = unsolved.filter((cell) => COL_OF[cell] === COL_OF[tri[0]!] && grid.hasCandidate(cell, digit)).length;
    const boxCount = unsolved.filter((cell) => BOX_OF[cell] === BOX_OF[tri[0]!] && grid.hasCandidate(cell, digit)).length;
    if (bugShape && rowCount === 3 && colCount === 3 && boxCount === 3) {
      return {
        strategyId,
        placements: [{ cell: tri[0]!, digit }],
        eliminations: [],
        highlights: { cells: [tri[0]!], candidates: [{ cell: tri[0]!, digit }], links: [] },
        explanation: { zh: `${cellName(tri[0]!)} 是 BUG+1 的三值格，额外候选 ${digit} 必须为真。`, en: `${cellName(tri[0]!)} is the BUG+1 trivalue cell, so the extra candidate ${digit} must be true.` },
      };
    }
  }
  return null;
}
