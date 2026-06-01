/**
 * Hidden Subset (T2: pairs/triples/quads).
 *
 * If N digits in one house appear only in N cells,
 * eliminate all non-subset digits from those N cells.
 */

import { HOUSES, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    // Try hidden pairs, triples, quads
    for (const house of HOUSES) {
      // For each possible subset size (2-4 for pairs/triples/quads)
      for (let size = 2; size <= 4; size++) {
        // Find all combinations of cells in the house
        const combinations = getCombinations(house, size);
        
        for (const combo of combinations) {
          // Count how many times each digit appears in these cells
          const digitCount: Record<number, number> = {};
          const digitCells: Record<number, number[]> = {};
          
          for (const cell of combo) {
            const candidates = grid.candidatesOf(cell);
            for (const digit of digitsOf(candidates)) {
              digitCount[digit] = (digitCount[digit] || 0) + 1;
              if (!digitCells[digit]) digitCells[digit] = [];
              digitCells[digit]!.push(cell);
            }
          }
          
          // Find digits that appear in all cells of this combination
          const subsetDigits: number[] = [];
          for (const digit in digitCount) {
            if (digitCount[digit] === size) {
              subsetDigits.push(Number(digit));
            }
          }
          
          // If we found exactly 'size' digits that each appear in all cells of the combination
          if (subsetDigits.length === size) {
            // Check if these digits only appear in these cells
            let isValid = true;
            for (const digit of subsetDigits) {
              const cellsWhereDigitAppears = digitCells[digit]!;
              for (const cell of house) {
                if (!cellsWhereDigitAppears.includes(cell) && grid.hasCandidate(cell, digit)) {
                  // This digit appears in other cells too, not a valid hidden subset
                  isValid = false;
                  break;
                }
              }
              if (!isValid) break;
            }
            
            if (isValid) {
              // Eliminate all non-subset digits from these cells
              const eliminations: { cell: number; digit: number }[] = [];
              const highlightCells: number[] = [];
              const highlightCandidates: { cell: number; digit: number }[] = [];
              
              for (const cell of combo) {
                highlightCells.push(cell);
                // Highlight all candidates in these cells
                for (const digit of digitsOf(grid.candidatesOf(cell))) {
                  highlightCandidates.push({ cell, digit });
                  
                  // If this digit is not part of the subset, eliminate it
                  if (!subsetDigits.includes(digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                const sizeName = ['','',(size === 2 ? '数对' : size === 3 ? '三数组' : '四数组')];
                const houseType = ['行','列','宫'];
                const houseIndex = Math.floor(house[0]! / 9);
                const houseTypeName = houseType[houseIndex % 3];
                const houseNum = houseIndex % 3 + 1;
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: highlightCells, 
                    candidates: highlightCandidates, 
                    links: [] 
                  },
                  explanation: {
                    zh: `在${houseTypeName}${houseNum}中，发现隐性${sizeName[size]}，可从对应单元格中消除多余候选数`,
                    en: `Found hidden ${sizeName[size]} in ${houseTypeName}${houseNum}, can eliminate extra candidates from those cells.`,
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

// Helper function to get combinations of cells
function getCombinations<T>(arr: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  
  const result: T[][] = [];
  const first = arr[0]!;
  const rest = arr.slice(1);
  
  // Combinations that include the first element
  const restCombinations = getCombinations(rest, size - 1);
  for (const combo of restCombinations) {
    result.push([first, ...combo]);
  }
  
  // Combinations that don't include the first element
  const withoutFirst = getCombinations(rest, size);
  for (const combo of withoutFirst) {
    result.push(combo);
  }
  
  return result;
}