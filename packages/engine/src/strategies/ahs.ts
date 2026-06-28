import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { findAllALS, isRCC, alsShareCells, type ALS } from './als.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface AHS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: AHS[] = [];
  if (emptyCells.length < 3) return result;

  for (let size = 1; size <= Math.min(4, emptyCells.length - 2); size++) {
    const digitCandidates = digitsOf(emptyCells.reduce((m, c) => m | grid.candidatesOf(c), 0));
    if (digitCandidates.length < size + 1) continue;

    for (const combo of combinations2(digitCandidates, size)) {
      const appearCells = house.filter((c) => {
        if (grid.get(c) !== 0) return false;
        return combo.some((d) => grid.hasCandidate(c, d));
      });
      if (appearCells.length === size + 1) {
        const mask = combo.reduce((m, d) => m | maskOf(d), 0);
        result.push({
          house: houseIndex,
          cells: appearCells,
          digits: combo,
          digitMask: mask,
        });
      }
    }
  }
  return result;
}

function* combinations2<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations2(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations2(rest, k);
}

function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();
  for (let hi = 0; hi < HOUSES.length; hi++) {
    for (const ahs of findAHSInHouse(grid, HOUSES[hi]!, hi)) {
      const key = `${ahs.house}:${[...ahs.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
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

function isAHSRCC(grid: Grid, a: AHS, b: AHS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit)) return false;
  if (!(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc) continue;
      if (!PEERS_OF[ac]!.includes(bc)) continue;
      return true;
    }
  }
  return false;
}

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid);
    if (ahsList.length < 2) return null;

    for (let ai = 0; ai < ahsList.length; ai++) {
      for (let bi = ai + 1; bi < ahsList.length; bi++) {
        const a = ahsList[ai]!;
        const b = ahsList[bi]!;
        if (ahsShareCells(a, b)) continue;

        const common = digitsOf(a.digitMask & b.digitMask);
        for (const x of common) {
          if (!isAHSRCC(grid, a, b, x)) continue;

          for (const z of common) {
            if (z === x) continue;
            const zBit = maskOf(z);
            const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
            const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
            if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

            const eliminations: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (a.cells.includes(c) || b.cells.includes(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (aCellsZ.every((ac) => peers.has(ac)) && bCellsZ.every((bc) => peers.has(bc))) {
                eliminations.push({ cell: c, digit: z });
              }
            }

            if (eliminations.length > 0) {
              const allCells = [...a.cells, ...b.cells, ...eliminations.map((e) => e.cell)];
              return {
                strategyId: 'ahs',
                placements: [],
                eliminations,
                highlights: {
                  cells: [...new Set(allCells)],
                  candidates: [
                    ...a.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...b.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...eliminations,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `AHS-XZ：两个几乎隐藏集通过受限公共候选数 ${x} 连接；消去共同候选 ${z}。`,
                  en: `AHS-XZ: two Almost Hidden Sets linked by RCC ${x}; eliminate common candidate ${z}.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};