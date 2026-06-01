import { SIZE, ROW_OF, COL_OF, ROWS, COLS, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      const rowCandidates: number[][] = Array.from({ length: SIZE }, () => []);
      const colCandidates: number[][] = Array.from({ length: SIZE }, () => []);

      for (let r = 0; r < SIZE; r++) {
        for (const c of ROWS[r]!) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
            rowCandidates[r]!.push(COL_OF[c]!);
          }
        }
      }
      for (let c = 0; c < SIZE; c++) {
        for (const cell of COLS[c]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) {
            colCandidates[c]!.push(ROW_OF[cell]!);
          }
        }
      }

      for (let size = 2; size <= 4; size++) {
        const rowResult = findFish(d, size, rowCandidates, true, grid);
        if (rowResult) return rowResult;
        const colResult = findFish(d, size, colCandidates, false, grid);
        if (colResult) return colResult;
      }
    }
    return null;
  },
};

function combinations(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: number[][] = [];
  const first = arr[0]!;
  for (const rest of combinations(arr.slice(1), k - 1)) {
    result.push([first, ...rest]);
  }
  result.push(...combinations(arr.slice(1), k));
  return result;
}

function findFish(
  digit: number,
  size: number,
  houseCandidates: number[][],
  rowsAsBase: boolean,
  grid: Grid,
): Step | null {
  const housesWithRightCount: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (houseCandidates[i]!.length >= 2 && houseCandidates[i]!.length <= size) {
      housesWithRightCount.push(i);
    }
  }

  if (housesWithRightCount.length < size) return null;

  const baseCombos = combinations(housesWithRightCount, size);
  for (const base of baseCombos) {
    const coverSet = new Set<number>();
    let valid = true;
    for (const h of base) {
      for (const cv of houseCandidates[h]!) {
        coverSet.add(cv);
      }
      if (coverSet.size > size) {
        valid = false;
        break;
      }
    }
    if (!valid || coverSet.size !== size) continue;

    const cover = [...coverSet].sort((a, b) => a - b);

    const elims: { cell: number; digit: number }[] = [];
    const baseCells: number[] = [];
    for (const bIdx of base) {
      if (rowsAsBase) {
        for (const c of ROWS[bIdx]!) {
          if (grid.hasCandidate(c, digit)) {
            baseCells.push(c);
            if (!cover.includes(COL_OF[c]!)) {
              elims.push({ cell: c, digit });
            }
          }
        }
      } else {
        for (const c of COLS[bIdx]!) {
          if (grid.hasCandidate(c, digit)) {
            baseCells.push(c);
            if (!cover.includes(ROW_OF[c]!)) {
              elims.push({ cell: c, digit });
            }
          }
        }
      }
    }

    const realElims = elims.filter((e) => !baseCells.includes(e.cell));
    if (realElims.length === 0) continue;

    const names = FISH_NAMES[size]!;
    const baseStr = base.map((h) => (rowsAsBase ? `R${h + 1}` : `C${h + 1}`)).join(', ');
    const coverStr = cover.map((h) => (rowsAsBase ? `C${h + 1}` : `R${h + 1}`)).join(', ');
    return {
      strategyId: 'basic-fish',
      placements: [],
      eliminations: realElims,
      highlights: { cells: baseCells, candidates: baseCells.map((c) => ({ cell: c, digit })), links: [] },
      explanation: {
        zh: `${names.zh}：${digit} 在基础行/列 {${baseStr}} 中的候选全部被覆盖行/列 {${coverStr}} 覆盖，排除覆盖行/列中非基础交集处的 ${digit}。`,
        en: `${names.en}: Digit ${digit} in base {${baseStr}} is covered by {${coverStr}}, eliminate ${digit} from cover cells outside base intersections.`,
      },
    };
  }
  return null;
}