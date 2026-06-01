/**
 * T2 STRATEGY — naked subset (difficulty 20-30).
 * 
 * Includes naked pairs, triples, and quads.
 * When N cells in a house contain only N candidates between them, those candidates
 * can be eliminated from other cells in that house.
 */

import { HOUSES, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    // Check for naked subsets of size 2, 3, and 4
    for (const size of [2, 3, 4]) {
      for (const [houseIndex, house] of HOUSES.entries()) {
        // Get all empty cells in this house
        const emptyCells = house.filter(cell => grid.get(cell) === 0);
        
        // Generate all combinations of 'size' empty cells
        const combinations = getCombinations(emptyCells, size);
        
        for (const combo of combinations) {
          // Collect all candidates from these cells
          const allCandidatesInCombo = new Set<number>();
          for (const cell of combo) {
            const candidates = grid.candidatesOf(cell);
            for (const digit of getDigitsFromMask(candidates)) {
              allCandidatesInCombo.add(digit);
            }
          }
          
          // If we have exactly 'size' unique candidates in 'size' cells
          if (allCandidatesInCombo.size === size) {
            // Verify that each cell in combo only has candidates from the combo set
            let valid = true;
            for (const cell of combo) {
              const cellCandidates = grid.candidatesOf(cell);
              for (const digit of getDigitsFromMask(cellCandidates)) {
                if (!allCandidatesInCombo.has(digit)) {
                  valid = false;
                  break;
                }
              }
              if (!valid) break;
            }
            
            if (valid) {
              // Find other cells in this house that have these candidates
              const otherCellsInHouse = house.filter(cell => 
                !combo.includes(cell) && grid.get(cell) === 0
              );
              
              const eliminations: { cell: number; digit: number }[] = [];
              for (const cell of otherCellsInHouse) {
                for (const digit of allCandidatesInCombo) {
                  if (grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                const digitsArray = Array.from(allCandidatesInCombo).sort((a, b) => a - b);
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: combo,
                    candidates: combo.flatMap(cell => 
                      getDigitsFromMask(grid.candidatesOf(cell))
                        .filter(digit => allCandidatesInCombo.has(digit))
                        .map(digit => ({ cell, digit }))
                    ),
                    links: []
                  },
                  explanation: {
                    zh: `在${getHouseTypeAndNumber(houseIndex)}中，${combo.length === 2 ? '显性数对' : combo.length === 3 ? '显性三数组' : '显性四数组'} ${digitsArray.join(',')} 位于 ${combo.map(cell => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join(',')}。因此，这些数字可以从该单元的其他位置移除。`,
                    en: `In ${getHouseTypeAndNumber(houseIndex)}, naked ${combo.length === 2 ? 'pair' : combo.length === 3 ? 'triple' : 'quad'} ${digitsArray.join(',')} at ${combo.map(cell => `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`).join(',')}. Therefore, these digits can be eliminated from other cells in this house.`,
                  },
                };
              }
            }
          }
        }
      }
    }
    
    return null;
  },
};

// Helper function to get all combinations of a certain size from an array
function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (size > arr.length) return [];
  
  const result: T[][] = [];
  
  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
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

// Helper function to extract digits from a candidate mask
function getDigitsFromMask(mask: number): number[] {
  const digits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if ((mask & (1 << (d - 1))) !== 0) {
      digits.push(d);
    }
  }
  return digits;
}

// Helper function to get house type and number for explanation
function getHouseTypeAndNumber(houseIndex: number): string {
  if (houseIndex < 9) {
    // Row
    return `第 ${houseIndex + 1} 行`;
  } else if (houseIndex < 18) {
    // Column
    return `第 ${houseIndex - 9 + 1} 列`;
  } else {
    // Box
    return `第 ${houseIndex - 18 + 1} 宫`;
  }
}