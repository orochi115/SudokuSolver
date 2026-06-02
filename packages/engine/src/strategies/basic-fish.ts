/**
 * T3 STRATEGY — basic fish (X-Wing/Swordfish/Jellyfish) (difficulty 40).
 *
 * Unified base/cover set implementation for fish patterns.
 * X-Wing (size 2), Swordfish (size 3), Jellyfish (size 4).
 */

import { ROWS, COLS, CELLS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    // Try different fish sizes (2 for X-Wing, 3 for Swordfish, 4 for Jellyfish)
    for (let size = 2; size <= 4; size++) {
      // Look for fish in rows (base set in rows, cover set in columns)
      for (let digit = 1; digit <= 9; digit++) {
        // Get all rows that have candidates for this digit
        const rowsWithDigit: number[] = [];
        for (let r = 0; r < 9; r++) {
          for (const cell of ROWS[r]!) {
            if (grid.hasCandidate(cell, digit)) {
              rowsWithDigit.push(r);
              break;
            }
          }
        }
        
        // Get all combinations of 'size' rows
        const rowCombinations = getCombinations(rowsWithDigit, size);
        
        for (const baseRows of rowCombinations) {
          // Find all columns where the digit appears in these base rows
          const coverCols: number[] = [];
          for (const row of baseRows) {
            for (const cell of ROWS[row]!) {
              if (grid.hasCandidate(cell, digit) && !coverCols.includes(cell % 9)) {
                coverCols.push(cell % 9);
              }
            }
          }
          
          // If we have exactly 'size' columns
          if (coverCols.length === size) {
            // Check that every candidate for this digit in base rows is also in cover columns
            let validFish = true;
            const basePositions: number[] = [];
            
            for (const row of baseRows) {
              for (const cell of ROWS[row]!) {
                if (grid.hasCandidate(cell, digit)) {
                  basePositions.push(cell);
                  const col = cell % 9;
                  if (!coverCols.includes(col)) {
                    validFish = false;
                    break;
                  }
                }
              }
              if (!validFish) break;
            }
            
            if (validFish) {
              // Find eliminations: candidates in cover columns but not in base rows
              const eliminations: { cell: number; digit: number }[] = [];
              for (const col of coverCols) {
                for (const cell of COLS[col]!) {
                  const cellRow = Math.floor(cell / 9);
                  if (grid.hasCandidate(cell, digit) && !baseRows.includes(cellRow)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                // Determine fish type for explanation
                let fishType = '';
                switch (size) {
                  case 2: fishType = 'X-Wing'; break;
                  case 3: fishType = 'Swordfish'; break;
                  case 4: fishType = 'Jellyfish'; break;
                }
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: basePositions.concat(eliminations.map(e => e.cell)),
                    candidates: basePositions.map(cell => ({ cell, digit })),
                    links: []
                  },
                  explanation: {
                    zh: `${fishType}: 数字 ${digit} 在 ${size} 行 [${baseRows.map(r => r + 1).join(', ')}] 中的候选位置恰好位于 ${size} 列 [${coverCols.map(c => c + 1).join(', ')}] 中，因此可以从这些列中但不在这些行中的其他位置删除候选数 ${digit}（基础鱼）`,
                    en: `${fishType}: Digit ${digit} in ${size} rows [${baseRows.map(r => r + 1).join(', ')}] has candidates only in ${size} columns [${coverCols.map(c => c + 1).join(', ')}], so ${digit} can be eliminated from other cells in those columns outside those rows (Basic Fish)`,
                  },
                };
              }
            }
          }
        }
        
        // Look for fish in columns (base set in columns, cover set in rows)
        const colsWithDigit: number[] = [];
        for (let c = 0; c < 9; c++) {
          for (const cell of COLS[c]!) {
            if (grid.hasCandidate(cell, digit)) {
              colsWithDigit.push(c);
              break;
            }
          }
        }
        
        // Get all combinations of 'size' columns
        const colCombinations = getCombinations(colsWithDigit, size);
        
        for (const baseCols of colCombinations) {
          // Find all rows where the digit appears in these base columns
          const coverRows: number[] = [];
          for (const col of baseCols) {
            for (const cell of COLS[col]!) {
              if (grid.hasCandidate(cell, digit) && !coverRows.includes(Math.floor(cell / 9))) {
                coverRows.push(Math.floor(cell / 9));
              }
            }
          }
          
          // If we have exactly 'size' rows
          if (coverRows.length === size) {
            // Check that every candidate for this digit in base columns is also in cover rows
            let validFish = true;
            const basePositions: number[] = [];
            
            for (const col of baseCols) {
              for (const cell of COLS[col]!) {
                if (grid.hasCandidate(cell, digit)) {
                  basePositions.push(cell);
                  const row = Math.floor(cell / 9);
                  if (!coverRows.includes(row)) {
                    validFish = false;
                    break;
                  }
                }
              }
              if (!validFish) break;
            }
            
            if (validFish) {
              // Find eliminations: candidates in cover rows but not in base columns
              const eliminations: { cell: number; digit: number }[] = [];
              for (const row of coverRows) {
                for (const cell of ROWS[row]!) {
                  const cellCol = cell % 9;
                  if (grid.hasCandidate(cell, digit) && !baseCols.includes(cellCol)) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
              
              if (eliminations.length > 0) {
                // Determine fish type for explanation
                let fishType = '';
                switch (size) {
                  case 2: fishType = 'X-Wing'; break;
                  case 3: fishType = 'Swordfish'; break;
                  case 4: fishType = 'Jellyfish'; break;
                }
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: basePositions.concat(eliminations.map(e => e.cell)),
                    candidates: basePositions.map(cell => ({ cell, digit })),
                    links: []
                  },
                  explanation: {
                    zh: `${fishType}: 数字 ${digit} 在 ${size} 列 [${baseCols.map(c => c + 1).join(', ')}] 中的候选位置恰好位于 ${size} 行 [${coverRows.map(r => r + 1).join(', ')}] 中，因此可以从这些行中但不在这些列中的其他位置删除候选数 ${digit}（基础鱼）`,
                    en: `${fishType}: Digit ${digit} in ${size} columns [${baseCols.map(c => c + 1).join(', ')}] has candidates only in ${size} rows [${coverRows.map(r => r + 1).join(', ')}], so ${digit} can be eliminated from other cells in those rows outside those columns (Basic Fish)`,
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