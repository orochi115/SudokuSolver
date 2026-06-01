/**
 * W-Wing (T3).
 *
 * Two bivalue cells with the same pair are bridged by a strong link on one digit.
 * The other digit is removed from cells seeing both bivalue cells.
 */

import { digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
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
    
    // Try each pair of bivalue cells
    for (let i = 0; i < bivalueCells.length; i++) {
      const cell1 = bivalueCells[i]!;
      const candidates1 = digitsOf(grid.candidatesOf(cell1));
      
      for (let j = i + 1; j < bivalueCells.length; j++) {
        const cell2 = bivalueCells[j]!;
        const candidates2 = digitsOf(grid.candidatesOf(cell2));
        
        // Check if they have the same pair of candidates
        if (candidates1.length === 2 && candidates2.length === 2 &&
            candidates1[0] === candidates2[0] && candidates1[1] === candidates2[1]) {
          
          const x = candidates1[0]!;
          const y = candidates1[1]!;
          
          // Find cells that see both bivalue cells
          const cell1Peers = PEERS_OF[cell1]!;
          const cell2Peers = PEERS_OF[cell2]!;
          
          const cellsSeeingBoth: number[] = [];
          
          for (let cell = 0; cell < 81; cell++) {
            if (cell === cell1 || cell === cell2) continue;
            
            // Check if cell sees both bivalue cells
            if (cell1Peers.includes(cell) && cell2Peers.includes(cell)) {
              cellsSeeingBoth.push(cell);
            }
          }
          
          // Eliminate y from cells seeing both bivalue cells
          const eliminations = cellsSeeingBoth
            .filter(cell => grid.hasCandidate(cell, y))
            .map(cell => ({ cell, digit: y }));
          
          if (eliminations.length > 0) {
            const highlightCells = [cell1, cell2];
            const highlightCandidates = [
              { cell: cell1, digit: x },
              { cell: cell1, digit: y },
              { cell: cell2, digit: x },
              { cell: cell2, digit: y }
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
                zh: `发现W翼模式：两个单元格R${Math.floor(cell1/9)+1}C${cell1%9+1}和R${Math.floor(cell2/9)+1}C${cell2%9+1}都有候选数{${x},${y}}，可从相关单元格中消除候选数${y}`,
                en: `Found W-Wing pattern: two cells R${Math.floor(cell1/9)+1}C${cell1%9+1} and R${Math.floor(cell2/9)+1}C${cell2%9+1} both have candidates {${x},${y}}, can eliminate candidate ${y} from related cells.`,
              },
            };
          }
        }
      }
    }
    
    return null;
  },
};