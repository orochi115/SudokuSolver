/**
 * Full House (T1).
 *
 * The last empty cell in a house.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // For each house (row, column, box)
    for (const house of HOUSES) {
      // Count empty cells in this house
      let emptyCount = 0;
      let emptyCell: number | null = null;
      
      for (const cell of house) {
        if (grid.get(cell) === 0) {
          emptyCount++;
          emptyCell = cell;
        }
      }
      
      // If exactly one cell is empty, we found a full house
      if (emptyCount === 1 && emptyCell !== null) {
        // The only digit that can go in this cell is the one missing from the house
        let missingDigit = 0;
        const usedDigits = new Set<number>();
        
        for (const cell of house) {
          const value = grid.get(cell);
          if (value !== 0) {
            usedDigits.add(value);
          }
        }
        
        for (let digit = 1; digit <= 9; digit++) {
          if (!usedDigits.has(digit)) {
            missingDigit = digit;
            break;
          }
        }
        
        const r = ROW_OF[emptyCell]! + 1;
        const c = COL_OF[emptyCell]! + 1;
        const b = BOX_OF[emptyCell]! + 1;
        
        return {
          strategyId: this.id,
          placements: [{ cell: emptyCell, digit: missingDigit }],
          eliminations: [],
          highlights: { 
            cells: [emptyCell], 
            candidates: [], 
            links: [] 
          },
          explanation: {
            zh: `在宫${b}中，只剩R${r}C${c}一个空格，必须填入数字${missingDigit}（全屋唯一）`,
            en: `In box ${b}, only R${r}C${c} is empty, so it must be ${missingDigit} (Full House).`,
          },
        };
      }
    }
    
    return null;
  },
};