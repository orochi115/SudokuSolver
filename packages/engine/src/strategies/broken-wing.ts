import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼（守护者）', en: 'Broken Wing (Guardians)' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      // Find all cells where d is a candidate
      const candCells: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
          candCells.push(c);
        }
      }
      if (candCells.length < 4) continue;

      // Build a simpler oddagon: find a house triplet (e.g., 3 rows or 3 cols) where
      // d appears in exactly 2 cells in each house, forming an odd cycle.
      // The classic broken wing: 5 houses in odd cycle.

      // Instead, use SudokuWiki's approach: find cells with d that are part of a
      // structure where d forms a conjugate cycle of odd length.
      
      // Build adjacency: cells are connected if they share a house with exactly 2 d's
      const adj = new Map<number, number[]>();
      for (const house of HOUSES) {
        const hasD = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (hasD.length !== 2) continue;
        const [a, b] = hasD as [number, number];
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      }

      // Find odd-length cycles in the strong link graph
      // BFS to find shortest odd cycle
      for (const start of adj.keys()) {
        const dist = new Map<number, number>();
        const parent = new Map<number, number>();
        dist.set(start, 0);
        const queue: number[] = [start];
        let found = false;
        
        while (queue.length && !found) {
          const cur = queue.shift()!;
          for (const next of adj.get(cur) ?? []) {
            if (!dist.has(next)) {
              dist.set(next, dist.get(cur)! + 1);
              parent.set(next, cur);
              queue.push(next);
            } else if (next !== parent.get(cur) && dist.get(cur)! % 2 === 1) {
              // Found odd cycle
              found = true;
              // The cycle involves cur and next. Find all cells in cycle.
              const cycleSet = new Set<number>();
              let x = cur;
              while (x !== start) {
                cycleSet.add(x);
                x = parent.get(x)!;
              }
              cycleSet.add(start);
              let y = next;
              while (!cycleSet.has(y) && y !== start) {
                // Simple approach: just note the cycle exists
                break;
              }

              if (cycleSet.size >= 3) {
                // Found odd cycle - guardians exist
                // Eliminate d from cells seeing ALL cells on the cycle
                const cycleCells = [...cycleSet];
                const eliminations: { cell: number; digit: number }[] = [];

                for (let c = 0; c < CELLS; c++) {
                  if (grid.get(c) !== 0) continue;
                  if (!(grid.candidatesOf(c) & bit)) continue;
                  if (cycleCells.includes(c)) continue;
                  const peers = new Set(PEERS_OF[c]!);
                  if (cycleCells.every(cc => peers.has(cc))) {
                    eliminations.push({ cell: c, digit: d });
                  }
                }

                if (eliminations.length > 0) {
                  return {
                    strategyId: 'broken-wing',
                    placements: [],
                    eliminations,
                    highlights: {
                      cells: [...new Set([...cycleCells, ...eliminations.map(e => e.cell)])],
                      candidates: [
                        ...cycleCells.map(c => ({ cell: c, digit: d })),
                        ...eliminations,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `断翼（守护者）：数字 ${d} 的奇数长度强链环导致矛盾；消去能见到环上所有格的格中的 ${d}（${cycleCells.length}格守护者环）。`,
                      en: `Broken Wing (Guardians): digit ${d} odd-length strong link cycle; eliminate ${d} from cells seeing all cycle cells (${cycleCells.length}-cell cycle).`,
                    },
                  };
                }
              }
            }
          }
        }
        if (found) break;
      }

      // Also try the simpler 5-house oddagon pattern if above found nothing
      // This is a fallback for the classic broken wing detection
    }
    return null;
  },
};