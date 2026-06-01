import type { Strategy } from '../strategy.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import {
  COLS,
  DIGITS,
  ROWS,
  combinations,
  houseName,
  uniqueCells,
} from './_utils.js';

interface FishResult {
  digit: number;
  baseType: 'row' | 'col';
  baseIndices: number[];
  coverIndices: number[];
  fishCells: number[];
  eliminations: { cell: number; digit: number }[];
}

function lineCells(type: 'row' | 'col', index: number): readonly number[] {
  return type === 'row' ? ROWS[index]! : COLS[index]!;
}

function findBasicFish(grid: Grid, size: number): FishResult | null {
  for (const digit of DIGITS) {
    for (const baseType of ['row', 'col'] as const) {
      const coverType = baseType === 'row' ? 'col' : 'row';
      const baseIndexes = Array.from({ length: 9 }, (_, i) => i);

      for (const baseSet of combinations(baseIndexes, size)) {
        let fishCells: number[] = [];
        const coverSet = new Set<number>();
        let valid = true;

        for (const baseIndex of baseSet) {
          const cells = lineCells(baseType, baseIndex).filter((cell) => grid.hasCandidate(cell, digit));
          if (cells.length < 2 || cells.length > size) {
            valid = false;
            break;
          }
          fishCells = fishCells.concat(cells);
          for (const cell of cells) {
            coverSet.add(coverType === 'col' ? cell % 9 : Math.floor(cell / 9));
          }
        }
        if (!valid || coverSet.size !== size) continue;

        const coverIndices = [...coverSet].sort((a, b) => a - b);
        const baseIndexSet = new Set(baseSet);
        const eliminations: { cell: number; digit: number }[] = [];

        for (const coverIndex of coverIndices) {
          for (const cell of lineCells(coverType, coverIndex)) {
            const baseIdx = baseType === 'row' ? Math.floor(cell / 9) : cell % 9;
            if (baseIndexSet.has(baseIdx)) continue;
            if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
          }
        }

        if (eliminations.length > 0) {
          return {
            digit,
            baseType,
            baseIndices: [...baseSet],
            coverIndices,
            fishCells: uniqueCells(fishCells),
            eliminations,
          };
        }
      }
    }
  }
  return null;
}

function createFishStrategy(
  id: string,
  zh: string,
  en: string,
  difficulty: number,
  size: number,
): Strategy {
  return {
    id,
    name: { zh, en },
    difficulty,
    apply(grid: Grid): Step | null {
      const hit = findBasicFish(grid, size);
      if (!hit) return null;

      const baseLabel = hit.baseIndices.map((i) => houseName(hit.baseType, i)).join(', ');
      const coverLabel = hit.coverIndices
        .map((i) => houseName(hit.baseType === 'row' ? 'col' : 'row', i))
        .join(', ');
      return {
        strategyId: this.id,
        placements: [],
        eliminations: hit.eliminations,
        highlights: {
          cells: uniqueCells([...hit.fishCells, ...hit.eliminations.map((e) => e.cell)]),
          candidates: [
            ...hit.fishCells.map((cell) => ({ cell, digit: hit.digit })),
            ...hit.eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${zh}: 数字 ${hit.digit} 在基集合 ${baseLabel} 与覆盖集合 ${coverLabel} 形成 base/cover 结构，因此可删除覆盖线上的其余候选。`,
          en: `${en}: digit ${hit.digit} forms a base/cover pattern with base ${baseLabel} and cover ${coverLabel}, so eliminate ${hit.digit} from other cells in the cover lines.`,
        },
      };
    },
  };
}

export const xWing = createFishStrategy('x-wing', 'X翼', 'X-Wing', 40, 2);
export const swordfish = createFishStrategy('swordfish', '剑鱼', 'Swordfish', 45, 3);
export const jellyfish = createFishStrategy('jellyfish', '水母', 'Jellyfish', 50, 4);
