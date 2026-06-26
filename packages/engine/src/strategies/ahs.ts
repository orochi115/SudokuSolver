/**
 * AHS — Almost Hidden Set (P1)
 *
 * Hidden-set dual of ALS: N digits confined to N+1 cells of a single house.
 * Implements AHS-XZ: two AHSs share a restricted common digit x (true in at
 * least one) and another common digit z, allowing eliminations.
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface AHS {
  house: number;
  digits: number[];
  cells: number[];
  digitMask: number;
  cellMask: number;
}

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}

function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxN = 4): AHS[] {
  const unsolved = house.filter((c) => grid.get(c) === 0);
  if (unsolved.length < 2) return [];
  const result: AHS[] = [];
  const presentDigits = Array.from(new Set(unsolved.flatMap((c) => digitsOf(grid.candidatesOf(c))))).sort((a, b) => a - b);
  for (let n = 1; n <= Math.min(maxN, presentDigits.length - 1); n++) {
    for (const digitCombo of combinations(presentDigits, n)) {
      const dMask = digitCombo.reduce((m, d) => m | maskOf(d), 0);
      const cells: number[] = [];
      for (const c of unsolved) {
        if ((grid.candidatesOf(c) & dMask) !== 0) cells.push(c);
      }
      if (cells.length === n + 1) {
        result.push({ house: houseIndex, digits: digitCombo, cells, digitMask: dMask, cellMask: cells.reduce((m, c) => m | (1 << c), 0) });
      }
    }
  }
  return result;
}

function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seen = new Set<string>();
  for (let hi = 0; hi < HOUSES.length; hi++) {
    for (const ahs of findAHSInHouse(grid, HOUSES[hi]!, hi)) {
      const key = `${hi}:${ahs.digits.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(ahs);
      }
    }
  }
  return result;
}

function ahsShareCells(a: AHS, b: AHS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

/** Restricted common for AHS: digit x must be true in at least one AHS. */
function ahsRestrictedCommon(grid: Grid, a: AHS, b: AHS, x: number): boolean {
  const bit = maskOf(x);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  // x must be absent from all cells outside both AHS that see all x-cells of both? Simplified:
  // x is restricted if there is no place for x outside the union that would satisfy both being false.
  // A practical check: all x-candidates in the shared houses are confined to the union.
  const houses = new Set([a.house, b.house]);
  for (const hi of houses) {
    const house = HOUSES[hi]!;
    for (const c of house) {
      if (grid.get(c) !== 0) continue;
      if (!(grid.candidatesOf(c) & bit)) continue;
      if (a.cells.includes(c) || b.cells.includes(c)) continue;
      return false;
    }
  }
  return true;
}

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid).sort((a, b) => a.cells[0]! - b.cells[0]!);
    if (ahsList.length < 2) return null;

    for (let i = 0; i < ahsList.length; i++) {
      for (let j = i + 1; j < ahsList.length; j++) {
        const a = ahsList[i]!;
        const b = ahsList[j]!;
        if (ahsShareCells(a, b)) continue;
        const commonDigits = a.digits.filter((d) => b.digits.includes(d));
        for (let r = 0; r < commonDigits.length; r++) {
          const x = commonDigits[r]!;
          if (!ahsRestrictedCommon(grid, a, b, x)) continue;
          for (let zIdx = 0; zIdx < commonDigits.length; zIdx++) {
            const z = commonDigits[zIdx]!;
            if (z === x) continue;
            // Eliminate z from cells that see all z-cells of both AHSs.
            const zBit = maskOf(z);
            const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
            const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
            if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;
            const elims: { cell: number; digit: number }[] = [];
            for (const c of a.cells) {
              if (b.cells.includes(c)) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (aCellsZ.every((ac) => ac === c || peers.has(ac)) && bCellsZ.every((bc) => bc === c || peers.has(bc))) {
                elims.push({ cell: c, digit: z });
              }
            }
            for (const c of b.cells) {
              if (a.cells.includes(c)) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (aCellsZ.every((ac) => ac === c || peers.has(ac)) && bCellsZ.every((bc) => bc === c || peers.has(bc))) {
                elims.push({ cell: c, digit: z });
              }
            }
            if (elims.length === 0) continue;
            const allCells = [...new Set([...a.cells, ...b.cells])];
            return {
              strategyId: this.id,
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
                zh: `AHS-XZ：两个 AHS 通过受限公共候选数 ${x} 连接；消去能在 link cells 看到所有 ${z} 的候选。`,
                en: `AHS-XZ: two AHS linked by restricted common ${x}; eliminate ${z} from cells seeing all ${z} across the link cells.`,
                
              },
            };
          }
        }
      }
    }
    return null;
  },
};
