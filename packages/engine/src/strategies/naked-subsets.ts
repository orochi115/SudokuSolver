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

function makeNakedSubset(N: 2 | 3 | 4): Strategy {
  const subsetNameZh = N === 2 ? '数对' : N === 3 ? '三数组' : '四数组';
  const subsetNameEn = N === 2 ? 'Pair' : N === 3 ? 'Triple' : 'Quad';
  const id = `naked-${N === 2 ? 'pair' : N === 3 ? 'triple' : 'quad'}`;
  const difficulty = 30 + (N - 2) * 2; // Pair: 30, Triple: 32, Quad: 34

  return {
    id,
    name: { zh: `显性${subsetNameZh}`, en: `Naked ${subsetNameEn}` },
    difficulty,

    apply(grid: Grid): Step | null {
      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        const emptyCells = house.filter(c => grid.get(c) === 0);
        if (emptyCells.length <= N) continue;

        const combos = getCombinations(emptyCells, N);
        for (const subCells of combos) {
          let unionMask = 0;
          for (const cell of subCells) {
            unionMask |= grid.candidatesOf(cell);
          }
          const unionDigits = digitsOf(unionMask);

          if (unionDigits.length === N) {
            const eliminations: CellDigit[] = [];
            for (const cell of emptyCells) {
              if (subCells.includes(cell)) continue;
              for (const d of unionDigits) {
                if (grid.hasCandidate(cell, d)) {
                  eliminations.push({ cell, digit: d });
                }
              }
            }

            if (eliminations.length > 0) {
              const cellNames = subCells.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
              const digitNames = unionDigits.join(', ');

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
              for (const cell of subCells) {
                for (const d of unionDigits) {
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
                  cells: subCells,
                  candidates: highlightsCandidates,
                  links: []
                },
                explanation: {
                  zh: `在第 ${houseIndex} ${houseTypeName}中，单元格 ${cellNames} 仅包含候选数 ${digitNames}（显性${subsetNameZh}），因此从该${houseTypeName}的其他格子中排除这些候选数。`,
                  en: `In ${houseTypeNameEn} ${houseIndex}, cells ${cellNames} contain only candidates ${digitNames} (Naked ${subsetNameEn}). Therefore, these candidates can be eliminated from other cells in that ${houseTypeNameEn}.`,
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

export const nakedPair = makeNakedSubset(2);
export const nakedTriple = makeNakedSubset(3);
export const nakedQuad = makeNakedSubset(4);
