import { CELLS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { peersIntersection, sees, uniqueCells, uniqueEliminations } from './common.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid) {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;
      const piv = digitsOf(pivotMask);
      if (piv.length !== 3) continue;

      const peerBivals = Array.from({ length: CELLS }, (_, c) => c).filter((cell) => cell !== pivot && grid.get(cell) === 0 && sees(pivot, cell) && popcount(grid.candidatesOf(cell)) === 2);
      for (let i = 0; i < peerBivals.length; i++) {
        for (let j = i + 1; j < peerBivals.length; j++) {
          const p1 = peerBivals[i]!;
          const p2 = peerBivals[j]!;
          const d1 = digitsOf(grid.candidatesOf(p1));
          const d2 = digitsOf(grid.candidatesOf(p2));
          if (d1.length !== 2 || d2.length !== 2) continue;

          const common = d1.filter((d) => d2.includes(d));
          if (common.length !== 1) continue;
          const z = common[0]!;
          if (!piv.includes(z)) continue;

          const xCand = d1.find((d) => d !== z);
          const yCand = d2.find((d) => d !== z);
          if (xCand === undefined || yCand === undefined || xCand === yCand) continue;
          if (!piv.includes(xCand) || !piv.includes(yCand)) continue;

          const elimCells = peersIntersection(p1, p2).filter((cell) => cell !== pivot && sees(cell, pivot) && grid.hasCandidate(cell, z));
          if (elimCells.length === 0) continue;

          const eliminations = uniqueEliminations(elimCells.map((cell) => ({ cell, digit: z })));
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([pivot, p1, p2, ...elimCells]),
              candidates: [
                ...piv.map((digit) => ({ cell: pivot, digit })),
                ...d1.map((digit) => ({ cell: p1, digit })),
                ...d2.map((digit) => ({ cell: p2, digit })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `XYZ翼：枢轴格为 {${piv.join(',')}}，两翼覆盖同一候选 ${z}，因此同时看见枢轴和两翼的格子可删除 ${z}。`,
              en: `XYZ-Wing: pivot {${piv.join(',')}} with two pincers sharing ${z} allows eliminating ${z} from cells that see pivot and both pincers.`,
            },
          };
        }
      }
    }
    return null;
  },
};
