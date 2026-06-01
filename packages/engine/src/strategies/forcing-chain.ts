/**
 * Forcing Chains (T4) — last-resort chain logic.
 *
 * We implement a depth-limited forcing-chain search.
 * Starting from a bivalue cell, try both values and trace implications.
 * If both paths eliminate the same candidate, that candidate is removed.
 *
 * Depth is bounded by the FORCING_CHAIN_MAX_DEPTH configuration.
 */

import { CELLS, ROW_OF, COL_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const MAX_DEPTH = 6;

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid: Grid): Step | null {
    // For each bivalue cell, try both candidates as assumptions
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const ds = digitsOf(grid.candidatesOf(cell));
      if (ds.length !== 2) continue;

      const d1 = ds[0]!;
      const d2 = ds[1]!;
      const result1 = traceForcing(grid, cell, d1, MAX_DEPTH);
      const result2 = traceForcing(grid, cell, d2, MAX_DEPTH);

      if (!result1 || !result2) continue;

      // Find common eliminations
      const common = findCommonEliminations(result1, result2);
      if (common.length > 0) {
        return makeStep(cell, ds, common);
      }
    }
    return null;
  },
};

interface ForcingResult {
  placements: CellDigit[];
  eliminations: CellDigit[];
}

function traceForcing(grid: Grid, cell: number, digit: number, depth: number): ForcingResult | null {
  const work = grid.clone();
  work.place(cell, digit);
  if (work.hasContradiction()) return null;

  const eliminations: CellDigit[] = [];
  const placements: CellDigit[] = [{ cell, digit }];

  // Propagate singles
  let changed = true;
  while (changed) {
    changed = false;
    for (let c = 0; c < CELLS; c++) {
      if (work.get(c) !== 0) continue;
      const mask = work.candidatesOf(c);
      if (popcount(mask) === 1) {
        const d = digitsOf(mask)[0]!;
        placements.push({ cell: c, digit: d });
        work.place(c, d);
        if (work.hasContradiction()) return null;
        changed = true;
      }
    }
  }

  if (depth > 0) {
    // Try deeper forcing
    for (let c = 0; c < CELLS; c++) {
      if (work.get(c) !== 0) continue;
      const ds = digitsOf(work.candidatesOf(c));
      if (ds.length === 2) {
        for (const d of ds) {
          const sub = traceForcing(work, c, d, depth - 1);
          if (!sub) return null;
        }
      }
    }
  }

  // Collect eliminations: any cell with a single candidate in the original grid
  // that is now removed
  for (let c = 0; c < CELLS; c++) {
    if (work.get(c) !== 0) continue;
    if (grid.get(c) !== 0) continue;
    const orig = digitsOf(grid.candidatesOf(c));
    const now = digitsOf(work.candidatesOf(c));
    for (const d of orig) {
      if (!now.includes(d)) {
        eliminations.push({ cell: c, digit: d });
      }
    }
  }

  return { placements, eliminations };
}

function findCommonEliminations(a: ForcingResult, b: ForcingResult): CellDigit[] {
  const map = new Map<string, CellDigit>();
  for (const e of a.eliminations) {
    map.set(`${e.cell}-${e.digit}`, e);
  }
  const common: CellDigit[] = [];
  for (const e of b.eliminations) {
    if (map.has(`${e.cell}-${e.digit}`)) {
      common.push(e);
    }
  }
  return common;
}

function makeStep(pivotCell: number, pivotDigits: number[], eliminations: CellDigit[]): Step {
  return {
    strategyId: 'forcing-chain',
    placements: [],
    eliminations,
    highlights: {
      cells: [pivotCell],
      candidates: pivotDigits.map((d) => ({ cell: pivotCell, digit: d })),
      links: [],
    },
    explanation: {
      zh: `强制链从 R${ROW_OF[pivotCell]! + 1}C${COL_OF[pivotCell]! + 1} 出发，消除 ${eliminations.length} 处候选。`,
      en: `Forcing chain from R${ROW_OF[pivotCell]! + 1}C${COL_OF[pivotCell]! + 1} eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
    },
  };
}
