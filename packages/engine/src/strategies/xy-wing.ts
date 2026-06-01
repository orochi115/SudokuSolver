import { CELLS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { peersIntersection, sees, uniqueCells, uniqueEliminations } from './common.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid) {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 2) continue;
      const [x, y] = digitsOf(pivotMask);
      if (x === undefined || y === undefined) continue;

      const pCells = Array.from({ length: CELLS }, (_, c) => c).filter((cell) => cell !== pivot && grid.get(cell) === 0 && sees(pivot, cell) && popcount(grid.candidatesOf(cell)) === 2);

      for (const p1 of pCells) {
        const d1 = digitsOf(grid.candidatesOf(p1));
        if (d1.length !== 2) continue;
        const hasX = d1.includes(x);
        if (!hasX) continue;
        const z = d1[0] === x ? d1[1] : d1[0];
        if (z === undefined || z === y) continue;

        for (const p2 of pCells) {
          if (p2 === p1) continue;
          const d2 = digitsOf(grid.candidatesOf(p2));
          if (d2.length !== 2) continue;
          if (!d2.includes(y) || !d2.includes(z)) continue;

          const elimCells = peersIntersection(p1, p2).filter((cell) => cell !== pivot && grid.hasCandidate(cell, z));
          if (elimCells.length === 0) continue;

          const eliminations = uniqueEliminations(elimCells.map((cell) => ({ cell, digit: z })));
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([pivot, p1, p2, ...elimCells]),
              candidates: [
                { cell: pivot, digit: x },
                { cell: pivot, digit: y },
                { cell: p1, digit: x },
                { cell: p1, digit: z },
                { cell: p2, digit: y },
                { cell: p2, digit: z },
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `XY翼：枢轴格为 {${x},${y}}，两翼分别为 {${x},${z}} 与 {${y},${z}}，因此同时看见两翼的格子可删除 ${z}。`,
              en: `XY-Wing: pivot {${x},${y}} with pincers {${x},${z}} and {${y},${z}} allows eliminating ${z} from cells seeing both pincers.`,
            },
          };
        }
      }
    }
    return null;
  },
};
