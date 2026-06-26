import { ROWS, COLS, ROW_OF, COL_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryTurbotFish(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  const strongLinks: { c1: number; c2: number; houseIdx: number }[] = [];

  for (let h = 0; h < 27; h++) {
    const house: readonly number[] = h < 9 ? ROWS[h]! : h < 18 ? COLS[h - 9]! : [];
    if (h >= 18) continue;
    const cells: number[] = [];
    const houseCells = h < 9 ? ROWS[h]! : COLS[h - 9]!;
    for (const cell of houseCells) {
      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) cells.push(cell);
    }
    if (cells.length === 2) {
      strongLinks.push({ c1: cells[0]!, c2: cells[1]!, houseIdx: h });
    }
  }

  for (let i = 0; i < strongLinks.length; i++) {
    for (let j = i + 1; j < strongLinks.length; j++) {
      const a = strongLinks[i]!;
      const b = strongLinks[j]!;

      if (a.houseIdx === b.houseIdx) continue;
      if (a.houseIdx < 9 === b.houseIdx < 9 && a.houseIdx >= 9 === b.houseIdx >= 9) {
        continue;
      }

      const shareRow = a.houseIdx < 9 && b.houseIdx >= 9;
      const shareCol = a.houseIdx >= 9 && b.houseIdx < 9;

      if (a.houseIdx < 9 && b.houseIdx < 9) continue;
      if (a.houseIdx >= 9 && b.houseIdx >= 9) continue;

      const rowLink = a.houseIdx < 9 ? a : b;
      const colLink = a.houseIdx >= 9 ? a : b;

      for (const wsA of [{ c1: rowLink.c1, c2: rowLink.c2 }, { c1: rowLink.c2, c2: rowLink.c1 }]) {
        for (const wsB of [{ c1: colLink.c1, c2: colLink.c2 }, { c1: colLink.c2, c2: colLink.c1 }]) {
          if (!PEERS_OF[wsA.c1]!.includes(wsB.c1)) continue;

          const endpoints: [number, number] = [wsA.c2, wsB.c2];
          if (endpoints[0] === endpoints[1]) continue;

          const elims = commonPeers(endpoints[0], endpoints[1]).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;

          const chainLinks: Link[] = [
            { from: { cell: wsA.c1, digit: d }, to: { cell: wsA.c2, digit: d }, type: 'strong' },
            { from: { cell: wsA.c1, digit: d }, to: { cell: wsB.c1, digit: d }, type: 'weak' },
            { from: { cell: wsB.c1, digit: d }, to: { cell: wsB.c2, digit: d }, type: 'strong' },
          ];

          return {
            strategyId: 'turbot-fish',
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...new Set([endpoints[0], endpoints[1], wsA.c1, wsB.c1, ...elims])],
              candidates: [
                ...new Set([endpoints[0], endpoints[1], wsA.c1, wsB.c1, ...elims]).values(),
              ].map((c) => ({ cell: c, digit: d })),
              links: chainLinks,
            },
            explanation: {
              zh: `多宝鱼：数字 ${d} 的两对强链（${cellLabel(wsA.c1)}-${cellLabel(wsA.c2)}、${cellLabel(wsB.c1)}-${cellLabel(wsB.c2)}）通过弱链连接，因此两端 ${cellLabel(endpoints[0])} 与 ${cellLabel(endpoints[1])} 至少其一为 ${d}；消除能同时看到两端的所有格中的 ${d}。`,
              en: `Turbot Fish: digit ${d} forms two strong links (${cellLabel(wsA.c1)}-${cellLabel(wsA.c2)}, ${cellLabel(wsB.c1)}-${cellLabel(wsB.c2)}) connected by a weak link; endpoints ${cellLabel(endpoints[0])} and ${cellLabel(endpoints[1])} are a Turbot Fish; eliminate ${d} from cells seeing both.`,
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