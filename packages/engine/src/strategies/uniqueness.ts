import { SIZE, ROW_OF, COL_OF, BOX_OF, PEERS_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellIdx(r: number, c: number): number {
  return r * 9 + c;
}

function digitsOfMask(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= SIZE; d++) {
    if (mask & maskOf(d)) out.push(d);
  }
  return out;
}

function findUR(grid: Grid): Step | null {
  for (let r1 = 0; r1 < SIZE; r1++) {
    for (let r2 = r1 + 1; r2 < SIZE; r2++) {
      for (let c1 = 0; c1 < SIZE; c1++) {
        for (let c2 = c1 + 1; c2 < SIZE; c2++) {
          const b1 = BOX_OF[cellIdx(r1, c1)]!;
          const b4 = BOX_OF[cellIdx(r2, c2)]!;
          if (b1 === b4) continue;
          const b2 = BOX_OF[cellIdx(r1, c2)]!;
          const b3 = BOX_OF[cellIdx(r2, c1)]!;
          if (b1 === b2 || b1 === b3 || b2 === b4 || b3 === b4) continue;

          const c00 = cellIdx(r1, c1);
          const c01 = cellIdx(r1, c2);
          const c10 = cellIdx(r2, c1);
          const c11 = cellIdx(r2, c2);

          if (grid.get(c00) !== 0 || grid.get(c01) !== 0 || grid.get(c10) !== 0 || grid.get(c11) !== 0) continue;

          const m00 = grid.candidatesOf(c00);
          const m01 = grid.candidatesOf(c01);
          const m10 = grid.candidatesOf(c10);
          const m11 = grid.candidatesOf(c11);

          const commonTwo = m00 & m01 & m10 & m11;
          const commonDigits = digitsOfMask(commonTwo);
          if (commonDigits.length < 2) continue;

          const d1 = commonDigits[0]!;
          const d2 = commonDigits[1]!;
          const deadlyMask = maskOf(d1) | maskOf(d2);

          const extras: { cell: number; extraMask: number }[] = [];
          const cells = [c00, c01, c10, c11];
          for (const [idx, mask] of [m00, m01, m10, m11].entries()) {
            const extra = mask & ~deadlyMask;
            if (extra !== 0) extras.push({ cell: cells[idx]!, extraMask: extra });
          }

          if (extras.length === 0) continue;
          if (extras.length === 1) {
            const ec = extras[0]!;
            const elims: { cell: number; digit: number }[] = [];
            for (const d of digitsOfMask(ec.extraMask)) {
              for (const p of PEERS_OF[ec.cell]!) {
                if (cells.includes(p)) continue;
                if (grid.hasCandidate(p, d)) {
                  elims.push({ cell: p, digit: d });
                }
              }
            }
            if (elims.length > 0) {
              const fmt = (c: number) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
              return {
                strategyId: 'uniqueness',
                placements: [],
                eliminations: elims,
                highlights: { cells: [c00, c01, c10, c11], candidates: [], links: [] },
                explanation: {
                  zh: `唯一矩形 Type 1：${fmt(c00)}-${fmt(c11)} 致命模式，排除 ${fmt(ec.cell)} 额外候选的影响格。`,
                  en: `Unique Rectangle Type 1: ${fmt(c00)}-${fmt(c11)} deadly pattern, eliminate extra candidates from peers.`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性技巧', en: 'Uniqueness Techniques' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    return findUR(grid);
  },
};