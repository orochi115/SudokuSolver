/**
 * T2 STRATEGY — naked subset (pair/triple/quad) (difficulty 30).
 *
 * If N cells in a house contain candidates from the same set of N digits,
 * eliminate those digits from other cells in the same house.
 */

import { HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    // Try different subset sizes (2 for pair, 3 for triple, 4 for quad)
    for (let size = 2; size <= 4; size++) {
      // Check each house
      for (const house of HOUSES) {
        // Get empty cells in the house
        const emptyCells = house.filter(cell => grid.get(cell) === 0);
        
        // Get all combinations of 'size' cells from emptyCells
        const combinations = getCombinations(emptyCells, size);
        
        for (const combo of combinations) {
          // Gather all unique candidates in these cells
          let combinedMask = 0;
          for (const cell of combo) {
            combinedMask |= grid.candidatesOf(cell);
          }
          
          // Check if the combined candidates have exactly 'size' digits
          const allDigits = digitsOf(combinedMask);
          if (allDigits.length === size) {
            // Verify all cells in the combo only have candidates from this set
            let allValid = true;
            for (const cell of combo) {
              const cellMask = grid.candidatesOf(cell);
              // Make sure this cell's candidates are only from the combined set
              if ((cellMask | combinedMask) !== combinedMask) {
                allValid = false;
                break;
              }
              // Make sure this cell has exactly 'size' candidates or fewer but all from the set
              const cellDigits = digitsOf(cellMask);
              if (cellDigits.some(d => !allDigits.includes(d))) {
                allValid = false;
                break;
              }
            }
            
            if (allValid) {
              // Find other cells in the house that have any of these digits
              const otherCells = house.filter(cell => !combo.includes(cell) && grid.get(cell) === 0);
              const eliminations: { cell: number; digit: number }[] = [];
              
              for (const cell of otherCells) {
                for (const digit of allDigits) {
                  if (grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
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
                    cells: combo,
                    candidates: combo.flatMap(cell => 
                      allDigits.filter(d => grid.hasCandidate(cell, d))
                            .map(d => ({ cell, digit: d }))
                    ),
                    links: []
                  },
                  explanation: {
                    zh: `在同一个单元中，${sizeName} [${combo.map(c => `R${Math.floor(c / 9) + 1}C${(c % 9) + 1}`).join(', ')}] 包含相同的 ${size} 个候选数 [${allDigits.join(', ')}]，因此可以从该单元中其他格子中删除这些候选数（显性${sizeName}）`,
                    en: `In the same house, ${size}-cells [${combo.map(c => `R${Math.floor(c / 9) + 1}C${(c % 9) + 1}`).join(', ')}] contain the same ${size} candidates [${allDigits.join(', ')}], so these candidates can be eliminated from other cells in the house (Naked ${sizeName})`,
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