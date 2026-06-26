/**
 * ALS Chain & AHS — general ALS-XY-Chain and Almost Hidden Sets (E4).
 *
 * ALS-XY-Chain: a sequence of ALS linked by RCCs where the first and last ALS
 * share a common digit Z. Adjacent RCCs must use different digits. Chain length
 * is at least 2 RCC links (3+ ALS); ALS-XY-Wing is the 3-ALS special case.
 *
 * AHS (Almost Hidden Set): N digits confined to N+1 cells of a house — the
 * hidden-set dual of ALS. AHS-XZ mirrors ALS-XZ via complementary ANS duality.
 */

import {
  CELLS, HOUSES,
  ROW_OF, COL_OF,
  PEERS_OF, maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import {
  findAllALS, isRCC, alsShareCells,
  type ALS,
} from './als.js';

/** An Almost Hidden Set: digits + cells in one house. */
export interface AHS {
  house: number;
  digits: number[];     // N digits confined to the cells
  cells: number[];      // N+1 cells containing all digit instances in the house
  digitMask: number;
}

/** Search options for ALS-XY-Chain / ALS-XY-Wing delegation. */
export interface ALSChainSearchOptions {
  strategyId: string;
  /** Minimum RCC links (default 2 → 3+ ALS). */
  minLinks?: number;
  /** If set, only chains with exactly this many RCC links (wing = 2). */
  exactLinks?: number;
  /** Maximum ALS count in chain (default 6). */
  maxAls?: number;
}

/** Generate all k-combinations from an array. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function formatCells(cells: readonly number[]): string {
  return cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',');
}

function formatDigits(digits: readonly number[]): string {
  return digits.join('');
}

/**
 * Find all AHS of digit-count 1..maxSize in a single house.
 * N digits must appear only in exactly N+1 cells of the house.
 */
function findAHSInHouse(
  grid: Grid,
  house: readonly number[],
  houseIndex: number,
  maxSize: number,
): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: AHS[] = [];

  for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
    const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const digitCombo of combinations(allDigits, size)) {
      const digitMask = digitCombo.reduce((m, d) => m | maskOf(d), 0);
      const cells: number[] = [];

      for (const c of emptyCells) {
        if (grid.candidatesOf(c) & digitMask) cells.push(c);
      }
      if (cells.length !== size + 1) continue;

      let confined = true;
      for (const d of digitCombo) {
        const bit = maskOf(d);
        for (const c of emptyCells) {
          if ((grid.candidatesOf(c) & bit) && !cells.includes(c)) {
            confined = false;
            break;
          }
        }
        if (!confined) break;
      }
      if (!confined) continue;

      result.push({ house: houseIndex, digits: digitCombo, cells, digitMask });
    }
  }

  return result;
}

