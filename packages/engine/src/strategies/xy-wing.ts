/**
 * T3 STRATEGY — XY-Wing (difficulty 50).
 * 
 * An XY-Wing consists of three cells:
 * - Pivot (bivalue): XY
 * - Pincer 1 (bivalue): XZ  
 * - Pincer 2 (bivalue): YZ
 * Where X, Y, Z are different digits.
 * Any cell that sees both pincers can have Z eliminated.
 */

import { PEERS_OF, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
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
    
    // For each bivalue cell as potential pivot
    for (const { cell: pivot, candidates: pivotCandidates } of bivalueCells) {
      const [x, y] = digitsOf(pivotCandidates); // Get the two digits in the pivot
      if (!x || !y) continue;
      
      // Find pincer cells that share one digit with the pivot
      const pincer1Candidates = maskOf(x); // Looking for XZ cells
      const pincer2Candidates = maskOf(y); // Looking for YZ cells
      
      // Find cells that have X and one other digit (XZ pattern)
      const xzCells = bivalueCells.filter(({ cell: c, candidates }) => 
        c !== pivot && 
        PEERS_OF[pivot]!.includes(c) && 
        (candidates & maskOf(x)) !== 0 // Contains X
      );
      
      for (const { cell: xzCell, candidates: xzCandidates } of xzCells) {
        // Get the Z digit (not X)
        const zDigit = digitsOf(xzCandidates).find(d => d !== x);
        if (!zDigit) continue;
        
        // Now find the YZ cell that can see the pivot and has Y
        const yzCells = bivalueCells.filter(({ cell: c, candidates }) => 
          c !== pivot && 
          c !== xzCell && 
          (candidates & maskOf(y)) !== 0 && // Contains Y
          (candidates & maskOf(zDigit)) !== 0 && // Contains Z  
          popcount(candidates & ~(maskOf(y) | maskOf(zDigit))) === 0 // Only Y and Z
        );
        
        for (const { cell: yzCell, candidates: yzCandidates } of yzCells) {
          // Verify that yzCell has only Y and Z
          if (popcount(yzCandidates) !== 2) continue;
          
          // Check if yzCell can see the pivot
          if (!PEERS_OF[pivot]!.includes(yzCell)) continue;
          
          // Check that xzCell and yzCell are not peers of each other
          // (otherwise the pattern would be degenerate)
          if (PEERS_OF[xzCell]!.includes(yzCell)) continue;
          
          // Find cells that can see both xzCell and yzCell
          const sharedPeers = PEERS_OF[xzCell]!.filter(cell => 
            PEERS_OF[yzCell]!.includes(cell) && 
            grid.get(cell) === 0 && 
            grid.hasCandidate(cell, zDigit)
          );
          
          if (sharedPeers.length > 0) {
            const eliminations = sharedPeers.map(cell => ({ cell, digit: zDigit }));
            
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot, xzCell, yzCell, ...sharedPeers],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: xzCell, digit: x },
                  { cell: xzCell, digit: zDigit },
                  { cell: yzCell, digit: y },
                  { cell: yzCell, digit: zDigit },
                  ...sharedPeers.map(cell => ({ cell, digit: zDigit }))
                ],
                links: []
              },
              explanation: {
                zh: `XY翼：枢纽 R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} (${x}${y})，夹钳 R${ROW_OF[xzCell]! + 1}C${COL_OF[xzCell]! + 1} (${x}${zDigit}) 和 R${ROW_OF[yzCell]! + 1}C${COL_OF[yzCell]! + 1} (${y}${zDigit})。任何能同时看到两个夹钳的格子都不能有数字 ${zDigit}。`,
                en: `XY-Wing: pivot R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} (${x}${y}), pincers R${ROW_OF[xzCell]! + 1}C${COL_OF[xzCell]! + 1} (${x}${zDigit}) and R${ROW_OF[yzCell]! + 1}C${COL_OF[yzCell]! + 1} (${y}${zDigit}). Any cell seeing both pincers cannot have digit ${zDigit}.`,
              },
            };
          }
        }
      }
    }
    
    return null;
  },
};
