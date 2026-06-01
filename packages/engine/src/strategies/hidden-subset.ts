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

function applyHiddenSubset(grid: Grid, size: number, id: string): Step | null {
  for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
    const house = HOUSES[hIdx]!;
    const emptyCells = house.filter((cell) => grid.get(cell) === 0);
    if (emptyCells.length <= size) continue;

    // Get all digits that are not yet solved in this house and actually have candidates
    const solvedDigits = new Set(house.map((c) => grid.get(c)).filter((d) => d !== 0));
    const activeDigits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (!solvedDigits.has(d) && house.some((c) => grid.hasCandidate(c, d))) {
        activeDigits.push(d);
      }
    }

    if (activeDigits.length <= size) continue;

    const combos = getCombinations(activeDigits, size);
    for (const combo of combos) {
      // Find cells in this house that have at least one of the combo digits as a candidate
      const containingCells = emptyCells.filter((cell) =>
        combo.some((digit) => grid.hasCandidate(cell, digit))
      );

      if (containingCells.length === size) {
        // We found a Hidden Subset!
        // Now, check for eliminations: candidates in containingCells that are NOT in combo
        const eliminations: { cell: number; digit: number }[] = [];
        for (const cell of containingCells) {
          for (let d = 1; d <= 9; d++) {
            if (!combo.includes(d) && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
        }

        if (eliminations.length > 0) {
          const subsetCandidates: { cell: number; digit: number }[] = [];
          for (const cell of containingCells) {
            for (const d of combo) {
              if (grid.hasCandidate(cell, d)) {
                subsetCandidates.push({ cell, digit: d });
              }
            }
          }

          const cellNames = containingCells.map((cell) => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join(', ');

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

          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: containingCells,
              candidates: [...subsetCandidates, ...eliminations],
              links: [],
            },
            explanation: {
              zh: `在${houseDescZh}中，候选数 [${combo.join('')}] 仅出现在单元格 ${cellNames} 中，构成隐性${subsetNameZh}，因此可以排除这些单元格中的其他候选数。`,
              en: `In ${houseDescEn}, candidates [${combo.join(', ')}] only appear in cells ${cellNames}, forming a Hidden ${subsetNameEn}, so we can eliminate other candidates from these cells.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const hiddenPair: Strategy = {
  id: 'hidden-pair',
  name: { zh: '隐性数对', en: 'Hidden Pair' },
  difficulty: 31,
  apply(grid: Grid) {
    return applyHiddenSubset(grid, 2, this.id);
  },
};

export const hiddenTriple: Strategy = {
  id: 'hidden-triple',
  name: { zh: '隐性三数组', en: 'Hidden Triple' },
  difficulty: 33,
  apply(grid: Grid) {
    return applyHiddenSubset(grid, 3, this.id);
  },
};

export const hiddenQuad: Strategy = {
  id: 'hidden-quad',
  name: { zh: '隐性四数组', en: 'Hidden Quad' },
  difficulty: 35,
  apply(grid: Grid) {
    return applyHiddenSubset(grid, 4, this.id);
  },
};
