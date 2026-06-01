import { BOXES, ROWS, digitsOf, popcount } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, hasDigit, maskUnion } from './common.js';
import { combinations } from './advanced-common.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: '苏德克', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid): Step | null {
    for (const row of ROWS) {
      for (const box of BOXES) {
        const intersection = row.filter((cell) => box.includes(cell));
        const rowRest = row.filter((cell) => !box.includes(cell));
        const boxRest = box.filter((cell) => !row.includes(cell));
        const rowCells = intersection.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) > 1);
        const boxCells = boxRest.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) > 1);
        for (const lineSet of combinations(rowCells, 2)) {
          if (popcount(maskUnion(grid, lineSet)) !== 3) continue;
          for (const boxSet of combinations(boxCells, 2)) {
            if (popcount(maskUnion(grid, boxSet)) !== 3) continue;
            const lineDigits = digitsOf(maskUnion(grid, lineSet));
            const boxDigits = digitsOf(maskUnion(grid, boxSet));
            const shared = lineDigits.filter((digit) => boxDigits.includes(digit));
            if (shared.length !== 2) continue;
            const lineOnly = lineDigits.filter((digit) => !shared.includes(digit));
            const boxOnly = boxDigits.filter((digit) => !shared.includes(digit));
            if (lineOnly.length !== 1 || boxOnly.length !== 1) continue;
            const eliminations = [
              ...rowRest.filter((cell) => grid.hasCandidate(cell, lineOnly[0]!)).map((cell) => ({ cell, digit: lineOnly[0]! })),
              ...boxRest.filter((cell) => !boxSet.includes(cell) && grid.hasCandidate(cell, boxOnly[0]!)).map((cell) => ({ cell, digit: boxOnly[0]! })),
            ];
            if (eliminations.length === 0) continue;
            const cells = [...lineSet, ...boxSet];
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: { cells, candidates: candidateHighlights(cells, [...shared, ...lineOnly, ...boxOnly]), links: [] },
              explanation: {
                zh: `${cells.map(cellName).join('、')} 在行/宫交叠处形成 Sue de Coq，锁定的候选可从对应余格删除。`,
                en: `${cells.map(cellName).join(', ')} form a Sue de Coq in the row/box intersection, so locked candidates are removed from the corresponding remainders.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
