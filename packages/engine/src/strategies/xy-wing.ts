/**
 * XY-Wing (T3).
 *
 * Pivot {X,Y} sees pincers {X,Z} and {Y,Z}.
 * Candidate Z is removed from cells seeing both pincers.
 */

import { digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all bivalue cells (cells with exactly 2 candidates)
    const bivalueCells: number[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.hasCandidate(cell, 1)) { // Check if cell is empty
        const candidates = grid.candidatesOf(cell);
        if (digitsOf(candidates).length === 2) {
          bivalueCells.push(cell);
        }
      }
    }
    
    // Try each bivalue cell as a potential pivot
    for (const pivot of bivalueCells) {
      const pivotCandidates = digitsOf(grid.candidatesOf(pivot));
      const x = pivotCandidates[0]!;
      const y = pivotCandidates[1]!;
      
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
      
      // Look for two pincers that form a valid XY-wing
      for (let i = 0; i < potentialPincers.length; i++) {
        const pincer1 = potentialPincers[i]!;
        const x1 = pincer1.candidates[0]!;
        const z1 = pincer1.candidates[1]!;
        
        for (let j = i + 1; j < potentialPincers.length; j++) {
          const pincer2 = potentialPincers[j]!;
          const y2 = pincer2.candidates[0]!;
          const z2 = pincer2.candidates[1]!;
          
          // Check if we have a valid XY-wing pattern:
          // - Pivot has candidates {X,Y}  
          // - Pincer1 has candidates {X,Z}
          // - Pincer2 has candidates {Y,Z}
          if (x1 === x && y2 === y && z1 === z2) {
            // Found valid XY-wing pattern
            
            // Find cells that see both pincers
            const pincer1Peers = PEERS_OF[pincer1.cell]!;
            const pincer2Peers = PEERS_OF[pincer2.cell]!;
            
            const cellsSeeingBothPincers: number[] = [];
            
            for (let cell = 0; cell < 81; cell++) {
              if (cell === pivot || cell === pincer1.cell || cell === pincer2.cell) continue;
              
              // Check if cell sees both pincers (is peer of both)
              if (pincer1Peers.includes(cell) && pincer2Peers.includes(cell)) {
                cellsSeeingBothPincers.push(cell);
              }
            }
            
            // Eliminate Z from cells seeing both pincers
            const eliminations = cellsSeeingBothPincers
              .filter(cell => grid.hasCandidate(cell, z1))
              .map(cell => ({ cell, digit: z1 }));
            
            if (eliminations.length > 0) {
              const highlightCells = [pivot, pincer1.cell, pincer2.cell];
              const highlightCandidates = [
                { cell: pivot, digit: x },
                { cell: pivot, digit: y },
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
                  zh: `发现XY翼模式：支点R${Math.floor(pivot/9)+1}C${pivot%9+1}的候选数为{${x},${y}}，两个臂分别为{${x},${z1}}和{${y},${z2}}，可从相关单元格中消除候选数${z1}`,
                  en: `Found XY-Wing pattern: pivot R${Math.floor(pivot/9)+1}C${pivot%9+1} has candidates {${x},${y}}, pincers are {${x},${z1}} and {${y},${z2}}, can eliminate candidate ${z1} from related cells.`,
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