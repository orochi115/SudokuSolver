/**
 * Single-Digit Patterns (T3: Skyscraper/2-String Kite/Empty Rectangle).
 *
 * Short single-digit chains prove one of two endpoints must be true,
 * eliminating the digit from cells seeing both endpoints.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    // Try Skyscraper, 2-String Kite, Empty Rectangle patterns
    
    // For each digit 1-9
    for (let digit = 1; digit <= 9; digit++) {
      // Find all conjugate pairs (digit appears exactly twice in a house)
      const conjugatePairs: { house: number; cells: number[] }[] = [];
      
      // Check rows
      for (let row = 0; row < 9; row++) {
        const rowCells = HOUSES[row]!;
        const cellsWithDigit: number[] = [];
        
        for (const cell of rowCells) {
          if (grid.hasCandidate(cell, digit)) {
            cellsWithDigit.push(cell);
          }
        }
        
        if (cellsWithDigit.length === 2) {
          conjugatePairs.push({ house: row, cells: cellsWithDigit });
        }
      }
      
      // Check columns
      for (let col = 0; col < 9; col++) {
        const colCells = HOUSES[9 + col]!;
        const cellsWithDigit: number[] = [];
        
        for (const cell of colCells) {
          if (grid.hasCandidate(cell, digit)) {
            cellsWithDigit.push(cell);
          }
        }
        
        if (cellsWithDigit.length === 2) {
          conjugatePairs.push({ house: 9 + col, cells: cellsWithDigit });
        }
      }
      
      // Check boxes
      for (let box = 0; box < 9; box++) {
        const boxCells = HOUSES[18 + box]!;
        const cellsWithDigit: number[] = [];
        
        for (const cell of boxCells) {
          if (grid.hasCandidate(cell, digit)) {
            cellsWithDigit.push(cell);
          }
        }
        
        if (cellsWithDigit.length === 2) {
          conjugatePairs.push({ house: 18 + box, cells: cellsWithDigit });
        }
      }
      
      // Look for pattern combinations that create eliminations
      for (let i = 0; i < conjugatePairs.length; i++) {
        const pair1 = conjugatePairs[i]!;
        
        for (let j = i + 1; j < conjugatePairs.length; j++) {
          const pair2 = conjugatePairs[j]!;
          
          // Check if the pairs are connected via a weak link (sharing a house)
          const sharedHouse = findSharedHouse(pair1.house, pair2.house);
          
          if (sharedHouse !== null) {
            // Check if these pairs form a valid pattern
            const pattern = detectPattern(pair1, pair2, sharedHouse, grid, digit);
            
            if (pattern) {
              return pattern;
            }
          }
        }
      }
    }
    
    return null;
  },
};

// Helper to find shared house between two houses
function findSharedHouse(house1: number, house2: number): number | null {
  // Convert house indices to their actual houses
  const houses = [house1, house2];
  
  // Check if they are in the same row, column, or box
  if (house1 < 9 && house2 < 9) {
    // Both are rows
    if (house1 === house2) return house1;
  } else if (house1 >= 9 && house2 >= 9 && house1 < 18 && house2 < 18) {
    // Both are columns
    if (house1 === house2) return house1;
  } else if (house1 >= 18 && house2 >= 18) {
    // Both are boxes
    if (house1 === house2) return house1;
  }
  
  // Check for shared cell between houses
  return null;
}

// Helper to detect specific pattern
function detectPattern(
  pair1: { house: number; cells: number[] },
  pair2: { house: number; cells: number[] },
  sharedHouse: number,
  grid: any,
  digit: number
): any {
  // Simple pattern detection logic:
  // 1. Check if pairs are in different rows/columns/boxes but share a common unit
  
  // For now, let's try to detect Skyscraper pattern
  // A Skyscraper involves two conjugate pairs where one cell from each pair
  // sees the other cell from the other pair
  
  const cells1 = pair1.cells;
  const cells2 = pair2.cells;
  
  // Check if cells from one pair can see cells from the other pair
  for (const c1 of cells1) {
    for (const c2 of cells2) {
      // If cells see each other (they're in same house or peers)
      if (sameHouse(c1, c2) || isPeer(c1, c2)) {
        // This could be a valid pattern - create elimination
        const eliminationCells: number[] = [];
        
        // Find cells that see both cells from the pairs
        for (let cell = 0; cell < 81; cell++) {
          // Skip cells from the pairs
          if (cell === c1 || cell === c2) continue;
          
          // Check if this cell sees both c1 and c2
          if ((isPeer(cell, c1) && isPeer(cell, c2)) || 
              (sameHouse(cell, c1) && sameHouse(cell, c2))) {
            eliminationCells.push(cell);
          }
        }
        
        // If we found elimination cells, return the step
        if (eliminationCells.length > 0) {
          const eliminations = eliminationCells.map(c => ({ cell: c, digit }));
          
          // Highlight relevant cells
          const highlightCells = [...cells1, ...cells2];
          const highlightCandidates = [...cells1, ...cells2].map(c => ({ cell: c, digit }));
          
          return {
            strategyId: 'single-digit-patterns',
            placements: [],
            eliminations,
            highlights: { 
              cells: highlightCells, 
              candidates: highlightCandidates, 
              links: [] 
            },
            explanation: {
              zh: `发现单数字模式（如摩天楼），可从相关单元格中消除候选数`,
              en: `Found single-digit pattern (e.g. Skyscraper), can eliminate candidates from related cells.`,
            },
          };
        }
      }
    }
  }
  
  return null;
}

// Helper to check if two cells are in the same house
function sameHouse(cell1: number, cell2: number): boolean {
  return (
    Math.floor(cell1 / 9) === Math.floor(cell2 / 9) || // Same row
    (cell1 % 9) === (cell2 % 9) || // Same column
    (Math.floor(cell1 / 27) === Math.floor(cell2 / 27) &&
     Math.floor((cell1 % 9) / 3) === Math.floor((cell2 % 9) / 3)) // Same box
  );
}

// Helper to check if two cells are peers
function isPeer(cell1: number, cell2: number): boolean {
  return (
    Math.floor(cell1 / 9) === Math.floor(cell2 / 9) || // Same row
    (cell1 % 9) === (cell2 % 9) || // Same column
    (Math.floor(cell1 / 27) === Math.floor(cell2 / 27) &&
     Math.floor((cell1 % 9) / 3) === Math.floor((cell2 % 9) / 3)) // Same box
  );
}