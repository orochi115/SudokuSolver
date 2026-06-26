/**
 * MSLS / Multi-Sector Locked Sets (P2) — 多扇区数组
 *
 * A rank-0 set-logic pattern: a set of cells whose candidate union has the same
 * size as the set, with every value's occurrences inside the set mutually
 * visible. The set then behaves as an extended locked set; each digit can be
 * eliminated from any outside cell that sees all of its occurrences inside the
 * set.
 *
 * This implementation searches rectangular multi-sector sets (row set × column
 * set) and reports the first elimination it finds.
 */

import { CELLS, ROW_OF, COL_OF, PEERS_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function allSeeEachOther(cells: number[]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (!PEERS_OF[cells[i]!]!.includes(cells[j]!)) return false;
    }
  }
  return true;
}

function* subsets(size: number, k: number): Generator<number[]> {
  if (k === 0) { yield []; return; }
  for (let i = 0; i <= size - k; i++) {
    for (const rest of subsets(size - i - 1, k - 1)) {
      yield [i, ...rest.map((x) => x + i + 1)];
    }
  }
}

function trySet(grid: Grid, rows: number[], cols: number[]): Step | null {
  const cells: number[] = [];
  for (const r of rows) {
    for (const c of cols) {
      const cell = r * 9 + c;
      if (grid.get(cell) === 0) cells.push(cell);
    }
  }
  if (cells.length < 2) return null;

  const digitSet = new Set<number>();
  for (const c of cells) {
    for (const d of digitsOf(grid.candidatesOf(c))) digitSet.add(d);
  }
  const digits = [...digitSet].sort((a, b) => a - b);
  if (digits.length !== cells.length) return null;

  for (const d of digits) {
    const holders = cells.filter((c) => grid.hasCandidate(c, d));
    if (holders.length === 0 || !allSeeEachOther(holders)) return null;
  }

  const cellSet = new Set(cells);
  const eliminations: { cell: number; digit: number }[] = [];
  for (const d of digits) {
    const holders = cells.filter((c) => grid.hasCandidate(c, d));
    for (let c = 0; c < CELLS; c++) {
      if (cellSet.has(c)) continue;
      if (grid.get(c) !== 0) continue;
      if (!grid.hasCandidate(c, d)) continue;
      if (holders.every((h) => PEERS_OF[c]!.includes(h))) {
        eliminations.push({ cell: c, digit: d });
      }
    }
  }

  if (eliminations.length === 0) return null;

  return {
    strategyId: 'msls',
    placements: [],
    eliminations,
    highlights: {
      cells: [...cells, ...eliminations.map((e) => e.cell)],
      candidates: [
        ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `多扇区数组：行 {${rows.map((r) => r + 1).join(',')}} × 列 {${cols.map((c) => c + 1).join(',')}} 的 ${cells.length} 格形成锁定集，从外部可见格中消去锁定数字。`,
      en: `MSLS: the ${cells.length} cells in rows {${rows.map((r) => r + 1).join(',')}} × columns {${cols.map((c) => c + 1).join(',')}} form a locked set; eliminate locked digits from outside cells seeing all occurrences.`,
      },
  };
}

export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区数组', en: 'Multi-Sector Locked Sets' },
  difficulty: 1300,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (const rSize of [2, 3, 4]) {
      for (const cSize of [2, 3, 4]) {
        for (const rows of subsets(9, rSize)) {
          for (const cols of subsets(9, cSize)) {
            const step = trySet(grid, rows, cols);
            if (step) return step;
          }
        }
      }
    }
    return null;
  },
};
