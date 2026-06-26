import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      const byRow: number[][] = Array.from({ length: 9 }, () => []);
      const byCol: number[][] = Array.from({ length: 9 }, () => []);
      const byBox: number[][] = Array.from({ length: 9 }, () => []);

      let count = 0;
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
          byRow[ROW_OF[c]!]!.push(c);
          byCol[COL_OF[c]!]!.push(c);
          byBox[BOX_OF[c]!]!.push(c);
          count++;
        }
      }

      if (count < 5 || count > 9) continue;

      const oddRows = byRow.filter((rc) => rc.length >= 2);
      const oddCols = byCol.filter((cc) => cc.length >= 2);

      for (let r1 = 0; r1 < oddRows.length; r1++) {
        for (let r2 = r1 + 1; r2 < oddRows.length; r2++) {
          for (let r3 = r2 + 1; r3 < oddRows.length; r3++) {
            const rowSets = [oddRows[r1]!, oddRows[r2]!, oddRows[r3]!];
            const rowNums = rowSets.map((rs) => ROW_OF[rs[0]!]!);
            const allCells = [...new Set(rowSets.flat())];

            let totalInCols = 0;
            const colSet = new Set<number>();
            for (const c of allCells) colSet.add(COL_OF[c]!);
            for (const col of colSet) {
              totalInCols += byCol[col]!.filter((bc) => allCells.includes(bc)).length;
            }

            if (totalInCols < allCells.length) continue;

            const guardianCells: number[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (allCells.includes(c)) continue;
              if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
                const peers = new Set(PEERS_OF[c]!);
                const oddGuardian = allCells.some((ac) => peers.has(ac));
                if (oddGuardian) {
                  guardianCells.push(c);
                }
              }
            }

            if (guardianCells.length === 0 || guardianCells.length > 4) continue;

            const minGuardianBox = new Map<number, number[]>();
            for (const gc of guardianCells) {
              const box = BOX_OF[gc]!;
              if (!minGuardianBox.has(box)) minGuardianBox.set(box, []);
              minGuardianBox.get(box)!.push(gc);
            }

            for (const [box, gCells] of minGuardianBox) {
              if (gCells.length >= 2) {
                for (const gc of gCells) {
                  const others = gCells.filter((g) => g !== gc);
                  if (others.every((o) => PEERS_OF[gc]!.includes(o))) {
                    const elims: { cell: number; digit: number }[] = [];
                    for (let c = 0; c < CELLS; c++) {
                      if (guardianCells.includes(c) || allCells.includes(c) || grid.get(c) !== 0) continue;
                      if (!(grid.candidatesOf(c) & bit)) continue;
                      const peers = new Set(PEERS_OF[c]!);
                      if (gCells.every((gc2) => peers.has(gc2))) {
                        elims.push({ cell: c, digit: d });
                      }
                    }
                    if (elims.length > 0) {
                      return {
                        strategyId: 'broken-wing',
                        placements: [],
                        eliminations: elims,
                        highlights: {
                          cells: [...new Set([...allCells, ...guardianCells, ...elims.map((e) => e.cell)])],
                          candidates: [
                            ...new Set([...allCells, ...guardianCells]).map((c) => ({ cell: c, digit: d })),
                            ...elims,
                          ],
                          links: [],
                        },
                        explanation: {
                          zh: `断翼：数字 ${d} 的奇数环有 ${guardianCells.length} 个守护格，至少一真；消去公共可见格中的 ${d}。`,
                          en: `Broken Wing: digit ${d}'s oddagon has ${guardianCells.length} guardian cells; at least one guardian is true; eliminate ${d} from common peers.`,
                        },
                      };
                    }
                  }
                }
              }
            }

            if (guardianCells.length === 1) {
              if (grid.hasCandidate(guardianCells[0]!, d)) {
                return {
                  strategyId: 'broken-wing',
                  placements: [],
                  eliminations: [{ cell: guardianCells[0]!, digit: d }],
                  highlights: {
                    cells: [...new Set([...allCells, ...guardianCells])],
                    candidates: [...new Set([...allCells, ...guardianCells]).map((c) => ({ cell: c, digit: d }))],
                    links: [],
                  },
                  explanation: {
                    zh: `断翼：数字 ${d} 的奇数环仅有一个守护格 ${cellLabel(guardianCells[0]!)}，该格必须为 ${d} 以打破奇数环。`,
                    en: `Broken Wing: digit ${d}'s oddagon has a single guardian ${cellLabel(guardianCells[0]!)}; that cell must be ${d} to break the oddagon.`,
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