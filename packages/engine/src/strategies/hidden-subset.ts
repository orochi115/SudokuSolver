/**
 * T2 STRATEGY — hidden subset (pair/triple/quad) (difficulty 30).
 *
 * If N digits in a house have candidates in exactly N cells,
 * eliminate other candidates from those N cells.
 */

import { HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    // Try different subset sizes (2 for pair, 3 for triple, 4 for quad)
    for (let size = 2; size <= 4; size++) {
      // Check each house
      for (const house of HOUSES) {
        // Get all possible combinations of 'size' digits from 1-9
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const digitCombinations = getCombinations(digits, size);
        
        for (const digitCombo of digitCombinations) {
          // For each combination of digits, find all cells in the house that have any of these digits
          const cellsInHouse = house.filter(cell => grid.get(cell) === 0);
          const cellsWithTheseDigits: number[] = [];
          
          for (const cell of cellsInHouse) {
            // Check if this cell has ANY of the digits in the combination
            let hasAnyOfThese = false;
            for (const digit of digitCombo) {
              if (grid.hasCandidate(cell, digit)) {
                hasAnyOfThese = true;
                break;
              }
            }
            if (hasAnyOfThese) {
              cellsWithTheseDigits.push(cell);
            }
          }
          
          // Check if these digits only appear in these cells (hidden subset condition)
          let validPattern = true;
          for (const digit of digitCombo) {
            // Check specifically that all cells with this digit are within our identified subset
            for (const cell of cellsInHouse) {
              if (grid.hasCandidate(cell, digit) && !cellsWithTheseDigits.includes(cell)) {
                validPattern = false;
                break;
              }
            }
            if (!validPattern) break;
          }
          
          // We must also verify that we have exactly 'size' cells
          if (validPattern && cellsWithTheseDigits.length === size && size <= cellsInHouse.length) {
            // Before eliminating, verify that each of the digits in digitCombo actually appears
            // in at least one of the cellsWithTheseDigits
            let allDigitsPresent = true;
            for (const digit of digitCombo) {
              let digitFound = false;
              for (const cell of cellsWithTheseDigits) {
                if (grid.hasCandidate(cell, digit)) {
                  digitFound = true;
                  break;
                }
              }
              if (!digitFound) {
                allDigitsPresent = false;
                break;
              }
            }
            
            if (!allDigitsPresent) continue; // Skip this combination
            
            // Now find extra candidates to eliminate from these cells
            const eliminations: { cell: number; digit: number }[] = [];
            
            for (const cell of cellsWithTheseDigits) {
              const currentCandidates = digitsOf(grid.candidatesOf(cell));
              for (const candidate of currentCandidates) {
                if (!digitCombo.includes(candidate)) {
                  eliminations.push({ cell, digit: candidate });
                }
              }
            }
            
            if (eliminations.length > 0) {
              // Formulate the explanation based on size
              let sizeName = '';
              switch (size) {
                case 2: sizeName = '数对'; break;
                case 3: sizeName = '三数组'; break;
                case 4: sizeName = '四数组'; break;
              }
              
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: cellsWithTheseDigits,
                  candidates: cellsWithTheseDigits.flatMap(cell => 
                    digitCombo.filter(d => grid.hasCandidate(cell, d))
                              .map(d => ({ cell, digit: d }))
                  ),
                  links: []
                },
                explanation: {
                  zh: `在同一个单元中，${size} 个数字 [${digitCombo.join(', ')}] 只出现在 ${size} 个格子 [${cellsWithTheseDigits.map(c => `R${Math.floor(c / 9) + 1}C${(c % 9) + 1}`).join(', ')}] 中，因此可以在这些格子中删除其他候选数（隐性${sizeName}）`,
                  en: `In the same house, ${size} digits [${digitCombo.join(', ')}] appear only in ${size} cells [${cellsWithTheseDigits.map(c => `R${Math.floor(c / 9) + 1}C${(c % 9) + 1}`).join(', ')}], so other candidates can be eliminated from these cells (Hidden ${sizeName})`,
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

// Helper function to generate combinations
function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size > arr.length) return [];
  if (size === 0) return [[]];
  if (size === arr.length) return [arr];

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