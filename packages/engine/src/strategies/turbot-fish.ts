import {
  ROWS, COLS, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function tryTurbotFish(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  const strongLinks: Array<{ cellA: number; cellB: number }> = [];

  for (let r = 0; r < 9; r++) {
    const cells = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cells.length === 2) strongLinks.push({ cellA: cells[0]!, cellB: cells[1]! });
  }

  for (let c = 0; c < 9; c++) {
    const cells = COLS[c]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) strongLinks.push({ cellA: cells[0]!, cellB: cells[1]! });
  }

  for (let i = 0; i < strongLinks.length; i++) {
    for (let j = i + 1; j < strongLinks.length; j++) {
      const a = strongLinks[i]!;
      const b = strongLinks[j]!;

      for (const endA of [a.cellA, a.cellB]) {
        for (const endB of [b.cellA, b.cellB]) {
          const midA = endA === a.cellA ? a.cellB : a.cellA;
          const midB = endB === b.cellA ? b.cellB : b.cellA;

          const midSees = PEERS_OF[midA]!.includes(midB);
          if (!midSees) continue;

          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;

          const rowA = ROW_OF[endA]! + 1;
          const colA = COL_OF[endA]! + 1;
          const rowB = ROW_OF[endB]! + 1;
          const colB = COL_OF[endB]! + 1;

          return {
            strategyId: 'turbot-fish',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...new Set([midA, midB, endA, endB, ...elims])],
              candidates: [
                ...new Set([midA, midB, endA, endB]).values(),
              ].map((c) => ({ cell: c, digit: d })),
              links: [
                { from: { cell: midA, digit: d }, to: { cell: midB, digit: d }, type: 'weak' },
                { from: { cell: midA, digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
                { from: { cell: midB, digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：多宝鱼。${cellLabel(midA)} 与 ${cellLabel(midB)} 弱链相连，分别经强链到 ${cellLabel(endA)} 和 ${cellLabel(endB)}；两端 ${d} 必有一真，消除公共可见格中的 ${d}。`,
              en: `Digit ${d}: Turbot Fish. Weak link ${cellLabel(midA)}-${cellLabel(midB)} connects two strong links to ${cellLabel(endA)} and ${cellLabel(endB)}; one end must be ${d}, eliminate from common peers.`,
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
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryTurbotFish(grid, d);
      if (step) return step;
    }
    return null;
  },
};