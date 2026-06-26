import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色法', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      // Find all conjugate pairs of d (houses with exactly 2 candidates of d)
      const conjugatePairs: [number, number][] = [];
      for (const h of HOUSES) {
        const cells = h.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cells.length === 2) {
          const u = cells[0]!;
          const v = cells[1]!;
          if (!conjugatePairs.some(([p1, p2]) => p1 === u && p2 === v)) {
            conjugatePairs.push([u, v]);
          }
        }
      }

      if (conjugatePairs.length === 0) continue;

      // Try each conjugate pair as a seed
      for (const [seedA, seedB] of conjugatePairs) {
        // We will keep track of colors A and B as sets of cell indices
        const colorA = new Set<number>();
        const colorB = new Set<number>();

        // Step 1 & 2: Simple Coloring propagation along strong links
        const queue: { cell: number; color: 'A' | 'B' }[] = [];
        queue.push({ cell: seedA, color: 'A' });
        colorA.add(seedA);
        queue.push({ cell: seedB, color: 'B' });
        colorB.add(seedB);

        while (queue.length > 0) {
          const { cell, color } = queue.shift()!;
          const oppColor = color === 'A' ? 'B' : 'A';
          const oppSet = color === 'A' ? colorB : colorA;

          // Find strong link neighbors
          for (const [u, v] of conjugatePairs) {
            let neighbor = -1;
            if (u === cell) neighbor = v;
            else if (v === cell) neighbor = u;

            if (neighbor !== -1) {
              if (!oppSet.has(neighbor)) {
                oppSet.add(neighbor);
                queue.push({ cell: neighbor, color: oppColor });
              }
            }
          }
        }

        // Step 3: Promotion (iterate to a fixed point)
        while (true) {
          let changed = false;
          for (const col of ['A', 'B'] as const) {
            const currentSet = col === 'A' ? colorA : colorB;
            const oppSet = col === 'A' ? colorB : colorA;

            for (const h of HOUSES) {
              const candidates = h.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
              if (candidates.length <= 1) continue;

              // Ruled out candidates: candidates that see any cell colored with `col`
              // (which means they are peers of any cell in currentSet)
              const ruledOut = candidates.filter(c => {
                // It sees any cell in currentSet (other than itself, but if it is in currentSet, it's not ruled out by itself)
                return [...currentSet].some(colored => colored !== c && PEERS_OF[c]!.includes(colored));
              });

              const remaining = candidates.filter(c => !ruledOut.includes(c));
              if (remaining.length === 1) {
                const exception = remaining[0]!;
                // Promote exception to col
                if (!currentSet.has(exception)) {
                  currentSet.add(exception);
                  changed = true;
                }
              }
            }
          }
          if (!changed) break;
        }

        // Let's look for Step 4.1: trap
        const trapElims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            const seesA = [...colorA].some(colored => PEERS_OF[c]!.includes(colored));
            const seesB = [...colorB].some(colored => PEERS_OF[c]!.includes(colored));
            if (seesA && seesB) {
              trapElims.push({ cell: c, digit: d });
            }
          }
        }

        if (trapElims.length > 0) {
          // Construct links for highlighting
          const links: Link[] = [];
          for (const [u, v] of conjugatePairs) {
            if ((colorA.has(u) && colorB.has(v)) || (colorB.has(u) && colorA.has(v))) {
              links.push({ from: { cell: u, digit: d }, to: { cell: v, digit: d }, type: 'strong' });
            }
          }

          const highlightedCells = [...new Set([...colorA, ...colorB, ...trapElims.map(e => e.cell)])];
          return {
            strategyId: this.id,
            placements: [],
            eliminations: trapElims,
            highlights: {
              cells: highlightedCells,
              candidates: [
                ...[...colorA].map(c => ({ cell: c, digit: d })),
                ...[...colorB].map(c => ({ cell: c, digit: d })),
                ...trapElims
              ],
              links
            },
            explanation: {
              zh: `多重染色法：对于数字 ${d}，以 ${cellLabel(seedA)}-${cellLabel(seedB)} 为种子进行强弱链染色和推广。格 ${trapElims.map(e => cellLabel(e.cell)).join(', ')} 同时能看到 A 组和 B 组的着色格，必定不能填入 ${d}。`,
              en: `Multi-Coloring: For digit ${d}, coloring seeded on ${cellLabel(seedA)}-${cellLabel(seedB)} with promotion rules. Cells ${trapElims.map(e => cellLabel(e.cell)).join(', ')} see both color groups, so eliminate ${d} from them.`
            }
          };
        }

        // Let's look for Step 4.2: wrap
        let wrapColor: 'A' | 'B' | null = null;
        for (const h of HOUSES) {
          const candidates = h.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          const countA = candidates.filter(c => colorA.has(c)).length;
          const countB = candidates.filter(c => colorB.has(c)).length;
          if (countA >= 2) {
            wrapColor = 'A';
            break;
          }
          if (countB >= 2) {
            wrapColor = 'B';
            break;
          }
        }

        // Let's look for Step 4.3: house emptied
        if (!wrapColor) {
          for (const h of HOUSES) {
            const candidates = h.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
            if (candidates.length > 0) {
              const allSeeA = candidates.every(c => [...colorA].some(colored => PEERS_OF[c]!.includes(colored)));
              const allSeeB = candidates.every(c => [...colorB].some(colored => PEERS_OF[c]!.includes(colored)));
              if (allSeeA) {
                wrapColor = 'A';
                break;
              }
              if (allSeeB) {
                wrapColor = 'B';
                break;
              }
            }
          }
        }

        if (wrapColor) {
          // If wrapColor is A, then B must be true! We place d in all B cells.
          // If wrapColor is B, then A must be true! We place d in all A cells.
          const trueSet = wrapColor === 'A' ? colorB : colorA;
          const placements = [...trueSet]
            .filter(c => grid.get(c) === 0 && grid.hasCandidate(c, d))
            .map(c => ({ cell: c, digit: d }));

          if (placements.length > 0) {
            const links: Link[] = [];
            for (const [u, v] of conjugatePairs) {
              if ((colorA.has(u) && colorB.has(v)) || (colorB.has(u) && colorA.has(v))) {
                links.push({ from: { cell: u, digit: d }, to: { cell: v, digit: d }, type: 'strong' });
              }
            }

            const highlightedCells = [...new Set([...colorA, ...colorB, ...placements.map(p => p.cell)])];
            return {
              strategyId: this.id,
              placements,
              eliminations: [],
              highlights: {
                cells: highlightedCells,
                candidates: [
                  ...[...colorA].map(c => ({ cell: c, digit: d })),
                  ...[...colorB].map(c => ({ cell: c, digit: d })),
                  ...placements
                ],
                links
              },
              explanation: {
                zh: `多重染色法（环绕/行宫冲突）：对于数字 ${d}，以 ${cellLabel(seedA)}-${cellLabel(seedB)} 为种子进行着色和推广。${wrapColor} 组在某区域中产生自相矛盾，因此另一组 ${wrapColor === 'A' ? 'B' : 'A'} 组必定为真，格 ${placements.map(p => cellLabel(p.cell)).join(', ')} 填入 ${d}。`,
                en: `Multi-Coloring (wrap/contradiction): For digit ${d}, coloring seeded on ${cellLabel(seedA)}-${cellLabel(seedB)} with promotion rules. Group ${wrapColor} causes a contradiction, so opposite group ${wrapColor === 'A' ? 'B' : 'A'} is true; place ${d} in cells ${placements.map(p => cellLabel(p.cell)).join(', ')}.`
              }
            };
          }
        }
      }
    }
    return null;
  }
};
