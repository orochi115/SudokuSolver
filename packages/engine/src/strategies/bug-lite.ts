import {
  CELLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const c11 = r1 * 9 + c1;
          const c12 = r1 * 9 + c2;
          const c21 = r2 * 9 + c1;
          const c22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[c11]!, BOX_OF[c12]!, BOX_OF[c21]!, BOX_OF[c22]!]);
          if (boxes.size !== 2) continue;
          yield [c11, c12, c21, c22];
        }
      }
    }
  }
}

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG精简', en: 'BUG Lite' },
  difficulty: 984,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map(c => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
      if (masks.some(m => m === 0)) continue;

      const allSame = masks.every(m => m === masks[0]);
      if (!allSame) continue;
      if (popcount(masks[0]!) !== 2) continue;

      const [x, y] = digitsOf(masks[0]!) as [number, number];

      for (const cell of cells) {
        const peers = new Set(new Array(81).fill(0).map((_, i) => i).filter(i => {
          if (i === cell) return false;
          return ROW_OF[i] === ROW_OF[cell] || COL_OF[i] === COL_OF[cell] || BOX_OF[i] === BOX_OF[cell];
        }));
        const eliminations: { cell: number; digit: number }[] = [];
        for (const d of [x, y]) {
          for (const p of peers) {
            if (p === cell || cells.includes(p)) continue;
            if (grid.get(p) === 0 && grid.hasCandidate(p, d) && !eliminations.find(e => e.cell === p && e.digit === d)) {
              eliminations.push({ cell: p, digit: d });
            }
          }
        }
        if (eliminations.length > 0) {
          return {
            strategyId: 'bug-lite',
            placements: [],
            eliminations,
            highlights: {
              cells: [...new Set([...cells, ...eliminations.map(e => e.cell)])],
              candidates: [
                ...cells.map(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))).flat(),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `BUG精简：格集 ${cells.map(c => cellLabel(c)).join(',')} 中候选 {${x},${y}} 构成致命模式；消去同行列宫中的 {${x},${y}}。`,
              en: `BUG Lite: cells ${cells.map(c => cellLabel(c)).join(',')} form deadly pattern with {${x},${y}}; eliminate {${x},${y}} from peers in intersecting houses.`,
            },
          };
        }
      }
    }
    return null;
  },
};