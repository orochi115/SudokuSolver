import { PEERS_OF, HOUSES, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60, // Suggested difficulty: 60 coloring

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      // 1. Build strong links graph for this digit
      const adj = new Map<number, number[]>();
      
      for (const house of HOUSES) {
        const candidates = house.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
        if (candidates.length === 2) {
          const [u, v] = candidates;
          if (!adj.has(u!)) adj.set(u!, []);
          if (!adj.has(v!)) adj.set(v!, []);
          adj.get(u!)!.push(v!);
          adj.get(v!)!.push(u!);
        }
      }

      if (adj.size === 0) continue;

      // 2. Find and 2-color connected components
      const visited = new Set<number>();
      for (const start of adj.keys()) {
        if (visited.has(start)) continue;

        const color = new Map<number, number>(); // cell -> 0 or 1
        const queue: number[] = [start];
        color.set(start, 0);
        visited.add(start);

        let hasWrapConflict = false;
        let conflictColor = -1;

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++]!;
          const currColor = color.get(curr)!;
          const neighbors = adj.get(curr) || [];

          for (const neighbor of neighbors) {
            if (!color.has(neighbor)) {
              color.set(neighbor, 1 - currColor);
              visited.add(neighbor);
              queue.push(neighbor);
            } else if (color.get(neighbor) === currColor) {
              hasWrapConflict = true;
              conflictColor = currColor;
            }
          }
        }

        const cellsInComp = Array.from(color.keys());

        // Also check if any same-color cells are peers (indirect wrap)
        if (!hasWrapConflict) {
          for (let i = 0; i < cellsInComp.length; i++) {
            for (let j = i + 1; j < cellsInComp.length; j++) {
              const u = cellsInComp[i]!;
              const v = cellsInComp[j]!;
              if (color.get(u) === color.get(v)) {
                if (PEERS_OF[u]!.includes(v)) {
                  hasWrapConflict = true;
                  conflictColor = color.get(u)!;
                  break;
                }
              }
            }
            if (hasWrapConflict) break;
          }
        }

        // --- Wrap Case (Type I) ---
        if (hasWrapConflict && conflictColor !== -1) {
          const eliminations: CellDigit[] = [];
          for (const cell of cellsInComp) {
            if (color.get(cell) === conflictColor) {
              eliminations.push({ cell, digit });
            }
          }

          if (eliminations.length > 0) {
            // Build the strong links for the highlights
            const links: Link[] = [];
            const seenEdges = new Set<string>();
            for (const u of cellsInComp) {
              for (const v of adj.get(u) || []) {
                const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
                if (!seenEdges.has(edgeKey)) {
                  seenEdges.add(edgeKey);
                  links.push({
                    from: { cell: u, digit },
                    to: { cell: v, digit },
                    type: 'strong',
                  });
                }
              }
            }

            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: cellsInComp,
                candidates: cellsInComp.map(cell => ({ cell, digit })),
                links,
              },
              explanation: {
                zh: `候选数 ${digit} 在染色过程中，同一颜色在某些相互看见的格子中冲突（构成单数字强链闭环/Wrap），说明该颜色必为假，因此可以排除该颜色的所有候选数。`,
                en: `For candidate ${digit}, simple coloring reveals a contradiction (Color Wrap) where same-colored cells see each other. Thus, that color is false and ${digit} can be eliminated from those cells.`,
              },
            };
          }
        }

        // --- Trap Case (Type II) ---
        // Find uncolored cells with this digit that see both color 0 and color 1 in this component
        const eliminations: CellDigit[] = [];
        for (let cell = 0; cell < 81; cell++) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit) && !color.has(cell)) {
            const seesColor0 = cellsInComp.some(c => color.get(c) === 0 && PEERS_OF[cell]!.includes(c));
            const seesColor1 = cellsInComp.some(c => color.get(c) === 1 && PEERS_OF[cell]!.includes(c));
            if (seesColor0 && seesColor1) {
              eliminations.push({ cell, digit });
            }
          }
        }

        if (eliminations.length > 0) {
          const links: Link[] = [];
          const seenEdges = new Set<string>();
          for (const u of cellsInComp) {
            for (const v of adj.get(u) || []) {
              const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
              if (!seenEdges.has(edgeKey)) {
                seenEdges.add(edgeKey);
                links.push({
                  from: { cell: u, digit },
                  to: { cell: v, digit },
                  type: 'strong',
                });
              }
            }
          }

          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...cellsInComp, ...eliminations.map(e => e.cell)],
              candidates: [
                ...cellsInComp.map(cell => ({ cell, digit })),
                ...eliminations,
              ],
              links,
            },
            explanation: {
              zh: `候选数 ${digit} 在强链染色中，存在未染色的格子能同时看见两种颜色的格子（构成 Color Trap）。因此，不论哪种颜色为真，该格子都不可填入 ${digit}，可以予以排除。`,
              en: `For candidate ${digit}, simple coloring reveals a cell seeing both color 0 and color 1 (Color Trap). Thus, ${digit} can be eliminated from that cell.`,
            },
          };
        }
      }
    }

    return null;
  },
};
