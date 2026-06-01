import { HOUSES, ROW_OF, COL_OF, SIZE, digitsOf } from '../grid.js';
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

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 35, // Suggested cost band: 30 subsets, hidden subsets are slightly harder than naked ones

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

        // Find which digits are not placed in this house
        const placedDigits = new Set<number>();
        for (const cell of house) {
          const v = grid.get(cell);
          if (v !== 0) {
            placedDigits.add(v);
          }
        }
        const availableDigits: number[] = [];
        for (let d = 1; d <= SIZE; d++) {
          if (!placedDigits.has(d)) {
            availableDigits.push(d);
          }
        }

        if (availableDigits.length <= size) {
          continue;
        }

        const digitCombinations = getCombinations(availableDigits, size);
        for (const combDigits of digitCombinations) {
          const containingCells: number[] = [];
          for (const cell of emptyCells) {
            const hasAny = combDigits.some(d => grid.hasCandidate(cell, d));
            if (hasAny) {
              containingCells.push(cell);
            }
          }

          if (containingCells.length === size) {
            // We found a hidden subset!
            // Let's see if any other candidates can be eliminated from containingCells.
            const eliminations: CellDigit[] = [];
            for (const cell of containingCells) {
              const cellCandidates = digitsOf(grid.candidatesOf(cell));
              for (const d of cellCandidates) {
                if (!combDigits.includes(d)) {
                  eliminations.push({ cell, digit: d });
                }
              }
            }

            if (eliminations.length > 0) {
              const subsetNames = {
                2: { zh: '隐性数对', en: 'Hidden Pair' },
                3: { zh: '隐性三数组', en: 'Hidden Triple' },
                4: { zh: '隐性四数组', en: 'Hidden Quad' },
              };
              const nameObj = subsetNames[size as 2 | 3 | 4]!;
              const houseType = houseIdx < 9 ? '行' : houseIdx < 18 ? '列' : '宫';
              const houseTypeEn = houseIdx < 9 ? 'row' : houseIdx < 18 ? 'column' : 'box';
              const houseNum = (houseIdx % 9) + 1;

              const cellsStr = containingCells.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
              const digitsStr = combDigits.join(', ');

              const highlightCandidates: CellDigit[] = [];
              for (const c of containingCells) {
                for (const d of combDigits) {
                  if (grid.hasCandidate(c, d)) {
                    highlightCandidates.push({ cell: c, digit: d });
                  }
                }
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...containingCells],
                  candidates: highlightCandidates,
                  links: [],
                },
                explanation: {
                  zh: `在第 ${houseNum} ${houseType} 中，候选数 {${digitsStr}} 仅能填在格子 {${cellsStr}}（${nameObj.zh}）。因此，可从这些格子中排除其他候选数。`,
                  en: `In ${houseTypeEn} ${houseNum}, candidates {${digitsStr}} are confined to cells {${cellsStr}} (${nameObj.en}). Thus, other candidates can be eliminated from these cells.`,
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
