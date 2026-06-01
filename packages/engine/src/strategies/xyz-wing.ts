/**
 * T3 STRATEGY — XYZ-Wing (difficulty 50).
 * 
 * An XYZ-Wing consists of three cells:
 * - Pivot (trivalue): XYZ
 * - Pincer 1 (bivalue): XZ  
 * - Pincer 2 (bivalue): YZ
 * Where X, Y, Z are different digits.
 * Any cell that sees all three cells can have Z eliminated.
 */

import { PEERS_OF, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all trivalue cells (cells with exactly 3 candidates)
    const trivalueCells = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0) {
        const candidates = grid.candidatesOf(cell);
        if (popcount(candidates) === 3) {
          trivalueCells.push({ cell, candidates });
        }
      }
    }
    
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
    
    // For each trivalue cell as potential pivot
    for (const { cell: pivot, candidates: pivotCandidates } of trivalueCells) {
      const [x, y, z] = digitsOf(pivotCandidates); // Get the three digits in the pivot
      if (!x || !y || !z) continue;
      
      // Find bivalue cells that contain Z and either X or Y
      const xzCells = bivalueCells.filter(({ cell: c, candidates }) => 
        c !== pivot && 
        PEERS_OF[pivot]!.includes(c) && 
        (candidates & maskOf(z)) !== 0 && // Contains Z
        (candidates & maskOf(x)) !== 0 && // Contains X
        popcount(candidates & ~(maskOf(x) | maskOf(z))) === 0 // Only X and Z
      );
      
      const yzCells = bivalueCells.filter(({ cell: c, candidates }) => 
        c !== pivot && 
        PEERS_OF[pivot]!.includes(c) && 
        (candidates & maskOf(z)) !== 0 && // Contains Z
        (candidates & maskOf(y)) !== 0 && // Contains Y
        popcount(candidates & ~(maskOf(y) | maskOf(z))) === 0 // Only Y and Z
      );
      
      // Look for a valid XYZ-wing pattern
      for (const { cell: xzCell } of xzCells) {
        for (const { cell: yzCell } of yzCells) {
          if (xzCell === yzCell) continue; // Can't be the same cell
          
          // Find cells that can see all three cells (pivot, xzCell, yzCell)
          const sharedPeers = PEERS_OF[pivot]!.filter(cell => 
            PEERS_OF[xzCell]!.includes(cell) &&
            PEERS_OF[yzCell]!.includes(cell) &&
            grid.get(cell) === 0 && 
            grid.hasCandidate(cell, z)
          );
          
          if (sharedPeers.length > 0) {
            const eliminations = sharedPeers.map(cell => ({ cell, digit: z }));
            
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [pivot, xzCell, yzCell, ...sharedPeers],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: pivot, digit: z },
                  { cell: xzCell, digit: x },
                  { cell: xzCell, digit: z },
                  { cell: yzCell, digit: y },
                  { cell: yzCell, digit: z },
                  ...sharedPeers.map(cell => ({ cell, digit: z }))
                ],
                links: []
              },
              explanation: {
                zh: `XYZ翼：枢纽 R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} (${x}${y}${z})，夹钳 R${ROW_OF[xzCell]! + 1}C${COL_OF[xzCell]! + 1} (${x}${z}) 和 R${ROW_OF[yzCell]! + 1}C${COL_OF[yzCell]! + 1} (${y}${z})。任何能同时看到这三个格子的格子都不能有数字 ${z}。`,
                en: `XYZ-Wing: pivot R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} (${x}${y}${z}), pincers R${ROW_OF[xzCell]! + 1}C${COL_OF[xzCell]! + 1} (${x}${z}) and R${ROW_OF[yzCell]! + 1}C${COL_OF[yzCell]! + 1} (${y}${z}). Any cell seeing all three cells cannot have digit ${z}.`,
              },
            };
          }
        }
      }
    }
    
    return null;
  },
};