import { CELLS, ROW_OF, COL_OF, HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // 1. Find all cells containing this digit as a candidate
      const cellsWithDigit: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.hasCandidate(c, digit)) {
          cellsWithDigit.push(c);
        }
      }
      if (cellsWithDigit.length === 0) continue;

      // 2. Build strong links for this digit
      const strongAdjacency = new Map<number, Set<number>>();
      for (const cell of cellsWithDigit) {
        strongAdjacency.set(cell, new Set());
      }

      for (const house of HOUSES) {
        const houseCells = house.filter((c) => grid.hasCandidate(c, digit));
        if (houseCells.length === 2) {
          const [u, v] = houseCells as [number, number];
          strongAdjacency.get(u)!.add(v);
          strongAdjacency.get(v)!.add(u);
        }
      }

      // 3. Find connected components and 2-color them
      const coloredComponents: {
        cells: number[];
        colors: Map<number, number>;
        spanningTree: [number, number][];
      }[] = [];

      const visited = new Set<number>();

      for (const startCell of cellsWithDigit) {
        if (visited.has(startCell)) continue;

        const compCells: number[] = [];
        const colors = new Map<number, number>();
        const spanningTree: [number, number][] = [];

        // BFS/DFS to traverse and color
        const queue: { cell: number; color: number; parent?: number }[] = [
          { cell: startCell, color: 0 },
        ];
        colors.set(startCell, 0);
        visited.add(startCell);

        let isBipartite = true;

        while (queue.length > 0) {
          const { cell, color, parent } = queue.shift()!;
          compCells.push(cell);

          const neighbors = strongAdjacency.get(cell)!;
          for (const neighbor of neighbors) {
            if (!colors.has(neighbor)) {
              const nextColor = 1 - color;
              colors.set(neighbor, nextColor);
              visited.add(neighbor);
              spanningTree.push([cell, neighbor]);
              queue.push({ cell: neighbor, color: nextColor, parent: cell });
            } else {
              if (colors.get(neighbor) === color) {
                // Not bipartite in terms of strong links
                isBipartite = false;
              }
            }
          }
        }

        coloredComponents.push({ cells: compCells, colors, spanningTree });
      }

      // 4. Process each colored component for Simple Coloring Rule 1 & Rule 2
      for (const comp of coloredComponents) {
        const { cells: compCells, colors, spanningTree } = comp;

        const color0Cells = compCells.filter((c) => colors.get(c) === 0);
        const color1Cells = compCells.filter((c) => colors.get(c) === 1);

        // --- Rule 2: Twice in Unit (Color Clash / Wrap) ---
        // If two cells of the same color can see each other, that color is invalid.
        let badColor: number | null = null;

        for (const cells of [color0Cells, color1Cells]) {
          let clashFound = false;
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
              const u = cells[i]!;
              const v = cells[j]!;
              if (PEERS_OF[u]!.includes(v)) {
                clashFound = true;
                break;
              }
            }
            if (clashFound) break;
          }
          if (clashFound) {
            badColor = colors.get(cells[0]!)!;
            break;
          }
        }

        if (badColor !== null) {
          const clashingCells = badColor === 0 ? color0Cells : color1Cells;
          const eliminations: CellDigit[] = clashingCells.map((cell) => ({ cell, digit }));

          if (eliminations.length > 0) {
            const links: Link[] = spanningTree.map(([u, v]) => ({
              from: { cell: u, digit },
              to: { cell: v, digit },
              type: 'strong',
            }));

            const colorName = badColor === 0 ? 'A' : 'B';
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: compCells,
                candidates: compCells.map((c) => ({ cell: c, digit })),
                links,
              },
              explanation: {
                zh: `数字 ${digit} 在染色网络中颜色 ${colorName} 发生冲突（同色格相互看见）。因此，颜色 ${colorName} 必定为假，可排除这些格中的候选数 ${digit}。`,
                en: `For digit ${digit}, color ${colorName} in the coloring network has a clash (cells of the same color see each other). Thus, color ${colorName} must be false, so we can eliminate ${digit} from these cells.`,
              },
            };
          }
        }

        // --- Rule 1: Two Colors in Unit (Trap) ---
        // If an external cell sees both color 0 and color 1, we can eliminate digit.
        for (const p of cellsWithDigit) {
          if (compCells.includes(p)) continue;

          // Does p see color0Cells AND color1Cells?
          const seesColor0 = color0Cells.some((c) => PEERS_OF[c]!.includes(p));
          const seesColor1 = color1Cells.some((c) => PEERS_OF[c]!.includes(p));

          if (seesColor0 && seesColor1) {
            const links: Link[] = spanningTree.map(([u, v]) => ({
              from: { cell: u, digit },
              to: { cell: v, digit },
              type: 'strong',
            }));

            return {
              strategyId: this.id,
              placements: [],
              eliminations: [{ cell: p, digit }],
              highlights: {
                cells: [...compCells, p],
                candidates: [...compCells.map((c) => ({ cell: c, digit })), { cell: p, digit }],
                links,
              },
              explanation: {
                zh: `数字 ${digit} 染色网络中，R${ROW_OF[p]! + 1}C${COL_OF[p]! + 1} 同时看见了两种不同颜色（A 和 B）的格。因为 A 和 B 必有一个为真，所以 R${ROW_OF[p]! + 1}C${COL_OF[p]! + 1} 必定不能是 ${digit}（排除）。`,
                en: `For digit ${digit}, cell R${ROW_OF[p]! + 1}C${COL_OF[p]! + 1} sees both colors A and B. Since one of them must be true, we can eliminate candidate ${digit} from R${ROW_OF[p]! + 1}C${COL_OF[p]! + 1}.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};
