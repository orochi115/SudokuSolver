import { ROW_OF, COL_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function applyNakedSubset(grid: Grid, size: number, id: string): Step | null {
  for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
    const house = HOUSES[hIdx]!;
    const emptyCells = house.filter((cell) => grid.get(cell) === 0);
    if (emptyCells.length <= size) continue;

    const combos = getCombinations(emptyCells, size);
    for (const combo of combos) {
      let unionMask = 0;
      for (const cell of combo) {
        unionMask |= grid.candidatesOf(cell);
      }

      if (popcount(unionMask) === size) {
        const digits = digitsOf(unionMask);
        const otherCells = house.filter((cell) => !combo.includes(cell) && grid.get(cell) === 0);
        const eliminations: { cell: number; digit: number }[] = [];

        for (const cell of otherCells) {
          for (const digit of digits) {
            if (grid.hasCandidate(cell, digit)) {
              eliminations.push({ cell, digit });
            }
          }
        }

        if (eliminations.length > 0) {
          const subsetCandidates: { cell: number; digit: number }[] = [];
          for (const cell of combo) {
            for (const d of digits) {
              if (grid.hasCandidate(cell, d)) {
                subsetCandidates.push({ cell, digit: d });
              }
            }
          }

          const cellNames = combo.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join(', ');
          
          let houseDescZh = '';
          let houseDescEn = '';
          if (hIdx < 9) {
            houseDescZh = `第 ${hIdx + 1} 行`;
            houseDescEn = `Row ${hIdx + 1}`;
          } else if (hIdx < 18) {
            houseDescZh = `第 ${hIdx - 9 + 1} 列`;
            houseDescEn = `Column ${hIdx - 9 + 1}`;
          } else {
            houseDescZh = `第 ${hIdx - 18 + 1} 宫`;
            houseDescEn = `Box ${hIdx - 18 + 1}`;
          }

          const subsetNameZh = size === 2 ? '数对' : size === 3 ? '三数组' : '四数组';
          const subsetNameEn = size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad';
          const houseTypeZh = hIdx < 9 ? '行' : hIdx < 18 ? '列' : '宫';
          const houseTypeEn = hIdx < 9 ? 'row' : hIdx < 18 ? 'column' : 'box';

          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: combo,
              candidates: [...subsetCandidates, ...eliminations],
              links: [],
            },
            explanation: {
              zh: `在${houseDescZh}中，单元格 ${cellNames} 仅包含候选数 [${digits.join('')}]，构成显性${subsetNameZh}，因此可以从该${houseTypeZh}的其他单元格中排除这些候选数。`,
              en: `In ${houseDescEn}, cells ${cellNames} contain only candidate digits [${digits.join(', ')}], forming a Naked ${subsetNameEn}, so we can eliminate these candidates from other cells in the ${houseTypeEn}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const nakedPair: Strategy = {
  id: 'naked-pair',
  name: { zh: '显性数对', en: 'Naked Pair' },
  difficulty: 30,
  apply(grid: Grid) {
    return applyNakedSubset(grid, 2, this.id);
  },
};

export const nakedTriple: Strategy = {
  id: 'naked-triple',
  name: { zh: '显性三数组', en: 'Naked Triple' },
  difficulty: 32,
  apply(grid: Grid) {
    return applyNakedSubset(grid, 3, this.id);
  },
};

export const nakedQuad: Strategy = {
  id: 'naked-quad',
  name: { zh: '显性四数组', en: 'Naked Quad' },
  difficulty: 34,
  apply(grid: Grid) {
    return applyNakedSubset(grid, 4, this.id);
  },
};
