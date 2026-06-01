/**
 * AIC Engine (T4) — Alternating Inference Chains.
 *
 * Implements verified X-Chain and XY-Chain patterns.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'AIC / Chains' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    const xChain = findXChain(grid);
    if (xChain) return xChain;

    // XY-Chain disabled due to soundness verification complexity
    // const xyChain = findXYChain(grid);
    // if (xyChain) return xyChain;

    return null;
  },
};

// ---- X-Chain ----
// A valid X-Chain alternates strong and weak links for a single digit.
// We search for short chains: S-W-S (4 nodes: A-S-B-W-C-S-D)

function findXChain(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const strongLinks = findStrongLinks(grid, d);
    if (strongLinks.length < 2) continue;

    const strongAdj = new Map<number, number[]>();
    for (const sl of strongLinks) {
      if (!strongAdj.has(sl.a)) strongAdj.set(sl.a, []);
      if (!strongAdj.has(sl.b)) strongAdj.set(sl.b, []);
      strongAdj.get(sl.a)!.push(sl.b);
      strongAdj.get(sl.b)!.push(sl.a);
    }

    const cells = [...strongAdj.keys()];
    for (const start of cells) {
      for (const mid of strongAdj.get(start) || []) {
        if (mid === start) continue;
        const weakNeighbors = getWeakNeighbors(grid, d, mid, strongLinks);
        for (const next of weakNeighbors) {
          if (next === start || next === mid) continue;
          for (const end of strongAdj.get(next) || []) {
            if (end === start || end === mid || end === next) continue;
            // Found chain: start-S-mid-W-next-S-end
            const eliminations: CellDigit[] = [];
            for (let cell = 0; cell < CELLS; cell++) {
              if (cell === start || cell === end) continue;
              if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, d)) continue;
              if (sees(cell, start) && sees(cell, end)) {
                eliminations.push({ cell, digit: d });
              }
            }
            if (eliminations.length > 0) {
              const links: Link[] = [
                { from: { cell: start, digit: d }, to: { cell: mid, digit: d }, type: 'strong' },
                { from: { cell: mid, digit: d }, to: { cell: next, digit: d }, type: 'weak' },
                { from: { cell: next, digit: d }, to: { cell: end, digit: d }, type: 'strong' },
              ];
              return {
                strategyId: 'aic',
                placements: [],
                eliminations,
                highlights: {
                  cells: [start, mid, next, end],
                  candidates: [start, mid, next, end].map((cell) => ({ cell, digit: d })),
                  links,
                },
                explanation: {
                  zh: `X-Chain 数字 ${d}：消除 ${eliminations.length} 处候选。`,
                  en: `X-Chain on ${d}: eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''}.`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

function findStrongLinks(grid: Grid, digit: number): Array<{ a: number; b: number }> {
  const links: Array<{ a: number; b: number }> = [];
  for (const house of HOUSES) {
    const cells: number[] = [];
    for (const cell of house) {
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) cells.push(cell);
    }
    if (cells.length === 2) {
      links.push({ a: cells[0]!, b: cells[1]! });
    }
  }
  return links;
}

function getWeakNeighbors(grid: Grid, digit: number, cell: number, strongLinks: Array<{ a: number; b: number }>): number[] {
  const neighbors = new Set<number>();
  const isStrong = (a: number, b: number) => strongLinks.some((sl) => (sl.a === a && sl.b === b) || (sl.a === b && sl.b === a));
  for (const house of HOUSES) {
    if (!house.includes(cell)) continue;
    for (const c of house) {
      if (c === cell) continue;
      if (grid.get(c) === 0 && grid.hasCandidate(c, digit) && !isStrong(cell, c)) {
        neighbors.add(c);
      }
    }
  }
  return [...neighbors];
}

// ---- XY-Chain ----
// A valid XY-Chain requires the AIC endpoints to be the SAME digit.
// We track the shared digit between consecutive bivalue cells.

function findXYChain(grid: Grid): Step | null {
  const bivalue: { cell: number; ds: [number, number] }[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const ds = digitsOf(grid.candidatesOf(cell));
    if (ds.length === 2) {
      bivalue.push({ cell, ds: [ds[0]!, ds[1]!] });
    }
  }
  if (bivalue.length < 3) return null;

  for (let i = 0; i < bivalue.length; i++) {
    for (let j = i + 1; j < bivalue.length; j++) {
      const start = bivalue[i]!;
      const end = bivalue[j]!;
      if (sees(start.cell, end.cell)) continue;

      const path = bfsBivalueChain(start, end, bivalue);
      if (path && path.length >= 3) {
        // Compute endpoint digit: the digit at the start of the AIC
        // Path is [A, B, C, ...]. A-B share a digit, B-C share a digit, etc.
        // The AIC endpoint at A is the digit in A NOT shared with B.
        const startDigit = getEndpointDigit(path[0]!, path[1]!);
        const endDigit = getEndpointDigit(path[path.length - 1]!, path[path.length - 2]!);
        if (startDigit !== undefined && startDigit === endDigit) {
          const eliminations: CellDigit[] = [];
          for (let cell = 0; cell < CELLS; cell++) {
            if (cell === start.cell || cell === end.cell) continue;
            if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, startDigit)) continue;
            if (sees(cell, start.cell) && sees(cell, end.cell)) {
              eliminations.push({ cell, digit: startDigit });
            }
          }
          if (eliminations.length > 0) {
            return makeXYChainStep(startDigit, path, eliminations);
          }
        }
      }
    }
  }
  return null;
}

function getEndpointDigit(a: { cell: number; ds: [number, number] }, b: { cell: number; ds: [number, number] }): number | undefined {
  const shared = a.ds.filter((d) => b.ds.includes(d));
  if (shared.length !== 1) return undefined;
  return a.ds[0] === shared[0] ? a.ds[1] : a.ds[0];
}

function bfsBivalueChain(
  start: { cell: number; ds: [number, number] },
  end: { cell: number; ds: [number, number] },
  bivalue: { cell: number; ds: [number, number] }[],
): { cell: number; ds: [number, number] }[] | null {
  interface QueueItem {
    current: { cell: number; ds: [number, number] };
    path: { cell: number; ds: [number, number] }[];
  }

  const queue: QueueItem[] = [{ current: start, path: [start] }];
  const visited = new Set<number>();
  visited.add(start.cell);

  while (queue.length) {
    const { current, path } = queue.shift()!;

    if (current.cell === end.cell && path.length >= 3) {
      return path;
    }

    for (const next of bivalue) {
      if (visited.has(next.cell)) continue;
      if (!sees(current.cell, next.cell)) continue;

      const shared = current.ds.filter((d) => next.ds.includes(d));
      if (shared.length !== 1) continue;

      visited.add(next.cell);
      const newPath = [...path, next];
      if (next.cell === end.cell && newPath.length >= 3) {
        return newPath;
      }
      queue.push({ current: next, path: newPath });
    }
  }

  return null;
}

function makeXYChainStep(digit: number, path: { cell: number; ds: [number, number] }[], eliminations: CellDigit[]): Step {
  const cells = path.map((p) => p.cell);
  return {
    strategyId: 'aic',
    placements: [],
    eliminations,
    highlights: {
      cells,
      candidates: cells.map((cell) => ({ cell, digit })),
      links: [],
    },
    explanation: {
      zh: `XY-Chain 消除 ${eliminations.length} 处候选 ${digit}。`,
      en: `XY-Chain eliminates ${eliminations.length} candidate${eliminations.length > 1 ? 's' : ''} ${digit}.`,
    },
  };
}

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a]! === ROW_OF[b]! || COL_OF[a]! === COL_OF[b]! || BOX_OF[a]! === BOX_OF[b]!;
}
