/**
 * Bent Sets (P1) — 弯折集 / Almost Locked Pair
 *
 * Detects Almost Locked Pair/Triple patterns inside a chute (box∩row or
 * box∩column). The simplest sound case: two bivalue cells in the same chute
 * carrying the same pair {a,b} and lying in the same box but different
 * row/column (diagonal in the chute). The third chute cell sees both, so it
 * loses a and b.
 */

import { BOXES, ROWS, COLS, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

const CHUTES: number[][] = [];
for (const box of BOXES) {
  const rows = new Set(box.map((c) => Math.floor(c / 9)));
  const cols = new Set(box.map((c) => c % 9));
  for (const r of rows) {
    CHUTES.push(box.filter((c) => Math.floor(c / 9) === r));
  }
  for (const co of cols) {
    CHUTES.push(box.filter((c) => c % 9 === co));
  }
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯折集 / 几乎锁定对', en: 'Bent Sets / Almost Locked Pair' },
  difficulty: 540,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (const chute of CHUTES) {
      if (chute.length !== 3) continue;
      const cells = chute.filter((c) => grid.get(c) === 0).sort((a, b) => a - b);
      if (cells.length < 3) continue;

      // Try every unordered pair as the bent pair.
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i]!;
          const b = cells[j]!;
          const mA = grid.candidatesOf(a);
          const mB = grid.candidatesOf(b);
          if (popcount(mA) !== 2 || popcount(mB) !== 2) continue;
          if (mA !== mB) continue;
          const [d1, d2] = digitsOf(mA) as [number, number];

          // The pair must be "bent": same box but not same row/column.
          const sameBox = Math.floor(a / 27) === Math.floor(b / 27) && Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3);
          const sameRow = Math.floor(a / 9) === Math.floor(b / 9);
          const sameCol = (a % 9) === (b % 9);
          if (!sameBox || sameRow || sameCol) continue;

          const third = chute.find((c) => c !== a && c !== b)!;
          if (grid.get(third) !== 0) continue;
          const elims: { cell: number; digit: number }[] = [];
          if (grid.hasCandidate(third, d1)) elims.push({ cell: third, digit: d1 });
          if (grid.hasCandidate(third, d2)) elims.push({ cell: third, digit: d2 });
          if (elims.length === 0) continue;

          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [a, b, third],
              candidates: [
                { cell: a, digit: d1 }, { cell: a, digit: d2 },
                { cell: b, digit: d1 }, { cell: b, digit: d2 },
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `弯折集：同一拐折中的 ${cellLabel(a)} 与 ${cellLabel(b)} 均为 {${d1},${d2}}，对角相望；第三格 ${cellLabel(third)} 同时看到两者，消去 {${d1},${d2}}。`,
              en: `Bent Sets: ${cellLabel(a)} and ${cellLabel(b)} in the same chute are both {${d1},${d2}} and see the third cell ${cellLabel(third)}; eliminate {${d1},${d2}} from ${cellLabel(third)}.`,
            },
          };
        }
      }
    }
    return null;
  },
};