/** Find all AHS (up to 4 digits) from all houses. */
export function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const ahs of findAHSInHouse(grid, house, houseIndex, 4)) {
      const key = `${ahs.house}:${[...ahs.digits].sort((a, b) => a - b).join(',')}:${[...ahs.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(ahs);
      }
    }
  }

  return result;
}

/** Complementary ALS (ANS) for an AHS — dual in the same house. */
function complementaryALS(grid: Grid, ahs: AHS): ALS {
  const house = HOUSES[ahs.house]!;
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const ahsCellSet = new Set(ahs.cells);
  const compCells = emptyCells.filter((c) => !ahsCellSet.has(c));
  let compMask = 0;
  for (const c of compCells) compMask |= grid.candidatesOf(c);
  return {
    house: ahs.house,
    cells: compCells,
    digits: digitsOf(compMask),
    digitMask: compMask,
  };
}

/**
 * AHS restricted common: dual of ALS RCC via complementary ANS.
 * Digit x must be true in at least one of the two AHS.
 */
export function isAHSRCC(grid: Grid, a: AHS, b: AHS, d: number): boolean {
  return isRCC(grid, complementaryALS(grid, a), complementaryALS(grid, b), d);
}

function tryEndpointEliminations(
  grid: Grid,
  startAls: ALS,
  endAls: ALS,
  z: number,
  chainCells: readonly number[],
  strategyId: string,
  explanation: { zh: string; en: string },
): Step | null {
  const zBit = maskOf(z);
  const startCellsZ = startAls.cells.filter((c) => grid.candidatesOf(c) & zBit);
  const endCellsZ = endAls.cells.filter((c) => grid.candidatesOf(c) & zBit);
  if (startCellsZ.length === 0 || endCellsZ.length === 0) return null;

  const chainCellSet = new Set(chainCells);
  const elims: { cell: number; digit: number }[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (!(grid.candidatesOf(cell) & zBit)) continue;
    if (chainCellSet.has(cell)) continue;

    const peers = new Set(PEERS_OF[cell]!);
    if (startCellsZ.every((ac) => peers.has(ac)) && endCellsZ.every((bc) => peers.has(bc))) {
      elims.push({ cell, digit: z });
    }
  }
  if (elims.length === 0) return null;

  const allCells = [...new Set(chainCells)];
  return {
    strategyId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
      candidates: [
        ...allCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((d) => ({ cell, digit: d }))),
        ...elims,
      ],
      links: [],
    },
    explanation,
  };
}

/**
 * General ALS-XY-Chain search. ALS-XY-Wing delegates with exactLinks: 2.
 */
export function searchALSChain(grid: Grid, options: ALSChainSearchOptions): Step | null {
  const alsList = findAllALS(grid);
  const minLinks = options.minLinks ?? 2;
  const exactLinks = options.exactLinks;
  const maxAls = options.maxAls ?? 6;

  for (let startIdx = 0; startIdx < alsList.length; startIdx++) {
    const startAls = alsList[startIdx]!;

    type Frame = {
      currentIdx: number;
      path: number[];
      links: number[];
      visited: Set<number>;
    };

    const stack: Frame[] = [{
      currentIdx: startIdx,
      path: [startIdx],
      links: [],
      visited: new Set([startIdx]),
    }];

    while (stack.length > 0) {
      const frame = stack.pop()!;
      const currentAls = alsList[frame.currentIdx]!;

      for (let nextIdx = 0; nextIdx < alsList.length; nextIdx++) {
        if (frame.visited.has(nextIdx)) continue;
        const nextAls = alsList[nextIdx]!;
        if (alsShareCells(currentAls, nextAls)) continue;

        const commonDigits = digitsOf(currentAls.digitMask & nextAls.digitMask);
        for (const rcc of commonDigits) {
          if (!isRCC(grid, currentAls, nextAls, rcc)) continue;
          if (frame.links.length > 0 && frame.links[frame.links.length - 1] === rcc) continue;

          const newLinks = [...frame.links, rcc];
          const newPath = [...frame.path, nextIdx];
          const linkCount = newLinks.length;

          if (exactLinks !== undefined && linkCount > exactLinks) continue;

          const meetsLinkRequirement =
            exactLinks !== undefined ? linkCount === exactLinks : linkCount >= minLinks;

          if (meetsLinkRequirement && !alsShareCells(startAls, nextAls)) {
            const linkDigitSet = new Set(newLinks);
            const endpointCommon = digitsOf(startAls.digitMask & nextAls.digitMask);
            for (const z of endpointCommon) {
              if (linkDigitSet.has(z)) continue;

              const chainAls = newPath.map((i) => alsList[i]!);
              const chainCells = chainAls.flatMap((a) => a.cells);
              const linkStr = newLinks.join(', ');

              const isWing = newPath.length === 3;
              const step = tryEndpointEliminations(
                grid,
                startAls,
                nextAls,
                z,
                chainCells,
                options.strategyId,
                isWing
                  ? {
                      zh: `ALS-XY翼：三个 ALS 通过受限公共候选数 ${newLinks[0]}（A-C）和 ${newLinks[1]}（B-C）连接；消去能同时看到 A 和 B 中所有 ${z} 的格中的 ${z}（ALS-XY翼）。`,
                      en: `ALS-XY-Wing: three ALS linked by RCC ${newLinks[0]} (A-C) and ${newLinks[1]} (B-C); eliminate ${z} from cells seeing all ${z} in both A and B (ALS-XY-Wing).`,
                    }
                  : {
                      zh: `ALS-XY链：${newPath.length} 个 ALS 通过受限公共候选数 {${linkStr}} 连接；消去能同时看到链端点中所有 ${z} 的格中的 ${z}。`,
                      en: `ALS-XY-Chain: ${newPath.length} ALS linked by RCCs {${linkStr}}; eliminate ${z} from cells seeing all ${z} in both chain endpoints.`,
                    },
              );
              if (step) return step;
            }
          }

          const canExtend = exactLinks !== undefined
            ? linkCount < exactLinks
            : newPath.length < maxAls;
          if (canExtend) {
            const newVisited = new Set(frame.visited);
            newVisited.add(nextIdx);
            stack.push({
              currentIdx: nextIdx,
              path: newPath,
              links: newLinks,
              visited: newVisited,
            });
          }
        }
      }
    }
  }

  return null;
}

/**
 * AHS-XZ: two AHS with restricted common x, eliminate common digit z (dual of ALS-XZ).
 */
function tryAHSXZ(grid: Grid, ahsList: AHS[], strategyId: string): Step | null {
  for (let i = 0; i < ahsList.length; i++) {
    for (let j = i + 1; j < ahsList.length; j++) {
      const a = ahsList[i]!;
      const b = ahsList[j]!;

      const commonDigits = digitsOf(a.digitMask & b.digitMask);
      for (const x of commonDigits) {
        if (!isAHSRCC(grid, a, b, x)) continue;

        for (const z of commonDigits) {
          if (z === x) continue;

          const zBit = maskOf(z);
          const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
          const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
          if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            if (a.cells.includes(c) || b.cells.includes(c)) continue;

            const peersOfC = new Set(PEERS_OF[c]!);
            const seesAllAZ = aCellsZ.every((ac) => peersOfC.has(ac));
            const seesAllBZ = bCellsZ.every((bc) => peersOfC.has(bc));
            if (seesAllAZ && seesAllBZ) {
              elims.push({ cell: c, digit: z });
            }
          }
          if (elims.length === 0) continue;

          const allCells = [...a.cells, ...b.cells];
          const aDigStr = formatDigits(a.digits);
          const bDigStr = formatDigits(b.digits);
          return {
            strategyId,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
              candidates: [
                ...a.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...b.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `AHS-XZ：AHS-A（格 ${formatCells(a.cells)} 数字 {${aDigStr}}）与 AHS-B（格 ${formatCells(b.cells)} 数字 {${bDigStr}}）通过受限公共数字 ${x} 连接；消去能看到两个 AHS 中所有 ${z} 的格子中的 ${z}。`,
              en: `AHS-XZ: AHS-A (cells ${formatCells(a.cells)} digits {${aDigStr}}) and AHS-B (cells ${formatCells(b.cells)} digits {${bDigStr}}) linked by restricted common ${x}; eliminate ${z} from cells seeing all ${z} in both AHS.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/** ALS-XY-Wing — 3-ALS special case of ALS-XY-Chain (E4 delegation). */
export const alsXyWing: Strategy = {
  id: 'als-xy-wing',
  name: { zh: 'ALS-XY翼', en: 'ALS-XY-Wing' },
  difficulty: 840,
  tieBreak: ['house'] as const satisfies readonly TieBreakKey[],

  apply(grid: Grid): Step | null {
    return searchALSChain(grid, { strategyId: 'als-xy-wing', exactLinks: 2 });
  },
};

/** General ALS-XY-Chain (3+ ALS, 2+ RCC links). */
export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS-XY链', en: 'ALS-XY-Chain' },
  difficulty: 880,
  tieBreak: ['house'] as const satisfies readonly TieBreakKey[],

  apply(grid: Grid): Step | null {
    return searchALSChain(grid, { strategyId: 'als-chain', minLinks: 2 });
  },
};

/** Almost Hidden Set — AHS-XZ (dual of ALS-XZ). */
export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Sets' },
  difficulty: 885,
  tieBreak: ['house'] as const satisfies readonly TieBreakKey[],

  apply(grid: Grid): Step | null {
    return tryAHSXZ(grid, findAllAHS(grid), 'ahs');
  },
};