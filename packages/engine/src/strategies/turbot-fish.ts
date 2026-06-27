import {
  ROWS, COLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function findTurbotFish(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const step = tryTurbotForDigit(grid, d);
    if (step) return step;
  }
  return null;
}

function tryTurbotForDigit(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  const strongLinks: Array<{ house: number; cells: [number, number] }> = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length === 2) {
      strongLinks.push({ house: h, cells: [cands[0]!, cands[1]!] });
    }
  }

  for (let i = 0; i < strongLinks.length; i++) {
    for (let j = i + 1; j < strongLinks.length; j++) {
      const sl1 = strongLinks[i]!;
      const sl2 = strongLinks[j]!;

      for (let a = 0; a < 2; a++) {
        for (let b = 0; b < 2; b++) {
          const connectA = sl1.cells[a as 0 | 1];
          const connectB = sl2.cells[b as 0 | 1];
          if (connectA === connectB) continue;
          if (!PEERS_OF[connectA]!.includes(connectB)) continue;

          const endA = sl1.cells[(1 - a) as 0 | 1];
          const endB = sl2.cells[(1 - b) as 0 | 1];
          if (endA === endB) continue;

          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;

          const links: Link[] = [
            { from: { cell: connectA, digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
            { from: { cell: connectA, digit: d }, to: { cell: connectB, digit: d }, type: 'weak' },
            { from: { cell: connectB, digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
          ];

          return {
            strategyId: 'turbot-fish',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...new Set([connectA, connectB, endA, endB, ...elims])],
              candidates: [
                { cell: connectA, digit: d },
                { cell: connectB, digit: d },
                { cell: endA, digit: d },
                { cell: endB, digit: d },
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links,
            },
            explanation: {
              zh: `数字 ${d}：Turbot Fish。两条强链 ${cellLabel(connectA)}-${cellLabel(endA)} 与 ${cellLabel(connectB)}-${cellLabel(endB)} 通过弱链 ${cellLabel(connectA)}-${cellLabel(connectB)} 连接；${cellLabel(endA)} 和 ${cellLabel(endB)} 至少一个为真，消去公共可见格中的 ${d}。`,
              en: `Digit ${d}: Turbot Fish. Two strong links ${cellLabel(connectA)}-${cellLabel(endA)} and ${cellLabel(connectB)}-${cellLabel(endB)} connected by weak link; at least one of ${cellLabel(endA)} and ${cellLabel(endB)} is true, eliminate ${d} from common peers.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: 'Turbot Fish', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    return findTurbotFish(grid);
  },
};
