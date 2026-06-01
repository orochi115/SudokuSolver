import { ROW_OF, COL_OF, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    for (const pivot of bivalueCells) {
      const pivotDigits = digitsOf(grid.candidatesOf(pivot));
      if (pivotDigits.length !== 2) continue;
      const x = pivotDigits[0]!;
      const y = pivotDigits[1]!;

      const pincerCandidates: number[] = [];
      for (const c of bivalueCells) {
        if (c === pivot) continue;
        if (!PEERS_OF[pivot]!.includes(c)) continue;
        pincerCandidates.push(c);
      }

      for (let i = 0; i < pincerCandidates.length; i++) {
        const p1 = pincerCandidates[i]!;
        const d1 = digitsOf(grid.candidatesOf(p1));
        if (d1.length !== 2) continue;

        for (let j = i + 1; j < pincerCandidates.length; j++) {
          const p2 = pincerCandidates[j]!;
          const d2 = digitsOf(grid.candidatesOf(p2));
          if (d2.length !== 2) continue;

          let z: number | undefined;
          if (d1.includes(x) && d2.includes(y) && d1.some(dd => dd !== x) && d2.some(dd => dd !== y)) {
            const z1 = d1.find(dd => dd !== x);
            const z2 = d2.find(dd => dd !== y);
            if (z1 !== undefined && z2 !== undefined && z1 === z2) z = z1;
          }
          if (d1.includes(y) && d2.includes(x) && d1.some(dd => dd !== y) && d2.some(dd => dd !== x)) {
            const z1 = d1.find(dd => dd !== y);
            const z2 = d2.find(dd => dd !== x);
            if (z1 !== undefined && z2 !== undefined && z1 === z2) z = z1;
          }
          if (z === undefined) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of PEERS_OF[p1]!) {
            if (c === pivot || c === p1 || c === p2) continue;
            if (PEERS_OF[p2]!.includes(c) && grid.get(c) === 0) {
              const mask = grid.candidatesOf(c);
              if ((mask & (1 << (z - 1))) !== 0) {
                eliminations.push({ cell: c, digit: z });
              }
            }
          }
          if (eliminations.length === 0) continue;

          const pivotStr = `R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1}`;
          const p1Str = `R${ROW_OF[p1]! + 1}C${COL_OF[p1]! + 1}`;
          const p2Str = `R${ROW_OF[p2]! + 1}C${COL_OF[p2]! + 1}`;
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [pivot, p1, p2, ...eliminations.map(e => e.cell)],
              candidates: [
                ...pivotDigits.map(dd => ({ cell: pivot, digit: dd })),
                ...d1.map(dd => ({ cell: p1, digit: dd })),
                ...d2.map(dd => ({ cell: p2, digit: dd })),
                ...eliminations.map(e => ({ cell: e.cell, digit: z })),
              ],
              links: [
                { from: { cell: pivot, digit: x }, to: { cell: p1, digit: z }, type: 'weak' },
                { from: { cell: pivot, digit: y }, to: { cell: p2, digit: z }, type: 'weak' },
                { from: { cell: p1, digit: z }, to: { cell: p2, digit: z }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `枢轴格 ${pivotStr}({${x},${y}}) 与钳格 ${p1Str}({${d1.join(',')}}) 和 ${p2Str}({${d2.join(',')}}) 构成 XY翼，可排除同时看见两钳格的格中候选数 ${z}。`,
              en: `Pivot ${pivotStr}({${x},${y}}) with pincers ${p1Str}({${d1.join(',')}}) and ${p2Str}({${d2.join(',')}}) form an XY-Wing, eliminating candidate ${z} from cells seeing both pincers.`,
            },
          };
        }
      }
    }
    return null;
  },
};