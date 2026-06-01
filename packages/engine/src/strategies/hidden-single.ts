/**
 * T1 STRATEGY — hidden single (difficulty 10).
 *
 * A digit has only one possible cell in a house (row/column/box).
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // Check each house for hidden singles
    for (const [houseIndex, house] of HOUSES.entries()) {
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        let possibleCells: number[] = [];
        
        // Find all cells in this house where this digit is a candidate
        for (const cell of house) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }
        
        // If there's only one possible cell for this digit in this house
        if (possibleCells.length === 1) {
          const cell = possibleCells[0]!;
          
          // Determine the house type for explanation
          let houseType: string;
          let houseNumber: number;
          if (houseIndex < 9) {
            // Row
            houseType = 'row';
            houseNumber = houseIndex + 1;
          } else if (houseIndex < 18) {
            // Column
            houseType = 'column';
            houseNumber = (houseIndex - 9) + 1;
          } else {
            // Box
            houseType = 'box';
            houseNumber = (houseIndex - 18) + 1;
          }
          
          const r = ROW_OF[cell]! + 1;
          const c = COL_OF[cell]! + 1;
          
          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: { 
              cells: [cell], 
              candidates: [{ cell, digit }], 
              links: [] 
            },
            explanation: {
              zh: `数字 ${digit} 在第 ${houseNumber} ${houseType === 'row' ? '行' : houseType === 'column' ? '列' : '宫'} 中只有一个可能位置 R${r}C${c}，因此填入 ${digit}（隐性唯一）。`,
              en: `Digit ${digit} has only one possible cell in ${houseType} ${houseNumber}: R${r}C${c}, so it must be ${digit} (Hidden Single).`,
            },
          };
        }
      }
    }
    
    return null;
  },
};