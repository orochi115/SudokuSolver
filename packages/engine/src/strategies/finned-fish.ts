/** Finned / Sashimi Fish — finned X-Wing, Swordfish, Jellyfish. */

import { ROWS, COLS, ROW_OF, COL_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '带鳍X翼', en: 'Finned X-Wing' },
  3: { zh: '带鳍剑鱼', en: 'Finned Swordfish' },
  4: { zh: '带鳍水母', en: 'Finned Jellyfish' },
};

function* combine(values: number[], size: number): Generator<number[]> {
  if (values.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => values[i]!);
    let i = size - 1;
    while (i >= 0 && idx[i]! === values.length - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function seesAll(cell: number, fins: readonly number[]): boolean {
  return fins.every((fin) => PEERS_OF[cell]!.includes(fin));
}

function candidateCells(grid: Grid, house: readonly number[], digit: number): number[] {
  const bit = maskOf(digit);
  return house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
}

function tryFinnedFish(
  grid: Grid,
  digit: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
  size: 2 | 3 | 4,
  strategyId: string,
): Step | null {
  const bit = maskOf(digit);
  const baseCandidates = baseHouses.map((house) => candidateCells(grid, house, digit));
  const eligibleBases = baseCandidates
    .map((cells, index) => (cells.length > 0 && cells.length <= size + 2 ? index : -1))
    .filter((index) => index >= 0);
  const allCovers = Array.from({ length: 9 }, (_, i) => i);

  for (const baseIndices of combine(eligibleBases, size)) {
    const baseSet = new Set(baseIndices);
    for (const coverIndices of combine(allCovers, size)) {
      const coverSet = new Set(coverIndices);
      const fishCells: number[] = [];
      const fins: number[] = [];
      let valid = true;

      for (const baseIndex of baseIndices) {
        const cells = baseCandidates[baseIndex]!;
        if (cells.length === 0) {
          valid = false;
          break;
        }
        for (const cell of cells) {
          const coverIndex = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          if (coverSet.has(coverIndex)) fishCells.push(cell);
          else fins.push(cell);
        }
      }

      if (!valid || fins.length === 0 || fishCells.length === 0) continue;
      const finBox = Math.floor(ROW_OF[fins[0]!]! / 3) * 3 + Math.floor(COL_OF[fins[0]!]! / 3);
      if (fins.some((cell) => Math.floor(ROW_OF[cell]! / 3) * 3 + Math.floor(COL_OF[cell]! / 3) !== finBox)) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const coverIndex of coverIndices) {
        for (const cell of coverHouses[coverIndex]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const baseIndex = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(baseIndex)) continue;
          if (seesAll(cell, fins)) eliminations.push({ cell, digit });
        }
      }
      if (eliminations.length === 0) continue;

      const names = NAMES[size]!;
      const baseLabel = baseAxis === 'row' ? '行' : '列';
      const baseLabelEn = baseAxis === 'row' ? 'rows' : 'columns';
      const coverLabel = baseAxis === 'row' ? '列' : '行';
      const coverLabelEn = baseAxis === 'row' ? 'columns' : 'rows';
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...fishCells, ...fins, ...eliminations.map((e) => e.cell)])],
          candidates: [
            ...fishCells.map((cell) => ({ cell, digit })),
            ...fins.map((cell) => ({ cell, digit })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `数字 ${digit} 在 ${baseIndices.map((i) => i + 1).join(',')} ${baseLabel}形成${names.zh}，鳍格 ${fins.map(cellLabel).join(',')} 限制消除范围；只能从看见全部鳍格的覆盖${coverLabel}候选中消去 ${digit}。`,
          en: `Digit ${digit} forms a ${names.en} in ${baseLabelEn} ${baseIndices.map((i) => i + 1).join(',')}; fins ${fins.map(cellLabel).join(',')} restrict eliminations to cover ${coverLabelEn} cells that see every fin.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFish(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: NAMES[size]!,
    difficulty,
    tieBreak: ['digit', 'house'],
    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        const rowStep = tryFinnedFish(grid, digit, ROWS, COLS, 'row', size, id);
        if (rowStep) return rowStep;
        const colStep = tryFinnedFish(grid, digit, COLS, ROWS, 'col', size, id);
        if (colStep) return colStep;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFish(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFish(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFish(4, 'finned-jellyfish', 495);
