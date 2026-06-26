/**
 * ALS — Almost Locked Sets (T4) / 几乎锁定集
 *
 * An ALS is N cells (all in the same house, or all peers of each other) with
 * exactly N+1 candidates collectively. Like a locked set but with one extra
 * digit that is "almost" eliminated.
 *
 * Main patterns:
 *
 * ALS-XZ:
 *   Two ALS (A and B) share a Restricted Common Candidate (RCC) X:
 *   all X-candidates in A see all X-candidates in B (and vice versa).
 *   They also share an unrestricted common candidate Z (not X).
 *   → Z can be eliminated from any cell outside both ALS that sees all Z in A
 *     AND all Z in B.
 *
 * Doubly Linked ALS-XZ (ALS-XY if you will):
 *   Same as ALS-XZ but with TWO RCCs. In this case, ALL candidates of Z in
 *   A are true OR all in B are true → eliminate Z from cells seeing all Z
 *   in either ALS.
 *
 * ALS-XY-Wing:
 *   Three ALS linked by two RCCs forming a wing pattern.
 *   (ALS_A -- X -- ALS_C -- Y -- ALS_B) where ALS_A and ALS_B share Z.
 *   Eliminate Z from cells seeing all Z in ALS_A and ALS_B.
 *
 * Death Blossom:
 *   A stem cell (bivalue or with few candidates) is linked to multiple ALS
 *   petals. Each digit of the stem is the RCC to one petal. The shared
 *   candidates across all petals can be eliminated from cells outside.
 *
 * ALS Chain:
 *   A sequence of ALS linked by RCCs; endpoint shared candidates are eliminated.
 */

import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';

/** An Almost Locked Set: cells + candidate digits. */
export interface ALS {
  house: number;
  cells: number[];      // cells in this ALS (all in one unit or mutually visible)
  digits: number[];     // all candidates across cells (exactly cells.length + 1 distinct digits)
  digitMask: number;    // bitmask of digits
}

/**
 * Find all ALS of size 1..maxSize from a single house.
 * Size 1: a bivalue cell (1 cell, 2 candidates).
 * Size 2: 2 cells with 3 candidates collectively.
 * etc.
 */
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

/** Find all ALS (up to size 4) from all houses. */
export function findAllALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const als of findALSInHouse(grid, house, houseIndex, 4)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(als);
      }
    }
  }

  return result;
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

/**
 * Check if digit d is a Restricted Common Candidate between ALS A and ALS B:
 * every cell in A that has d sees every cell in B that has d (and vice versa).
 */
