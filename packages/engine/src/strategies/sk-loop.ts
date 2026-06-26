import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function trySkLoop(grid: Grid): Step | null {
  for (let band1 = 0; band1 < 3; band1++) {
    for (let band2 = band1 + 1; band2 < 3; band2++) {
      for (let stack1 = 0; stack1 < 3; stack1++) {
        for (let stack2 = stack1 + 1; stack2 < 3; stack2++) {
          const boxes = [
            band1 * 3 + stack1,
            band1 * 3 + stack2,
            band2 * 3 + stack1,
            band2 * 3 + stack2,
          ];

          const pivots: number[] = [];
          let pivotValid = true;

          for (const bx of boxes) {
            const bCells = BOXES[bx]!;
            let pivotFound = false;
            for (const c of bCells) {
              if (grid.get(c) !== 0) {
                pivots.push(c);
                pivotFound = true;
                break;
              }
            }
            if (!pivotFound) { pivotValid = false; break; }
          }

          if (!pivotValid || pivots.length !== 4) continue;

          const eliminations: { cell: number; digit: number }[] = [];

          for (let i = 0; i < 4; i++) {
            const pivot = pivots[i]!;
            const bx = boxes[i]!;
            const bCells = BOXES[bx]!;
            const pivotRow = ROW_OF[pivot]!;
            const pivotCol = COL_OF[pivot]!;

            const rowInBox = bCells.filter((c) => ROW_OF[c] === pivotRow && c !== pivot);
            const colInBox = bCells.filter((c) => COL_OF[c] === pivotCol && c !== pivot);
            const loopCells = [...rowInBox, ...colInBox];

            let rowMask = 0, colMask = 0;
            for (const c of rowInBox) rowMask |= grid.candidatesOf(c);
            for (const c of colInBox) colMask |= grid.candidatesOf(c);
            const innerMask = rowMask & colMask;
            const outerMask = (rowMask | colMask) & ~innerMask;

            const innerDigits = digitsOf(innerMask);
            const outerDigits = digitsOf(outerMask);

            for (const d of outerDigits) {
              const elimLine = i < 2 ? ROWS[pivotRow]! : COLS[pivotCol]!;
              for (const c of elimLine) {
                if (c === pivot || loopCells.includes(c)) continue;
                if (grid.hasCandidate(c, d)) {
                  eliminations.push({ cell: c, digit: d });
                }
              }
            }

            for (const d of innerDigits) {
              for (const c of bCells) {
                if (c === pivot || loopCells.includes(c)) continue;
                if (grid.hasCandidate(c, d)) {
                  eliminations.push({ cell: c, digit: d });
                }
              }
            }
          }

          if (eliminations.length === 0) continue;

          const seen = new Set<number>();
          const uniqueElims = eliminations.filter((e) => {
            const key = e.cell * 10 + e.digit;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          return {
            strategyId: 'sk-loop',
            placements: [],
            eliminations: uniqueElims,
            highlights: {
              cells: [...new Set([...pivots, ...uniqueElims.map((e) => e.cell)])],
              candidates: [
                ...pivots.flatMap((p) => digitsOf(grid.candidatesOf(p)).map((d) => ({ cell: p, digit: d }))),
                ...uniqueElims,
              ],
              links: [],
            },
            explanation: {
              zh: `SK-Loop：${boxes.map((b) => `B${b + 1}`).join(',')} 四宫形成多米诺环；消去环外相关候选。`,
              en: `SK-Loop: boxes ${boxes.map((b) => `B${b + 1}`).join(',')} form a domino loop; eliminate loop-related candidates.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: '多米诺环', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return trySkLoop(grid);
  },
};