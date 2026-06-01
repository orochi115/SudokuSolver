/**
 * T1 STRATEGY — full house (difficulty 10).
 *
 * A house has only one empty cell left, so it must contain the missing digit.
 */

import { HOUSES, ROW_OF, COL_OF, ALL_CANDIDATES, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fullHouse: Strategy = {
  id: 'full-house',
  name: { zh: '全屋唯一', en: 'Full House' },
  difficulty: 10,

  apply(grid: Grid): Step | null {
    // Check each house for full house
    for (const [houseIndex, house] of HOUSES.entries()) {
      let emptyCells: number[] = [];
      let placedDigitsMask = 0;
      
      // Find empty cells and digits already placed in the house
      for (const cell of house) {
        const value = grid.get(cell);
        if (value !== 0) {
          placedDigitsMask |= maskOf(value);
        } else {
          emptyCells.push(cell);
        }
      }
      
      // If there's only one empty cell in the house
      if (emptyCells.length === 1) {
        const cell = emptyCells[0]!;
        
        // Calculate the missing digit
        const missingDigitMask = ALL_CANDIDATES & ~placedDigitsMask;
        if (popcount(missingDigitMask) === 1) {
          const digit = digitsOf(missingDigitMask)[0]!;
          
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
              zh: `第 ${houseNumber} ${houseType === 'row' ? '行' : houseType === 'column' ? '列' : '宫'} 中只剩下 R${r}C${c} 一个空格，必须填入缺少的数字 ${digit}（全屋唯一）。`,
              en: `${houseType} ${houseNumber} has only one empty cell R${r}C${c}, which must be the missing digit ${digit} (Full House).`,
            },
          };
        }
      }
    }
    
    return null;
  },
};