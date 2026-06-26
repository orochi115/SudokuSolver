/**
 * Advanced ALS Strategies (P1) — 进阶 ALS 策略
 *
 * ALS-Chain (general ALS-XY-Chain) and AHS (Almost Hidden Set).
 *
 * ALS-Chain:
 *   A sequence of ALS nodes linked by Restricted Common Candidates (RCCs).
 *   ALS[0] -- RCC1 -- ALS[1] -- RCC2 -- ALS[2] -- ...
 *   The elimination: digits shared between first and last ALS that are NOT
 *   themselves RCCs can be eliminated from cells outside that see all
 *   instances of that digit in both endpoint ALS sets.
 *   Note: als-xy-wing is the len-2 special case (3 ALS, 2 RCCs).
 *   The general ALS-chain subsumes als-xy-wing (E4 — fold it).
 *
 * AHS (Almost Hidden Set):
 *   The dual of ALS. In a house with N cells, N digits appear exactly N+1
 *   times total. (ALS: N cells, N+1 digits. AHS: N digits in N+1 cells.)
 *   AHS-XZ: Two AHS share a Restricted Common Digit (RCD). Eliminates via
 *   the same XZ rule as ALS-XZ but from a hidden-set perspective.
 *   For the engine, AHS is registered as a standalone strategy that detects
 *   AHS-based eliminations.
 */

import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALS definitions (shared with als.ts conceptually)
// ─────────────────────────────────────────────────────────────────────────────

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
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

function findAllALS(grid: Grid, maxSize = 4): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();
  for (let hi = 0; hi < HOUSES.length; hi++) {
    for (const als of findALSInHouse(grid, HOUSES[hi]!, hi, maxSize)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) { seenKeys.add(key); result.push(als); }
    }
  }
  return result;
}

function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc || !PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

function alsShareCells(a: ALS, b: ALS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

// ─────────────────────────────────────────────────────────────────────────────
// ALS-Chain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * General ALS-Chain:
 * Find chains of ALS: ALS[0] -- rcc[0] -- ALS[1] -- rcc[1] -- ALS[2] -- ...
 * Each consecutive pair shares exactly one RCC.
 * The chain eliminates digit Z where:
 *   - Z is in both ALS[0] and ALS[last]
 *   - Z is not an RCC anywhere in the chain
 *   - Cells outside see all Z in ALS[0] and ALS[last]
 *
 * Chain length: 2 to 5 ALS nodes (practical limit).
 * Note: len-2 is ALS-XZ, len-3 is ALS-XY-Wing.
 */
function tryALSChain(grid: Grid, alsList: ALS[], minLen: number, maxLen: number): Step | null {
  // DFS: chain = list of ALS, rccs = list of RCC digits between consecutive pairs
  function dfs(
    chain: ALS[],
    rccs: number[], // rcc between chain[i] and chain[i+1]
    rccSet: Set<number>, // all rccs used so far
  ): Step | null {
    if (chain.length >= minLen) {
      const first = chain[0]!;
      const last = chain[chain.length - 1]!;

      // Find Z: common digits between first and last that are not RCCs
      const commonZ = digitsOf(first.digitMask & last.digitMask).filter((d) => !rccSet.has(d));

      for (const Z of commonZ) {
        const zBit = maskOf(Z);
        const zCellsFirst = first.cells.filter((c) => grid.candidatesOf(c) & zBit);
        const zCellsLast = last.cells.filter((c) => grid.candidatesOf(c) & zBit);
        if (zCellsFirst.length === 0 || zCellsLast.length === 0) continue;

        const allChainCells = chain.flatMap((a) => a.cells);
        const allCellSet = new Set(allChainCells);

        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & zBit)) continue;
          if (allCellSet.has(c)) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesFirst = zCellsFirst.every((x) => peers.has(x));
          const seesLast = zCellsLast.every((x) => peers.has(x));
          if (seesFirst && seesLast) elims.push({ cell: c, digit: Z });
        }

        if (elims.length > 0) {
          const chainDesc = chain.map((a, idx) => {
            const rcc = rccs[idx] ?? '?';
            return `ALS(${a.cells.map(cellLabel).join(',')})${idx < rccs.length ? `→[${rcc}]→` : ''}`;
          }).join('');

          return {
            strategyId: 'als-chain',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...new Set([...allChainCells, ...elims.map((e) => e.cell)])],
              candidates: [
                ...allChainCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `ALS链（${chain.length}节）：通过RCC ${rccs.join(',')} 连接 ${chain.length} 个几乎锁定集；消去能同时看到首尾 ALS 中所有 ${Z} 的格中的 ${Z}。`,
              en: `ALS-Chain (${chain.length} nodes): ${chain.length} ALS linked by RCCs ${rccs.join(',')}; eliminate ${Z} from cells seeing all ${Z} in first and last ALS.`,
            },
          };
        }
      }
    }

    if (chain.length >= maxLen) return null;

    const last = chain[chain.length - 1]!;
    for (const next of alsList) {
      if (chain.some((a) => alsShareCells(a, next) || a === next)) continue;
      if (alsShareCells(last, next)) continue;

      // Find RCC between last and next (must be exactly one new RCC)
      const commonDigits = digitsOf(last.digitMask & next.digitMask);
      for (const rcc of commonDigits) {
        if (rccSet.has(rcc)) continue; // RCCs must be distinct in a chain
        if (!isRCC(grid, last, next, rcc)) continue;

        rccSet.add(rcc);
        chain.push(next);
        rccs.push(rcc);

        const result = dfs(chain, rccs, rccSet);

        chain.pop();
        rccs.pop();
        rccSet.delete(rcc);

        if (result) return result;
      }
    }
    return null;
  }

  for (const startAls of alsList) {
    const result = dfs([startAls], [], new Set());
    if (result) return result;
  }
  return null;
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS 链', en: 'ALS-Chain' },
  difficulty: 880,
  tieBreak: ['house', 'size'],

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid, 4);
    // Skip len-2 (that's ALS-XZ, already handled by als-xz)
    // Skip len-3 (that's ALS-XY-Wing, E4: als-xy-wing is alias/folded)
    // This detects len 2..4 so it subsumes als-xy-wing (E4 compliance)
    return tryALSChain(grid, alsList, 2, 4);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AHS (Almost Hidden Set)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Almost Hidden Set (AHS):
 * In a house with cells, N digits appear in exactly N+1 cells (one extra cell).
 * This is the dual of ALS (N cells with N+1 digits).
 *
 * AHS-XZ:
 * Two AHS share a Restricted Common Digit (RCD) X.
 * They also share a common digit Z (not X).
 * Eliminate Z from cells outside both AHS that see all Z in both AHS.
 *
 * Finding AHS: in a house, find a set of N digits that appear in exactly N+1 cells.
 */

