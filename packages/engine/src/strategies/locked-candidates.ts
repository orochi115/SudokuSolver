/**
 * T2 STRATEGY — locked candidates (pointing/claiming) (difficulty 20).
 *
 * Pointing: When candidates for a digit in a box are confined to one line, 
 * eliminate that digit from the rest of the line outside the box.
 * 
 * Claiming: When candidates for a digit in a line are confined to one box,
 * eliminate that digit from the rest of the box outside the line.
 */

import { HOUSES, ROWS, COLS, BOXES, CELLS, BOX_OF, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    // Pointing: Check boxes for candidates confined to one line
    for (let box = 0; box < 9; box++) {
      for (let digit = 1; digit <= 9; digit++) {
        const boxCells = BOXES[box]!;
        const candidatesInBox: number[] = [];
        
        for (const cell of boxCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            candidatesInBox.push(cell);
          }
        }
        
        // Check if all candidates in the box are in the same row
        if (candidatesInBox.length >= 2 && candidatesInBox.length <= 3) { // Need at least 2, max 3 for one row
          const rowsWithCandidates = new Set(candidatesInBox.map(cell => ROW_OF[cell]!));
          if (rowsWithCandidates.size === 1) {
            // Pointing: All candidates in same row
            const targetRow = Array.from(rowsWithCandidates)[0]!; // Extract the single row
            const rowCells = ROWS[targetRow]!;
            
            // Find eliminations in the row but outside the box
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of rowCells) {
              if (!boxCells.includes(cell) && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [...candidatesInBox, ...eliminations.map(e => e.cell)], 
                  candidates: [...candidatesInBox.map(cell => ({ cell, digit }))], 
                  links: [] 
                },
                explanation: {
                  zh: `数字 ${digit} 在第${box + 1}宫的所有候选位置都在第${targetRow + 1}行中，因此可以从该行在第${box + 1}宫外的其他位置中删除候选数 ${digit}（区块排除 - 指向）`,
                  en: `Digit ${digit} in box ${box + 1} is confined to row ${targetRow + 1}, so ${digit} can be eliminated from other cells in that row outside box ${box + 1} (Locked Candidates - Pointing)`,
                },
              };
            }
          }
          
          // Check if all candidates in the box are in the same column
          const colsWithCandidates = new Set(candidatesInBox.map(cell => COL_OF[cell]!));
          if (colsWithCandidates.size === 1) {
            // Pointing: All candidates in same column
            const targetCol = Array.from(colsWithCandidates)[0]!; // Extract the single column
            const colCells = COLS[targetCol]!;
            
            // Find eliminations in the column but outside the box
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of colCells) {
              if (!boxCells.includes(cell) && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [...candidatesInBox, ...eliminations.map(e => e.cell)], 
                  candidates: [...candidatesInBox.map(cell => ({ cell, digit }))], 
                  links: [] 
                },
                explanation: {
                  zh: `数字 ${digit} 在第${box + 1}宫的所有候选位置都在第${targetCol + 1}列中，因此可以从该列在第${box + 1}宫外的其他位置中删除候选数 ${digit}（区块排除 - 指向）`,
                  en: `Digit ${digit} in box ${box + 1} is confined to column ${targetCol + 1}, so ${digit} can be eliminated from other cells in that column outside box ${box + 1} (Locked Candidates - Pointing)`,
                },
              };
            }
          }
        }
      }
    }
    
    // Claiming: Check rows for candidates confined to one box
    for (let row = 0; row < 9; row++) {
      for (let digit = 1; digit <= 9; digit++) {
        const rowCells = ROWS[row]!;
        const candidatesInRow: number[] = [];
        
        for (const cell of rowCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            candidatesInRow.push(cell);
          }
        }
        
        // Check if all candidates in the row are in the same box
        if (candidatesInRow.length >= 2 && candidatesInRow.length <= 3) { // Need at least 2, max 3 for one box
          const boxWithCandidates = new Set(candidatesInRow.map(cell => BOX_OF[cell]!));
          if (boxWithCandidates.size === 1) {
            // Claiming: All candidates in same box
            const targetBox = Array.from(boxWithCandidates)[0]!; // Extract the single box
            const boxCells = BOXES[targetBox]!;
            
            // Find eliminations in the box but outside the row
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of boxCells) {
              if (!rowCells.includes(cell) && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [...candidatesInRow, ...eliminations.map(e => e.cell)], 
                  candidates: [...candidatesInRow.map(cell => ({ cell, digit }))], 
                  links: [] 
                },
                explanation: {
                  zh: `数字 ${digit} 在第${row + 1}行的所有候选位置都在第${targetBox + 1}宫中，因此可以从该宫在第${row + 1}行外的其他位置中删除候选数 ${digit}（区块排除 - 声明）`,
                  en: `Digit ${digit} in row ${row + 1} is confined to box ${targetBox + 1}, so ${digit} can be eliminated from other cells in that box outside row ${row + 1} (Locked Candidates - Claiming)`,
                },
              };
            }
          }
        }
      }
    }
    
    // Claiming: Check columns for candidates confined to one box
    for (let col = 0; col < 9; col++) {
      for (let digit = 1; digit <= 9; digit++) {
        const colCells = COLS[col]!;
        const candidatesInCol: number[] = [];
        
        for (const cell of colCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            candidatesInCol.push(cell);
          }
        }
        
        // Check if all candidates in the column are in the same box
        if (candidatesInCol.length >= 2 && candidatesInCol.length <= 3) { // Need at least 2, max 3 for one box
          const boxWithCandidates = new Set(candidatesInCol.map(cell => BOX_OF[cell]!));
          if (boxWithCandidates.size === 1) {
            // Claiming: All candidates in same box
            const targetBox = Array.from(boxWithCandidates)[0]!; // Extract the single box
            const boxCells = BOXES[targetBox]!;
            
            // Find eliminations in the box but outside the column
            const eliminations: { cell: number; digit: number }[] = [];
            for (const cell of boxCells) {
              if (!colCells.includes(cell) && grid.hasCandidate(cell, digit)) {
                eliminations.push({ cell, digit });
              }
            }
            
            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: [...candidatesInCol, ...eliminations.map(e => e.cell)], 
                  candidates: [...candidatesInCol.map(cell => ({ cell, digit }))], 
                  links: [] 
                },
                explanation: {
                  zh: `数字 ${digit} 在第${col + 1}列的所有候选位置都在第${targetBox + 1}宫中，因此可以从该宫在第${col + 1}列外的其他位置中删除候选数 ${digit}（区块排除 - 声明）`,
                  en: `Digit ${digit} in column ${col + 1} is confined to box ${targetBox + 1}, so ${digit} can be eliminated from other cells in that box outside column ${col + 1} (Locked Candidates - Claiming)`,
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