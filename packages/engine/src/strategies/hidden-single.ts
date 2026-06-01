/**
 * Hidden Single (T1).
 *
 * If a digit has only one possible cell in a house, place it.
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
    // For each house (row, column, box)
    for (const house of HOUSES) {
      // For each digit 1-9
      for (let digit = 1; digit <= 9; digit++) {
        let candidateCell: number | null = null;
        let count = 0;

        // Find all cells in this house that have this digit as a candidate
        for (const cell of house) {
          if (grid.hasCandidate(cell, digit)) {
            candidateCell = cell;
            count++;
          }
        }

        // If exactly one cell has this digit as a candidate, we found a hidden single
        if (count === 1 && candidateCell !== null) {
          const r = ROW_OF[candidateCell]! + 1;
          const c = COL_OF[candidateCell]! + 1;
          const b = BOX_OF[candidateCell]! + 1;
          
          return {
            strategyId: this.id,
            placements: [{ cell: candidateCell, digit }],
            eliminations: [],
            highlights: { 
              cells: [candidateCell], 
              candidates: [{ cell: candidateCell, digit }], 
              links: [] 
            },
            explanation: {
              zh: `在宫${b}中，数字${digit}只能放在R${r}C${c}（隐性唯一）`,
              en: `In box ${b}, digit ${digit} can only go in R${r}C${c} (Hidden Single).`,
            },
          };
        }
      }
    }
    
    return null;
  },
};