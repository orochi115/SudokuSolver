import { SIZE, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function peers(cell: number, other: number): boolean {
  return PEERS_OF[cell]!.includes(other);
}

function commonPeers(cellA: number, cellB: number): number[] {
  return PEERS_OF[cellA]!.filter((c) => PEERS_OF[cellB]!.includes(c));
}

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const triValueCells: { cell: number; digits: number[] }[] = [];
    const biValueCells: { cell: number; digits: number[] }[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0) continue;
      const mask = grid.candidatesOf(c);
      const cnt = popcount(mask);
      if (cnt === 3) triValueCells.push({ cell: c, digits: digitsOf(mask) });
      if (cnt === 2) biValueCells.push({ cell: c, digits: digitsOf(mask) });
    }

    for (const pivot of triValueCells) {
      const [x, y, z] = pivot.digits;

      const pincer1 = biValueCells.find(
        (b) => peers(pivot.cell, b.cell) && b.digits[0] === x && b.digits[1] === z
      ) ?? biValueCells.find(
        (b) => peers(pivot.cell, b.cell) && b.digits[0] === z && b.digits[1] === x
      );

      const pincer2 = biValueCells.find(
        (b) => peers(pivot.cell, b.cell) && b.digits[0] === y && b.digits[1] === z
      ) ?? biValueCells.find(
        (b) => peers(pivot.cell, b.cell) && b.digits[0] === z && b.digits[1] === y
      );

      if (!pincer1 || !pincer2 || pincer1.cell === pincer2.cell) continue;

      // Z must be the common digit
      if (!pincer1.digits.includes(z!) || !pincer2.digits.includes(z!)) continue;

      const shared = commonPeers(pincer1.cell, pincer2.cell).filter(
        (c) => peers(c, pivot.cell)
      );

      const elims: { cell: number; digit: number }[] = [];
      for (const c of shared) {
        if (grid.hasCandidate(c, z!)) {
          elims.push({ cell: c, digit: z! });
        }
      }

      const alsoPivotPeers = commonPeers(pivot.cell, pivot.cell).filter((c) => {
        if (c === pincer1.cell || c === pincer2.cell) return false;
        return peers(c, pincer1.cell) && peers(c, pincer2.cell);
      });
      for (const c of alsoPivotPeers) {
        if (grid.hasCandidate(c, z!) && !elims.find((e) => e.cell === c)) {
          elims.push({ cell: c, digit: z! });
        }
      }

      if (elims.length === 0) continue;

      const rP = ROW_OF[pivot.cell]! + 1;
      const cP = COL_OF[pivot.cell]! + 1;
      const r1 = ROW_OF[pincer1.cell]! + 1;
      const c1 = COL_OF[pincer1.cell]! + 1;
      const r2 = ROW_OF[pincer2.cell]! + 1;
      const c2 = COL_OF[pincer2.cell]! + 1;
      return {
        strategyId: this.id,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [pivot.cell, pincer1.cell, pincer2.cell],
          candidates: [
            { cell: pivot.cell, digit: x! }, { cell: pivot.cell, digit: y! }, { cell: pivot.cell, digit: z! },
            { cell: pincer1.cell, digit: pincer1.digits[0]! }, { cell: pincer1.cell, digit: pincer1.digits[1]! },
            { cell: pincer2.cell, digit: pincer2.digits[0]! }, { cell: pincer2.cell, digit: pincer2.digits[1]! },
          ],
          links: [],
        },
        explanation: {
          zh: `XYZ翼：枢纽 R${rP}C${cP} {${x},${y},${z}} 连接钳子 R${r1}C${c1} 和 R${r2}C${c2}，排除它们共同影响格中的 ${z}。`,
          en: `XYZ-Wing: Pivot R${rP}C${cP} {${x},${y},${z}} connects pincers R${r1}C${c1} and R${r2}C${c2}, eliminate ${z} from cells seen by pivot and both pincers.`,
        },
      };
    }
    return null;
  },
};