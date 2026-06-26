/**
 * Fireworks (P2) — 烟花
 *
 * Detects a triple firework: three digits confined to an L-shaped set of three
 * cells inside a box (one row-line cell, one column-line cell and their
 * intersection). The three cells then form a hidden triple, so all other
 * candidates can be eliminated from them.
 */

import { BOXES, BOX_OF, ROW_OF, COL_OF, CELLS, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (const box of BOXES) {
      const boxDigitCells: number[][] = Array.from({ length: 10 }, () => []);
      for (const c of box) {
        if (grid.get(c) !== 0) continue;
        for (const d of digitsOf(grid.candidatesOf(c))) {
          boxDigitCells[d]!.push(c);
        }
      }

      for (const x of box) {
        if (grid.get(x) !== 0) continue;
        const r = ROW_OF[x]!;
        const c = COL_OF[x]!;
        const rowLine = box.filter((cell) => cell !== x && ROW_OF[cell] === r);
        const colLine = box.filter((cell) => cell !== x && COL_OF[cell] === c);

        for (const y of rowLine) {
          for (const z of colLine) {
            const lSet = new Set([x, y, z]);

            const fwDigits: number[] = [];
            for (let d = 1; d <= 9; d++) {
              const cells = boxDigitCells[d]!;
              if (cells.length === 0) continue;
              if (cells.every((cell) => lSet.has(cell))) fwDigits.push(d);
            }

            if (fwDigits.length !== 3) continue;

            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of lSet) {
              if (grid.get(cell) !== 0) continue;
              const candMask = grid.candidatesOf(cell);
              for (const d of digitsOf(candMask)) {
                if (!fwDigits.includes(d)) {
                  eliminations.push({ cell, digit: d });
                }
              }
            }
            if (eliminations.length === 0) continue;

            const lCells = [x, y, z];
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...lCells, ...eliminations.map((e) => e.cell)],
                candidates: [
                  ...lCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((d) => ({ cell, digit: d }))),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `烟花：${lCells.map(cellLabel).join('|')} 三格在宫内被 {${fwDigits.join(',')}} 锁定成隐式三数组，删除这三格中的其余候选数。`,
                en: `Fireworks: cells ${lCells.map(cellLabel).join('|')} form a hidden triple locked to {${fwDigits.join(',')}} inside the box; eliminate other candidates from these cells.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
