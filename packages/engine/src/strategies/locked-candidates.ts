/**
 * Locked Candidates (T2: pointing/claiming).
 *
 * If all candidates for a digit in one house are confined to the intersection with another house,
 * eliminate that digit from the rest of the other house.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // Try pointing (box → row/column) and claiming (row/column → box)
    
    // First, check pointing: candidates in a box are confined to one row/column
    for (let box = 0; box < 9; box++) {
      const boxCells = HOUSES[18 + box]!;
      
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        const candidatesInBox: number[] = [];
        
        // Find all candidates for this digit in the box
        for (const cell of boxCells) {
          if (grid.hasCandidate(cell, digit)) {
            candidatesInBox.push(cell);
          }
        }
        
        // If there are candidates in the box
        if (candidatesInBox.length > 0) {
          // Check if all candidates are in the same row
          const rows = new Set<number>();
          const cols = new Set<number>();
          
          for (const cell of candidatesInBox) {
            rows.add(ROW_OF[cell]!);
            cols.add(COL_OF[cell]!);
          }
          
          // If all candidates are in the same row (pointing)
          if (rows.size === 1) {
            const row = rows.values().next().value as number;
            const rowCells = HOUSES[row]!;
            
            // Eliminate this digit from the rest of the row (outside the box)
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of rowCells) {
              if (BOX_OF[cell] !== box && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              const rowNum = row + 1;
              const boxNum = box + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [boxCells[0]], 
                  candidates: candidatesInBox.map(c => ({ cell: c, digit })), 
                  links: [] 
                },
                explanation: {
                  zh: `宫${boxNum}中数字${digit}的候选数都在行${rowNum}中，因此行${rowNum}其他位置的${digit}可删除（指向数对）`,
                  en: `All candidates for digit ${digit} in box ${boxNum} are in row ${rowNum}, so ${digit} can be eliminated from other cells in row ${rowNum} (Pointing).`,
                },
              };
            }
          }
          
          // If all candidates are in the same column (pointing)
          if (cols.size === 1) {
            const col = cols.values().next().value as number;
            const colCells = HOUSES[9 + col]!;
            
            // Eliminate this digit from the rest of the column (outside the box)
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of colCells) {
              if (BOX_OF[cell] !== box && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              const colNum = col + 1;
              const boxNum = box + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [boxCells[0]], 
                  candidates: candidatesInBox.map(c => ({ cell: c, digit })), 
                  links: [] 
                },
                explanation: {
                  zh: `宫${boxNum}中数字${digit}的候选数都在列${colNum}中，因此列${colNum}其他位置的${digit}可删除（指向数对）`,
                  en: `All candidates for digit ${digit} in box ${boxNum} are in column ${colNum}, so ${digit} can be eliminated from other cells in column ${colNum} (Pointing).`,
                },
              };
            }
          }
        }
      }
    }
    
    // Now, check claiming: candidates in a row/column are confined to one box
    for (let row = 0; row < 9; row++) {
      const rowCells = HOUSES[row]!;
      
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        const candidatesInRow: number[] = [];
        
        // Find all candidates for this digit in the row
        for (const cell of rowCells) {
          if (grid.hasCandidate(cell, digit)) {
            candidatesInRow.push(cell);
          }
        }
        
        // If there are candidates in the row
        if (candidatesInRow.length > 0) {
          // Check if all candidates are in the same box
          const boxes = new Set<number>();
          
          for (const cell of candidatesInRow) {
            boxes.add(BOX_OF[cell]!);
          }
          
          // If all candidates are in the same box (claiming)
          if (boxes.size === 1) {
            const box = boxes.values().next().value as number;
            const boxCells = HOUSES[18 + box]!;
            
            // Eliminate this digit from the rest of the box (outside the row)
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of boxCells) {
              if (ROW_OF[cell] !== row && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              const rowNum = row + 1;
              const boxNum = box + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [rowCells[0]], 
                  candidates: candidatesInRow.map(c => ({ cell: c, digit })), 
                  links: [] 
                },
                explanation: {
                  zh: `行${rowNum}中数字${digit}的候选数都在宫${boxNum}中，因此宫${boxNum}其他位置的${digit}可删除（声明/占位排除）`,
                  en: `All candidates for digit ${digit} in row ${rowNum} are in box ${boxNum}, so ${digit} can be eliminated from other cells in box ${boxNum} (Claiming).`,
                },
              };
            }
          }
        }
      }
    }
    
    for (let col = 0; col < 9; col++) {
      const colCells = HOUSES[9 + col]!;
      
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        const candidatesInCol: number[] = [];
        
        // Find all candidates for this digit in the column
        for (const cell of colCells) {
          if (grid.hasCandidate(cell, digit)) {
            candidatesInCol.push(cell);
          }
        }
        
        // If there are candidates in the column
        if (candidatesInCol.length > 0) {
          // Check if all candidates are in the same box
          const boxes = new Set<number>();
          
          for (const cell of candidatesInCol) {
            boxes.add(BOX_OF[cell]!);
          }
          
          // If all candidates are in the same box (claiming)
          if (boxes.size === 1) {
            const box = boxes.values().next().value as number;
            const boxCells = HOUSES[18 + box]!;
            
            // Eliminate this digit from the rest of the box (outside the column)
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of boxCells) {
              if (COL_OF[cell] !== col && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              const colNum = col + 1;
              const boxNum = box + 1;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [colCells[0]], 
                  candidates: candidatesInCol.map(c => ({ cell: c, digit })), 
                  links: [] 
                },
                explanation: {
                  zh: `列${colNum}中数字${digit}的候选数都在宫${boxNum}中，因此宫${boxNum}其他位置的${digit}可删除（声明/占位排除）`,
                  en: `All candidates for digit ${digit} in column ${colNum} are in box ${boxNum}, so ${digit} can be eliminated from other cells in box ${boxNum} (Claiming).`,
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