import {
  CELLS, PEERS_OF, ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function seeEachOther(a: number, b: number): boolean {
  return PEERS_OF[a]!.includes(b);
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const quadCells: number[] = [];
    const tripleCells: number[] = [];
    const bivalueCells: number[] = [];

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      const pc = popcount(m);
      if (pc === 2) bivalueCells.push(c);
      else if (pc === 3) tripleCells.push(c);
      else if (pc === 4) quadCells.push(c);
    }

    for (const pivot of quadCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask);

      for (const rcc of pivotDigits) {
        const rccBit = maskOf(rcc);
        const petals = bivalueCells.filter(p => {
          if (p === pivot) return false;
          if (!(grid.candidatesOf(p) & rccBit)) return false;
          if (!seeEachOther(p, pivot)) return false;
          return true;
        });

        if (petals.length < 3) {
          const extraPetals = tripleCells.filter(p => {
            if (p === pivot || petals.includes(p)) return false;
            if (!(grid.candidatesOf(p) & rccBit)) return false;
            if (!seeEachOther(p, pivot)) return false;
            const pMask = grid.candidatesOf(p);
            return (pMask & ~rccBit & ~pivotMask) === 0;
          });

          for (const extra of extraPetals) {
            const testPetals = [...petals, extra];
            if (testPetals.length < 3) continue;

            let commonMask = grid.candidatesOf(testPetals[0]!) & ~rccBit;
            for (let i = 1; i < testPetals.length; i++) {
              commonMask &= grid.candidatesOf(testPetals[i]!) & ~rccBit;
            }

            const elimDigits = digitsOf(commonMask);
            for (const z of elimDigits) {
              const zBit = maskOf(z);
              const eliminations: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (grid.get(c) !== 0) continue;
                if (!(grid.candidatesOf(c) & zBit)) continue;
                if (c === pivot || testPetals.includes(c)) continue;
                const peers = new Set(PEERS_OF[c]!);
                if (peers.has(pivot) && testPetals.every(p => peers.has(p))) {
                  eliminations.push({ cell: c, digit: z });
                }
              }

              if (eliminations.length > 0) {
                const allCells = [pivot, ...testPetals, ...eliminations.map(e => e.cell)];
                return {
                  strategyId: 'wxyz-wing',
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...new Set(allCells)],
                    candidates: [
                      ...allCells.filter(c => c === pivot || testPetals.includes(c))
                        .flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...eliminations,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `WXYZ翼：枢纽 ${cellLabel(pivot)}（候选 {${pivotDigits.join(',')}}）通过受限公共候选 ${rcc} 连接 ${testPetals.length} 个花瓣；消去公共可见格中的 ${z}。`,
                    en: `WXYZ-Wing: pivot ${cellLabel(pivot)} (cands {${pivotDigits.join(',')}}) linked by RCC ${rcc} to ${testPetals.length} petals; eliminate ${z} from common peers.`,
                  },
                };
              }
            }
          }
          continue;
        }

        let commonMask = 0x1ff & ~rccBit;
        for (const p of petals.slice(0, 3)) {
          commonMask &= grid.candidatesOf(p) & ~rccBit;
        }
        for (const p of petals.slice(3)) {
          commonMask &= grid.candidatesOf(p) & ~rccBit;
        }

        const elimDigits = digitsOf(commonMask);
        for (const z of elimDigits) {
          const zBit = maskOf(z);
          const usedPetals = petals.slice(0, 3);
          const eliminations: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            if (c === pivot || usedPetals.includes(c)) continue;
            const peers = new Set(PEERS_OF[c]!);
            if (peers.has(pivot) && usedPetals.every(p => peers.has(p))) {
              eliminations.push({ cell: c, digit: z });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: 'wxyz-wing',
              placements: [],
              eliminations,
              highlights: {
                cells: [...new Set([pivot, ...usedPetals, ...eliminations.map(e => e.cell)])],
                candidates: [
                  ...usedPetals.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                  ...digitsOf(pivotMask).map(d => ({ cell: pivot, digit: d })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ翼：枢纽 ${cellLabel(pivot)}（候选 {${pivotDigits.join(',')}}）通过 ${rcc} 连接 3 个双值花瓣；消去公共可见格的 ${z}（WXYZ翼）。`,
                en: `WXYZ-Wing: pivot ${cellLabel(pivot)} (cands {${pivotDigits.join(',')}}) linked by ${rcc} to 3 petals; eliminate ${z} from common peers.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};