interface AHS {
  house: number;
  digits: number[];
  digitMask: number;
  cells: number[];   // N+1 cells that contain at least one of the N digits
  cellMask: number;  // bitmask of cells (using cell index)
}

function findAllAHS(grid: Grid, maxSize = 3): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();

  for (let hi = 0; hi < HOUSES.length; hi++) {
    const house = HOUSES[hi]!;
    const emptyCells = house.filter((c) => grid.get(c) === 0);
    if (emptyCells.length < 2) continue;

    const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const presentDigits = allDigits.filter((d) => {
      const bit = maskOf(d);
      return emptyCells.some((c) => grid.candidatesOf(c) & bit);
    });

    for (let size = 1; size <= Math.min(maxSize, presentDigits.length - 1); size++) {
      for (const digitCombo of combinations(presentDigits, size)) {
        const digitMask = digitCombo.reduce((m, d) => m | maskOf(d), 0);
        // Cells that contain at least one of these digits
        const cells = emptyCells.filter((c) => grid.candidatesOf(c) & digitMask);
        if (cells.length !== size + 1) continue; // AHS: N digits in exactly N+1 cells

        const key = `${hi}:${digitCombo.sort().join(',')}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        result.push({
          house: hi,
          digits: digitCombo,
          digitMask,
          cells,
          cellMask: 0, // unused
        });
      }
    }
  }
  return result;
}

/** Check if digit d is a Restricted Common Digit for AHS a and AHS b. */
function isRCD(grid: Grid, a: AHS, b: AHS, d: number): boolean {
  // d is in both AHS digit sets
  const bit = maskOf(d);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  // All cells in a that have d see all cells in b that have d
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc || !PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

function tryAHS(grid: Grid): Step | null {
  const ahsList = findAllAHS(grid, 3);

  for (let i = 0; i < ahsList.length; i++) {
    for (let j = i + 1; j < ahsList.length; j++) {
      const a = ahsList[i]!;
      const b = ahsList[j]!;

      // No shared cells
      const aCellSet = new Set(a.cells);
      if (b.cells.some((c) => aCellSet.has(c))) continue;

      // Find RCD X
      const commonDigits = digitsOf(a.digitMask & b.digitMask);
      for (const X of commonDigits) {
        if (!isRCD(grid, a, b, X)) continue;

        // Find common Z (not X) to eliminate
        for (const Z of commonDigits) {
          if (Z === X) continue;
          const zBit = maskOf(Z);
          const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
          const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
          if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            if (a.cells.includes(c) || b.cells.includes(c)) continue;
            const peers = new Set(PEERS_OF[c]!);
            const seesA = aCellsZ.every((x) => peers.has(x));
            const seesB = bCellsZ.every((x) => peers.has(x));
            if (seesA && seesB) elims.push({ cell: c, digit: Z });
          }
          if (elims.length === 0) continue;

          const allCells = [...a.cells, ...b.cells];
          return {
            strategyId: 'ahs',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
              candidates: [
                ...a.cells.flatMap((c) => a.digits.filter((d) => grid.hasCandidate(c, d)).map((d) => ({ cell: c, digit: d }))),
                ...b.cells.flatMap((c) => b.digits.filter((d) => grid.hasCandidate(c, d)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `AHS-XZ：几乎隐藏集 A（数字 {${a.digits.join(',')}} 在 ${a.cells.length} 格）与 B（数字 {${b.digits.join(',')}} 在 ${b.cells.length} 格）通过受限公共数字 ${X} 连接；消去能看到两 AHS 中所有 ${Z} 的格中的 ${Z}。`,
              en: `AHS-XZ: AHS-A (digits {${a.digits.join(',')}} in ${a.cells.length} cells) and AHS-B (digits {${b.digits.join(',')}} in ${b.cells.length} cells) linked by RCD ${X}; eliminate ${Z} from cells seeing all ${Z} in both AHS.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set (AHS)' },
  difficulty: 885,
  tieBreak: ['house', 'size'],

  apply(grid: Grid): Step | null {
    return tryAHS(grid);
  },
};
