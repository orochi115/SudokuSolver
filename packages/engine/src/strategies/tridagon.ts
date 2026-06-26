import { ROW_OF, COL_OF, BOX_OF, HOUSES, ROWS, COLS, BOXES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const TRI_BOXES: [number, number, number, number][] = [];
for (let b1 = 0; b1 < 6; b1++) {
  for (let b2 = b1 + 1; b2 < 9; b2++) {
    if (Math.floor(b1 / 3) !== Math.floor(b2 / 3)) continue;
    for (let b3 = 0; b3 < 6; b3++) {
      if (b3 === b1 || b3 === b2) continue;
      if (b3 % 3 !== b1 % 3) continue;
      for (let b4 = b3 + 1; b4 < 9; b4++) {
        if (b4 === b1 || b4 === b2) continue;
        if (Math.floor(b4 / 3) !== Math.floor(b3 / 3)) continue;
        if (b4 % 3 !== b2 % 3) continue;
        TRI_BOXES.push([b1, b2, b3, b4]);
      }
    }
  }
}

interface TriBoxTransversal {
  cells: [number, number, number];
  digitMask: number;
}

function findTransversals(grid: Grid, boxIdx: number, dMask: number): TriBoxTransversal[] {
  const box = BOXES[boxIdx]!;
  const result: TriBoxTransversal[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 3; j < 6; j++) {
      for (let k = 6; k < 9; k++) {
        const cells = [box[i]!, box[j]!, box[k]!];
        const minirows = new Set(cells.map((c) => ROW_OF[c]! % 3));
        const minicols = new Set(cells.map((c) => COL_OF[c]! % 3));
        if (minirows.size !== 3 || minicols.size !== 3) continue;
        let mask = 0;
        let valid = true;
        for (const c of cells) {
          if (grid.get(c) !== 0) { valid = false; break; }
          const cm = grid.candidatesOf(c);
          if ((cm & ~dMask) !== 0) continue;
          mask |= cm;
        }
        if (!valid) continue;
        if (popcount(mask) === 3 && (mask & dMask) === dMask) {
          result.push({ cells: cells as [number, number, number], digitMask: mask });
        }
      }
    }
  }
  return result;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [b1, b2, b3, b4] of TRI_BOXES) {
      const digitSets = new Map<string, { dMask: number; trans: Map<number, TriBoxTransversal[]> }>();
      for (let d1 = 1; d1 <= 7; d1++) {
        for (let d2 = d1 + 1; d2 <= 8; d2++) {
          for (let d3 = d2 + 1; d3 <= 9; d3++) {
            const dMask = maskOf(d1) | maskOf(d2) | maskOf(d3);
            const t1 = findTransversals(grid, b1, dMask);
            const t2 = findTransversals(grid, b2, dMask);
            const t3 = findTransversals(grid, b3, dMask);
            const t4 = findTransversals(grid, b4, dMask);
            if (t1.length === 0 || t2.length === 0 || t3.length === 0 || t4.length === 0) continue;
            const key = `${d1}-${d2}-${d3}`;
            const trans = new Map<number, TriBoxTransversal[]>();
            trans.set(b1, t1); trans.set(b2, t2); trans.set(b3, t3); trans.set(b4, t4);
            digitSets.set(key, { dMask, trans });
          }
        }
      }

      for (const { dMask, trans } of digitSets.values()) {
        const digits = digitsOf(dMask);
        for (const t1 of trans.get(b1)!) {
          for (const t2 of trans.get(b2)!) {
            for (const t3 of trans.get(b3)!) {
              for (const t4 of trans.get(b4)!) {
                const allCells = [...t1.cells, ...t2.cells, ...t3.cells, ...t4.cells];
                const allCellSet = new Set(allCells);
                const patternCells = allCells.filter((c) => {
                  const cm = grid.candidatesOf(c);
                  return (cm & ~dMask) === 0;
                });
                const targetCells = allCells.filter((c) => {
                  const cm = grid.candidatesOf(c);
                  return (cm & ~dMask) !== 0;
                });
                if (patternCells.length !== 11 || targetCells.length !== 1) continue;

                const target = targetCells[0]!;
                const elims = digits
                  .filter((d) => grid.hasCandidate(target, d))
                  .map((d) => ({ cell: target, digit: d }));
                if (elims.length === 0) continue;

                return {
                  strategyId: 'tridagon',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: allCells,
                    candidates: allCells.flatMap((c) =>
                      digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                    ),
                    links: [],
                  },
                  explanation: {
                    zh: `三值死环（Tridagon）：在宫 ${[b1 + 1, b2 + 1, b3 + 1, b4 + 1].join(',')} 中，数字 {${digits.join(',')}} 构成三值死环，${cellLabel(target)} 为守护格；消去该格的 ${digits.join(',')}。`,
                    en: `Tridagon: four boxes ${[b1 + 1, b2 + 1, b3 + 1, b4 + 1].join(',')} form a trivalue oddagon on digits {${digits.join(',')}}; ${cellLabel(target)} is the guardian cell; eliminate ${digits.join(',')} from it.`,
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