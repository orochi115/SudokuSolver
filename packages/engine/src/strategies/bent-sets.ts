import { CELLS, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryBentSets(grid: Grid): Step | null {
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalueCells.push(c);
  }

  for (const stem of bivalueCells) {
    const stemMask = grid.candidatesOf(stem);
    const stemDigits = digitsOf(stemMask);
    if (stemDigits.length !== 2) continue;

    const stemPeers = new Set(PEERS_OF[stem]!);
    const nearBivalue = bivalueCells.filter((c) => c !== stem && stemPeers.has(c));

    for (let i = 0; i < nearBivalue.length; i++) {
      for (let j = i + 1; j < nearBivalue.length; j++) {
        const a = nearBivalue[i]!;
        const b = nearBivalue[j]!;
        if (!PEERS_OF[a]!.includes(b)) continue;

        const aMask = grid.candidatesOf(a);
        const bMask = grid.candidatesOf(b);
        const unionMask = stemMask | aMask | bMask;

        if (popcount(unionMask) !== 3) continue;

        const unionDigits = digitsOf(unionMask);
        const rccDigits = stemDigits.filter((d) => (aMask & maskOf(d)) && (bMask & maskOf(d)));
        if (rccDigits.length !== 1) continue;

        const rcc = rccDigits[0]!;
        const z = stemDigits.find((d) => d !== rcc)!;
        if (!(aMask & maskOf(z)) && !(bMask & maskOf(z))) continue;

        const zCells = [a, b].filter((c) => grid.candidatesOf(c) & maskOf(z));
        if (zCells.length < 1) continue;

        const peersA = new Set(PEERS_OF[zCells[0]!]!);
        const commonPeers = zCells.length > 1
          ? PEERS_OF[zCells[1]!]!.filter((p) => peersA.has(p))
          : [...peersA];

        const eliminations: { cell: number; digit: number }[] = [];
        for (const c of commonPeers) {
          if (c === stem || c === a || c === b) continue;
          if (grid.hasCandidate(c, z)) eliminations.push({ cell: c, digit: z });
        }

        if (eliminations.length > 0) {
          return {
            strategyId: 'bent-sets',
            placements: [],
            eliminations,
            highlights: {
              cells: [stem, a, b, ...eliminations.map((e) => e.cell)],
              candidates: [
                ...([stem, a, b] as const).flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `Bent Sets（ALP/ALT）：{${cellLabel(stem)},${cellLabel(a)},${cellLabel(b)}} 形成几乎锁定组；消去 ${z}。`,
              en: `Bent Sets (ALP/ALT): {${cellLabel(stem)},${cellLabel(a)},${cellLabel(b)}} form an ALS; eliminate ${z}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: 'Bent Sets', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryBentSets(grid);
  },
};