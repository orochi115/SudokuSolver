import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function getBand(box: number): number {
  return Math.floor(box / 3);
}

function sees(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function tryExocet(grid: Grid): Step | null {
  for (let baseBox = 0; baseBox < 9; baseBox++) {
    const bCells = BOXES[baseBox]!;
    const emptyInBox = bCells.filter((c) => grid.get(c) === 0);

    for (let i = 0; i < emptyInBox.length; i++) {
      for (let j = i + 1; j < emptyInBox.length; j++) {
        const b1 = emptyInBox[i]!;
        const b2 = emptyInBox[j]!;
        if (!sees(b1, b2)) continue;

        const bUnion = grid.candidatesOf(b1) | grid.candidatesOf(b2);
        const bDigits = digitsOf(bUnion);
        if (bDigits.length < 3 || bDigits.length > 4) continue;

        for (const useStack of [true, false]) {
          const otherBoxes: number[] = [];
          for (let b = 0; b < 9; b++) {
            if (b === baseBox) continue;
            const sameGroup = useStack ? (b % 3) === (baseBox % 3) : getBand(b) === getBand(baseBox);
            if (sameGroup) otherBoxes.push(b);
          }

          if (otherBoxes.length !== 2) continue;

          const targets: number[] = [];
          for (const ob of otherBoxes) {
            const obCells = BOXES[ob]!;
            const lineAligned: number[] = [];
            if (useStack) {
              if (ROW_OF[b1] === ROW_OF[b2]) {
                const targetRow = ROW_OF[b1]!;
                if (getBand(ob) === getBand(baseBox)) continue;
                for (const c of obCells) {
                  if (ROW_OF[c] === targetRow && grid.get(c) === 0) lineAligned.push(c);
                }
              }
            } else {
              if (COL_OF[b1] === COL_OF[b2]) {
                const targetCol = COL_OF[b1]!;
                if ((ob % 3) === (baseBox % 3)) continue;
                for (const c of obCells) {
                  if (COL_OF[c] === targetCol && grid.get(c) === 0) lineAligned.push(c);
                }
              }
            }
            if (lineAligned.length === 1) targets.push(lineAligned[0]!);
          }

          if (targets.length !== 2) continue;

          const t1 = targets[0]!;
          const t2 = targets[1]!;
          if (sees(t1, t2)) continue;
          if (sees(t1, b1) || sees(t1, b2) || sees(t2, b1) || sees(t2, b2)) continue;

          const t1Mask = grid.candidatesOf(t1);
          const t2Mask = grid.candidatesOf(t2);
          const tUnion = t1Mask | t2Mask;
          const allBDigitsInTargets = bDigits.every((d) => (tUnion & maskOf(d)) !== 0);
          if (!allBDigitsInTargets) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const d of digitsOf(grid.candidatesOf(t1))) {
            if (!bDigits.includes(d)) eliminations.push({ cell: t1, digit: d });
          }
          for (const d of digitsOf(grid.candidatesOf(t2))) {
            if (!bDigits.includes(d)) eliminations.push({ cell: t2, digit: d });
          }

          if (eliminations.length === 0) continue;

          return {
            strategyId: 'exocet',
            placements: [],
            eliminations,
            highlights: {
              cells: [b1, b2, t1, t2, ...eliminations.map((e) => e.cell)],
              candidates: [
                ...eliminations,
                ...bDigits.map((d) => ({ cell: b1, digit: d })),
                ...bDigits.map((d) => ({ cell: b2, digit: d })),
                ...bDigits.map((d) => ({ cell: t1, digit: d })),
                ...bDigits.map((d) => ({ cell: t2, digit: d })),
              ],
              links: [],
            },
            explanation: {
              zh: `Exocet：基单元格 ${cellLabel(b1)}、${cellLabel(b2)} 含 {${bDigits.join(',')}}，目标格 ${cellLabel(t1)}、${cellLabel(t2)} 只能含 {${bDigits.join(',')}}，消除目标格其他候选。`,
              en: `Exocet: base cells ${cellLabel(b1)},${cellLabel(b2)} with {${bDigits.join(',')}}; target cells ${cellLabel(t1)},${cellLabel(t2)} restricted to {${bDigits.join(',')}}; eliminate other candidates from targets.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryExocet(grid);
  },
};