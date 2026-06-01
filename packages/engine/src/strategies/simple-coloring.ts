import { CELLS, SIZE, ROW_OF, COL_OF, HOUSES, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function conjugatePairs(grid: Grid, digit: number): [number, number][] {
  const bit = maskOf(digit);
  const pairs: [number, number][] = [];
  for (const house of HOUSES) {
    const cells: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) cells.push(c);
    }
    if (cells.length === 2) pairs.push([cells[0]!, cells[1]!]);
  }
  return pairs;
}

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      const pairs = conjugatePairs(grid, d);
      if (pairs.length === 0) continue;

      const adj = new Map<number, number[]>();
      for (const [a, b] of pairs) {
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      }

      const components: Map<number, boolean>[] = [];
      const globalColor = new Map<number, boolean>();
      const visited = new Set<number>();

      for (const start of adj.keys()) {
        if (visited.has(start)) continue;
        const comp = new Map<number, boolean>();
        const queue: number[] = [start];
        comp.set(start, true);
        globalColor.set(start, true);
        visited.add(start);
        while (queue.length > 0) {
          const cur = queue.shift()!;
          const curCol = comp.get(cur)!;
          for (const nb of adj.get(cur)!) {
            if (!visited.has(nb)) {
              visited.add(nb);
              comp.set(nb, !curCol);
              globalColor.set(nb, !curCol);
              queue.push(nb);
            }
          }
        }
        components.push(comp);
      }

      const allDigitCells: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) && !globalColor.has(c)) {
          allDigitCells.push(c);
        }
      }

      const links: Link[] = pairs.map(([a, b]) => ({
        from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' as const,
      }));

      const fmt = (c: number) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;

      for (const comp of components) {
        const trueCells: number[] = [];
        const falseCells: number[] = [];
        for (const [cell, col] of comp) {
          if (col) trueCells.push(cell); else falseCells.push(cell);
        }

        const coloredCells = [...trueCells, ...falseCells];
        const coloredCandidates = [...trueCells.map((c) => ({ cell: c, digit: d })), ...falseCells.map((c) => ({ cell: c, digit: d }))];

        const seesOneOf = (cell: number, list: number[]): boolean => {
          for (const c of list) {
            if (PEERS_OF[cell]!.includes(c)) return true;
          }
          return false;
        };

        const trapElims: { cell: number; digit: number }[] = [];
        for (const cell of allDigitCells) {
          if (seesOneOf(cell, trueCells) && seesOneOf(cell, falseCells)) {
            trapElims.push({ cell, digit: d });
          }
        }

        if (trapElims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: trapElims,
            highlights: { cells: coloredCells, candidates: coloredCandidates, links },
            explanation: {
              zh: `简单染色（陷阱）：数字 ${d} 的染色分量中，${trapElims.map((e) => fmt(e.cell)).join('、')} 同时看到两种颜色，因此排除 ${d}。`,
              en: `Simple Coloring (Trap): Digit ${d} — ${trapElims.map((e) => fmt(e.cell)).join(',')} see both colors within component, eliminate ${d}.`,
            },
          };
        }

        const colorArr = [...comp.entries()];
        for (let i = 0; i < colorArr.length; i++) {
          for (let j = i + 1; j < colorArr.length; j++) {
            const [c1, col1] = colorArr[i]!;
            const [c2, col2] = colorArr[j]!;
            if (col1 !== col2) continue;
            if (PEERS_OF[c1]!.includes(c2)) {
              const allSameColor = col1 ? trueCells : falseCells;
              const elims = allSameColor.map((c) => ({ cell: c, digit: d }));
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: { cells: coloredCells, candidates: coloredCandidates, links },
                explanation: {
                  zh: `简单染色（缠绕）：数字 ${d} 的同色候选 ${fmt(c1)} 和 ${fmt(c2)} 互相可见，该色全假，排除该色所有候选 ${d}。`,
                  en: `Simple Coloring (Wrap): Digit ${d} same-color ${fmt(c1)} & ${fmt(c2)} see each other, that color is false.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};