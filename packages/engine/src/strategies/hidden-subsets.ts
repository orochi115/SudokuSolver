import { ROW_OF, COL_OF, HOUSES, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, path: T[]) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]!);
      helper(i + 1, path);
      path.pop();
    }
  }
  helper(0, []);
  return result;
}

function makeHiddenSubset(N: 2 | 3 | 4): Strategy {
  const subsetNameZh = N === 2 ? '数对' : N === 3 ? '三数组' : '四数组';
  const subsetNameEn = N === 2 ? 'Pair' : N === 3 ? 'Triple' : 'Quad';
  const id = `hidden-${N === 2 ? 'pair' : N === 3 ? 'triple' : 'quad'}`;
  const difficulty = 35 + (N - 2) * 2; // Pair: 35, Triple: 37, Quad: 39

  return {
    id,
    name: { zh: `隐性${subsetNameZh}`, en: `Hidden ${subsetNameEn}` },
    difficulty,

    apply(grid: Grid): Step | null {
      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        const emptyCells = house.filter(c => grid.get(c) === 0);
        if (emptyCells.length <= N) continue;

        // Collect all candidates in this house
        let houseMask = 0;
        for (const cell of emptyCells) {
          houseMask |= grid.candidatesOf(cell);
        }
        const activeDigits = digitsOf(houseMask);
        if (activeDigits.length <= N) continue;

        const combos = getCombinations(activeDigits, N);
        for (const subDigits of combos) {
          const containingCells: number[] = [];
          for (const cell of emptyCells) {
            const hasAny = subDigits.some(d => grid.hasCandidate(cell, d));
            if (hasAny) {
              containingCells.push(cell);
            }
          }

          if (containingCells.length === N) {
            const eliminations: CellDigit[] = [];
            for (const cell of containingCells) {
              const cellDigits = digitsOf(grid.candidatesOf(cell));
              for (const d of cellDigits) {
                if (!subDigits.includes(d)) {
                  eliminations.push({ cell, digit: d });
                }
              }
            }

            if (eliminations.length > 0) {
              const cellNames = containingCells.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
              const digitNames = subDigits.join(', ');

              let houseTypeName = '';
              let houseTypeNameEn = '';
              let houseIndex = 0;
              if (h < 9) {
                houseTypeName = '行';
                houseTypeNameEn = 'Row';
                houseIndex = h + 1;
              } else if (h < 18) {
                houseTypeName = '列';
                houseTypeNameEn = 'Column';
                houseIndex = h - 9 + 1;
              } else {
                houseTypeName = '宫';
                houseTypeNameEn = 'Box';
                houseIndex = h - 18 + 1;
              }

              const highlightsCandidates: CellDigit[] = [];
              for (const cell of containingCells) {
                for (const d of subDigits) {
                  if (grid.hasCandidate(cell, d)) {
                    highlightsCandidates.push({ cell, digit: d });
                  }
                }
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: containingCells,
                  candidates: highlightsCandidates,
                  links: []
                },
                explanation: {
                  zh: `在第 ${houseIndex} ${houseTypeName}中，候选数 ${digitNames} 仅分布于 ${cellNames}（隐性${subsetNameZh}），因此从这些格子中排除其他候选数。`,
                  en: `In ${houseTypeNameEn} ${houseIndex}, candidates ${digitNames} are confined to cells ${cellNames} (Hidden ${subsetNameEn}). Therefore, other candidates can be eliminated from these cells.`,
                }
              };
            }
          }
        }
      }
      return null;
    }
  };
}

export const hiddenPair = makeHiddenSubset(2);
export const hiddenTriple = makeHiddenSubset(3);
export const hiddenQuad = makeHiddenSubset(4);
