/**
 * Simple Coloring (T4) — single-digit strong-link graph with two colors.
 *
 * Trap: an uncolored candidate sees both colors -> eliminate it.
 * Wrap: two cells with the same color see each other -> that color is false,
 *       so the opposite color is true (all cells of that color are placements).
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const result = applyForDigit(grid, d);
      if (result) return result;
    }
    return null;
  },
};

function applyForDigit(grid: Grid, digit: number): Step | null {
  // Build conjugate pair graph: edges between cells that are the only two
  // candidates for this digit in some house.
  const adj: number[][] = Array.from({ length: CELLS }, () => []);
  for (const house of HOUSES) {
    const cells: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
        cells.push(cell);
      }
    }
    if (cells.length === 2) {
      adj[cells[0]!]!.push(cells[1]!);
      adj[cells[1]!]!.push(cells[0]!);
    }
  }

  // Color each connected component
  const color = new Int8Array(CELLS).fill(-1);
  for (let start = 0; start < CELLS; start++) {
    if (adj[start]!.length === 0) continue;
    if (color[start] !== -1) continue;

    // BFS this component
    const comp: number[] = [];
    const queue: number[] = [start];
    color[start] = 0;
    while (queue.length) {
      const u = queue.shift()!;
      comp.push(u);
      for (const v of adj[u]!) {
        if (color[v] === -1) {
          color[v] = color[u] === 0 ? 1 : 0;
          queue.push(v);
        }
      }
    }

    // Build sets for quick lookup
    const color0 = comp.filter((c) => color[c] === 0);
    const color1 = comp.filter((c) => color[c] === 1);

    // Wrap: two same-colored cells see each other -> that color is false
    const wrap0 = findWrap(grid, digit, color0);
    if (wrap0) {
      // color 0 is false, so color 1 is true -> placements
      return makeWrapStep(grid, digit, color0, color1, 0, comp, adj);
    }
    const wrap1 = findWrap(grid, digit, color1);
    if (wrap1) {
      return makeWrapStep(grid, digit, color1, color0, 1, comp, adj);
    }

    // Trap: uncolored candidate sees both colors
    const trap = findTrap(grid, digit, color0, color1);
    if (trap) {
      return makeTrapStep(grid, digit, trap.cell, color0, color1, comp, adj);
    }
  }

  return null;
}

function findWrap(grid: Grid, digit: number, cells: number[]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (sees(cells[i]!, cells[j]!)) return true;
    }
  }
  return false;
}

function findTrap(grid: Grid, digit: number, c0: number[], c1: number[]): { cell: number } | null {
  const s0 = new Set(c0);
  const s1 = new Set(c1);
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (!grid.hasCandidate(cell, digit)) continue;
    if (s0.has(cell) || s1.has(cell)) continue;
    let sees0 = false;
    let sees1 = false;
    for (const u of c0) {
      if (sees(u, cell)) { sees0 = true; break; }
    }
    if (!sees0) continue;
    for (const u of c1) {
      if (sees(u, cell)) { sees1 = true; break; }
    }
    if (sees1) return { cell };
  }
  return null;
}

function makeWrapStep(
  grid: Grid,
  digit: number,
  falseColor: number[],
  trueColor: number[],
  falseVal: number,
  comp: number[],
  adj: number[][],
): Step {
  const placements: CellDigit[] = trueColor.map((cell) => ({ cell, digit }));
  const links = buildLinks(comp, adj, digit);
  return {
    strategyId: 'simple-coloring',
    placements,
    eliminations: [],
    highlights: {
      cells: [...comp],
      candidates: comp.map((cell) => ({ cell, digit })),
      links,
    },
    explanation: {
      zh: `数字 ${digit} 的染色出现同色冲突（${falseColor.length} 格），因此对立色全部成立。`,
      en: `Coloring on ${digit} has a same-color conflict (${falseColor.length} cells), so the opposite color is true.`,
    },
  };
}

function makeTrapStep(
  grid: Grid,
  digit: number,
  trapCell: number,
  c0: number[],
  c1: number[],
  comp: number[],
  adj: number[][],
): Step {
  const eliminations: CellDigit[] = [{ cell: trapCell, digit }];
  const links = buildLinks(comp, adj, digit);
  return {
    strategyId: 'simple-coloring',
    placements: [],
    eliminations,
    highlights: {
      cells: [...comp, trapCell],
      candidates: [...comp.map((cell) => ({ cell, digit })), { cell: trapCell, digit }],
      links,
    },
    explanation: {
      zh: `数字 ${digit} 的染色：R${ROW_OF[trapCell]! + 1}C${COL_OF[trapCell]! + 1} 同时看到两色，可排除候选 ${digit}。`,
      en: `Coloring on ${digit}: R${ROW_OF[trapCell]! + 1}C${COL_OF[trapCell]! + 1} sees both colors, eliminating candidate ${digit}.`,
    },
  };
}

function buildLinks(comp: number[], adj: number[][], digit: number): Link[] {
  const links: Link[] = [];
  const visited = new Set<string>();
  for (const u of comp) {
    for (const v of adj[u]!) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (visited.has(key)) continue;
      visited.add(key);
      links.push({
        from: { cell: u, digit },
        to: { cell: v, digit },
        type: 'strong',
      });
    }
  }
  return links;
}

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a]! === ROW_OF[b]! || COL_OF[a]! === COL_OF[b]! ||
    (Math.floor(ROW_OF[a]! / 3) === Math.floor(ROW_OF[b]! / 3) &&
     Math.floor(COL_OF[a]! / 3) === Math.floor(COL_OF[b]! / 3));
}
