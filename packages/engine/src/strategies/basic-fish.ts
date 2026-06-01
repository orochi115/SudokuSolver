/**
 * T3 STRATEGY — basic fish (difficulty 40-50).
 * 
 * Unified implementation for X-Wing (size 2), Swordfish (size 3), and Jellyfish (size 4).
 * Uses base/cover set model: if N units (base) have candidates for a digit confined 
 * to N other units (cover), then that digit can be eliminated from the cover units
 * outside the base units.
 */

import { ROWS, COLS, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    // For each digit 1-9
    for (let digit = 1; digit <= 9; digit++) {
      // Check fish patterns for this digit
      for (const size of [2, 3, 4]) { // X-Wing, Swordfish, Jellyfish
        // Check fish in rows (base units are rows, cover units are columns)
        const rowCombinations = getCombinations(ROWS.map((_, i) => i), size);
        for (const baseRows of rowCombinations) {
          // Find all columns that have this digit in these base rows
          const candidateCols = new Set<number>();
          for (const row of baseRows) {
            for (const cell of ROWS[row]!) {
              if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                candidateCols.add(COL_OF[cell]!);
              }
            }
          }
          
          if (candidateCols.size === size) {
            // Now check if all candidates for this digit in these columns are in the base rows
            const coverCols = Array.from(candidateCols);
            let allInBaseRows = true;
            for (const col of coverCols) {
              for (const cell of COLS[col]!) {
                if (grid.get(cell) === 0 && 
                    grid.hasCandidate(cell, digit) && 
                    !baseRows.includes(ROW_OF[cell]!)) {
                  allInBaseRows = false;
                  break;
                }
              }
              if (!allInBaseRows) break;
            }
            
            if (allInBaseRows) {
              // Found a valid fish pattern - eliminate digit from cover columns outside base rows
              const eliminations: { cell: number; digit: number }[] = [];
              for (const col of coverCols) {
                for (const cell of COLS[col]!) {
                  if (!baseRows.includes(ROW_OF[cell]!) && 
                      grid.get(cell) === 0 && 
                      grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                const baseUnits = baseRows.map(row => `R${row + 1}`).join(',');
                const coverUnits = coverCols.map(col => `C${col + 1}`).join(',');
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: baseRows.flatMap(row => 
                      ROWS[row]!.filter(cell => 
                        grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                      )
                    ).concat(
                      coverCols.flatMap(col => 
                        COLS[col]!.filter(cell => 
                          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                        )
                      )
                    ),
                    candidates: baseRows.flatMap(row => 
                      ROWS[row]!.filter(cell => 
                        grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                      ).map(cell => ({ cell, digit }))
                    ).concat(
                      coverCols.flatMap(col => 
                        COLS[col]!.filter(cell => 
                          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                        ).map(cell => ({ cell, digit }))
                      )
                    ),
                    links: []
                  },
                  explanation: {
                    zh: `${getSizeName(size)}：数字 ${digit} 在${baseUnits}中只出现在${coverUnits}。因此，${coverUnits}中但不在${baseUnits}中的位置不能再有数字 ${digit}。`,
                    en: `${getSizeName(size)}: digit ${digit} in ${baseUnits} only appears in ${coverUnits}. Therefore, digit ${digit} can be eliminated from cells in ${coverUnits} but outside ${baseUnits}.`,
                  },
                };
              }
            }
          }
        }
        
        // Check fish in columns (base units are columns, cover units are rows)
        const colCombinations = getCombinations(COLS.map((_, i) => i), size);
        for (const baseCols of colCombinations) {
          // Find all rows that have this digit in these base columns
          const candidateRows = new Set<number>();
          for (const col of baseCols) {
            for (const cell of COLS[col]!) {
              if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                candidateRows.add(ROW_OF[cell]!);
              }
            }
          }
          
          if (candidateRows.size === size) {
            // Now check if all candidates for this digit in these rows are in the base columns
            const coverRows = Array.from(candidateRows);
            let allInBaseCols = true;
            for (const row of coverRows) {
              for (const cell of ROWS[row]!) {
                if (grid.get(cell) === 0 && 
                    grid.hasCandidate(cell, digit) && 
                    !baseCols.includes(COL_OF[cell]!)) {
                  allInBaseCols = false;
                  break;
                }
              }
              if (!allInBaseCols) break;
            }
            
            if (allInBaseCols) {
              // Found a valid fish pattern - eliminate digit from cover rows outside base columns
              const eliminations: { cell: number; digit: number }[] = [];
              for (const row of coverRows) {
                for (const cell of ROWS[row]!) {
                  if (!baseCols.includes(COL_OF[cell]!) && 
                      grid.get(cell) === 0 && 
                      grid.hasCandidate(cell, digit)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                const baseUnits = baseCols.map(col => `C${col + 1}`).join(',');
                const coverUnits = coverRows.map(row => `R${row + 1}`).join(',');
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: baseCols.flatMap(col => 
                      COLS[col]!.filter(cell => 
                        grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                      )
                    ).concat(
                      coverRows.flatMap(row => 
                        ROWS[row]!.filter(cell => 
                          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                        )
                      )
                    ),
                    candidates: baseCols.flatMap(col => 
                      COLS[col]!.filter(cell => 
                        grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                      ).map(cell => ({ cell, digit }))
                    ).concat(
                      coverRows.flatMap(row => 
                        ROWS[row]!.filter(cell => 
                          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
                        ).map(cell => ({ cell, digit }))
                      )
                    ),
                    links: []
                  },
                  explanation: {
                    zh: `${getSizeName(size)}：数字 ${digit} 在${baseUnits}中只出现在${coverUnits}。因此，${coverUnits}中但不在${baseUnits}中的位置不能再有数字 ${digit}。`,
                    en: `${getSizeName(size)}: digit ${digit} in ${baseUnits} only appears in ${coverUnits}. Therefore, digit ${digit} can be eliminated from cells in ${coverUnits} but outside ${baseUnits}.`,
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

// Helper function to get the name of the fish based on size
function getSizeName(size: number): string {
  switch (size) {
    case 2: return 'X-Wing';
    case 3: return 'Swordfish';
    case 4: return 'Jellyfish';
    default: return `${size}-Fish`;
  }
}