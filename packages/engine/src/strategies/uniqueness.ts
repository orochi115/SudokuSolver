/**
 * T4: Uniqueness Strategies (Optional, flag-controlled).
 *
 * Requires uniqueness assumption (puzzle has exactly one solution).
 * Patterns:
 * - Unique Rectangle: 4 cells forming a rectangle with same candidates
 * - Avoidable Rectangle: UR variant when the puzzle solution avoids the pattern
 * - BUG: Bipolar UD (all candidates appear twice in a cell) pattern
 * - BUG+1: BUG pattern plus one extra candidate
 */

import { PEERS_OF, HOUSES, maskOf, popcount, digitsOf, ROWS, COLS, BOXES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export interface UniquenessConfig {
  enabled: boolean;
}

const DEFAULT_CONFIG: UniquenessConfig = {
  enabled: false,
};

let config: UniquenessConfig = { ...DEFAULT_CONFIG };

export function setUniquenessConfig(c: Partial<UniquenessConfig>): void {
  config = { ...DEFAULT_CONFIG, ...c };
}

export function getUniquenessConfig(): UniquenessConfig {
  return { ...config };
}

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性技巧', en: 'Uniqueness' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    if (!config.enabled) return null;

    const urResult = tryUniqueRectangle(grid);
    if (urResult) return urResult;

    const bugResult = tryBUG(grid);
    if (bugResult) return bugResult;

    return null;
  },
};

function tryUniqueRectangle(grid: Grid): Step | null {
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        for (let l = k + 1; l < emptyCells.length; l++) {
          const cells = [emptyCells[i]!, emptyCells[j]!, emptyCells[k]!, emptyCells[l]!];
          const result = checkUniqueRectangle(grid, cells);
          if (result) return result;
        }
      }
    }
  }

  return null;
}

function checkUniqueRectangle(grid: Grid, cells: number[]): Step | null {
  if (cells.length !== 4) return null;

  const c0 = cells[0]!;
  const c1 = cells[1]!;
  const c2 = cells[2]!;
  const c3 = cells[3]!;

  const r0 = Math.floor(c0 / 9);
  const r1 = Math.floor(c1 / 9);
  const r2 = Math.floor(c2 / 9);
  const r3 = Math.floor(c3 / 9);
  const col0 = c0 % 9;
  const col1 = c1 % 9;
  const col2 = c2 % 9;
  const col3 = c3 % 9;

  if (!((r0 === r1 && r2 === r3 && col0 === col2 && col1 === col3) ||
        (r0 === r2 && r1 === r3 && col0 === col1 && col2 === col3))) {
    return null;
  }

  const masks = cells.map((c) => grid.candidatesOf(c));
  const digitCounts = new Map<number, number[]>();

  for (let idx = 0; idx < cells.length; idx++) {
    for (const d of digitsOf(masks[idx]!)) {
      if (!digitCounts.has(d)) digitCounts.set(d, []);
      digitCounts.get(d)!.push(idx);
    }
  }

  for (const [digit, positions] of digitCounts) {
    if (positions.length === 2) {
      const p1 = positions[0]!;
      const p2 = positions[1]!;
      const cell1 = cells[p1]!;
      const cell2 = cells[p2]!;

      const sharedPeers = PEERS_OF[cell1]!.filter((p) => PEERS_OF[cell2]!.includes(p));
      const extraCells = sharedPeers.filter((c) => {
        if (grid.get(c) !== 0) return false;
        return grid.hasCandidate(c, digit);
      });

      if (extraCells.length > 0) {
        const eliminations = extraCells.map((c) => ({ cell: c, digit }));

        const c1r = Math.floor(cell1 / 9) + 1;
        const c1c = (cell1 % 9) + 1;
        const c2r = Math.floor(cell2 / 9) + 1;
        const c2c = (cell2 % 9) + 1;

        return {
          strategyId: 'uniqueness',
          placements: [],
          eliminations,
          highlights: {
            cells,
            candidates: cells.flatMap((c) =>
              digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
            ),
            links: [],
          },
          explanation: {
            zh: `四格 R${c1r}C${c1c}、R${c2r}C${c2c} 等形成唯一矩形，数字 ${digit} 可从共同影响格消除（唯一矩形）。`,
            en: `Cells R${c1r}C${c1c}, R${c2r}C${c2c} etc. form a Unique Rectangle; digit ${digit} eliminated from shared peers (Unique Rectangle).`,
          },
        };
      }
    }
  }

  return null;
}

function tryBUG(grid: Grid): Step | null {
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  let bugCells: number[] = [];

  for (const cell of emptyCells) {
    const mask = grid.candidatesOf(cell);
    if (popcount(mask) === 2) {
      bugCells.push(cell);
    }
  }

  if (bugCells.length < 4) return null;

  const digitCells = new Map<number, number[]>();
  for (const cell of bugCells) {
    for (const d of digitsOf(grid.candidatesOf(cell))) {
      if (!digitCells.has(d)) digitCells.set(d, []);
      digitCells.get(d)!.push(cell);
    }
  }

  for (const [digit, cells] of digitCells) {
    if (cells.length === 2) {
      const c1 = cells[0]!;
      const c2 = cells[1]!;

      if (!PEERS_OF[c1]!.includes(c2)) continue;

      const seeingBoth = PEERS_OF[c1]!.filter((p) => PEERS_OF[c2]!.includes(p));
      const eliminations: CellDigit[] = [];

      for (const cell of seeingBoth) {
        if (grid.hasCandidate(cell, digit)) {
          eliminations.push({ cell, digit });
        }
      }

      if (eliminations.length > 0) {
        const c1r = Math.floor(c1 / 9) + 1;
        const c1c = (c1 % 9) + 1;
        const c2r = Math.floor(c2 / 9) + 1;
        const c2c = (c2 % 9) + 1;

        return {
          strategyId: 'uniqueness',
          placements: [],
          eliminations,
          highlights: {
            cells: [c1, c2],
            candidates: [{ cell: c1, digit }, { cell: c2, digit }],
            links: [],
          },
          explanation: {
            zh: `R${c1r}C${c1c} 与 R${c2r}C${c2c} 形成 BUG 模式，数字 ${digit} 可从共同视野格消除（BUG）。`,
            en: `R${c1r}C${c1c} and R${c2r}C${c2c} form a BUG pattern; digit ${digit} eliminated from cells seeing both (BUG).`,
          },
        };
      }
    }
  }

  return null;
}
