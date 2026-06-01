import { CELLS, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;
      const pivotDigits = digitsOf(pivotMask);

      const bivaluePeers = PEERS_OF[pivot]!
        .filter((cell) => grid.get(cell) === 0)
        .filter((cell) => popcount(grid.candidatesOf(cell)) === 2)
        .filter((cell) => (grid.candidatesOf(cell) & ~pivotMask) === 0);

      for (let i = 0; i < bivaluePeers.length; i++) {
        for (let j = i + 1; j < bivaluePeers.length; j++) {
          const p1 = bivaluePeers[i]!;
          const p2 = bivaluePeers[j]!;
          const m1 = grid.candidatesOf(p1);
          const m2 = grid.candidatesOf(p2);
          const common = m1 & m2;
          if (popcount(common) !== 1) continue;
          const z = digitsOf(common)[0]!;

          const union = m1 | m2;
          if (union !== pivotMask) continue;

          const eliminations = PEERS_OF[pivot]!
            .filter((cell) => PEERS_OF[p1]!.includes(cell) && PEERS_OF[p2]!.includes(cell))
            .filter((cell) => cell !== pivot && cell !== p1 && cell !== p2)
            .filter((cell) => grid.hasCandidate(cell, z))
            .map((cell) => ({ cell, digit: z }));
          if (eliminations.length === 0) continue;

          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [pivot, p1, p2],
              candidates: [
                ...pivotDigits.map((digit) => ({ cell: pivot, digit })),
                ...digitsOf(m1).map((digit) => ({ cell: p1, digit })),
                ...digitsOf(m2).map((digit) => ({ cell: p2, digit })),
              ],
              links: [],
            },
            explanation: {
              zh: `构成 XYZ-Wing：三值枢轴与两翼共同限制候选，故可删除公共候选 ${z}。`,
              en: `An XYZ-Wing is formed: the tri-value pivot with two pincers forces candidate ${z}, so remove ${z} from cells seeing all three.`,
            },
          };
        }
      }
    }

    return null;
  },
};
