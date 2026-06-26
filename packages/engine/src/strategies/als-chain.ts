/**
 * ALS-Chain / ALS-XY-Chain (P1) — 一般 ALS 链
 *
 * A sequence of Almost Locked Sets linked by Restricted Common Candidates.
 * The first and last ALS share a common digit Z; Z must be true in at least
 * one endpoint, so it can be eliminated from cells seeing all Z in both ends.
 *
 * E4: `als-xy-wing` is the k=3 special case of this chain search.
 */

import {
  CELLS, HOUSES,
  ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}

function findALSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): ALS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: ALS[] = [];
  for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
    for (const combo of combinations(emptyCells, size)) {
      let mask = 0;
      for (const c of combo) mask |= grid.candidatesOf(c);
      if (popcount(mask) === size + 1) {
        result.push({ house: houseIndex, cells: combo, digits: digitsOf(mask), digitMask: mask });
      }
    }
  }
  return result;
}

export function findAllALS(grid: Grid, maxSize = 3): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();
  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    for (const als of findALSInHouse(grid, HOUSES[houseIndex]!, houseIndex, maxSize)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(als);
      }
    }
  }
  return result;
}

function alsShareCells(a: ALS, b: ALS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc) return false;
      if (!PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

/** Try ALS chain of length 2..maxLen and return first elimination. */
export function searchALSChain(grid: Grid, maxLen = 4, forcedStrategyId?: string, maxSize = 3): Step | null {
  const alsList = findAllALS(grid, maxSize).sort((a, b) => a.cells[0]! - b.cells[0]!);
  if (alsList.length < 2) return null;

  // Precompute RCCs between ALS pairs.
  const rccCache = new Map<string, number[]>();
  function rccs(a: ALS, b: ALS): number[] {
    const key = `${a.cells.join(',')}|${b.cells.join(',')}`;
    if (!rccCache.has(key)) {
      const common = a.digits.filter((d) => b.digits.includes(d) && isRCC(grid, a, b, d));
      rccCache.set(key, common);
    }
    return rccCache.get(key)!;
  }

  // BFS over ALS chains.
  interface QueueItem {
    chain: ALS[];
    rccs: number[]; // RCC between chain[i] and chain[i+1]
  }

  const BUDGET = 10000;
  let expansions = 0;
  for (let startIdx = 0; startIdx < alsList.length; startIdx++) {
    const queue: QueueItem[] = [{ chain: [alsList[startIdx]!], rccs: [] }];
    while (queue.length) {
      if (++expansions > BUDGET) return null;
      const item = queue.shift()!;
      if (item.chain.length >= 2 && item.chain.length <= maxLen) {
        const first = item.chain[0]!;
        const last = item.chain[item.chain.length - 1]!;
        if (!alsShareCells(first, last)) {
          const rccSet = new Set(item.rccs);
          const commonZ = first.digits.filter((z) => last.digits.includes(z) && !rccSet.has(z));
          for (const z of commonZ) {
            const zBit = maskOf(z);
            const aCellsZ = first.cells.filter((c) => grid.candidatesOf(c) & zBit);
            const bCellsZ = last.cells.filter((c) => grid.candidatesOf(c) & zBit);
            if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;
            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (first.cells.includes(c) || last.cells.includes(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (aCellsZ.every((ac) => peers.has(ac)) && bCellsZ.every((bc) => peers.has(bc))) {
                elims.push({ cell: c, digit: z });
              }
            }
            if (elims.length > 0) {
              const allCells = [...new Set(item.chain.flatMap((a) => a.cells))];
              const strategyId = forcedStrategyId ?? 'als-chain';
              const isWing = item.chain.length === 3;
              return {
                strategyId,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...allCells, ...elims.map((e) => e.cell)],
                  candidates: [
                    ...allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: isWing
                    ? `ALS-XY翼：三个 ALS 通过受限公共候选数链连接；消去能同时看到首尾 ALS 中所有 ${z} 的格中的 ${z}。`
                    : `ALS链：${item.chain.length} 个 ALS 通过受限公共候选数连接；消去能同时看到首尾 ALS 中所有 ${z} 的格中的 ${z}。`,
                  en: isWing
                    ? `ALS-XY-Wing: three ALS linked by RCCs; eliminate ${z} from cells seeing all ${z} in both end ALS.`
                    : `ALS-Chain: ${item.chain.length} ALS linked by RCCs; eliminate ${z} from cells seeing all ${z} in both end ALS.`,
                },
              };
            }
          }
        }
      }
      if (item.chain.length >= maxLen) continue;
      const last = item.chain[item.chain.length - 1]!;
      for (let nextIdx = 0; nextIdx < alsList.length; nextIdx++) {
        const next = alsList[nextIdx]!;
        if (item.chain.some((a) => alsShareCells(a, next))) continue;
        const commonRCCs = rccs(last, next);
        if (commonRCCs.length === 0) continue;
        // Avoid repeating the immediately previous RCC digit.
        const prevRcc = item.rccs[item.rccs.length - 1];
        for (const x of commonRCCs) {
          if (x === prevRcc) continue;
          queue.push({ chain: [...item.chain, next], rccs: [...item.rccs, x] });
        }
      }
    }
  }
  return null;
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS链', en: 'ALS-Chain' },
  difficulty: 880,
  tieBreak: ['house'] as readonly TieBreakKey[],
  apply(grid: Grid): Step | null {
    return searchALSChain(grid, 4, 'als-chain');
  },
};
