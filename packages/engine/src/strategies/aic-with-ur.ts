import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

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

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含UR节点的AIC', en: 'AIC with UR' },
  difficulty: 770,
  tieBreak: ['chain-length'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map(c => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
      if (masks.some(m => m === 0)) continue;

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      const urMask = intersect;

      const extraCells = cells.filter((_, i) => (masks[i]! & ~urMask) !== 0);
      if (extraCells.length < 1 || extraCells.length > 2) continue;

      for (let c = 0; c < CELLS; c++) {
        if (cells.includes(c)) continue;
        if (grid.get(c) !== 0) continue;
        const m = grid.candidatesOf(c);

        const common = digitsOf(m & urMask);
        if (common.length === 0) continue;

        for (const d of common) {
          const bit = maskOf(d);
          const elimDigit = d === x ? y : x;

          const urPeers = new Set(PEERS_OF[c]!);
          const urHasDigit = cells.filter(cc => grid.hasCandidate(cc, d));

          if (urHasDigit.every(uc => urPeers.has(uc))) {
            const extraPeers = new Set(PEERS_OF[c]!);
            for (const ec of extraCells) {
              if (grid.hasCandidate(ec, elimDigit) && extraPeers.has(ec)) {
                if (grid.hasCandidate(c, elimDigit)) {
                  return {
                    strategyId: 'aic-with-ur',
                    placements: [],
                    eliminations: [{ cell: c, digit: elimDigit }],
                    highlights: {
                      cells: [...cells, c],
                      candidates: [
                        ...cells.flatMap(cc => digitsOf(grid.candidatesOf(cc)).map(dd => ({ cell: cc, digit: dd }))),
                        { cell: c, digit: elimDigit },
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `含UR的AIC：UR矩形 {${x},${y}} 与格 ${cellLabel(c)} 构成推理链；消去 ${cellLabel(c)} 中的 ${elimDigit}（含UR）。`,
                      en: `AIC with UR: UR rectangle {${x},${y}} and ${cellLabel(c)} form inference chain; eliminate ${elimDigit} from ${cellLabel(c)} (AIC-with-UR).`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};