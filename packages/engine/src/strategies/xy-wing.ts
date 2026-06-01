import { ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function peers(cell: number, other: number): boolean {
  return PEERS_OF[cell]!.includes(other);
}

function commonPeers(cellA: number, cellB: number): number[] {
  return PEERS_OF[cellA]!.filter((c) => PEERS_OF[cellB]!.includes(c));
}

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const bivalueCells: { cell: number; digits: number[] }[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0) continue;
      const mask = grid.candidatesOf(c);
      if (popcount(mask) === 2) {
        bivalueCells.push({ cell: c, digits: digitsOf(mask) });
      }
    }

    for (const pivot of bivalueCells) {
      const x = pivot.digits[0]!;
      const y = pivot.digits[1]!;

      const xzPincers: { cell: number; z: number }[] = [];
      const yzPincers: { cell: number; z: number }[] = [];

      for (const bc of bivalueCells) {
        if (bc.cell === pivot.cell) continue;
        if (!peers(pivot.cell, bc.cell)) continue;
        const a = bc.digits[0]!;
        const b = bc.digits[1]!;
        if (a === x && b !== y) {
          xzPincers.push({ cell: bc.cell, z: b });
        } else if (a === y && b !== x) {
          yzPincers.push({ cell: bc.cell, z: b });
        } else if (b === x && a !== y) {
          xzPincers.push({ cell: bc.cell, z: a });
        } else if (b === y && a !== x) {
          yzPincers.push({ cell: bc.cell, z: a });
        }
      }

      if (xzPincers.length === 0 || yzPincers.length === 0) continue;

      for (const p1 of xzPincers) {
        for (const p2 of yzPincers) {
          if (p1.z !== p2.z) continue;
          const z = p1.z;
          const shared = commonPeers(p1.cell, p2.cell);
          const elims: { cell: number; digit: number }[] = [];
          for (const c of shared) {
            if (grid.hasCandidate(c, z)) {
              elims.push({ cell: c, digit: z });
            }
          }
          if (elims.length === 0) continue;

          const rP = ROW_OF[pivot.cell]! + 1;
          const cP = COL_OF[pivot.cell]! + 1;
          const r1 = ROW_OF[p1.cell]! + 1;
          const c1 = COL_OF[p1.cell]! + 1;
          const r2 = ROW_OF[p2.cell]! + 1;
          const c2 = COL_OF[p2.cell]! + 1;
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [pivot.cell, p1.cell, p2.cell],
              candidates: [
                { cell: pivot.cell, digit: x }, { cell: pivot.cell, digit: y },
                { cell: p1.cell, digit: x }, { cell: p1.cell, digit: z },
                { cell: p2.cell, digit: y }, { cell: p2.cell, digit: z },
              ],
              links: [],
            },
            explanation: {
              zh: `XY翼：枢纽 R${rP}C${cP} {${x},${y}} 连接钳子 R${r1}C${c1} {${x},${z}} 和 R${r2}C${c2} {${y},${z}}，排除共同影响格中的 ${z}。`,
              en: `XY-Wing: Pivot R${rP}C${cP} {${x},${y}} connects pincers R${r1}C${c1} {${x},${z}} and R${r2}C${c2} {${y},${z}}, eliminate ${z} from cells seen by both pincers.`,
            },
          };
        }
      }
    }
    return null;
  },
};