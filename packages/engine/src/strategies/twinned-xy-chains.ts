/**
 * Twinned XY-Chains (P2) — 孪生 XY 链
 *
 * Detects a six-cell giant naked set: k cells holding exactly k distinct digits
 * (k = 6 in the classic 3×2 / 2×3 substrate) where, for every digit, all cells
 * that can hold it inside the set mutually see each other. The set then acts
 * as an extended locked set, and each digit can be eliminated from any outside
 * cell that sees all of its occurrences inside the set.
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

function tryFormation(grid: Grid, cells: number[]): Step | null {
  // All cells must be empty and have candidates.
  for (const c of cells) {
    if (grid.get(c) !== 0) return null;
    if (digitsOf(grid.candidatesOf(c)).length === 0) return null;
  }

  const digitSet = new Set<number>();
  for (const c of cells) {
    for (const d of digitsOf(grid.candidatesOf(c))) digitSet.add(d);
  }
  const digits = [...digitSet].sort((a, b) => a - b);
  if (digits.length !== cells.length) return null;

  // Each digit's occurrences inside the formation must be mutually visible.
  for (const d of digits) {
    const holders: number[] = cells.filter((c) => grid.hasCandidate(c, d));
    if (holders.length === 0) return null;
    if (!allSeeEachOther(holders)) return null;
  }

  const formationSet = new Set(cells);
  const eliminations: { cell: number; digit: number }[] = [];

  for (const d of digits) {
    const holders = cells.filter((c) => grid.hasCandidate(c, d));
    for (let c = 0; c < CELLS; c++) {
      if (formationSet.has(c)) continue;
      if (grid.get(c) !== 0) continue;
      if (!grid.hasCandidate(c, d)) continue;
      if (holders.every((h) => PEERS_OF[c]!.includes(h))) {
        eliminations.push({ cell: c, digit: d });
      }
    }
  }

  if (eliminations.length === 0) return null;

  return {
    strategyId: 'twinned-xy-chains',
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
      zh: `孪生 XY 链：${cells.map(cellLabel).join(',')} 形成 ${cells.length} 格 ${cells.length} 数的广义锁定集，从能看到各数字全部位置的格中消去这些数字。`,
      en: `Twinned XY-Chains: ${cells.map(cellLabel).join(',')} form a ${cells.length}-cell ${cells.length}-digit extended locked set; eliminate those digits from cells seeing all occurrences.`,
    },
  };
}

export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生 XY 链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // Two rows × three columns.
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            for (let c3 = c2 + 1; c3 < 9; c3++) {
              const cells = [
                r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
                r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
              ];
              const step = tryFormation(grid, cells);
              if (step) return step;
            }
          }
        }
      }
    }

    // Three rows × two columns.
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          for (let c1 = 0; c1 < 9; c1++) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              const cells = [
                r1 * 9 + c1, r1 * 9 + c2,
                r2 * 9 + c1, r2 * 9 + c2,
                r3 * 9 + c1, r3 * 9 + c2,
              ];
              const step = tryFormation(grid, cells);
              if (step) return step;
            }
          }
        }
      }
    }

    return null;
  },
};
