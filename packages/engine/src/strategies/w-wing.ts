/**
 * T3 STRATEGY — W-Wing (difficulty 50).
 * 
 * A W-Wing consists of:
 * - Two bivalue cells with the same candidates (W and X): WX
 * - A strong link between the X candidates in these cells
 * - Any cell that sees both W candidates can have W eliminated
 */

import { PEERS_OF, ROWS, COLS, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all bivalue cells (cells with exactly 2 candidates)
    const bivalueCells = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0) {
        const candidates = grid.candidatesOf(cell);
        if (popcount(candidates) === 2) {
          bivalueCells.push({ cell, candidates });
        }
      }
    }
    
    // For each bivalue cell as potential first wing
    for (const { cell: wing1, candidates: wing1Candidates } of bivalueCells) {
      const [w, x] = digitsOf(wing1Candidates); // Get the two digits in the first wing
      if (!w || !x) continue;
      
       // Find another bivalue cell with the same candidates (WX)
       const matchingWings = bivalueCells.filter(({ cell: c, candidates }) => 
         c !== wing1 && 
         candidates === wing1Candidates  // This works because they are the same bitmasks
       );
      
      for (const { cell: wing2, candidates: wing2Candidates } of matchingWings) {
        // Check if there's a strong link between the X candidates in these wings
        // A strong link exists if X appears only twice in a house (row, col, or box)
        
        // Check if the X candidates in both wings are in the same row, column, or box
        // and there are no other X candidates in that house
        const wing1XPos = wing1; // Position of X in wing1 (it's the same cell)
        const wing2XPos = wing2; // Position of X in wing2 (it's the same cell)
        
        // Check for strong link in row
        let strongLinkFound = false;
        let strongLinkType = '';
        let strongLinkLocation = 0;
        
        // Check if both X positions are in the same row
        if (ROW_OF[wing1] === ROW_OF[wing2]) {
          // Check if X appears only in these two positions in the row
          const row = ROW_OF[wing1]!;
          const xInRow = ROWS[row]!.filter(cell => 
            grid.get(cell) === 0 && grid.hasCandidate(cell, x)
          );
          if (xInRow.length === 2 && xInRow.includes(wing1) && xInRow.includes(wing2)) {
            strongLinkFound = true;
            strongLinkType = 'row';
            strongLinkLocation = row + 1;
          }
        }
        
        // Check for strong link in column
        if (!strongLinkFound && COL_OF[wing1] === COL_OF[wing2]) {
          // Check if X appears only in these two positions in the column
          const col = COL_OF[wing1]!;
          const xInCol = COLS[col]!.filter(cell => 
            grid.get(cell) === 0 && grid.hasCandidate(cell, x)
          );
          if (xInCol.length === 2 && xInCol.includes(wing1) && xInCol.includes(wing2)) {
            strongLinkFound = true;
            strongLinkType = 'column';
            strongLinkLocation = col + 1;
          }
        }
        
        if (strongLinkFound) {
          // Find cells that can see both W candidates (but not the X candidates)
          // Actually, the W-Wing works differently: the W candidates in both wings
          // can be used to eliminate W from cells that see both wings
          
          // The W in wing1 is the candidate other than X
          // The W in wing2 is the candidate other than X
          // So both wings have the same W, X candidates
          
          // Find cells that can see both wings and have W as candidate
          const sharedPeers = PEERS_OF[wing1]!.filter(cell => 
            PEERS_OF[wing2]!.includes(cell) && 
            grid.get(cell) === 0 && 
            grid.hasCandidate(cell, w)
          );
          
          if (sharedPeers.length > 0) {
            const eliminations = sharedPeers.map(cell => ({ cell, digit: w }));
            
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [wing1, wing2, ...sharedPeers],
                candidates: [
                  { cell: wing1, digit: w },
                  { cell: wing1, digit: x },
                  { cell: wing2, digit: w },
                  { cell: wing2, digit: x },
                  ...sharedPeers.map(cell => ({ cell, digit: w }))
                ],
                links: []
              },
              explanation: {
                zh: `W翼：两个相同候选数格 R${ROW_OF[wing1]! + 1}C${COL_OF[wing1]! + 1} 和 R${ROW_OF[wing2]! + 1}C${COL_OF[wing2]! + 1} 都含 (${w}${x})，并通过数字 ${x} 在第 ${strongLinkLocation} ${strongLinkType === 'row' ? '行' : '列'} 形成强链。任何能同时看到这两个格子的格子都不能有数字 ${w}。`,
                en: `W-Wing: two identical bivalue cells R${ROW_OF[wing1]! + 1}C${COL_OF[wing1]! + 1} and R${ROW_OF[wing2]! + 1}C${COL_OF[wing2]! + 1} both contain (${w}${x}), with a strong link on digit ${x} in ${strongLinkType} ${strongLinkLocation}. Any cell seeing both cells cannot have digit ${w}.`,
              },
            };
          }
        }
      }
    }
    
    return null;
  },
};