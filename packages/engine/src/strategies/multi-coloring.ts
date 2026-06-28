import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  maskOf, digitsOf, PEERS_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function buildCluster(grid: Grid, d: number): Map<number, 0 | 1> | null {
  const bit = maskOf(d);
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  const visited = new Set<number>();
  let best: Map<number, 0 | 1> | null = null;

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const coloring = new Map<number, 0 | 1>();
    const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    coloring.set(start, 0);

    while (queue.length > 0) {
      const { cell, color } = queue.shift()!;
      const ncolor = (1 - color) as 0 | 1;
      for (const neighbor of adj.get(cell) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        coloring.set(neighbor, ncolor);
        queue.push({ cell: neighbor, color: ncolor });
      }
    }

    if (coloring.size >= 2 && (best === null || coloring.size > best.size)) {
      best = coloring;
    }
  }

  return best;
}

function tryWrap(grid: Grid, d: number, bit: number, cluster: Map<number, 0 | 1>): Step | null {
  const color0: number[] = [];
  const color1: number[] = [];
  for (const [cell, c] of cluster) {
    if (c === 0) color0.push(cell);
    else color1.push(cell);
  }

  for (const [testColor, otherColor] of [[color0, color1], [color1, color0]] as [number[], number[]][]) {
    let conflict = false;
    outer: for (let i = 0; i < testColor.length; i++) {
      for (let j = i + 1; j < testColor.length; j++) {
        const a = testColor[i]!;
        const b = testColor[j]!;
        if (ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b]) {
          conflict = true;
          break outer;
        }
      }
    }

    if (!conflict) continue;

    const placements: CellDigit[] = otherColor
      .filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
      .map(c => ({ cell: c, digit: d }));

    if (placements.length === 0) continue;

    const allCells = [...cluster.keys()];
    return {
      strategyId: 'multi-coloring',
      placements,
      eliminations: [],
      highlights: {
        cells: allCells,
        candidates: allCells.map(c => ({ cell: c, digit: d })),
        links: [],
      },
      explanation: {
        zh: `X-Colors（包裹）：数字 ${d} 的染色簇中一色导致矛盾，另一色全真；填入 ${placements.map(p => cellLabel(p.cell) + '=' + d).join('、')}。`,
        en: `X-Colors (Wrap): digit ${d} cluster, one color contradicts; the other is true; place ${placements.map(p => cellLabel(p.cell) + '=' + d).join(', ')}.`,
      },
    };
  }
  return null;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cluster = buildCluster(grid, d);
      if (!cluster) continue;

      const result = tryWrap(grid, d, bit, cluster);
      if (result) return result;
    }
    return null;
  },
};