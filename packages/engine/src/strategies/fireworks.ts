import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function tryFireworks(grid: Grid): Step | null {
  for (let box = 0; box < 9; box++) {
    const boxCells = BOXES[box]!;
    for (let r = 0; r < 9; r++) {
      const rowCells = ROWS[r]!;
      const rcInBox = rowCells.filter((c) => BOX_OF[c] === box);
      if (rcInBox.length < 2) continue;
      for (let c = 0; c < 9; c++) {
        const colCells = COLS[c]!;
        const ccInBox = colCells.filter((x) => BOX_OF[x] === box);
        if (ccInBox.length < 2) continue;
        const xCell = rcInBox.find((rc) => ccInBox.includes(rc));
        if (xCell === undefined) continue;
        const yCells = rcInBox.filter((rc) => rc !== xCell);
        const zCells = ccInBox.filter((cc) => cc !== xCell);
        const lCells = [xCell, ...yCells, ...zCells];
        const uniqueLCells = [...new Set(lCells)];

        const fireworkDigits: number[] = [];
        for (let d = 1; d <= 9; d++) {
          const rowCandsInBox = rcInBox.filter((rc) => grid.hasCandidate(rc, d));
          const colCandsInBox = ccInBox.filter((cc) => grid.hasCandidate(cc, d));
          if (rowCandsInBox.length === 0 && colCandsInBox.length === 0) continue;
          const rowConfined = rowCandsInBox.every((rc) => rc === xCell || yCells.includes(rc));
          const colConfined = colCandsInBox.every((cc) => cc === xCell || zCells.includes(cc));
          const outsideL = boxCells.filter((bc) => !uniqueLCells.includes(bc));
          const noOutside = outsideL.every((bc) => !grid.hasCandidate(bc, d));
          if (rowConfined && colConfined && noOutside) {
            fireworkDigits.push(d);
          }
        }

        if (fireworkDigits.length < 2) continue;

        if (fireworkDigits.length === 3 && uniqueLCells.length === 3) {
          const eliminations: { cell: number; digit: number }[] = [];
          for (const lc of uniqueLCells) {
            for (const d of digitsOf(grid.candidatesOf(lc))) {
              if (!fireworkDigits.includes(d)) {
                eliminations.push({ cell: lc, digit: d });
              }
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: 'fireworks',
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueLCells,
                candidates: uniqueLCells.flatMap((lc) =>
                  digitsOf(grid.candidatesOf(lc)).map((d) => ({ cell: lc, digit: d }))
                ),
                links: [],
              },
              explanation: {
                zh: `三重烟花：${cellLabel(xCell)} 的 L 型格 {${uniqueLCells.map((c) => cellLabel(c)).join(',')}} 包含烟花数字 {${fireworkDigits.join(',')}}，构成分布隐性三数组。`,
                en: `Triple Fireworks: L-cells {${uniqueLCells.map((c) => cellLabel(c)).join(',')}} at ${cellLabel(xCell)} contain firework digits {${fireworkDigits.join(',')}}, forming a distributed hidden triple.`,
              },
            };
          }
        }

        if (fireworkDigits.length === 4) {
          const eliminations: { cell: number; digit: number }[] = [];
          const fwSet = new Set(fireworkDigits);
          for (const lc of uniqueLCells) {
            for (const d of digitsOf(grid.candidatesOf(lc))) {
              if (!fwSet.has(d)) {
                eliminations.push({ cell: lc, digit: d });
              }
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: 'fireworks',
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueLCells,
                candidates: uniqueLCells.flatMap((lc) =>
                  digitsOf(grid.candidatesOf(lc)).map((d) => ({ cell: lc, digit: d }))
                ),
                links: [],
              },
              explanation: {
                zh: `四重烟花：${cellLabel(xCell)} 的 L 型格包含 4 个烟花数字 {${fireworkDigits.join(',')}}，构成分布隐性四数组。`,
                en: `Quad Fireworks: L-cells contain 4 firework digits {${fireworkDigits.join(',')}}, forming a distributed hidden quad.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryFireworks(grid);
  },
};