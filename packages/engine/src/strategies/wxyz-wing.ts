import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function isRestricted(cells: number[], digit: number, grid: Grid): boolean {
  const bit = 1 << (digit - 1);
  const withDigit = cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
  if (withDigit.length <= 1) return true;
  for (let i = 0; i < withDigit.length; i++) {
    for (let j = i + 1; j < withDigit.length; j++) {
      if (!PEERS_OF[withDigit[i]!]!.includes(withDigit[j]!)) return false;
    }
  }
  return true;
}

function tryWingOfSize(grid: Grid, n: number, strategyId: string, nameZh: string, nameEn: string): Step | null {
  for (let houseIdx = 0; houseIdx < HOUSES.length; houseIdx++) {
    const house = HOUSES[houseIdx]!;
    const emptyCells = house.filter((c) => grid.get(c) === 0 && popcount(grid.candidatesOf(c)) >= 2);
    if (emptyCells.length < n) continue;

    for (const combo of combinations(emptyCells, n)) {
      let unionMask = 0;
      for (const c of combo) unionMask |= grid.candidatesOf(c);
      if (popcount(unionMask) !== n) continue;

      const unionDigits = digitsOf(unionMask);
      const nonRestricted = unionDigits.filter((d) => !isRestricted(combo, d, grid));
      if (nonRestricted.length !== 1) continue;

      const z = nonRestricted[0]!;
      const zBit = 1 << (z - 1);
      const zCells = combo.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);
      if (zCells.length < 2) continue;

      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        if (!(grid.candidatesOf(c) & zBit)) continue;
        if (combo.includes(c)) continue;
        const peers = new Set(PEERS_OF[c]!);
        if (zCells.every((zc) => peers.has(zc))) {
          elims.push({ cell: c, digit: z });
        }
      }

      if (elims.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...combo, ...elims.map((e) => e.cell)],
          candidates: [
            ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `${nameZh}：${n}个格（${combo.map(cellLabel).join(',')}）共含${n}个候选数{${unionDigits.join(',')}}，其中${z}为非受限候选数；消去能看到所有${z}的格中的${z}。`,
          en: `${nameEn}: ${n} cells (${combo.map(cellLabel).join(',')}) hold ${n} digits {${unionDigits.join(',')}}; ${z} is the non-restricted digit; eliminate ${z} from cells seeing all ${z} occurrences.`,
        },
      };
    }
  }

  const boxLineCells: number[][] = [];
  for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
    const box = BOXES[boxIdx]!;
    for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
      const row = ROWS[rowIdx]!;
      const intersection = box.filter((c) => row.includes(c));
      if (intersection.length === 3) {
        const boxOnly = box.filter((c) => !intersection.includes(c));
        const rowOnly = row.filter((c) => !intersection.includes(c));
        boxLineCells.push([...intersection, ...boxOnly.slice(0, 3), ...rowOnly.slice(0, 3)]);
      }
    }
    for (let colIdx = 0; colIdx < 9; colIdx++) {
      const col = COLS[colIdx]!;
      const intersection = box.filter((c) => col.includes(c));
      if (intersection.length === 3) {
        const boxOnly = box.filter((c) => !intersection.includes(c));
        const colOnly = col.filter((c) => !intersection.includes(c));
        boxLineCells.push([...intersection, ...boxOnly.slice(0, 3), ...colOnly.slice(0, 3)]);
      }
    }
  }

  for (const region of boxLineCells) {
    const emptyCells = region.filter((c) => grid.get(c) === 0 && popcount(grid.candidatesOf(c)) >= 2);
    if (emptyCells.length < n) continue;

    for (const combo of combinations(emptyCells, n)) {
      let unionMask = 0;
      for (const c of combo) unionMask |= grid.candidatesOf(c);
      if (popcount(unionMask) !== n) continue;

      const houses = new Set<number>();
      for (const c of combo) {
        houses.add(ROW_OF[c]!);
        houses.add(9 + COL_OF[c]!);
        houses.add(18 + BOX_OF[c]!);
      }
      if (houses.size > 4) continue;

      const unionDigits = digitsOf(unionMask);
      const nonRestricted = unionDigits.filter((d) => !isRestricted(combo, d, grid));
      if (nonRestricted.length !== 1) continue;

      const z = nonRestricted[0]!;
      const zBit = 1 << (z - 1);
      const zCells = combo.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);
      if (zCells.length < 2) continue;

      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        if (!(grid.candidatesOf(c) & zBit)) continue;
        if (combo.includes(c)) continue;
        const peers = new Set(PEERS_OF[c]!);
        if (zCells.every((zc) => peers.has(zc))) {
          elims.push({ cell: c, digit: z });
        }
      }

      if (elims.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...combo, ...elims.map((e) => e.cell)],
          candidates: [
            ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `${nameZh}：${n}个格（${combo.map(cellLabel).join(',')}）共含${n}个候选数{${unionDigits.join(',')}}，其中${z}为非受限候选数；消去能看到所有${z}的格中的${z}。`,
          en: `${nameEn}: ${n} cells (${combo.map(cellLabel).join(',')}) hold ${n} digits {${unionDigits.join(',')}}; ${z} is the non-restricted digit; eliminate ${z} from cells seeing all ${z} occurrences.`,
        },
      };
    }
  }

  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryWingOfSize(grid, 4, 'wxyz-wing', 'WXYZ翼', 'WXYZ-Wing');
  },
};

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryWingOfSize(grid, 5, 'vwxyz-wing', 'VWXYZ翼', 'VWXYZ-Wing');
  },
};
