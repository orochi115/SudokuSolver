import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
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

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形（2×3）', en: 'Extended Unique Rectangle (2×3)' },
  difficulty: 981,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const urCells = [c11, c12, c21, c22];
      const masks = urCells.map(c => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
      if (masks.some(m => m === 0)) continue;

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      const urMask = intersect;

      const pureCells = urCells.filter((_, i) => masks[i] === intersect);

      for (const r of new Set(urCells.map(c => ROW_OF[c]!))) {
        for (const c of new Set(urCells.map(cell => COL_OF[cell]!))) {
          const extraCell = r * 9 + c;
          if (urCells.includes(extraCell)) continue;
          if (grid.get(extraCell) !== 0) continue;
          const extraMask = grid.candidatesOf(extraCell);
          if (!(extraMask & urMask)) continue;

          const extended = [...urCells, extraCell];
          let unionMask = 0;
          for (const ce of extended) unionMask |= grid.candidatesOf(ce);
          if (popcount(unionMask) !== extended.length) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          const otherCells = ROWS[r]!.filter(oc => !extended.includes(oc) && grid.get(oc) === 0);
          for (const oc of otherCells) {
            for (const d of digitsOf(intersect)) {
              if (grid.hasCandidate(oc, d)) eliminations.push({ cell: oc, digit: d });
            }
          }
          for (const oc of COLS[c]!) {
            if (!extended.includes(oc) && grid.get(oc) === 0) {
              for (const d of digitsOf(intersect)) {
                if (grid.hasCandidate(oc, d) && !eliminations.find(e => e.cell === oc && e.digit === d)) {
                  eliminations.push({ cell: oc, digit: d });
                }
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              strategyId: 'extended-unique-rectangle',
              placements: [],
              eliminations,
              highlights: {
                cells: [...new Set([...extended, ...eliminations.map(e => e.cell)])],
                candidates: extended.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `扩展唯一矩形（2×3）：UR对 {${x},${y}} 扩展至额外格 ${cellLabel(extraCell)} 形成区域锁定；消去行列中其他格的 {${x},${y}}。`,
                en: `Extended Unique Rectangle (2×3): UR pair {${x},${y}} extended to ${cellLabel(extraCell)} forming a locked set; eliminate {${x},${y}} from other cells in the row/col.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};