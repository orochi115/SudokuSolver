import {
  ROWS, COLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
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

function tryTurbotFish(grid: Grid, d: number, strategyId: string): Step | null {
  const bit = maskOf(d);

  interface StrongLink {
    a: number;
    b: number;
    house: number;
  }

  const strongLinks: StrongLink[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length === 2) {
      strongLinks.push({ a: cands[0]!, b: cands[1]!, house: h });
    }
  }

  for (let i = 0; i < strongLinks.length; i++) {
    for (let j = i + 1; j < strongLinks.length; j++) {
      const sl1 = strongLinks[i]!;
      const sl2 = strongLinks[j]!;

      const pairs: Array<{ s1a: number; s1b: number; s2a: number; s2b: number }> = [
        { s1a: sl1.a, s1b: sl1.b, s2a: sl2.a, s2b: sl2.b },
        { s1a: sl1.a, s1b: sl1.b, s2a: sl2.b, s2b: sl2.a },
        { s1a: sl1.b, s1b: sl1.a, s2a: sl2.a, s2b: sl2.b },
        { s1a: sl1.b, s1b: sl1.a, s2a: sl2.b, s2b: sl2.a },
      ];

      for (const { s1a, s1b, s2a, s2b } of pairs) {
        if (s1b === s2a) continue;
        if (!PEERS_OF[s1b]!.includes(s2a)) continue;
        if (s1a === s2b) continue;

        const allCells = new Set([s1a, s1b, s2a, s2b]);
        if (allCells.size !== 4) continue;

        const elims = commonPeers(s1a, s2b).filter(
          (c) => !allCells.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        );

        if (elims.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: d })),
          highlights: {
            cells: [...allCells, ...elims],
            candidates: [
              ...[s1a, s1b, s2a, s2b].map((c) => ({ cell: c, digit: d })),
              ...elims.map((c) => ({ cell: c, digit: d })),
            ],
            links: [
              { from: { cell: s1a, digit: d }, to: { cell: s1b, digit: d }, type: 'strong' as const },
              { from: { cell: s1b, digit: d }, to: { cell: s2a, digit: d }, type: 'weak' as const },
              { from: { cell: s2a, digit: d }, to: { cell: s2b, digit: d }, type: 'strong' as const },
            ],
          },
          explanation: {
            zh: `数字 ${d}：多宝鱼（Turbot Fish）。强链 ${cellLabel(s1a)}-${cellLabel(s1b)} 与 ${cellLabel(s2a)}-${cellLabel(s2b)} 经弱链 ${cellLabel(s1b)}-${cellLabel(s2a)} 连接；两端 ${cellLabel(s1a)} 与 ${cellLabel(s2b)} 至少其一为 ${d}，消去公共可见格中的 ${d}。`,
            en: `Digit ${d}: Turbot Fish. Strong links ${cellLabel(s1a)}-${cellLabel(s1b)} and ${cellLabel(s2a)}-${cellLabel(s2b)} joined by weak link ${cellLabel(s1b)}-${cellLabel(s2a)}; endpoints ${cellLabel(s1a)} and ${cellLabel(s2b)} must include ${d}; eliminate ${d} from cells seeing both.`,
          },
        };
      }
    }
  }
  return null;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryTurbotFish(grid, d, this.id);
      if (step) return step;
    }
    return null;
  },
};
