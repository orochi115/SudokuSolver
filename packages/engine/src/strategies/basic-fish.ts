/**
 * Basic Fish (T3: X-Wing/Swordfish/Jellyfish).
 *
 * For one digit, if N base houses' candidates are fully covered by N cover houses,
 * eliminate that digit from cover-house cells outside the base houses.
 */

import { ROWS, COLS, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    // Try X-Wing (size 2), Swordfish (size 3), Jellyfish (size 4)
    for (let size = 2; size <= 4; size++) {
      // Try rows as base houses
      for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
        const baseRows = [rowIndex];
        const baseRowCells = ROWS[rowIndex]!;
        
        // Find candidates in this row for each digit
        const digitCandidates: Record<number, number[]> = {};
        for (const cell of baseRowCells) {
          const candidates = grid.candidatesOf(cell);
          for (const digit of digitsOf(candidates)) {
            if (!digitCandidates[digit]) digitCandidates[digit] = [];
            digitCandidates[digit]!.push(cell);
          }
        }
        
        // Find digits that have candidates in this row
        const digitsWithCandidates = Object.keys(digitCandidates).map(Number);
        
        // For each combination of digits, check if they form a valid fish
        const digitCombinations = getCombinations(digitsWithCandidates, size);
        for (const digits of digitCombinations) {
          // Collect cells where these digits appear
          const allCells: number[] = [];
          for (const digit of digits) {
            if (digitCandidates[digit]) {
              allCells.push(...digitCandidates[digit]!);
            }
          }
          
          // Remove duplicates
          const uniqueCells = [...new Set(allCells)];
          
          // Check if these cells lie in exactly 'size' columns
          const columnSet = new Set<number>();
          for (const cell of uniqueCells) {
            columnSet.add(cell % 9);
          }
          
          if (columnSet.size === size) {
            // Found a valid fish pattern
            const coverColumns = Array.from(columnSet).map(col => 9 + col);
            
            // Eliminate this digit from cover columns outside the base rows
            const eliminations: { cell: number; digit: number }[] = [];
            const highlightCells: number[] = [];
            const highlightCandidates: { cell: number; digit: number }[] = [];
            
            // Add all cells in the base rows and cover columns to highlights
            for (const cell of baseRowCells) {
              if (grid.hasCandidate(cell, digits[0]!)) {
                highlightCells.push(cell);
                for (const digit of digitsOf(grid.candidatesOf(cell))) {
                  highlightCandidates.push({ cell, digit });
                }
              }
            }
            
            for (const col of coverColumns) {
              const colCells = COLS[col - 9]!;
              for (const cell of colCells) {
                if (baseRowCells.includes(cell)) continue; // Skip base cells
                if (grid.hasCandidate(cell, digits[0]!)) {
                  eliminations.push({ cell, digit: digits[0]! });
                }
              }
            }
            
            if (eliminations.length > 0) {
              const fishName = ['','',(size === 2 ? 'X翼' : size === 3 ? '剑鱼' : '水母')];
              const baseType = '行';
              const coverType = '列';
              
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
                  zh: `发现${fishName[size]}（${baseType}为基础，${coverType}为覆盖），可从覆盖列中消除候选数`,
                  en: `Found ${fishName[size]} (${baseType} as base, ${coverType} as cover), can eliminate candidates from cover houses.`,
                },
              };
            }
          }
        }
      }
      
      // Try columns as base houses
      for (let colIndex = 0; colIndex < 9; colIndex++) {
        const baseCols = [colIndex];
        const baseColCells = COLS[colIndex]!;
        
        // Find candidates in this column for each digit
        const digitCandidates: Record<number, number[]> = {};
        for (const cell of baseColCells) {
          const candidates = grid.candidatesOf(cell);
          for (const digit of digitsOf(candidates)) {
            if (!digitCandidates[digit]) digitCandidates[digit] = [];
            digitCandidates[digit]!.push(cell);
          }
        }
        
        // Find digits that have candidates in this column
        const digitsWithCandidates = Object.keys(digitCandidates).map(Number);
        
        // For each combination of digits, check if they form a valid fish
        const digitCombinations = getCombinations(digitsWithCandidates, size);
        for (const digits of digitCombinations) {
          // Collect cells where these digits appear
          const allCells: number[] = [];
          for (const digit of digits) {
            if (digitCandidates[digit]) {
              allCells.push(...digitCandidates[digit]!);
            }
          }
          
          // Remove duplicates
          const uniqueCells = [...new Set(allCells)];
          
          // Check if these cells lie in exactly 'size' rows
          const rowSet = new Set<number>();
          for (const cell of uniqueCells) {
            rowSet.add(Math.floor(cell / 9));
          }
          
          if (rowSet.size === size) {
            // Found a valid fish pattern
            const coverRows = Array.from(rowSet).map(row => row);
            
            // Eliminate this digit from cover rows outside the base columns
            const eliminations: { cell: number; digit: number }[] = [];
            const highlightCells: number[] = [];
            const highlightCandidates: { cell: number; digit: number }[] = [];
            
            // Add all cells in the base columns and cover rows to highlights
            for (const cell of baseColCells) {
              if (grid.hasCandidate(cell, digits[0]!)) {
                highlightCells.push(cell);
                for (const digit of digitsOf(grid.candidatesOf(cell))) {
                  highlightCandidates.push({ cell, digit });
                }
              }
            }
            
            for (const row of coverRows) {
              const rowCells = ROWS[row]!;
              for (const cell of rowCells) {
                if (baseColCells.includes(cell)) continue; // Skip base cells
                if (grid.hasCandidate(cell, digits[0]!)) {
                  eliminations.push({ cell, digit: digits[0]! });
                }
              }
            }
            
            if (eliminations.length > 0) {
              const fishName = ['','',(size === 2 ? 'X翼' : size === 3 ? '剑鱼' : '水母')];
              const baseType = '列';
              const coverType = '行';
              
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
                  zh: `发现${fishName[size]}（${baseType}为基础，${coverType}为覆盖），可从覆盖行中消除候选数`,
                  en: `Found ${fishName[size]} (${baseType} as base, ${coverType} as cover), can eliminate candidates from cover houses.`,
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

// Helper function to get combinations
function getCombinations<T>(arr: T[], size: number): T[][] {
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