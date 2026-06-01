import { ROW_OF, COL_OF, PEERS_OF, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0) continue;
      if (popcount(grid.candidatesOf(c)) !== 3) continue;

      const pivot = c;
      const pivotDigits = digitsOf(grid.candidatesOf(pivot));
      if (pivotDigits.length !== 3) continue;
      const z = pivotDigits[2]!;
      const x = pivotDigits[0]!;
      const y = pivotDigits[1]!;

      const bivaluePeers: number[] = [];
      for (const p of PEERS_OF[pivot]!) {
        if (grid.get(p) === 0 && popcount(grid.candidatesOf(p)) === 2) {
          bivaluePeers.push(p);
        }
      }

      for (let i = 0; i < bivaluePeers.length; i++) {
        const p1 = bivaluePeers[i]!;
        const d1 = digitsOf(grid.candidatesOf(p1));
        if (d1.length !== 2) continue;
        if (!d1.includes(z)) continue;
        const other1 = d1.find(dd => dd !== z);
        if (other1 === undefined || !pivotDigits.includes(other1)) continue;

        for (let j = i + 1; j < bivaluePeers.length; j++) {
          const p2 = bivaluePeers[j]!;
          const d2 = digitsOf(grid.candidatesOf(p2));
          if (d2.length !== 2) continue;
          if (!d2.includes(z)) continue;
          const other2 = d2.find(dd => dd !== z);
          if (other2 === undefined || !pivotDigits.includes(other2)) continue;
          if (other1 === other2) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const target of PEERS_OF[pivot]!) {
            if (target === p1 || target === p2 || target === pivot) continue;
            if (grid.get(target) !== 0) continue;
            if (PEERS_OF[p1]!.includes(target) && PEERS_OF[p2]!.includes(target)) {
              if ((grid.candidatesOf(target) & maskOf(z)) !== 0) {
                eliminations.push({ cell: target, digit: z });
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
                { from: { cell: pivot, digit: z }, to: { cell: p1, digit: other1 }, type: 'weak' },
                { from: { cell: pivot, digit: z }, to: { cell: p2, digit: other2 }, type: 'weak' },
                { from: { cell: p1, digit: other1 }, to: { cell: p2, digit: other2 }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `枢轴格 ${pivotStr}({${pivotDigits.join(',')}}) 与钳格 ${p1Str}({${d1.join(',')}}) 和 ${p2Str}({${d2.join(',')}}) 构成 XYZ翼，可排除同时看见枢轴与两钳格的格中候选数 ${z}。`,
              en: `Pivot ${pivotStr}({${pivotDigits.join(',')}}) with pincers ${p1Str}({${d1.join(',')}}) and ${p2Str}({${d2.join(',')}}) form an XYZ-Wing, eliminating candidate ${z} from cells seeing the pivot and both pincers.`,
            },
          };
        }
      }
    }
    return null;
  },
};