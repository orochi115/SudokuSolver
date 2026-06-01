/**
 * T3: W-Wing.
 *
 * Two bivalue cells with the same pair {X,Y} are bridged by a strong link
 * on digit X between them. Candidate Y is removed from any cell that sees
 * both bivalue cells.
 */

import { PEERS_OF, popcount, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

    // Find all bivalue cells
    const bivalueCells: number[] = [];
    for (const cell of emptyCells) {
      if (popcount(grid.candidatesOf(cell)) === 2) {
        bivalueCells.push(cell);
      }
    }

    for (let i = 0; i < bivalueCells.length; i++) {
      for (let j = i + 1; j < bivalueCells.length; j++) {
        const c1 = bivalueCells[i]!;
        const c2 = bivalueCells[j]!;
        const m1 = grid.candidatesOf(c1);
        const m2 = grid.candidatesOf(c2);
        if (m1 !== m2) continue; // Must have same digit pair

        const digits = digitsOf(m1);
        const x = digits[0]!;
        const y = digits[1]!;

        // Check for strong link on digit x between c1 and c2
        const c1InRow = Math.floor(c1 / 9);
        const c1InCol = c1 % 9;
        const c2InRow = Math.floor(c2 / 9);
        const c2InCol = c2 % 9;

        let hasStrongLink = false;
        // Strong link if same row/col/box and both are only occurrences of x in that house
        if (c1InRow === c2InRow) {
          // Same row - check if x appears exactly twice in that row
          let count = 0;
          for (const cell of grid.values) {
            // Row check via row iteration
          }
          let xCount = 0;
          for (const cell of emptyCells) {
            if (Math.floor(cell / 9) === c1InRow && grid.hasCandidate(cell, x)) {
              xCount++;
            }
          }
          if (xCount === 2) hasStrongLink = true;
        } else if (c1InCol === c2InCol) {
          let xCount = 0;
          for (const cell of emptyCells) {
            if (cell % 9 === c1InCol && grid.hasCandidate(cell, x)) {
              xCount++;
            }
          }
          if (xCount === 2) hasStrongLink = true;
        } else {
          // Same box?
          const bi1 = Math.floor(c1 / 27) * 3 + Math.floor((c1 % 9) / 3);
          const bi2 = Math.floor(c2 / 27) * 3 + Math.floor((c2 % 9) / 3);
          if (bi1 === bi2) {
            let xCount = 0;
            for (const cell of emptyCells) {
              const bi = Math.floor(cell / 27) * 3 + Math.floor((cell % 9) / 3);
              if (bi === bi1 && grid.hasCandidate(cell, x)) {
                xCount++;
              }
            }
            if (xCount === 2) hasStrongLink = true;
          }
        }

        if (!hasStrongLink) continue;

        // Eliminate y from any cell that sees both c1 and c2
        const c1Peers = new Set(PEERS_OF[c1]!);
        const eliminations: { cell: number; digit: number }[] = [];
        for (const cell of emptyCells) {
          if (cell === c1 || cell === c2) continue;
          if (c1Peers.has(cell) && PEERS_OF[c2]!.includes(cell)) {
            if (grid.hasCandidate(cell, y)) {
              eliminations.push({ cell, digit: y });
            }
          }
        }
        if (eliminations.length > 0) {
          const c1r = Math.floor(c1 / 9) + 1;
          const c1c2 = (c1 % 9) + 1;
          const c2r = Math.floor(c2 / 9) + 1;
          const c2c2 = (c2 % 9) + 1;
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [c1, c2],
              candidates: [
                { cell: c1, digit: x }, { cell: c1, digit: y },
                { cell: c2, digit: x }, { cell: c2, digit: y },
              ],
              links: [],
            },
            explanation: {
              zh: `R${c1r}C${c1c2} 与 R${c2r}C${c2c2} 为双值格(XY)，数字 ${x} 形成强链，消去从两格共同影响格的 ${y}（W翼）。`,
              en: `R${c1r}C${c1c2} and R${c2r}C${c2c2} are bivalue cells (XY) bridged by a strong link on ${x}; eliminate ${y} from cells seeing both (W-Wing).`,
            },
          };
        }
      }
    }
    return null;
  },
};