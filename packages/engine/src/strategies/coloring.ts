import { PEERS_OF, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // 1. Find all cells containing the candidate digit
      const cellsWithD: number[] = [];
      for (let c = 0; c < 81; c++) {
        if (grid.hasCandidate(c, digit)) {
          cellsWithD.push(c);
        }
      }
      if (cellsWithD.length === 0) continue;

      // 2. Build strong links for this digit
      // A strong link exists between two cells if they are the only two candidates in a house
      const adj = new Map<number, Set<number>>();
      for (const cell of cellsWithD) {
        adj.set(cell, new Set<number>());
      }

      for (const house of HOUSES) {
        const houseCells = house.filter(c => grid.hasCandidate(c, digit));
        if (houseCells.length === 2) {
          const [u, v] = houseCells;
          adj.get(u!)!.add(v!);
          adj.get(v!)!.add(u!);
        }
      }

      // 3. Color components
      const colors = new Map<number, number>(); // cell -> color (1 or -1)
      const visited = new Set<number>();

      for (const start of cellsWithD) {
        if (visited.has(start)) continue;
        const neighborsCount = adj.get(start)?.size || 0;
        if (neighborsCount === 0) continue; // Skip isolated vertices

        // Run BFS to color this component
        const componentCells: number[] = [];
        const queue: number[] = [start];
        colors.set(start, 1);
        visited.add(start);

        while (queue.length > 0) {
          const u = queue.shift()!;
          componentCells.push(u);
          const colorU = colors.get(u)!;

          for (const v of adj.get(u)!) {
            if (!visited.has(v)) {
              colors.set(v, -colorU);
              visited.add(v);
              queue.push(v);
            }
          }
        }

        // For this component, let's collect the two color sets
        const color1Set = componentCells.filter(c => colors.get(c) === 1);
        const color2Set = componentCells.filter(c => colors.get(c) === -1);

        // 4. Check for Color Wrap (Same-color conflict)
        // Check if any two cells of color 1 see each other
        let wrapColor: number | null = null;
        let conflictPair: [number, number] | null = null;

        for (let i = 0; i < color1Set.length; i++) {
          for (let j = i + 1; j < color1Set.length; j++) {
            const u = color1Set[i]!;
            const v = color1Set[j]!;
            if (PEERS_OF[u]!.includes(v)) {
              wrapColor = 1;
              conflictPair = [u, v];
              break;
            }
          }
          if (wrapColor) break;
        }

        if (!wrapColor) {
          // Check color 2
          for (let i = 0; i < color2Set.length; i++) {
            for (let j = i + 1; j < color2Set.length; j++) {
              const u = color2Set[i]!;
              const v = color2Set[j]!;
              if (PEERS_OF[u]!.includes(v)) {
                wrapColor = -1;
                conflictPair = [u, v];
                break;
              }
            }
            if (wrapColor) break;
          }
        }

        if (wrapColor !== null && conflictPair !== null) {
          // All cells of the conflicting color must have candidate eliminated
          const badCells = wrapColor === 1 ? color1Set : color2Set;
          const eliminations: CellDigit[] = badCells.map(c => ({ cell: c, digit }));

          if (eliminations.length > 0) {
            // Build visual links for the component
            const links: Link[] = [];
            // To make visual links simple, we can add all strong links inside this component
            const addedPairs = new Set<string>();
            for (const u of componentCells) {
              for (const v of adj.get(u)!) {
                const key = u < v ? `${u}-${v}` : `${v}-${u}`;
                if (!addedPairs.has(key)) {
                  addedPairs.add(key);
                  links.push({
                    from: { cell: u, digit },
                    to: { cell: v, digit },
                    type: 'strong',
                  });
                }
              }
            }

            const colorName = wrapColor === 1 ? 'Color 1' : 'Color 2';
            const colorNameZh = wrapColor === 1 ? '颜色 1' : '颜色 2';

            return {
              strategyId: 'simple-coloring',
              placements: [],
              eliminations,
              highlights: {
                cells: componentCells,
                candidates: componentCells.map(c => ({ cell: c, digit })),
                links,
              },
              explanation: {
                zh: `简单染色：数字 ${digit} 在同一染色分组中，发现两个被染成相同颜色（${colorNameZh}）的格子相互冲突，因此该颜色的所有格子均不能是 ${digit}。`,
                en: `Simple Coloring: For digit ${digit}, two cells with the same color (${colorName}) see each other, meaning that color must be false. Eliminate ${digit} from all cells of this color.`,
              },
            };
          }
        }

        // 5. Check for Color Trap
        // Find any uncolored cell with candidate d that sees at least one color 1 cell and at least one color 2 cell
        const eliminations: CellDigit[] = [];
        for (const c of cellsWithD) {
          if (colors.has(c)) continue; // Must not be in this component
          const seesColor1 = color1Set.some(c1 => PEERS_OF[c]!.includes(c1));
          const seesColor2 = color2Set.some(c2 => PEERS_OF[c]!.includes(c2));
          if (seesColor1 && seesColor2) {
            eliminations.push({ cell: c, digit });
          }
        }

        if (eliminations.length > 0) {
          const links: Link[] = [];
          const addedPairs = new Set<string>();
          for (const u of componentCells) {
            for (const v of adj.get(u)!) {
              const key = u < v ? `${u}-${v}` : `${v}-${u}`;
              if (!addedPairs.has(key)) {
                addedPairs.add(key);
                links.push({
                  from: { cell: u, digit },
                  to: { cell: v, digit },
                  type: 'strong',
                });
              }
            }
          }

          return {
            strategyId: 'simple-coloring',
            placements: [],
            eliminations,
            highlights: {
              cells: [...componentCells, ...eliminations.map(e => e.cell)],
              candidates: [
                ...componentCells.map(c => ({ cell: c, digit })),
                ...eliminations,
              ],
              links,
            },
            explanation: {
              zh: `简单染色：找到数字 ${digit} 的染色分组。格子能同时看到该染色分组中被染成不同颜色的两个格子，因此排除其中的候选数 ${digit}。`,
              en: `Simple Coloring: For digit ${digit}, found a colored component. Cells that see both Color 1 and Color 2 cells in this component cannot contain ${digit}.`,
            },
          };
        }
      }
    }

    return null;
  },
};
