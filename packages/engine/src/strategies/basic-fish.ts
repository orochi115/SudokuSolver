import { ROWS, COLS, ROW_OF, COL_OF, maskOf, digitsOf, popcount, PEERS_OF, HOUSES, BOXES, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES_ZH: Record<number, string> = { 2: 'X翼', 3: '剑鱼', 4: '水母' };
const FISH_NAMES_EN: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' };

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      for (const size of [2, 3, 4]) {
        const rowStep = findFish(grid, d, bit, size, ROWS, 'row');
        if (rowStep) return rowStep;
        const colStep = findFish(grid, d, bit, size, COLS, 'col');
        if (colStep) return colStep;
      }
    }
    return null;
  },
};

function findFish(
  grid: Grid,
  d: number,
  bit: number,
  size: number,
  baseHouses: readonly (readonly number[])[],
  baseType: 'row' | 'col',
): Step | null {
  const coverHouses = baseType === 'row' ? COLS : ROWS;

  const eligible: number[] = [];
  for (let i = 0; i < 9; i++) {
    const locs: number[] = [];
    for (const c of baseHouses[i]!) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) locs.push(c);
    }
    if (locs.length >= 2 && locs.length <= size) eligible.push(i);
  }
  if (eligible.length < size) return null;

  const combos = combinations(eligible, size);
  for (const combo of combos) {
    const coverSet = new Set<number>();
    const baseCells: number[] = [];
    for (const bi of combo) {
      for (const c of baseHouses[bi]!) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          baseCells.push(c);
          const coverIdx = baseType === 'row' ? COL_OF[c]! : ROW_OF[c]!;
          coverSet.add(coverIdx);
        }
      }
    }
    if (coverSet.size !== size) continue;

    const eliminations: { cell: number; digit: number }[] = [];
    for (const ci of coverSet) {
      for (const c of coverHouses[ci]!) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          const baseIdx = baseType === 'row' ? ROW_OF[c]! : COL_OF[c]!;
          if (!combo.includes(baseIdx)) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }
    }
    if (eliminations.length === 0) continue;

    const fishName = FISH_NAMES_ZH[size]!;
    const fishNameEn = FISH_NAMES_EN[size]!;
    const baseLabel = baseType === 'row' ? '行' : '列';
    const baseLabelEn = baseType === 'row' ? 'rows' : 'columns';
    const baseIdxsStr = combo.map(bi => bi + 1).join(',');
    const coverIdxsStr = [...coverSet].map(ci => ci + 1).join(',');

    return {
      strategyId: 'basic-fish',
      placements: [],
      eliminations,
      highlights: {
        cells: [...baseCells, ...eliminations.map(e => e.cell)],
        candidates: [
          ...baseCells.map(c => ({ cell: c, digit: d })),
          ...eliminations.map(e => ({ cell: e.cell, digit: d })),
        ],
        links: [],
      },
      explanation: {
        zh: `数字 ${d} 在${baseLabel} ${baseIdxsStr} 中形成${fishName}，覆盖${baseLabel}外的候选 ${d} 可被排除。`,
        en: `Digit ${d} forms a ${fishNameEn} in ${baseLabelEn} ${baseIdxsStr}/${baseLabelEn === 'rows' ? 'columns' : 'rows'} ${coverIdxsStr}, eliminating ${d} from cells outside the base ${baseLabelEn} in the cover houses.`,
      },
    };
  }
  return null;
}

function combinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  if (k === 0) { result.push([]); return result; }
  if (arr.length < k) return result;
  function backtrack(start: number, current: number[]): void {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}