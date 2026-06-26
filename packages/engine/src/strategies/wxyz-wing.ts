import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
      const box = BOXES[boxIdx]!;
      const boxCells = box.filter((c) => grid.get(c) === 0);

      for (const line of [ROWS, COLS]) {
        for (let li = 0; li < 9; li++) {
          const lineCells = line[li]!.filter((c) => grid.get(c) === 0);
          const shared = boxCells.filter((c) => line[li]!.includes(c));
          if (shared.length === 0) continue;

          const inBoxOnly = boxCells.filter((c) => !line[li]!.includes(c));
          const onLineOnly = lineCells.filter((c) => !box.includes(c));

          const wingCells = [...shared, ...inBoxOnly, ...onLineOnly].slice(0, 4);
          if (wingCells.length !== 4) continue;

          if (new Set(wingCells).size !== 4) continue;

          let totalMask = 0;
          for (const c of wingCells) totalMask |= grid.candidatesOf(c);
          if (popcount(totalMask) !== 4) continue;

          let nonRestricted: number | null = null;
          let valid = true;
          for (const d of digitsOf(totalMask)) {
            const cellWithD = wingCells.filter((c) => grid.hasCandidate(c, d));
            let allSee = true;
            for (let i = 0; i < cellWithD.length; i++) {
              for (let j = i + 1; j < cellWithD.length; j++) {
                if (!PEERS_OF[cellWithD[i]!]!.includes(cellWithD[j]!)) {
                  allSee = false;
                  break;
                }
              }
              if (!allSee) break;
            }
            if (!allSee) {
              if (nonRestricted !== null) { valid = false; break; }
              nonRestricted = d;
            }
          }
          if (!valid || nonRestricted === null) continue;

          const zBit = maskOf(nonRestricted);
          const zCells = wingCells.filter((c) => grid.candidatesOf(c) & zBit);

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (wingCells.includes(c) || grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            const peers = new Set(PEERS_OF[c]!);
            if (zCells.every((zc) => peers.has(zc))) {
              elims.push({ cell: c, digit: nonRestricted });
            }
          }

          if (elims.length > 0) {
            return {
              strategyId: 'wxyz-wing',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...wingCells, ...elims.map((e) => e.cell)],
                candidates: [
                  ...wingCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ翼：4 格含 4 数字，非受限数字 ${nonRestricted} 至少一真；消去其所有公共可见格中的 ${nonRestricted}。`,
                en: `WXYZ-Wing: 4 cells with 4 digits; non-restricted digit ${nonRestricted} must be true in one; eliminate ${nonRestricted} from cells seeing all its occurrences.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};