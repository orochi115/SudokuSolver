/**
 * T1 STRATEGY — hidden single (difficulty 10).
 *
 * When a digit has only one possible cell in a house, place it there.
 */

import { HOUSES, ROWS, COLS, BOXES, CELLS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // For each house
    for (const house of HOUSES) {
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        let possibleCells: number[] = [];
        
        // Find all cells in the house where this digit is a candidate
        for (const cell of house) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
            possibleCells.push(cell);
          }
        }
        
        // If there's exactly one possible cell for this digit in this house
        if (possibleCells.length === 1) {
          const cell = possibleCells[0]!;
          const r = Math.floor(cell / 9) + 1;
          const c = (cell % 9) + 1;
          
          // Determine the type of house for explanation
          let houseType = "";
          const houseIndex = HOUSES.indexOf(house as any);
          if (houseIndex < 9) {
            houseType = `第${houseIndex + 1}行`;
          } else if (houseIndex < 18) {
            houseType = `第${houseIndex - 8}列`; // 9-17 maps to 1-9
          } else {
            houseType = `第${houseIndex - 17}宫`; // 18-26 maps to 1-9
          }
          
          return {
            strategyId: this.id,
            placements: [{ cell, digit }],
            eliminations: [],
            highlights: { 
              cells: house.filter(c => grid.get(c) === 0), 
              candidates: [{ cell, digit }], 
              links: [] 
            },
            explanation: {
              zh: `数字 ${digit} 在${houseType}中只有一个可能位置 R${r}C${c}，因此填入 ${digit}（隐性唯一）`,
              en: `Digit ${digit} has only one possible cell R${r}C${c} in its ${houseType}, so it must be ${digit} (Hidden Single)`,
            },
          };
        }
      }
    }
    return null;
  },
};