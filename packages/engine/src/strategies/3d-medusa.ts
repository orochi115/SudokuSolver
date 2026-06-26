import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // 1. Collect all cell-candidates (vertices)
    const vertices: { cell: number; digit: number }[] = [];
    const vertexMap = new Map<string, number>();

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        for (const d of digitsOf(grid.candidatesOf(c))) {
          const idx = vertices.length;
          vertices.push({ cell: c, digit: d });
          vertexMap.set(`${c}:${d}`, idx);
        }
      }
    }

    const V = vertices.length;
    if (V === 0) return null;

    // Build strong link adjacency list
    const adj: number[][] = Array.from({ length: V }, () => []);

    function addEdge(i: number, j: number) {
      if (!adj[i]!.includes(j)) adj[i]!.push(j);
      if (!adj[j]!.includes(i)) adj[j]!.push(i);
    }

    // Bi-location strong links: digit d, exactly 2 cells in house H
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      for (const h of HOUSES) {
        const cells = h.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cells.length === 2) {
          const u = cells[0]!;
          const v = cells[1]!;
          const idxU = vertexMap.get(`${u}:${d}`);
          const idxV = vertexMap.get(`${v}:${d}`);
          if (idxU !== undefined && idxV !== undefined) {
            addEdge(idxU, idxV);
          }
        }
      }
    }

    // Bi-value strong links: cell c, exactly 2 candidates
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) {
        const m = grid.candidatesOf(c);
        if (popcount(m) === 2) {
          const ds = digitsOf(m);
          const idx1 = vertexMap.get(`${c}:${ds[0]!}`);
          const idx2 = vertexMap.get(`${c}:${ds[1]!}`);
          if (idx1 !== undefined && idx2 !== undefined) {
            addEdge(idx1, idx2);
          }
        }
      }
    }

    // 2. Find and 2-color connected components of the strong links
    const visited = new Set<number>();
    for (let s = 0; s < V; s++) {
      if (visited.has(s) || adj[s]!.length === 0) continue;

      // Color this component
      const color = new Map<number, 'A' | 'B'>();
      const queue = [s];
      color.set(s, 'A');
      let isBipartite = true;

      const compVertices: number[] = [];
      while (queue.length > 0) {
        const u = queue.shift()!;
        compVertices.push(u);
        const cU = color.get(u)!;
        const cOpp = cU === 'A' ? 'B' : 'A';

        for (const v of adj[u]!) {
          if (color.has(v)) {
            if (color.get(v) === cU) {
              isBipartite = false;
            }
          } else {
            color.set(v, cOpp);
            queue.push(v);
          }
        }
      }

      for (const cv of compVertices) visited.add(cv);

      if (!isBipartite) continue; // Skip non-bipartite component

      const colorA = new Set<number>(compVertices.filter(v => color.get(v) === 'A'));
      const colorB = new Set<number>(compVertices.filter(v => color.get(v) === 'B'));

      const activeA = [...colorA].map(v => vertices[v]!);
      const activeB = [...colorB].map(v => vertices[v]!);

      // Help functions for whole-color eliminations
      const links: Link[] = [];
      for (let i = 0; i < V; i++) {
        for (const j of adj[i]!) {
          if (i < j && compVertices.includes(i)) {
            links.push({
              from: { cell: vertices[i]!.cell, digit: vertices[i]!.digit },
              to: { cell: vertices[j]!.cell, digit: vertices[j]!.digit },
              type: 'strong'
            });
          }
        }
      }

      function buildWholeColorStep(self: Strategy, falseSet: typeof activeA, trueSet: typeof activeA, ruleName: string, ruleDescZh: string, ruleDescEn: string): Step | null {
        const eliminations = falseSet
          .filter(v => grid.get(v.cell) === 0 && grid.hasCandidate(v.cell, v.digit))
          .map(v => ({ cell: v.cell, digit: v.digit }));

        const placements = trueSet
          .filter(v => grid.get(v.cell) === 0 && grid.hasCandidate(v.cell, v.digit) && popcount(grid.candidatesOf(v.cell)) === 1) // Only place if it is certain
          .map(v => ({ cell: v.cell, digit: v.digit }));

        if (eliminations.length === 0) return null;

        const highlightedCells = [...new Set([...compVertices.map(v => vertices[v]!.cell), ...eliminations.map(e => e.cell)])];
        return {
          strategyId: self.id,
          placements,
          eliminations,
          highlights: {
            cells: highlightedCells,
            candidates: [
              ...compVertices.map(v => ({ cell: vertices[v]!.cell, digit: vertices[v]!.digit })),
              ...eliminations
            ],
            links
          },
          explanation: {
            zh: `三维美杜莎（${ruleName}）：${ruleDescZh}。因此该颜色组全部为假，消去其所有候选，另一组候选全部为真。`,
            en: `3D Medusa (${ruleName}): ${ruleDescEn}. Thus this color group is false; eliminate all its candidates, making the opposite group true.`
          }
        };
      }

      // Check R1: Twice in a Cell
      // If a cell has two candidates colored the same color
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0) {
          const cellsA = activeA.filter(v => v.cell === c);
          if (cellsA.length >= 2) {
            const step = buildWholeColorStep(this, activeA, activeB, 'R1', `格 ${cellLabel(c)} 中有两个候选数同为 A 组着色`, `cell ${cellLabel(c)} has two candidates colored group A`);
            if (step) return step;
          }
          const cellsB = activeB.filter(v => v.cell === c);
          if (cellsB.length >= 2) {
            const step = buildWholeColorStep(this, activeB, activeA, 'R1', `格 ${cellLabel(c)} 中有两个候选数同为 B 组着色`, `cell ${cellLabel(c)} has two candidates colored group B`);
            if (step) return step;
          }
        }
      }

      // Check R2: Twice in a Unit
      // If a house has two cells with the same color on the same digit
      for (const h of HOUSES) {
        for (let d = 1; d <= 9; d++) {
          const cellsA = activeA.filter(v => v.digit === d && h.includes(v.cell));
          if (cellsA.length >= 2) {
            const step = buildWholeColorStep(this, activeA, activeB, 'R2', `某区域内在数字 ${d} 上有两个格同为 A 组着色`, `unit has two cells colored group A on digit ${d}`);
            if (step) return step;
          }
          const cellsB = activeB.filter(v => v.digit === d && h.includes(v.cell));
          if (cellsB.length >= 2) {
            const step = buildWholeColorStep(this, activeB, activeA, 'R2', `某区域内在数字 ${d} 上有两个格同为 B 组着色`, `unit has two cells colored group B on digit ${d}`);
            if (step) return step;
          }
        }
      }

      // Check R3: Two colors in a cell
      // An uncolored candidate (c, x) in a cell c that holds both a Green and a Blue colored candidate
      const r3Elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0) {
          const hasA = activeA.some(v => v.cell === c);
          const hasB = activeB.some(v => v.cell === c);
          if (hasA && hasB) {
            // All other uncolored candidates in cell c can be eliminated
            for (const d of digitsOf(grid.candidatesOf(c))) {
              const isColored = compVertices.some(v => vertices[v]!.cell === c && vertices[v]!.digit === d);
              if (!isColored) {
                r3Elims.push({ cell: c, digit: d });
              }
            }
          }
        }
      }
      if (r3Elims.length > 0) {
        const highlightedCells = [...new Set([...compVertices.map(v => vertices[v]!.cell), ...r3Elims.map(e => e.cell)])];
        return {
          strategyId: this.id,
          placements: [],
          eliminations: r3Elims,
          highlights: {
            cells: highlightedCells,
            candidates: [
              ...compVertices.map(v => ({ cell: vertices[v]!.cell, digit: vertices[v]!.digit })),
              ...r3Elims
            ],
            links
          },
          explanation: {
            zh: `三维美杜莎（R3）：格中同时包含 A 组和 B 组的着色候选数，其他未着色的候选数必定为假，消去格中的未着色候选 ${r3Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}。`,
            en: `3D Medusa (R3): a cell holds both group A and group B candidates; eliminate other uncolored candidates ${r3Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}.`
          }
        };
      }

      // Check R4: Two colors in a unit
      // An uncolored candidate (c, d) sees a Green d and a Blue d
      const r4Elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0) {
          for (const d of digitsOf(grid.candidatesOf(c))) {
            const isColored = compVertices.some(v => vertices[v]!.cell === c && vertices[v]!.digit === d);
            if (!isColored) {
              const seesA = activeA.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell));
              const seesB = activeB.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell));
              if (seesA && seesB) {
                r4Elims.push({ cell: c, digit: d });
              }
            }
          }
        }
      }
      if (r4Elims.length > 0) {
        const highlightedCells = [...new Set([...compVertices.map(v => vertices[v]!.cell), ...r4Elims.map(e => e.cell)])];
        return {
          strategyId: this.id,
          placements: [],
          eliminations: r4Elims,
          highlights: {
            cells: highlightedCells,
            candidates: [
              ...compVertices.map(v => ({ cell: vertices[v]!.cell, digit: vertices[v]!.digit })),
              ...r4Elims
            ],
            links
          },
          explanation: {
            zh: `三维美杜莎（R4）：数字的未着色候选能同时看到同数字的 A 组和 B 组着色候选，消去 ${r4Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}。`,
            en: `3D Medusa (R4): uncolored candidate sees both group A and group B of the same digit; eliminate ${r4Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}.`
          }
        };
      }

      // Check R5: Two colors, unit + cell
      // An uncolored candidate (c, d) sees a colored d of color X along a house AND cell c holds opposite color Y on another digit
      const r5Elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0) {
          for (const d of digitsOf(grid.candidatesOf(c))) {
            const isColored = compVertices.some(v => vertices[v]!.cell === c && vertices[v]!.digit === d);
            if (!isColored) {
              // Check if cell c holds color A (on other digits) AND sees color B of digit d
              const cellHasA = activeA.some(v => v.cell === c && v.digit !== d);
              const seesBOfDigit = activeB.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell));
              if (cellHasA && seesBOfDigit) {
                r5Elims.push({ cell: c, digit: d });
                continue;
              }
              // Check if cell c holds color B (on other digits) AND sees color A of digit d
              const cellHasB = activeB.some(v => v.cell === c && v.digit !== d);
              const seesAOfDigit = activeA.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell));
              if (cellHasB && seesAOfDigit) {
                r5Elims.push({ cell: c, digit: d });
              }
            }
          }
        }
      }
      if (r5Elims.length > 0) {
        const highlightedCells = [...new Set([...compVertices.map(v => vertices[v]!.cell), ...r5Elims.map(e => e.cell)])];
        return {
          strategyId: this.id,
          placements: [],
          eliminations: r5Elims,
          highlights: {
            cells: highlightedCells,
            candidates: [
              ...compVertices.map(v => ({ cell: vertices[v]!.cell, digit: vertices[v]!.digit })),
              ...r5Elims
            ],
            links
          },
          explanation: {
            zh: `三维美杜莎（R5）：未着色候选在其格内看到一组着色，且在其区域内看到另一组同数字着色，消去 ${r5Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}。`,
            en: `3D Medusa (R5): uncolored candidate sees opposite colors in its cell and in its unit; eliminate ${r5Elims.map(e => `${cellLabel(e.cell)}(${e.digit})`).join(', ')}.`
          }
        };
      }

      // Check R6: Cell Emptied by Color
      // An uncolored cell whose every candidate sees the same single color
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0) {
          const hasColored = compVertices.some(v => vertices[v]!.cell === c);
          if (!hasColored) {
            const cands = digitsOf(grid.candidatesOf(c));
            if (cands.length > 0) {
              const allSeeA = cands.every(d => activeA.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell)));
              const allSeeB = cands.every(d => activeB.some(v => v.digit === d && PEERS_OF[c]!.includes(v.cell)));
              if (allSeeA) {
                const step = buildWholeColorStep(this, activeA, activeB, 'R6', `格 ${cellLabel(c)} 的所有候选都被 A 组着色排除`, `all candidates of cell ${cellLabel(c)} see group A`);
                if (step) return step;
              }
              if (allSeeB) {
                const step = buildWholeColorStep(this, activeB, activeA, 'R6', `格 ${cellLabel(c)} 的所有候选都被 B 组着色排除`, `all candidates of cell ${cellLabel(c)} see group B`);
                if (step) return step;
              }
            }
          }
        }
      }
    }
    return null;
  }
};
