import { HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
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

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30, // Suggested cost band: 30 subsets

  apply(grid: Grid): Step | null {
    for (let size = 2; size <= 4; size++) {
      for (let houseIdx = 0; houseIdx < HOUSES.length; houseIdx++) {
        const house = HOUSES[houseIdx]!;
        const emptyCells: number[] = [];
        for (const cell of house) {
          if (grid.get(cell) === 0) {
            emptyCells.push(cell);
          }
        }

        if (emptyCells.length <= size || emptyCells.length > 8) {
          continue;
        }

        const combinations = getCombinations(emptyCells, size);
        for (const comb of combinations) {
          let unionMask = 0;
          for (const cell of comb) {
            unionMask |= grid.candidatesOf(cell);
          }

          if (popcount(unionMask) === size) {
            const subsetDigits = digitsOf(unionMask);
            const eliminations: CellDigit[] = [];
            for (const cell of emptyCells) {
              if (!comb.includes(cell)) {
                for (const d of subsetDigits) {
                  if (grid.hasCandidate(cell, d)) {
                    eliminations.push({ cell, digit: d });
                  }
                }
              }
            }

            if (eliminations.length > 0) {
              const subsetNames = {
                2: { zh: '显性数对', en: 'Naked Pair' },
                3: { zh: '显性三数组', en: 'Naked Triple' },
                4: { zh: '显性四数组', en: 'Naked Quad' },
              };
              const nameObj = subsetNames[size as 2 | 3 | 4]!;
              const houseType = houseIdx < 9 ? '行' : houseIdx < 18 ? '列' : '宫';
              const houseTypeEn = houseIdx < 9 ? 'row' : houseIdx < 18 ? 'column' : 'box';
              const houseNum = (houseIdx % 9) + 1;

              const combStr = comb.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
              const digitsStr = subsetDigits.join(', ');

              const highlightCandidates: CellDigit[] = [];
              for (const c of comb) {
                const mask = grid.candidatesOf(c) & unionMask;
                for (const d of digitsOf(mask)) {
                  highlightCandidates.push({ cell: c, digit: d });
                }
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...comb],
                  candidates: highlightCandidates,
                  links: [],
                },
                explanation: {
                  zh: `在第 ${houseNum} ${houseType} 中，格子 {${combStr}} 的候选数仅限于 {${digitsStr}}（${nameObj.zh}）。因此，可从该${houseType}的其他格子中排除这些候选数。`,
                  en: `In ${houseTypeEn} ${houseNum}, cells {${combStr}} contain only candidates {${digitsStr}} (${nameObj.en}). Thus, these candidates can be eliminated from other cells in this ${houseTypeEn}.`,
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
