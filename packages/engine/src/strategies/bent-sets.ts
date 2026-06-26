import { CELLS, BOXES, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
      const box = BOXES[boxIdx]!;

      for (const line of [ROWS, COLS]) {
        for (let li = 0; li < 9; li++) {
          const lineCells = line[li]!.filter((c) => grid.get(c) === 0);
          const boxCells = box.filter((c) => grid.get(c) === 0);
          const shared = boxCells.filter((c) => line[li]!.includes(c));
          if (shared.length === 0) continue;

          const inBoxOnly = boxCells.filter((c) => !line[li]!.includes(c));
          const onLineOnly = lineCells.filter((c) => !box.includes(c));

          for (const size of [2, 3]) {
            const numCells = size + (size === 2 ? 1 : 0);
            const allCandidates = [
              ...shared.slice(0, Math.min(shared.length, size)),
              ...inBoxOnly.slice(0, Math.max(0, size - Math.min(shared.length, size))),
              ...onLineOnly.slice(0, Math.max(0, size - Math.min(shared.length, size) - inBoxOnly.length)),
            ];
            if (allCandidates.length < 2) continue;

            let totalMask = 0;
            for (const c of allCandidates) totalMask |= grid.candidatesOf(c);
            if (popcount(totalMask) !== size + 1) continue;

            for (const z of digitsOf(totalMask)) {
              const zBit = maskOf(z);
              const zCells = allCandidates.filter((c) => grid.candidatesOf(c) & zBit);
              if (zCells.length === 0) continue;

              let zRestricted = true;
              for (let i = 0; i < zCells.length; i++) {
                for (let j = i + 1; j < zCells.length; j++) {
                  if (!PEERS_OF[zCells[i]!]!.includes(zCells[j]!)) {
                    zRestricted = false;
                    break;
                  }
                }
                if (!zRestricted) break;
              }

              if (zRestricted) continue;

              const elims: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (allCandidates.includes(c) || grid.get(c) !== 0) continue;
                if (!(grid.candidatesOf(c) & zBit)) continue;
                const peers = new Set(PEERS_OF[c]!);
                if (zCells.every((zc) => peers.has(zc))) {
                  elims.push({ cell: c, digit: z });
                }
              }

              if (elims.length > 0) {
                return {
                  strategyId: 'bent-sets',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...allCandidates, ...elims.map((e) => e.cell)],
                    candidates: [
                      ...allCandidates.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `弯曲集：${allCandidates.length} 格含 ${size + 1} 个数字，非受限数字 ${z} 至少一真；消去公共可见格中的 ${z}。`,
                    en: `Bent Sets: ${allCandidates.length} cells with ${size + 1} digits; non-restricted digit ${z} must be true in one; eliminate ${z} from common peers.`,
                  },
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};