function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit)) return false;
  if (!(b.digitMask & bit)) return false;

  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);

  if (aCells.length === 0 || bCells.length === 0) return false;

  // All cells in aCells must see all cells in bCells
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc) return false; // ALS can't share cells
      if (!PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

/**
 * Check if two ALS share any cells. They must not.
 */
function alsShareCells(a: ALS, b: ALS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

/**
 * Doubly-linked ALS-XZ: Two ALS connected by two RCCs.
 */
function tryALSDoublyLinkedXZ(grid: Grid, alsList: ALS[], strategyId: string): Step | null {
  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      const a = alsList[i]!;
      const b = alsList[j]!;

      if (alsShareCells(a, b)) continue;

      // Find RCCs
      const commonDigits = digitsOf(a.digitMask & b.digitMask);
      const rccs = commonDigits.filter((digit) => isRCC(grid, a, b, digit));

      for (let r1 = 0; r1 < rccs.length; r1++) {
        for (let r2 = r1 + 1; r2 < rccs.length; r2++) {
          const x = rccs[r1]!;
          const y = rccs[r2]!;
          const rccMask = maskOf(x) | maskOf(y);
          const elims: { cell: number; digit: number }[] = [];

          for (const digit of a.digits.filter((d) => (rccMask & maskOf(d)) === 0)) {
            for (const cell of HOUSES[a.house]!) {
              if (grid.get(cell) === 0 && !a.cells.includes(cell) && grid.hasCandidate(cell, digit)) {
                elims.push({ cell, digit });
              }
            }
          }
          for (const digit of b.digits.filter((d) => (rccMask & maskOf(d)) === 0)) {
            for (const cell of HOUSES[b.house]!) {
              if (grid.get(cell) === 0 && !b.cells.includes(cell) && grid.hasCandidate(cell, digit)) {
                elims.push({ cell, digit });
              }
            }
          }

          if (elims.length > 0) {
            const allCells = [...a.cells, ...b.cells];
            const aDigStr = a.digits.join('');
            const bDigStr = b.digits.join('');
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
                zh: `双链 ALS-XZ：ALS-A（格 ${a.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} 候选 {${aDigStr}}）与 ALS-B（格 ${b.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} 候选 {${bDigStr}}）通过受限公共候选数 ${x} 和 ${y} 双链连接；消去各自 house 中非 RCC 候选。`,
                en: `Doubly-linked ALS-XZ: ALS-A (cells ${a.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} cands {${aDigStr}}) and ALS-B (cells ${b.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} cands {${bDigStr}}) are linked by RCCs ${x} and ${y}; eliminate non-RCC candidates from their houses.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/**
 * ALS-XZ: Two ALS connected by RCC X, eliminate common digit Z.
 */
function tryALSXZ(grid: Grid, alsList: ALS[], strategyId: string): Step | null {
  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      const a = alsList[i]!;
      const b = alsList[j]!;

      if (alsShareCells(a, b)) continue;

      const commonDigits = digitsOf(a.digitMask & b.digitMask);

      for (const x of commonDigits) {
        if (!isRCC(grid, a, b, x)) continue;

        // Found RCC X. Now look for common candidate Z (not X) to eliminate.
        for (const z of commonDigits) {
          if (z === x) continue;

          const zBit = maskOf(z);
          const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
          const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);

          if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

          // Eliminate Z from cells seeing all Z in A and all Z in B
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

          // Also check doubly-linked: if there's a second RCC y ≠ x
          const secondRCC = commonDigits.filter((d) => d !== x && d !== z && isRCC(grid, a, b, d));

          const allCells = [...a.cells, ...b.cells];
          const aDigStr = a.digits.join('');
          const bDigStr = b.digits.join('');

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
              links: [
                ...a.cells.filter((c) => grid.candidatesOf(c) & maskOf(x)).map((c) => ({
                  from: { cell: c, digit: x },
                  to: { cell: b.cells.find((bc) => grid.candidatesOf(bc) & maskOf(x))!, digit: x },
                  type: 'strong' as const,
                })),
              ],
            },
            explanation: {
              zh: `ALS-XZ：ALS-A（格 ${a.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} 候选 {${aDigStr}}）与 ALS-B（格 ${b.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} 候选 {${bDigStr}}）通过受限公共候选数 ${x} 连接${secondRCC.length > 0 ? '（双链）' : ''}；消去能看到两个 ALS 中所有 ${z} 的格子中的 ${z}。`,
              en: `ALS-XZ: ALS-A (cells ${a.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} cands {${aDigStr}}) and ALS-B (cells ${b.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',')} cands {${bDigStr}}) linked by RCC ${x}${secondRCC.length > 0 ? ' (doubly linked)' : ''}; eliminate ${z} from cells seeing all ${z} in both ALS.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/**
 * ALS-XY-Wing: Three ALS A, B, C where:
 *   A and C share RCC X
 *   B and C share RCC Y (Y ≠ X)
 *   A and B share common candidate Z (not X or Y)
 *   Eliminate Z from cells seeing all Z in A and B.
 */
function tryALSXYWing(grid: Grid, alsList: ALS[], strategyId: string): Step | null {
  for (let ci = 0; ci < alsList.length; ci++) {
    const c_als = alsList[ci]!; // pivot ALS C

    for (let ai = 0; ai < alsList.length; ai++) {
      if (ai === ci) continue;
      const a_als = alsList[ai]!;
      if (alsShareCells(a_als, c_als)) continue;

      // Find RCC X between A and C
      const acCommon = digitsOf(a_als.digitMask & c_als.digitMask);
      const xCandidates = acCommon.filter((d) => isRCC(grid, a_als, c_als, d));
      if (xCandidates.length === 0) continue;

      for (let bi = 0; bi < alsList.length; bi++) {
        if (bi === ci || bi === ai) continue;
        const b_als = alsList[bi]!;
        if (alsShareCells(b_als, c_als)) continue;
        if (alsShareCells(b_als, a_als)) continue;

        // Find RCC Y between B and C
        const bcCommon = digitsOf(b_als.digitMask & c_als.digitMask);
        const yCandidates = bcCommon.filter((d) => isRCC(grid, b_als, c_als, d));
        if (yCandidates.length === 0) continue;

        for (const x of xCandidates) {
          for (const y of yCandidates) {
            if (x === y) continue;

            // Find common Z in A and B (not X or Y)
            const abCommon = digitsOf(a_als.digitMask & b_als.digitMask);
            for (const z of abCommon) {
              if (z === x || z === y) continue;

              const zBit = maskOf(z);
              const aCellsZ = a_als.cells.filter((c) => grid.candidatesOf(c) & zBit);
              const bCellsZ = b_als.cells.filter((c) => grid.candidatesOf(c) & zBit);
              if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

              const elims: { cell: number; digit: number }[] = [];
              for (let cell = 0; cell < CELLS; cell++) {
                if (grid.get(cell) !== 0) continue;
                if (!(grid.candidatesOf(cell) & zBit)) continue;
                if (a_als.cells.includes(cell) || b_als.cells.includes(cell) || c_als.cells.includes(cell)) continue;

                const peers = new Set(PEERS_OF[cell]!);
                if (aCellsZ.every((ac) => peers.has(ac)) && bCellsZ.every((bc) => peers.has(bc))) {
                  elims.push({ cell, digit: z });
                }
              }

              if (elims.length === 0) continue;

              const allCells = [...a_als.cells, ...b_als.cells, ...c_als.cells];
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
                explanation: {
                  zh: `ALS-XY翼：三个 ALS 通过受限公共候选数 ${x}（A-C）和 ${y}（B-C）连接；消去能同时看到 A 和 B 中所有 ${z} 的格中的 ${z}（ALS-XY翼）。`,
                  en: `ALS-XY-Wing: three ALS linked by RCC ${x} (A-C) and ${y} (B-C); eliminate ${z} from cells seeing all ${z} in both A and B (ALS-XY-Wing).`,
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

/**
 * Death Blossom: A stem cell with candidates {d1, d2, ...} is connected to
 * multiple ALS petals, each sharing one stem digit as an RCC. The common
 * candidates across all petals can be eliminated.
 *
 * For a 2-petal version (most common):
 * Stem has candidates {X, Y}.
 * Petal_X is an ALS where X is an RCC with the stem.
 * Petal_Y is an ALS where Y is an RCC with the stem.
 * Any candidate Z in both petals can be eliminated from cells seeing all Z
 * in both petals.
 */
function tryDeathBlossom(grid: Grid, alsList: ALS[], strategyId: string): Step | null {
  // Try each empty cell as the stem
  for (let stemCell = 0; stemCell < CELLS; stemCell++) {
    if (grid.get(stemCell) !== 0) continue;
    const stemMask = grid.candidatesOf(stemCell);
    const stemDigits = digitsOf(stemMask);
    if (stemDigits.length < 2 || stemDigits.length > 4) continue;

    // Death Blossom (2-petal): stem must have EXACTLY 2 candidates
    // (Each stem digit → one petal; stem is "absorbed" by the two petals)
    if (stemDigits.length !== 2) continue;
    for (const [stemD1, stemD2] of pairs(stemDigits)) {
      // Find ALS where stemD1 is RCC with stem (stem sees all cells of ALS that have stemD1)
      // Require at least one cell in ALS has stemD1 (non-vacuous)
      const petals1 = alsList.filter((als) => {
        if (als.cells.includes(stemCell)) return false;
        if (!(als.digitMask & maskOf(stemD1))) return false;
        // Check if stem sees all d1-cells in ALS (must have at least 1)
        const d1Cells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(stemD1));
        if (d1Cells.length === 0) return false; // non-vacuous RCC
        return d1Cells.every((c) => PEERS_OF[stemCell]!.includes(c));
      });

      const petals2 = alsList.filter((als) => {
        if (als.cells.includes(stemCell)) return false;
        if (!(als.digitMask & maskOf(stemD2))) return false;
        const d2Cells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(stemD2));
        if (d2Cells.length === 0) return false; // non-vacuous RCC
        return d2Cells.every((c) => PEERS_OF[stemCell]!.includes(c));
      });

      for (const p1 of petals1) {
        for (const p2 of petals2) {
          if (alsShareCells(p1, p2)) continue;
          if (p1.cells.includes(stemCell) || p2.cells.includes(stemCell)) continue;

          // Find common Z in both petals (not stemD1 or stemD2)
          const commonZ = digitsOf(p1.digitMask & p2.digitMask).filter(
            (d) => d !== stemD1 && d !== stemD2,
          );

          for (const z of commonZ) {
            const zBit = maskOf(z);
            const p1CellsZ = p1.cells.filter((c) => grid.candidatesOf(c) & zBit);
            const p2CellsZ = p2.cells.filter((c) => grid.candidatesOf(c) & zBit);
            if (p1CellsZ.length === 0 || p2CellsZ.length === 0) continue;

            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (c === stemCell || p1.cells.includes(c) || p2.cells.includes(c)) continue;

              const peers = new Set(PEERS_OF[c]!);
              if (p1CellsZ.every((pc) => peers.has(pc)) && p2CellsZ.every((pc) => peers.has(pc))) {
                elims.push({ cell: c, digit: z });
              }
            }

            if (elims.length === 0) continue;

            const allCells = [stemCell, ...p1.cells, ...p2.cells];
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                candidates: [
                  { cell: stemCell, digit: stemD1 },
                  { cell: stemCell, digit: stemD2 },
                  ...p1.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...p2.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `死亡之花：茎格 R${ROW_OF[stemCell]! + 1}C${COL_OF[stemCell]! + 1}（候选 {${stemD1},${stemD2}}）连接两个 ALS 花瓣；消去能看到两个花瓣中所有 ${z} 的格的 ${z}（死亡之花）。`,
                en: `Death Blossom: stem R${ROW_OF[stemCell]! + 1}C${COL_OF[stemCell]! + 1} (cands {${stemD1},${stemD2}}) links two ALS petals; eliminate ${z} from cells seeing all ${z} in both petals.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/** Generate all pairs from an array. */
function* pairs<T>(arr: T[]): Generator<[T, T]> {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      yield [arr[i]!, arr[j]!];
    }
  }
}

function makeAlsStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  tieBreak: readonly TieBreakKey[],
  applyTechnique: (grid: Grid, alsList: ALS[], strategyId: string) => Step | null,
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,

    apply(grid: Grid): Step | null {
      return applyTechnique(grid, findAllALS(grid), id);
    },
  };
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export interface AHS {
  house: number;
  digits: number[];
  cells: number[];
  digitMask: number;
}

function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: AHS[] = [];
  const houseDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let size = 1; size <= maxSize; size++) {
    for (const combo of combinations(houseDigits, size)) {
      const cells = emptyCells.filter(c => {
        const m = grid.candidatesOf(c);
        return combo.some(d => (m & maskOf(d)) !== 0);
      });
      if (cells.length === size + 1) {
        result.push({
          house: houseIndex,
          digits: combo,
          cells,
          digitMask: combo.reduce((m, d) => m | maskOf(d), 0)
        });
      }
    }
  }
  return result;
}

function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const ahs of findAHSInHouse(grid, house, houseIndex, 3)) {
      const key = `${ahs.house}:${[...ahs.cells].sort((a, b) => a - b).join(',')}:${ahs.digits.sort((a,b)=>a-b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(ahs);
      }
    }
  }

  return result;
}

function tryAHSXZ(grid: Grid, ahsList: AHS[], strategyId: string): Step | null {
  for (let i = 0; i < ahsList.length; i++) {
    for (let j = i + 1; j < ahsList.length; j++) {
      const a = ahsList[i]!;
      const b = ahsList[j]!;

      if (alsShareCells(a as any, b as any)) continue;

      const commonDigits = digitsOf(a.digitMask & b.digitMask);

      for (const x of commonDigits) {
        if (!isRCC(grid, a as any, b as any, x)) continue;

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
              zh: `几乎隐藏集 AHS-XZ：AHS-A（格 ${a.cells.map((c) => cellLabel(c)).join(',')} 候选数 {${a.digits.join('')}}）与 AHS-B（格 ${b.cells.map((c) => cellLabel(c)).join(',')} 候选数 {${b.digits.join('')}}）通过受限公共候选数 ${x} 连接；消去公共可见格中的 ${z}。`,
              en: `Almost Hidden Set AHS-XZ: AHS-A (cells ${a.cells.map((c) => cellLabel(c)).join(',')} cands {${a.digits.join('')}}) and AHS-B (cells ${b.cells.map((c) => cellLabel(c)).join(',')} cands {${b.digits.join('')}}) linked by RCC ${x}; eliminate ${z} from cells seeing all ${z} in both.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function precomputeRccs(grid: Grid, alsList: ALS[]): Map<string, number[]> {
  const rccTable = new Map<string, number[]>();
  for (let i = 0; i < alsList.length; i++) {
    for (let j = 0; j < alsList.length; j++) {
      if (i === j) continue;
      const a = alsList[i]!;
      const b = alsList[j]!;
      if (alsShareCells(a, b)) continue;

      const common = digitsOf(a.digitMask & b.digitMask);
      const rccs = common.filter(d => isRCC(grid, a, b, d));
      if (rccs.length > 0) {
        rccTable.set(`${i},${j}`, rccs);
      }
    }
  }
  return rccTable;
}

function dfsAlsChain(
  grid: Grid,
  alsList: ALS[],
  current: ALS,
  path: ALS[],
  rccs: number[],
  maxLen: number,
  rccTable: Map<string, number[]>
): Step | null {
  if (path.length >= 2) {
    const first = path[0]!;
    const last = path[path.length - 1]!;

    const commonDigits = digitsOf(first.digitMask & last.digitMask);
    for (const z of commonDigits) {
      if (z === rccs[0]! || z === rccs[rccs.length - 1]!) continue;

      const zBit = maskOf(z);
      const firstZ = first.cells.filter(c => grid.candidatesOf(c) & zBit);
      const lastZ = last.cells.filter(c => grid.candidatesOf(c) & zBit);
      if (firstZ.length === 0 || lastZ.length === 0) continue;

      const elims: { cell: number; digit: number }[] = [];
      const chainCells = new Set(path.flatMap(a => a.cells));

      for (let c = 0; c < 81; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & zBit) !== 0 && !chainCells.has(c)) {
          const seesAllFirst = firstZ.every(fc => PEERS_OF[c]!.includes(fc));
          const seesAllLast = lastZ.every(lc => PEERS_OF[c]!.includes(lc));
          if (seesAllFirst && seesAllLast) {
            elims.push({ cell: c, digit: z });
          }
        }
      }

      if (elims.length > 0) {
        const allCells = path.flatMap(a => a.cells);
        return {
          strategyId: 'als-chain',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...new Set([...allCells, ...elims.map(e => e.cell)])],
            candidates: [
              ...path.flatMap(a => a.cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })))),
              ...elims
            ],
            links: []
          },
          explanation: {
            zh: `ALS 链：长度为 ${path.length} 的 ALS 链（包含格 ${path.map(a => a.cells.map(c => cellLabel(c)).join(',')).join(' | ')}），通过受限公共候选数 [${rccs.join(',')}] 相连；两端均含 ${z}，消去其公共可见格中的 ${z}。`,
            en: `ALS Chain: ALS Chain of length ${path.length} (cells ${path.map(a => a.cells.map(c => cellLabel(c)).join(',')).join(' | ')}), connected by RCCs [${rccs.join(',')}]; eliminate ${z} from cells seeing all ${z} in both endpoints.`
          }
        };
      }
    }
  }

  if (path.length >= maxLen) return null;

  const currentIdx = alsList.indexOf(current);
  for (let nextIdx = 0; nextIdx < alsList.length; nextIdx++) {
    const next = alsList[nextIdx]!;
    if (path.includes(next)) continue;
    if (alsShareCells(current, next)) continue;

    const pairKey = `${currentIdx},${nextIdx}`;
    const rccList = rccTable.get(pairKey) || [];
    for (const rcc of rccList) {
      if (rccs.length > 0 && rcc === rccs[rccs.length - 1]!) continue;

      rccs.push(rcc);
      path.push(next);
      const res = dfsAlsChain(grid, alsList, next, path, rccs, maxLen, rccTable);
      if (res) return res;
      path.pop();
      rccs.pop();
    }
  }

  return null;
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS 链', en: 'ALS Chain' },
  difficulty: 880,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid);
    const rccTable = precomputeRccs(grid, alsList);
    for (const start of alsList) {
      const res = dfsAlsChain(grid, alsList, start, [start], [], 6, rccTable);
      if (res) return res;
    }
    return null;
  }
};

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid);
    return tryAHSXZ(grid, ahsList, this.id);
  }
};

export const alsXz = makeAlsStrategy(
  'als-xz',
  { zh: 'ALS-XZ', en: 'ALS-XZ' },
  810,
  ['house'],
  tryALSXZ,
);

export const alsXzDoublyLinked = makeAlsStrategy(
  'als-xz-doubly-linked',
  { zh: '双链 ALS-XZ', en: 'Doubly-linked ALS-XZ' },
  820,
  ['house'],
  tryALSDoublyLinkedXZ,
);

export const alsXyWing: Strategy = {
  id: 'als-xy-wing',
  name: { zh: 'ALS-XY翼', en: 'ALS-XY-Wing' },
  difficulty: 840,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid);
    const rccTable = precomputeRccs(grid, alsList);
    for (const start of alsList) {
      const res = dfsAlsChain(grid, alsList, start, [start], [], 3, rccTable);
      if (res) {
        res.strategyId = this.id;
        return res;
      }
    }
    return null;
  }
};

export const deathBlossom = makeAlsStrategy(
  'death-blossom',
  { zh: '死亡之花', en: 'Death Blossom' },
  860,
  ['cell-index'],
  tryDeathBlossom,
);
