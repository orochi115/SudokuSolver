/**
 * T3 STRATEGY — single digit patterns (Skyscraper/2-String Kite/Empty Rectangle) (difficulty 40).
 */

import { CELLS, ROWS, COLS, BOXES, PEERS_OF, BOX_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    // Look for each digit 1-9
    for (let digit = 1; digit <= 9; digit++) {
      // Find all cells with this candidate
      const candidates: number[] = [];
      for (let cell = 0; cell < CELLS; cell++) {
        if (grid.hasCandidate(cell, digit)) {
          candidates.push(cell);
        }
      }
      
      // Look for Skyscraper - simplified version
      const skyscraperResult = findSkyscraper(grid, digit, candidates);
      if (skyscraperResult) return skyscraperResult;
    }
    
    return null;
  },
};

// Skyscraper: Two strong links on the same digit connected by a weak link in a row/col
function findSkyscraper(grid: Grid, digit: number, candidates: number[]): Step | null {
  // Group candidates by row and column
  const candidatesByRow: number[][] = Array.from({ length: 9 }, () => []);
  const candidatesByCol: number[][] = Array.from({ length: 9 }, () => []);
  
  for (const cell of candidates) {
    const r = Math.floor(cell / 9);
    const c = cell % 9;
    candidatesByRow[r]!.push(cell);
    candidatesByCol[c]!.push(cell);
  }
  
  // Look for two rows with exactly two candidates each, sharing a column for one candidate in each
  for (let r1 = 0; r1 < 9; r1++) {
    if (candidatesByRow[r1]!.length !== 2) continue;
    
    const cand1a = candidatesByRow[r1]![0];
    const cand1b = candidatesByRow[r1]![1];
    if (cand1a === undefined || cand1b === undefined) continue;
    
    const colA = cand1a % 9;
    const colB = cand1b % 9;
    
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      if (candidatesByRow[r2]!.length !== 2) continue;
      
      const cand2a = candidatesByRow[r2]![0];
      const cand2b = candidatesByRow[r2]![1];
      if (cand2a === undefined || cand2b === undefined) continue;
      
      const colC = cand2a % 9;
      const colD = cand2b % 9;
      
      // Check if one candidate in r1 shares a column with one in r2
      if ((colA === colC && colB !== colD) || 
          (colA === colD && colB !== colC) ||
          (colB === colC && colA !== colD) ||
          (colB === colD && colA !== colC)) {
        
        // This is a potential skyscraper formation
        // Get the two cells that are not aligned in column
        let base1: number | null = null;
        let base2: number | null = null;
        let roof1: number | null = null;
        let roof2: number | null = null;
        
        if (colA === colC) {
          base1 = cand1a; base2 = cand2a;
          roof1 = cand1b; roof2 = cand2b;
        } else if (colA === colD) {
          base1 = cand1a; base2 = cand2b;
          roof1 = cand1b; roof2 = cand2a;
        } else if (colB === colC) {
          base1 = cand1b; base2 = cand2a;
          roof1 = cand1a; roof2 = cand2b;
        } else if (colB === colD) {
          base1 = cand1b; base2 = cand2b;
          roof1 = cand1a; roof2 = cand2a;
        }
        
        if (base1 !== null && base2 !== null && roof1 !== null && roof2 !== null) {
          // Find common peers of the two roof cells
          const peers1 = new Set(PEERS_OF[roof1]!);
          const peers2 = new Set(PEERS_OF[roof2]!);
          const commonPeers: number[] = [];
          
          for (const peer of peers1) {
            if (peer !== roof1 && peer !== roof2 && peers2.has(peer) && grid.hasCandidate(peer, digit)) {
              commonPeers.push(peer);
            }
          }
          
          if (commonPeers.length > 0) {
            const eliminations = commonPeers.map(cell => ({ cell, digit }));
            const cells = [base1, base2, roof1, roof2, ...commonPeers];
            
            return {
              strategyId: 'single-digit-patterns',
              placements: [],
              eliminations,
              highlights: { 
                cells, 
                candidates: cells.map(cell => ({ cell, digit })), 
                links: [
                  { from: { cell: base1, digit }, to: { cell: roof1, digit }, type: 'strong' },
                  { from: { cell: base2, digit }, to: { cell: roof2, digit }, type: 'strong' },
                ]
              },
              explanation: {
                zh: `摩天楼 (Skyscraper): 数字 ${digit} 在两行中各有两格候选，并通过公共列形成连接，可以消除两"屋顶"格共同影响且包含候选数 ${digit} 的格子（单数字模式 - 摩天楼）`,
                en: `Skyscraper: Digit ${digit} has two candidates in each of two rows, connected through a common column, allowing elimination of ${digit} from cells that see both "roof" cells (Single Digit Pattern - Skyscraper)`,
              },
            };
          }
        }
      }
    }
  }
  
  // Also look for column-based skyscrapers
  for (let c1 = 0; c1 < 9; c1++) {
    if (candidatesByCol[c1]!.length !== 2) continue;
    
    const cand1a = candidatesByCol[c1]![0];
    const cand1b = candidatesByCol[c1]![1];
    if (cand1a === undefined || cand1b === undefined) continue;
    
    const rowA = Math.floor(cand1a / 9);
    const rowB = Math.floor(cand1b / 9);
    
    for (let c2 = c1 + 1; c2 < 9; c2++) {
      if (candidatesByCol[c2]!.length !== 2) continue;
      
      const cand2a = candidatesByCol[c2]![0];
      const cand2b = candidatesByCol[c2]![1];
      if (cand2a === undefined || cand2b === undefined) continue;
      
      const rowC = Math.floor(cand2a / 9);
      const rowD = Math.floor(cand2b / 9);
      
      // Check if one candidate in c1 shares a row with one in c2
      if ((rowA === rowC && rowB !== rowD) || 
          (rowA === rowD && rowB !== rowC) ||
          (rowB === rowC && rowA !== rowD) ||
          (rowB === rowD && rowA !== rowC)) {
        
        // This is a potential skyscraper formation
        let base1: number | null = null;
        let base2: number | null = null;
        let roof1: number | null = null;
        let roof2: number | null = null;
        
        if (rowA === rowC) {
          base1 = cand1a; base2 = cand2a;
          roof1 = cand1b; roof2 = cand2b;
        } else if (rowA === rowD) {
          base1 = cand1a; base2 = cand2b;
          roof1 = cand1b; roof2 = cand2a;
        } else if (rowB === rowC) {
          base1 = cand1b; base2 = cand2a;
          roof1 = cand1a; roof2 = cand2b;
        } else if (rowB === rowD) {
          base1 = cand1b; base2 = cand2b;
          roof1 = cand1a; roof2 = cand2a;
        }
        
        if (base1 !== null && base2 !== null && roof1 !== null && roof2 !== null) {
          // Find common peers of the two roof cells
          const peers1 = new Set(PEERS_OF[roof1]!);
          const peers2 = new Set(PEERS_OF[roof2]!);
          const commonPeers: number[] = [];
          
          for (const peer of peers1) {
            if (peer !== roof1 && peer !== roof2 && peers2.has(peer) && grid.hasCandidate(peer, digit)) {
              commonPeers.push(peer);
            }
          }
          
          if (commonPeers.length > 0) {
            const eliminations = commonPeers.map(cell => ({ cell, digit }));
            const cells = [base1, base2, roof1, roof2, ...commonPeers];
            
            return {
              strategyId: 'single-digit-patterns',
              placements: [],
              eliminations,
              highlights: { 
                cells, 
                candidates: cells.map(cell => ({ cell, digit })), 
                links: [
                  { from: { cell: base1, digit }, to: { cell: roof1, digit }, type: 'strong' },
                  { from: { cell: base2, digit }, to: { cell: roof2, digit }, type: 'strong' },
                ]
              },
              explanation: {
                zh: `摩天楼 (Skyscraper): 数字 ${digit} 在两列中各有两格候选，并通过公共行形成连接，可以消除两"屋顶"格共同影响且包含候选数 ${digit} 的格子（单数字模式 - 摩天楼）`,
                en: `Skyscraper: Digit ${digit} has two candidates in each of two columns, connected through a common row, allowing elimination of ${digit} from cells that see both "roof" cells (Single Digit Pattern - Skyscraper)`,
              },
            };
          }
        }
      }
    }
  }
  
  return null;
}