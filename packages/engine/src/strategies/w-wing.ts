import { SIZE, ROW_OF, COL_OF, HOUSES, PEERS_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function peers(cell: number, other: number): boolean {
  return PEERS_OF[cell]!.includes(other);
}

function hasConjugatePair(grid: Grid, digit: number, houseIdx: number): number[] {
  const house = HOUSES[houseIdx]!;
  const cells: number[] = [];
  for (const c of house) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(digit))) {
      cells.push(c);
    }
  }
  return cells.length === 2 ? cells : [];
}

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
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

    for (let i = 0; i < bivalueCells.length; i++) {
      const a = bivalueCells[i]!;
      if (a.cell === 99) continue;
      for (let j = i + 1; j < bivalueCells.length; j++) {
        const b = bivalueCells[j]!;
        if (a.digits[0] !== b.digits[0] || a.digits[1] !== b.digits[1]) continue;
        if (peers(a.cell, b.cell)) continue;

        const [d1, d2] = a.digits;

        for (let h = 0; h < 27; h++) {
          const conj = hasConjugatePair(grid, d1!, h);
          if (conj.length !== 2) continue;
          if (!conj.includes(a.cell) || !conj.includes(b.cell)) continue;

          const elims: { cell: number; digit: number }[] = [];
          const commonPeers = PEERS_OF[a.cell]!.filter((c) => PEERS_OF[b.cell]!.includes(c));
          for (const c of commonPeers) {
            if (grid.hasCandidate(c, d2!)) {
              elims.push({ cell: c, digit: d2! });
            }
          }
          if (elims.length === 0) continue;

          const r1 = ROW_OF[a.cell]! + 1;
          const c1 = COL_OF[a.cell]! + 1;
          const r2 = ROW_OF[b.cell]! + 1;
          const c2 = COL_OF[b.cell]! + 1;
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [a.cell, b.cell],
              candidates: [
                { cell: a.cell, digit: a.digits[0]! }, { cell: a.cell, digit: a.digits[1]! },
                { cell: b.cell, digit: b.digits[0]! }, { cell: b.cell, digit: b.digits[1]! },
              ],
              links: [],
            },
            explanation: {
              zh: `W翼：双值格 R${r1}C${c1} 和 R${r2}C${c2} 同为 {${d1},${d2}}，通过数字 ${d1} 的强链连接，排除共同影响格中的 ${d2}。`,
              en: `W-Wing: Bivalue cells R${r1}C${c1} and R${r2}C${c2} both {${d1},${d2}} connected by strong link on ${d1}, eliminate ${d2} from cells seen by both.`,
            },
          };
        }

        for (let h = 0; h < 27; h++) {
          const conj = hasConjugatePair(grid, d2!, h);
          if (conj.length !== 2) continue;
          if (!conj.includes(a.cell) || !conj.includes(b.cell)) continue;

          const elims: { cell: number; digit: number }[] = [];
          const commonPeers = PEERS_OF[a.cell]!.filter((c) => PEERS_OF[b.cell]!.includes(c));
          for (const c of commonPeers) {
            if (grid.hasCandidate(c, d1!)) {
              elims.push({ cell: c, digit: d1! });
            }
          }
          if (elims.length === 0) continue;

          const r1 = ROW_OF[a.cell]! + 1;
          const c1 = COL_OF[a.cell]! + 1;
          const r2 = ROW_OF[b.cell]! + 1;
          const c2 = COL_OF[b.cell]! + 1;
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [a.cell, b.cell],
              candidates: [
                { cell: a.cell, digit: a.digits[0]! }, { cell: a.cell, digit: a.digits[1]! },
                { cell: b.cell, digit: b.digits[0]! }, { cell: b.cell, digit: b.digits[1]! },
              ],
              links: [],
            },
            explanation: {
              zh: `W翼：双值格 R${r1}C${c1} 和 R${r2}C${c2} 同为 {${d1},${d2}}，通过数字 ${d2} 的强链连接，排除共同影响格中的 ${d1}。`,
              en: `W-Wing: Bivalue cells R${r1}C${c1} and R${r2}C${c2} both {${d1},${d2}} connected by strong link on ${d2}, eliminate ${d1} from cells seen by both.`,
            },
          };
        }
      }
    }
    return null;
  },
};