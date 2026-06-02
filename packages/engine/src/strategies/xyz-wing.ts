/**
 * T3 STRATEGY — XYZ-Wing (difficulty 50).
 *
 * An XYZ-Wing consists of a trivalue cell (pivot, candidates XYZ) that sees
 * two bivalue cells (pincers): one with candidates XZ and one with YZ.
 * Any cell that sees all three cells can have Z eliminated.
 */

import { CELLS, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all trivalue cells (pivot) and bivalue cells (pincers)
    const trivalueCells: number[] = [];
    const bivalueCells: number[] = [];
    
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) === 0) {
        const mask = grid.candidatesOf(cell);
        const count = popcount(mask);
        if (count === 3) {
          trivalueCells.push(cell);
        } else if (count === 2) {
          bivalueCells.push(cell);
        }
      }
    }
    
    // Try each trivalue cell as the pivot
    for (const pivot of trivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask);
      if (pivotDigits.length !== 3) continue;
      
      const [x, y, z] = pivotDigits;
      if (x === undefined || y === undefined || z === undefined) continue;
      
      // Look for two pincers that form an XYZ-Wing with this pivot
      for (const pincer1 of bivalueCells) {
        if (pincer1 === pivot) continue;
        
        // Pincer1 must share a unit with pivot and have candidates xz
        if (!PEERS_OF[pivot]!.includes(pincer1)) continue;
        
        const pincer1Mask = grid.candidatesOf(pincer1);
        const pincer1Digits = digitsOf(pincer1Mask);
        if (pincer1Digits.length !== 2) continue;
        
        if (pincer1Digits.includes(x) && pincer1Digits.includes(z) && pincer1Digits.length === 2) {
          // Found potential pincer1 (XZ), now look for pincer2 (YZ)
          for (const pincer2 of bivalueCells) {
            if (pincer2 === pivot || pincer2 === pincer1) continue;
            
            // Pincer2 must share a unit with pivot and have candidates yz
            if (!PEERS_OF[pivot]!.includes(pincer2)) continue;
            
            // Pincer2 should not share a unit with pincer1 to avoid overlap
            if (PEERS_OF[pincer1]!.includes(pincer2)) continue;
            
            const pincer2Mask = grid.candidatesOf(pincer2);
            const pincer2Digits = digitsOf(pincer2Mask);
            if (pincer2Digits.length !== 2) continue;
            
            if (pincer2Digits.includes(y) && pincer2Digits.includes(z) && pincer2Digits.length === 2) {
              // Found a valid XYZ-Wing: pivot (XYZ), pincer1 (XZ), pincer2 (YZ)
              // Any cell that sees all three cells can have z eliminated
              
              const pivotPeers = new Set(PEERS_OF[pivot]!);
              const pincer1Peers = new Set(PEERS_OF[pincer1]!);
              const pincer2Peers = new Set(PEERS_OF[pincer2]!);
              const commonPeers: number[] = [];
              
              for (const peer of pivotPeers) {
                if (pincer1Peers.has(peer) && pincer2Peers.has(peer) && 
                    peer !== pivot && peer !== pincer1 && peer !== pincer2 && 
                    grid.hasCandidate(peer, z)) {
                  commonPeers.push(peer);
                }
              }
              
              if (commonPeers.length > 0) {
                const eliminations = commonPeers.map(cell => ({ cell, digit: z }));
                
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: { 
                    cells: [pivot, pincer1, pincer2],
                    candidates: [
                      { cell: pivot, digit: x }, { cell: pivot, digit: y }, { cell: pivot, digit: z },
                      { cell: pincer1, digit: x }, { cell: pincer1, digit: z },
                      { cell: pincer2, digit: y }, { cell: pincer2, digit: z }
                    ],
                    links: []
                  },
                  explanation: {
                    zh: `XYZ翼: 枢纽格 R${Math.floor(pivot / 9) + 1}C${(pivot % 9) + 1} (候选数 ${x}${y}${z}) 与夹子格 R${Math.floor(pincer1 / 9) + 1}C${(pincer1 % 9) + 1} (候选数 ${x}${z}) 和 R${Math.floor(pincer2 / 9) + 1}C${(pincer2 % 9) + 1} (候选数 ${y}${z}) 相连，因此可以从三格共同影响的格子中删除候选数 ${z}（XYZ翼）`,
                    en: `XYZ-Wing: Pivot cell R${Math.floor(pivot / 9) + 1}C${(pivot % 9) + 1} (candidates ${x}${y}${z}) connects to pincer cells R${Math.floor(pincer1 / 9) + 1}C${(pincer1 % 9) + 1} (candidates ${x}${z}) and R${Math.floor(pincer2 / 9) + 1}C${(pincer2 % 9) + 1} (candidates ${y}${z}), so candidate ${z} can be eliminated from cells seen by all three (XYZ-Wing)`,
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