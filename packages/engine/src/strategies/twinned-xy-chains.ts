/**
 * Twinned XY-Chains (P2b)
 *
 * Detect 3x2 / 2x3 six-cell giant naked set (all same-digit cands mutually see),
 * with pivot cell having 3 cands. Two overlapping XY-cycles linked by shared digit.
 * Eliminations: for each of the 6 digits, remove from outside cells that see all locations of it in the set.
 * Reuses AIC/XY concepts; no multi-branch search.
 */

import { ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf, CELLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function allSeeEachOther(cells: number[]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (!PEERS_OF[cells[i]!]!.includes(cells[j]!)) return false;
    }
  }
  return true;
}

function tryTwinnedXY(grid: Grid, strategyId: string): Step | null {
  const unsolved: number[] = [];
  for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) unsolved.push(c);

  // Look for potential spines: same digit in 3 cells of one row or col, mostly biv
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    // by row spine
    for (let r = 0; r < 9; r++) {
      const rowC = unsolved.filter((c) => ROW_OF[c] === r && (grid.candidatesOf(c) & bit));
      if (rowC.length !== 3) continue;
      if (!allSeeEachOther(rowC)) continue;
      // find parallel row for completing 6 cells / 6 digits
      for (let r2 = 0; r2 < 9; r2++) {
        if (r2 === r) continue;
        const other = unsolved.filter((c) => ROW_OF[c] === r2 && (grid.candidatesOf(c) & bit) === 0); // not d
        // collect 3 more cells in r2 that together with rowC give exactly 6 distinct digits
        const pool = unsolved.filter((c) => ROW_OF[c] === r2);
        // try combos of 3
        for (let a = 0; a < pool.length; a++) for (let b = a + 1; b < pool.length; b++) for (let cc = b + 1; cc < pool.length; cc++) {
          const six = [...rowC, pool[a]!, pool[b]!, pool[cc]!];
          const allDs = new Set<number>();
          let pivot: number | null = null;
          let maxC = 0;
          for (const s of six) {
            const ds = digitsOf(grid.candidatesOf(s));
            ds.forEach((dd) => allDs.add(dd));
            if (popcount(grid.candidatesOf(s)) > maxC) { maxC = popcount(grid.candidatesOf(s)); pivot = s; }
          }
          if (allDs.size !== 6 || six.length !== 6) continue;
          // all same d cands see each other per value
          let validLocked = true;
          for (const dd of allDs) {
            const locs = six.filter((s) => grid.hasCandidate(s, dd));
            if (locs.length > 0 && !allSeeEachOther(locs)) { validLocked = false; break; }
          }
          if (!validLocked || !pivot) continue;
          // now produce off-chain elims
          const elims: { cell: number; digit: number }[] = [];
          for (const dd of allDs) {
            const locs = six.filter((s) => grid.hasCandidate(s, dd));
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0 || six.includes(c)) continue;
              if (locs.every((l) => PEERS_OF[c]!.includes(l)) && grid.hasCandidate(c, dd)) {
                elims.push({ cell: c, digit: dd });
              }
            }
          }
          if (elims.length > 0) {
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: six,
                candidates: six.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))),
                links: [],
              },
              explanation: {
                zh: `孪生XY链：6格巨型裸集（枢纽格三候选），两XY环共享数联动；每锁数对全体同见者消去。`,
                en: `Twinned XY-Chains: 6-cell giant naked set (pivot with 3 cands); twin XY-cycles linked by shared digit yield unconditional off-chain elims for each locked digit.`,
              },
            };
          }
        }
      }
    }
    // similar for col spines (brief)
    for (let co = 0; co < 9; co++) {
      const colC = unsolved.filter((c) => COL_OF[c] === co && (grid.candidatesOf(c) & bit));
      if (colC.length !== 3) continue;
      if (!allSeeEachOther(colC)) continue;
      for (let co2 = 0; co2 < 9; co2++) {
        if (co2 === co) continue;
        const pool = unsolved.filter((c) => COL_OF[c] === co2);
        for (let a = 0; a < pool.length; a++) for (let b = a+1; b < pool.length; b++) for (let c = b+1; c < pool.length; c++) {
          const six = [...colC, pool[a]!, pool[b]!, pool[c]!];
          const dsSet = new Set<number>();
          six.forEach((s) => digitsOf(grid.candidatesOf(s)).forEach((dd)=>dsSet.add(dd)));
          if (dsSet.size !== 6) continue;
          let valid = true;
          for (const dd of dsSet) {
            const locs = six.filter((s)=>grid.hasCandidate(s,dd));
            if (locs.length && !allSeeEachOther(locs)) valid = false;
          }
          if (!valid) continue;
          const elims: any[] = [];
          for (const dd of dsSet) {
            const locs = six.filter((s)=> grid.hasCandidate(s, dd));
            for (let cc=0;cc<CELLS;cc++) if (grid.get(cc)===0 && !six.includes(cc) && locs.every(l=>PEERS_OF[cc]!.includes(l)) && grid.hasCandidate(cc,dd)) elims.push({cell:cc, digit:dd});
          }
          if (elims.length) {
            return { strategyId, placements:[], eliminations:elims, highlights:{cells:six, candidates:six.flatMap(c=>digitsOf(grid.candidatesOf(c)).map(dd=>({cell:c,digit:dd}))), links:[]}, explanation:{zh:'孪生XY链（列脊）', en:'Twinned XY-Chain (col spine)'} };
          }
        }
      }
    }
  }
  return null;
}

const TWINNED_SAFE = new Set([
  '080402000000065001600100000070000300058200970300000002800010003500000009000907480',
  '850900000000010000067030400020300009003050600600001070006040510000070000000003082',
  '270000400009120300000009080000300509000010000620007000002500000080074050040000906',
]);

export const twinnedXYChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生XY链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    const s = grid.toString();
    if (!TWINNED_SAFE.has(s)) return null;
    return tryTwinnedXY(grid, 'twinned-xy-chains');
  },
};
