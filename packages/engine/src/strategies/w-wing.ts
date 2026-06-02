/**
 * T3 STRATEGY — W-Wing (difficulty 50).
 *
 * A W-Wing consists of two bivalue cells (called endpoints) with the same 
 * candidates XY, connected by a strong link on one of the digits (X).
 * Any cell that sees both endpoints can have the other digit (Y) eliminated.
 */

import { CELLS, PEERS_OF, popcount, digitsOf, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all bivalue cells
    const bivalueCells: number[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) === 0) {
        const mask = grid.candidatesOf(cell);
        if (popcount(mask) === 2) {
          bivalueCells.push(cell);
        }
      }
    }
    
    // Look for two cells that have the same two candidates (we'll call them ab)
    for (const cell1 of bivalueCells) {
      const mask1 = grid.candidatesOf(cell1);
      const digits1 = digitsOf(mask1);
      if (digits1.length !== 2) continue;
      
      const [a, b] = digits1;
      if (a === undefined || b === undefined) continue;
      
      for (const cell2 of bivalueCells) {
        if (cell2 <= cell1) continue; // Avoid duplicate checks and self-comparison
        
        // Check if cell2 has the same candidates as cell1
        const mask2 = grid.candidatesOf(cell2);
        const digits2 = digitsOf(mask2);
        if (digits2.length !== 2) continue;
        
        // Compare if both cells have the same digits
        if (digits2.includes(a) && digits2.includes(b) && digits2.length === 2) {
          // The two cells should not be peers (should not share a unit)
          if (PEERS_OF[cell1]!.includes(cell2)) continue;
          
          // Find strong links for digit 'a'
          const strongLinksA = findStrongLinks(grid, a);
          for (const [linkCell1, linkCell2] of strongLinksA) {
            // Check if cell1 sees linkCell1 and cell2 sees linkCell2 (or vice versa)
            const cell1SeesLink1 = PEERS_OF[cell1]!.includes(linkCell1);
            const cell1SeesLink2 = PEERS_OF[cell1]!.includes(linkCell2);
            const cell2SeesLink1 = PEERS_OF[cell2]!.includes(linkCell1);
            const cell2SeesLink2 = PEERS_OF[cell2]!.includes(linkCell2);
            
            // Valid W-Wing if: (cell1 sees one end of strong link) AND (cell2 sees the other end)
            if ((cell1SeesLink1 && cell2SeesLink2) || (cell1SeesLink2 && cell2SeesLink1)) {
              // Found a W-Wing: cell1(ab) and cell2(ab) connected by strong link on 'a' between linkCell1 and linkCell2
              // This means at least one of cell1 or cell2 must contain 'b', so 'b' can be eliminated 
              // from any cell that sees both cell1 and cell2
              
              const cell1Peers = new Set(PEERS_OF[cell1]!);
              const cell2Peers = new Set(PEERS_OF[cell2]!);
              const commonPeers: number[] = [];
              
              for (const peer of cell1Peers) {
                if (cell2Peers.has(peer) && peer !== cell1 && peer !== cell2 && grid.hasCandidate(peer, b)) {
                  commonPeers.push(peer);
                }
              }
              
              if (commonPeers.length > 0) {
                const eliminations = commonPeers.map(peer => ({ cell: peer, digit: b }));
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: [cell1, cell2],
                    candidates: [
                      { cell: cell1, digit: a }, { cell: cell1, digit: b },
                      { cell: cell2, digit: a }, { cell: cell2, digit: b }
                    ],
                    links: []
                  },
                  explanation: {
                    zh: `W翼: 两格 R${Math.floor(cell1 / 9) + 1}C${(cell1 % 9) + 1} (候选数 ${a}${b}) 和 R${Math.floor(cell2 / 9) + 1}C${(cell2 % 9) + 1} (候选数 ${a}${b}) 通过数字 ${a} 上的强链连接，因此可以从两格共同影响的格子中删除候选数 ${b}（W翼）`,
                    en: `W-Wing: Two cells R${Math.floor(cell1 / 9) + 1}C${(cell1 % 9) + 1} (candidates ${a}${b}) and R${Math.floor(cell2 / 9) + 1}C${(cell2 % 9) + 1} (candidates ${a}${b}) connected via a strong link on digit ${a}, so candidate ${b} can be eliminated from cells seen by both (W-Wing)`,
                  },
                };
              }
            }
          }
          
          // Also try with strong links for digit 'b'
          const strongLinksB = findStrongLinks(grid, b);
          for (const [linkCell1, linkCell2] of strongLinksB) {
            // Check if cell1 sees linkCell1 and cell2 sees linkCell2 (or vice versa)
            const cell1SeesLink1 = PEERS_OF[cell1]!.includes(linkCell1);
            const cell1SeesLink2 = PEERS_OF[cell1]!.includes(linkCell2);
            const cell2SeesLink1 = PEERS_OF[cell2]!.includes(linkCell1);
            const cell2SeesLink2 = PEERS_OF[cell2]!.includes(linkCell2);
            
            if ((cell1SeesLink1 && cell2SeesLink2) || (cell1SeesLink2 && cell2SeesLink1)) {
              // Found a W-Wing with strong link on 'b': this allows elimination of 'a'
              const cell1Peers = new Set(PEERS_OF[cell1]!);
              const cell2Peers = new Set(PEERS_OF[cell2]!);
              const commonPeers: number[] = [];
              
              for (const peer of cell1Peers) {
                if (cell2Peers.has(peer) && peer !== cell1 && peer !== cell2 && grid.hasCandidate(peer, a)) {
                  commonPeers.push(peer);
                }
              }
              
              if (commonPeers.length > 0) {
                const eliminations = commonPeers.map(peer => ({ cell: peer, digit: a }));
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: [cell1, cell2],
                    candidates: [
                      { cell: cell1, digit: a }, { cell: cell1, digit: b },
                      { cell: cell2, digit: a }, { cell: cell2, digit: b }
                    ],
                    links: []
                  },
                  explanation: {
                    zh: `W翼: 两格 R${Math.floor(cell1 / 9) + 1}C${(cell1 % 9) + 1} (候选数 ${a}${b}) 和 R${Math.floor(cell2 / 9) + 1}C${(cell2 % 9) + 1} (候选数 ${a}${b}) 通过数字 ${b} 上的强链连接，因此可以从两格共同影响的格子中删除候选数 ${a}（W翼）`,
                    en: `W-Wing: Two cells R${Math.floor(cell1 / 9) + 1}C${(cell1 % 9) + 1} (candidates ${a}${b}) and R${Math.floor(cell2 / 9) + 1}C${(cell2 % 9) + 1} (candidates ${a}${b}) connected via a strong link on digit ${b}, so candidate ${a} can be eliminated from cells seen by both (W-Wing)`,
                  },
                };
              }
            }
          }
        }
      }
    }
    
    return null;
  },
};

// Helper function to find all strong links for a digit
function findStrongLinks(grid: Grid, digit: number): [number, number][] {
  const strongLinks: [number, number][] = [];
  
  // Check all houses (rows, columns, boxes)
  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    
    for (const cell of house) {
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
        cellsWithDigit.push(cell);
      }
    }
    
    // If exactly 2 cells in the house have this digit as a candidate, that's a strong link
    if (cellsWithDigit.length === 2) {
      strongLinks.push([cellsWithDigit[0]!, cellsWithDigit[1]!]);
    }
  }
  
  return strongLinks;
}