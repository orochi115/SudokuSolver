/**
 * T3 STRATEGY — XY-Wing (difficulty 50).
 *
 * An XY-Wing consists of three cells:
 * - A pivot cell with candidates XY
 * - A pincer cell with candidates XZ that shares a unit with the pivot
 * - Another pincer cell with candidates YZ that shares a unit with the pivot
 * - The two pincer cells should not see each other directly
 * - Any cell that sees both pincer cells can have Z eliminated
 */

import { CELLS, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Find all bivalue cells (candidates with exactly 2 digits)
    const bivalueCells: number[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) === 0) {
        const mask = grid.candidatesOf(cell);
        if (popcount(mask) === 2) {
          bivalueCells.push(cell);
        }
      }
    }
    
    // Try each bivalue cell as the pivot (XY)
    for (const pivot of bivalueCells) {
      const pivotMask = grid.candidatesOf(pivot);
      const pivotDigits = digitsOf(pivotMask);
      if (pivotDigits.length !== 2) continue;
      
      const [x, y] = pivotDigits;
      if (x === undefined || y === undefined) continue;
      
      // Find first pincer (XZ) that shares a unit with the pivot
      for (const pincer1 of bivalueCells) {
        if (pincer1 === pivot) continue;
        
        // Check if pincer1 shares a unit with pivot (is a peer)
        if (!PEERS_OF[pivot]!.includes(pincer1)) continue;
        
        const pincer1Mask = grid.candidatesOf(pincer1);
        const pincer1Digits = digitsOf(pincer1Mask);
        if (pincer1Digits.length !== 2) continue;
        
        // Check if pincer1 has x and another digit z
        if (!pincer1Digits.includes(x)) continue;
        
        const z = pincer1Digits.find(d => d !== x);
        if (z === undefined) continue;
        
        // Find second pincer (YZ) that shares a unit with the pivot but not with pincer1
        for (const pincer2 of bivalueCells) {
          if (pincer2 === pivot || pincer2 === pincer1) continue;
          
          // Check if pincer2 shares a unit with pivot (is a peer)
          if (!PEERS_OF[pivot]!.includes(pincer2)) continue;
          
          // Check if pincer2 does NOT share a unit with pincer1 (they shouldn't see each other directly)
          if (PEERS_OF[pincer1]!.includes(pincer2)) continue;
          
          const pincer2Mask = grid.candidatesOf(pincer2);
          const pincer2Digits = digitsOf(pincer2Mask);
          if (pincer2Digits.length !== 2) continue;
          
          // Verify that pincer2 has exactly y and z (YZ)
          if (pincer2Digits.includes(y) && pincer2Digits.includes(z) && pincer2Digits.length === 2) {
            // Double-check the XY-Wing logic: 
            // - If pivot is X, then pincer2 must be Z (since it's YZ), which means pincer1 can't be Z (it's XZ), so pincer1 must be X
            // - If pivot is Y, then pincer1 must be Z (since it's XZ), which means pincer2 can't be Z (it's YZ), so pincer2 must be Y
            // - If pivot is neither X nor Y (impossible), then it's not relevant
            // So if pivot is X or Y, at least one of pincer1 or pincer2 must end up as Z
            // Therefore, any cell that sees both pincer1 and pincer2 can't be Z
            
            // Find cells that are peers of both pincer1 and pincer2
            const pincer1Peers = new Set(PEERS_OF[pincer1]!);
            const pincer2Peers = new Set(PEERS_OF[pincer2]!);
            const commonPeers: number[] = [];
            
            for (const peer of pincer1Peers) {
              if (pincer2Peers.has(peer) && 
                  peer !== pincer1 && 
                  peer !== pincer2 && 
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
                    { cell: pivot, digit: x }, { cell: pivot, digit: y },
                    { cell: pincer1, digit: x }, { cell: pincer1, digit: z },
                    { cell: pincer2, digit: y }, { cell: pincer2, digit: z }
                  ],
                  links: [
                    { from: { cell: pivot, digit: x }, to: { cell: pincer1, digit: x }, type: 'weak' },
                    { from: { cell: pivot, digit: y }, to: { cell: pincer2, digit: y }, type: 'weak' },
                  ]
                },
                explanation: {
                  zh: `XY翼: 枢纽格 R${Math.floor(pivot / 9) + 1}C${(pivot % 9) + 1} (候选数 ${x}${y}) 与夹子格 R${Math.floor(pincer1 / 9) + 1}C${(pincer1 % 9) + 1} (候选数 ${x}${z}) 和 R${Math.floor(pincer2 / 9) + 1}C${(pincer2 % 9) + 1} (候选数 ${y}${z}) 相连，因此可以从两夹子格共同影响的格子中删除候选数 ${z}（XY翼）`,
                  en: `XY-Wing: Pivot cell R${Math.floor(pivot / 9) + 1}C${(pivot % 9) + 1} (candidates ${x}${y}) connects to pincer cells R${Math.floor(pincer1 / 9) + 1}C${(pincer1 % 9) + 1} (candidates ${x}${z}) and R${Math.floor(pincer2 / 9) + 1}C${(pincer2 % 9) + 1} (candidates ${y}${z}), so candidate ${z} can be eliminated from cells seen by both pincers (XY-Wing)`,
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