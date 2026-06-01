/**
 * XYZ-Wing (T3).
 *
 * Pivot {X,Y,Z} sees pincers {X,Z} and {Y,Z}.
 * Candidate Z is removed from cells seeing the pivot and both pincers.
 */

import { digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all trivalue cells (cells with exactly 3 candidates)
    const trivalueCells: number[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.hasCandidate(cell, 1)) { // Check if cell is empty
        const candidates = grid.candidatesOf(cell);
        if (digitsOf(candidates).length === 3) {
          trivalueCells.push(cell);
        }
      }
    }
    
    // Try each trivalue cell as a potential pivot
    for (const pivot of trivalueCells) {
      const pivotCandidates = digitsOf(grid.candidatesOf(pivot));
      const x = pivotCandidates[0]!;
      const y = pivotCandidates[1]!;
      const z = pivotCandidates[2]!;
      
      // Find peers of the pivot that have exactly 2 candidates
      const peers = PEERS_OF[pivot]!;
      const potentialPincers: {cell: number, candidates: number[]}[] = [];
      
      for (const peer of peers) {
        if (grid.hasCandidate(peer, 1)) { // Ensure cell is empty
          const peerCandidates = digitsOf(grid.candidatesOf(peer));
          if (peerCandidates.length === 2) {
            potentialPincers.push({ cell: peer, candidates: peerCandidates });
          }
        }
      }
      
      // Look for two pincers that form a valid XYZ-wing
      for (let i = 0; i < potentialPincers.length; i++) {
        const pincer1 = potentialPincers[i]!;
        const x1 = pincer1.candidates[0]!;
        const z1 = pincer1.candidates[1]!;
        
        for (let j = i + 1; j < potentialPincers.length; j++) {
          const pincer2 = potentialPincers[j]!;
          const y2 = pincer2.candidates[0]!;
          const z2 = pincer2.candidates[1]!;
          
          // Check if we have a valid XYZ-wing pattern:
          // - Pivot has candidates {X,Y,Z}  
          // - Pincer1 has candidates {X,Z}
          // - Pincer2 has candidates {Y,Z}
          if (x1 === x && y2 === y && z1 === z2 && z1 === z) {
            // Found valid XYZ-wing pattern
            
            // Find cells that see the pivot and both pincers
            const pincer1Peers = PEERS_OF[pincer1.cell]!;
            const pincer2Peers = PEERS_OF[pincer2.cell]!;
            
            const cellsSeeingPivotAndBothPincers: number[] = [];
            
            for (let cell = 0; cell < 81; cell++) {
              if (cell === pivot || cell === pincer1.cell || cell === pincer2.cell) continue;
              
              // Check if cell sees the pivot and both pincers
              if (PEERS_OF[cell]!.includes(pivot) && 
                  pincer1Peers.includes(cell) && 
                  pincer2Peers.includes(cell)) {
                cellsSeeingPivotAndBothPincers.push(cell);
              }
            }
            
            // Eliminate Z from cells seeing the pivot and both pincers
            const eliminations = cellsSeeingPivotAndBothPincers
              .filter(cell => grid.hasCandidate(cell, z))
              .map(cell => ({ cell, digit: z }));
            
            if (eliminations.length > 0) {
              const highlightCells = [pivot, pincer1.cell, pincer2.cell];
              const highlightCandidates = [
                { cell: pivot, digit: x },
                { cell: pivot, digit: y },
                { cell: pivot, digit: z },
                { cell: pincer1.cell, digit: x1 },
                { cell: pincer1.cell, digit: z1 },
                { cell: pincer2.cell, digit: y2 },
                { cell: pincer2.cell, digit: z2 }
              ];
              
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: highlightCells, 
                  candidates: highlightCandidates, 
                  links: [] 
                },
                explanation: {
                  zh: `发现XYZ翼模式：支点R${Math.floor(pivot/9)+1}C${pivot%9+1}的候选数为{${x},${y},${z}}，两个臂分别为{${x},${z}}和{${y},${z}}，可从相关单元格中消除候选数${z}`,
                  en: `Found XYZ-Wing pattern: pivot R${Math.floor(pivot/9)+1}C${pivot%9+1} has candidates {${x},${y},${z}}, pincers are {${x},${z}} and {${y},${z}}, can eliminate candidate ${z} from related cells.`,
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