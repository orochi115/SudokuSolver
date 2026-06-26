import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryWXYZWing(grid: Grid): Step | null {
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalueCells.push(c);
  }

  for (const pivot of bivalueCells) {
    const pivotMask = grid.candidatesOf(pivot);
    const pivotDigits = digitsOf(pivotMask);

    const pivotPeers = new Set(PEERS_OF[pivot]!);
    const nearBivalue = bivalueCells.filter((c) => c !== pivot && pivotPeers.has(c));

    for (let i = 0; i < nearBivalue.length; i++) {
      for (let j = i + 1; j < nearBivalue.length; j++) {
        const a = nearBivalue[i]!;
        const b = nearBivalue[j]!;
        const aMask = grid.candidatesOf(a);
        const bMask = grid.candidatesOf(b);

        const allMasks = pivotMask | aMask | bMask;
        const allDigits = digitsOf(allMasks);
        if (allDigits.length < 3 || allDigits.length > 4) continue;

        const sharedA = pivotDigits.filter((d) => aMask & maskOf(d));
        const sharedB = pivotDigits.filter((d) => bMask & maskOf(d));
        if (sharedA.length !== 1 || sharedB.length !== 1) continue;
        const rccA = sharedA[0]!;
        const rccB = sharedB[0]!;

        const zCandidates = allDigits.filter((d) => d !== rccA && d !== rccB);
        for (const z of zCandidates) {
          const zBit = maskOf(z);
          if (!(pivotMask & zBit)) continue;
          if (!(aMask & zBit)) continue;
          if (!(bMask & zBit)) continue;

          const aPeers = new Set(PEERS_OF[a]!);
          const bPeers = new Set(PEERS_OF[b]!);
          const commonPeers: number[] = [];
          for (const p of aPeers) {
            if (bPeers.has(p) && p !== pivot && p !== a && p !== b && grid.hasCandidate(p, z)) {
              commonPeers.push(p);
            }
          }

          if (commonPeers.length > 0) {
            return {
              strategyId: 'wxyz-wing',
              placements: [],
              eliminations: commonPeers.map((c) => ({ cell: c, digit: z })),
              highlights: {
                cells: [pivot, a, b],
                candidates: [
                  { cell: pivot, digit: rccA }, { cell: pivot, digit: rccB }, { cell: pivot, digit: z },
                  { cell: a, digit: rccA }, { cell: a, digit: z },
                  { cell: b, digit: rccB }, { cell: b, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ-Wing：枢纽 ${cellLabel(pivot)}（{${pivotDigits.join(',')}}）与翼格 ${cellLabel(a)} 和 ${cellLabel(b)} 共享 RCC ${rccA}、${rccB}；消去共同数字 ${z}。`,
                en: `WXYZ-Wing: pivot ${cellLabel(pivot)} ({${pivotDigits.join(',')}}) with wings ${cellLabel(a)} and ${cellLabel(b)} sharing RCC ${rccA},${rccB}; eliminate ${z}.`,
              },
            };
          }
        }
      }
    }
  }

  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ 翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryWXYZWing(grid);
  },
};