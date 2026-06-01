/**
 * T2 STRATEGY — locked candidates (difficulty 20-30).
 * 
 * Includes pointing and claiming techniques:
 * - Pointing: candidates in a box are confined to one line, allowing elimination in that line outside the box
 * - Claiming: candidates in a line are confined to one box, allowing elimination in that box outside the line
 */

import { ROWS, COLS, BOXES, PEERS_OF, ROW_OF, COL_OF, BOX_OF, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 25,

  apply(grid: Grid): Step | null {
    // Try pointing first: candidates in a box are confined to one line
    for (let box = 0; box < 9; box++) {
      const boxCells = BOXES[box]!;
      
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        const boxCellsWithDigit = boxCells.filter(cell => 
          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
        );
        
        if (boxCellsWithDigit.length < 2) continue; // Need at least 2 cells to be meaningful
        
        // Check if all the cells with this digit in the box are in the same row
        const rowsWithDigit = new Set<number>();
        for (const cell of boxCellsWithDigit) {
          const row = ROW_OF[cell];
          if (row !== undefined) {
            rowsWithDigit.add(row);
          }
        }
        if (rowsWithDigit.size === 1) {
          // Pointing: all candidates for this digit in the box are in the same row
          const row = Array.from(rowsWithDigit)[0]!;
          
          // Eliminate this digit from the rest of the row (outside the box)
          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of ROWS[row]!) {
            if (BOX_OF[cell] !== box && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
              eliminations.push({ cell, digit });
            }
          }
          
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: boxCellsWithDigit,
                candidates: boxCellsWithDigit.map(cell => ({ cell, digit })),
                links: []
              },
              explanation: {
                zh: `第 ${box + 1} 宫中数字 ${digit} 的候选位置都被限制在同一行（指向排除）。因此，在该行中但不在该宫内的其他位置不能有数字 ${digit}。`,
                en: `In box ${box + 1}, digit ${digit} is confined to the same row (Pointing). Therefore, digit ${digit} can be eliminated from other cells in that row but outside that box.`,
              },
            };
          }
        }
        
        // Check if all the cells with this digit in the box are in the same column
        const colsWithDigit = new Set<number>();
        for (const cell of boxCellsWithDigit) {
          const col = COL_OF[cell];
          if (col !== undefined) {
            colsWithDigit.add(col);
          }
        }
        if (colsWithDigit.size === 1) {
          // Pointing: all candidates for this digit in the box are in the same column
          const col = Array.from(colsWithDigit)[0]!;
          
          // Eliminate this digit from the rest of the column (outside the box)
          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of COLS[col]!) {
            if (BOX_OF[cell] !== box && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
              eliminations.push({ cell, digit });
            }
          }
          
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: boxCellsWithDigit,
                candidates: boxCellsWithDigit.map(cell => ({ cell, digit })),
                links: []
              },
              explanation: {
                zh: `第 ${box + 1} 宫中数字 ${digit} 的候选位置都被限制在同一列（指向排除）。因此，在该列中但不在该宫内的其他位置不能有数字 ${digit}。`,
                en: `In box ${box + 1}, digit ${digit} is confined to the same column (Pointing). Therefore, digit ${digit} can be eliminated from other cells in that column but outside that box.`,
              },
            };
          }
        }
      }
    }
    
    // Try claiming: candidates in a line are confined to one box
    for (let unitIndex = 0; unitIndex < 18; unitIndex++) { // Process rows and columns
      const isRow = unitIndex < 9;
      const unitCells = isRow ? ROWS[unitIndex]! : COLS[unitIndex - 9]!;
      
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        const unitCellsWithDigit = unitCells.filter(cell => 
          grid.get(cell) === 0 && grid.hasCandidate(cell, digit)
        );
        
        if (unitCellsWithDigit.length < 2) continue; // Need at least 2 cells to be meaningful
        
        // Check if all the cells with this digit in the line are in the same box
        const boxesWithDigit = new Set<number>();
        for (const cell of unitCellsWithDigit) {
          const box = BOX_OF[cell];
          if (box !== undefined) {
            boxesWithDigit.add(box);
          }
        }
        if (boxesWithDigit.size === 1) {
          // Claiming: all candidates for this digit in the line are in the same box
          const box = Array.from(boxesWithDigit)[0]!;
          
          // Eliminate this digit from the rest of the box (outside the line)
          const eliminations: { cell: number; digit: number }[] = [];
          for (const cell of BOXES[box]!) {
            if ((isRow ? ROW_OF[cell]! !== unitIndex : COL_OF[cell]! !== (unitIndex - 9)) &&
                grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
              eliminations.push({ cell, digit });
            }
          }
          
          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: unitCellsWithDigit,
                candidates: unitCellsWithDigit.map(cell => ({ cell, digit })),
                links: []
              },
              explanation: {
                zh: `${isRow ? '第 ' + (unitIndex + 1) + ' 行' : '第 ' + (unitIndex - 9 + 1) + ' 列'}中数字 ${digit} 的候选位置都被限制在同一宫内（声明排除）。因此，在该宫中但不在该行/列内的其他位置不能有数字 ${digit}。`,
                en: `In ${isRow ? 'row ' + (unitIndex + 1) : 'column ' + (unitIndex - 9 + 1)}, digit ${digit} is confined to the same box (Claiming). Therefore, digit ${digit} can be eliminated from other cells in that box but outside that line.`,
              },
            };
          }
        }
      }
    }
    
    return null;
  },
};