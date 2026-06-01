import { CELLS, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 2) continue;
      const [x, y] = digitsOf(pivotMask);
      if (!x || !y) continue;

      const peerCells = PEERS_OF[pivot]!.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2);
      for (let i = 0; i < peerCells.length; i++) {
        const p1 = peerCells[i]!;
        const m1 = grid.candidatesOf(p1);
        const d1 = digitsOf(m1);
        let z = 0;
        if (d1.includes(x)) z = d1.find((d) => d !== x) ?? 0;
        else if (d1.includes(y)) z = d1.find((d) => d !== y) ?? 0;
        else continue;
        if (z === 0 || z === x || z === y) continue;

        for (let j = i + 1; j < peerCells.length; j++) {
          const p2 = peerCells[j]!;
          if (PEERS_OF[p1]!.includes(p2)) continue;
          const d2 = digitsOf(grid.candidatesOf(p2));
          const match = (d2.includes(y) && d2.includes(z) && d1.includes(x) && d1.includes(z)) || (d2.includes(x) && d2.includes(z) && d1.includes(y) && d1.includes(z));
          if (!match) continue;

          const eliminations = PEERS_OF[p1]!
            .filter((cell) => PEERS_OF[p2]!.includes(cell))
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
                ...digitsOf(grid.candidatesOf(pivot)).map((digit) => ({ cell: pivot, digit })),
                ...digitsOf(grid.candidatesOf(p1)).map((digit) => ({ cell: p1, digit })),
                ...digitsOf(grid.candidatesOf(p2)).map((digit) => ({ cell: p2, digit })),
              ],
              links: [],
            },
            explanation: {
              zh: `构成 XY-Wing：枢轴与两翼共享链路，公共候选 ${z} 在可见交集处被排除。`,
              en: `An XY-Wing is formed: pivot and pincers force a contradiction on shared candidate ${z}, so eliminate ${z} from their common peers.`,
            },
          };
        }
      }
    }
    return null;
  },
};
