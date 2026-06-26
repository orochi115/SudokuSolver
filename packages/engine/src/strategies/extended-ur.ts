import { ROW_OF, COL_OF, BOX_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let r1 = 0; r1 < 7; r1++) {
      for (let r2 = r1 + 1; r2 < 8; r2++) {
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          for (let c1 = 0; c1 < 8; c1++) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              const cells = [
                r1 * 9 + c1, r1 * 9 + c2,
                r2 * 9 + c1, r2 * 9 + c2,
                r3 * 9 + c1, r3 * 9 + c2,
              ];

              const boxes = new Set(cells.map((c) => BOX_OF[c]!));
              if (boxes.size < 2 || boxes.size > 3) continue;

              const masks = cells.map((c) => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
              if (masks.some((m) => m === 0)) continue;

              const intersect = masks.reduce((a, b) => a & b);
              if (popcount(intersect) < 2) continue;

              const intDigits = digitsOf(intersect);
              for (let di = 0; di < intDigits.length; di++) {
                for (let dj = di + 1; dj < intDigits.length; dj++) {
                  const x = intDigits[di]!;
                  const y = intDigits[dj]!;
                  const dMask = maskOf(x) | maskOf(y);

                  const pureCells = cells.filter((_, i) => (masks[i]! & ~dMask) === 0);
                  const extraCells = cells.filter((_, i) => (masks[i]! & ~dMask) !== 0);

                  if (pureCells.length !== 4 || extraCells.length !== 2) continue;

                  const extraMask = extraCells.reduce((m, c) => m | grid.candidatesOf(c), 0) & ~dMask;
                  const extraDigits = digitsOf(extraMask);

                  for (const z of extraDigits) {
                    const zBit = maskOf(z);
                    const zCells = extraCells.filter((c) => grid.candidatesOf(c) & zBit);
                    if (zCells.length < 2) continue;

                    const peersZ1 = new Set([...Array.from({ length: 9 }, (_, i) => {
                      const c = zCells[0]!;
                      const r = ROW_OF[c]!;
                      const col = COL_OF[c]!;
                      return i !== r ? i * 9 + col : -1;
                    }).filter((x) => x >= 0)]);

                    const elims: { cell: number; digit: number }[] = [];
                    for (const peer of (() => {
                      const p1 = new Set([...Array.from({ length: 9 }, (_, i) => ROW_OF[zCells[0]!]! !== i ? i * 9 + COL_OF[zCells[0]!]! : -1).filter((x) => x >= 0), ...Array.from({ length: 9 }, (_, i) => COL_OF[zCells[0]!]! !== i ? ROW_OF[zCells[0]!]! * 9 + i : -1).filter((x) => x >= 0)]);
                      return p1;
                    })()) {
                      if (cells.includes(peer)) continue;
                      if (grid.get(peer) !== 0 && grid.hasCandidate(peer, z)) continue;
                      if (!grid.hasCandidate(peer, z)) continue;
                      const p1Peers = new Set((() => {
                        const res: number[] = [];
                        for (let i = 0; i < 9; i++) {
                          if (i !== ROW_OF[peer]!) res.push(i * 9 + COL_OF[peer]!);
                          if (i !== COL_OF[peer]!) res.push(ROW_OF[peer]! * 9 + i);
                        }
                        return res;
                      })());
                      if (zCells.every((zc) => p1Peers.has(zc))) {
                        elims.push({ cell: peer, digit: z });
                      }
                    }

                    if (elims.length > 0) {
                      return {
                        strategyId: 'extended-unique-rectangle',
                        placements: [],
                        eliminations: elims,
                        highlights: {
                          cells: [...cells, ...elims.map((e) => e.cell)],
                          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                          links: [],
                        },
                        explanation: {
                          zh: `扩展唯一矩形（2×3）：六格中候选 {${x},${y}} 构成致命模式基础，额外候选 ${z} 至少一真；消去公共可见格的 ${z}。`,
                          en: `Extended Unique Rectangle (2×3): six cells share {${x},${y}} as deadly pattern base; extra candidate ${z} must be true in one; eliminate ${z} from common peers.`,
                        },
                      };
                    }
                  }
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