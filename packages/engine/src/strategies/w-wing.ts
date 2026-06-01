import { ROWS, COLS, BOXES, ROW_OF, COL_OF, PEERS_OF, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const bivalueCells: number[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        bivalueCells.push(c);
      }
    }

    for (let i = 0; i < bivalueCells.length; i++) {
      for (let j = i + 1; j < bivalueCells.length; j++) {
        const a = bivalueCells[i]!;
        const b = bivalueCells[j]!;
        const dA = digitsOf(grid.candidatesOf(a));
        const dB = digitsOf(grid.candidatesOf(b));
        if (dA.length !== 2 || dB.length !== 2) continue;
        if (dA[0] !== dB[0] || dA[1] !== dB[1]) continue;

        const x = dA[0]!;
        const y = dA[1]!;

        const bridge = findConjugatePairBridge(grid, y, maskOf(y), a, b);
        if (bridge === null) continue;

        const eliminations: { cell: number; digit: number }[] = [];
        for (const p of PEERS_OF[a]!) {
          if (p === b) continue;
          if (PEERS_OF[b]!.includes(p) && grid.get(p) === 0 && (grid.candidatesOf(p) & maskOf(x)) !== 0) {
            eliminations.push({ cell: p, digit: x });
          }
        }
        if (eliminations.length === 0) continue;

        const aR = ROW_OF[a]! + 1;
        const aC = COL_OF[a]! + 1;
        const bR = ROW_OF[b]! + 1;
        const bC = COL_OF[b]! + 1;
        return {
          strategyId: this.id,
          placements: [],
          eliminations,
          highlights: {
            cells: [a, b, bridge[0], bridge[1], ...eliminations.map(e => e.cell)],
            candidates: [
              ...dA.map(dd => ({ cell: a, digit: dd })),
              ...dB.map(dd => ({ cell: b, digit: dd })),
              { cell: bridge[0], digit: y },
              { cell: bridge[1], digit: y },
              ...eliminations.map(e => ({ cell: e.cell, digit: x })),
            ],
            links: [
              { from: { cell: a, digit: y }, to: { cell: bridge[0], digit: y }, type: 'weak' },
              { from: { cell: bridge[0], digit: y }, to: { cell: bridge[1], digit: y }, type: 'strong' },
              { from: { cell: bridge[1], digit: y }, to: { cell: b, digit: y }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `R${aR}C${aC} 和 R${bR}C${bC} 同含数对 {${x},${y}}，且数字 ${y} 有强链连接（R${ROW_OF[bridge[0]]! + 1}C${COL_OF[bridge[0]]! + 1}—R${ROW_OF[bridge[1]]! + 1}C${COL_OF[bridge[1]]! + 1}），因此可排除同时看见两格的候选数 ${x}（W翼）。`,
            en: `R${aR}C${aC} and R${bR}C${bC} both contain pair {${x},${y}}, and digit ${y} has a strong link (R${ROW_OF[bridge[0]]! + 1}C${COL_OF[bridge[0]]! + 1}—R${ROW_OF[bridge[1]]! + 1}C${COL_OF[bridge[1]]! + 1}), so candidate ${x} can be removed from cells seeing both (W-Wing).`,
          },
        };
      }
    }
    return null;
  },
};

function findConjugatePairBridge(grid: Grid, digit: number, bit: number, cellA: number, cellB: number): [number, number] | null {
  const allHouses = [...ROWS, ...COLS, ...BOXES];
  for (const house of allHouses) {
    const locs: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) locs.push(c);
    }
    if (locs.length === 2) {
      const l0 = locs[0]!;
      const l1 = locs[1]!;
      if (PEERS_OF[cellA]!.includes(l0) && PEERS_OF[cellB]!.includes(l1)) return [l0, l1];
      if (PEERS_OF[cellA]!.includes(l1) && PEERS_OF[cellB]!.includes(l0)) return [l1, l0];
    }
  }
  return null;
}