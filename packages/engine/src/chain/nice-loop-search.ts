/**
 * Nice Loop search engine.
 *
 * Searches the shared strong/weak link graph for alternating cycles and classifies
 * them as continuous (Rule 1) or discontinuous (Rule 2 placement / Rule 3 elimination).
 */

import { maskOf, UNITS_OF, HOUSES, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import type { LinkGraph, ChainNode } from './graph.js';

export interface NiceLoopEdge {
  from: number;
  to: number;
  type: LinkType;
}

export interface NiceLoopResult {
  kind: 'continuous' | 'discontinuous-strong' | 'discontinuous-weak';
  startNode: number;
  edges: NiceLoopEdge[];
  eliminations: CellDigit[];
  placements: CellDigit[];
}

function opposite(type: LinkType): LinkType {
  return type === 'strong' ? 'weak' : 'strong';
}

function dedupeCellDigits(items: CellDigit[]): CellDigit[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const key = `${it.cell}:${it.digit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nodeCells(graph: LinkGraph, idx: number): number[] {
  return graph.nodes[idx]!.cells;
}

function commonHouses(cells: readonly number[]): number[] {
  if (cells.length === 0) return [];
  const common = new Set(UNITS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    const set = new Set(UNITS_OF[cells[i]!]!);
    for (const h of common) if (!set.has(h)) common.delete(h);
  }
  return [...common];
}

function loopNodeCells(graph: LinkGraph, edges: NiceLoopEdge[]): Set<number> {
  const set = new Set<number>();
  for (const e of edges) {
    for (const c of graph.nodes[e.from]!.cells) set.add(c);
    for (const c of graph.nodes[e.to]!.cells) set.add(c);
  }
  return set;
}

function evaluateContinuousLoop(
  grid: Grid,
  graph: LinkGraph,
  edges: NiceLoopEdge[],
): CellDigit[] {
  const loopCells = loopNodeCells(graph, edges);
  const out: CellDigit[] = [];

  for (const e of edges) {
    if (e.type !== 'weak') continue;
    const a = graph.nodes[e.from]!;
    const b = graph.nodes[e.to]!;

    // In-cell weak link: same cell, two digits.
    if (a.cells.length === 1 && b.cells.length === 1 && a.cells[0] === b.cells[0]) {
      const cell = a.cells[0]!;
      const keep = new Set([a.digit, b.digit]);
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        if (!keep.has(d)) out.push({ cell, digit: d });
      }
      continue;
    }

    // Between-cell weak link on a single digit.
    if (a.digit !== b.digit) continue;
    const digit = a.digit;
    const bit = maskOf(digit);
    const allCells = [...a.cells, ...b.cells];
    const houses = commonHouses(allCells);
    for (const h of houses) {
      for (const cell of HOUSES[h]!) {
        if (loopCells.has(cell)) continue;
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        out.push({ cell, digit });
      }
    }
  }

  return dedupeCellDigits(out);
}

function evaluateDiscontinuousStrong(
  grid: Grid,
  graph: LinkGraph,
  start: number,
): CellDigit[] {
  const node = graph.nodes[start]!;
  if (node.cells.length !== 1) return [];
  const cell = node.cells[0]!;
  if (!grid.hasCandidate(cell, node.digit)) return [];
  return digitsOf(grid.candidatesOf(cell))
    .filter((d) => d !== node.digit)
    .map((d) => ({ cell, digit: d }));
}

function evaluateDiscontinuousWeak(
  grid: Grid,
  graph: LinkGraph,
  start: number,
): CellDigit[] {
  const node = graph.nodes[start]!;
  const out: CellDigit[] = [];
  for (const cell of node.cells) {
    if (grid.hasCandidate(cell, node.digit)) out.push({ cell, digit: node.digit });
  }
  return out;
}

export function searchNiceLoop(
  grid: Grid,
  graph: LinkGraph,
  maxDepth = 24,
  perStartBudget = 4000,
): NiceLoopResult | null {
  const n = graph.nodes.length;

  function tryLoop(start: number, firstEdge: NiceLoopEdge): NiceLoopResult | null {
    const firstType = firstEdge.type;
    const visitedBase = new Set<number>([start, firstEdge.to]);

    interface QItem {
      path: number[];
      edges: NiceLoopEdge[];
      nextType: LinkType;
      visited: Set<number>;
    }

    const queue: QItem[] = [
      {
        path: [start, firstEdge.to],
        edges: [firstEdge],
        nextType: opposite(firstType),
        visited: new Set(visitedBase),
      },
    ];

    let budget = perStartBudget;
    while (queue.length) {
      if (budget-- <= 0) return null;
      const item = queue.shift()!;
      const cur = item.path[item.path.length - 1]!;
      if (item.path.length >= maxDepth) continue;

      for (const edge of graph.adjacency[cur]!) {
        if (edge.type !== item.nextType) continue;
        const v = edge.to;
        if (v === start) {
          // Closed loop.
          const loopEdges: NiceLoopEdge[] = [...item.edges, { from: cur, to: start, type: item.nextType }];
          const L = item.nextType;

          if (firstType === L) {
            // Discontinuous loop at the start node.
            if (firstType === 'strong') {
              const node = graph.nodes[start]!;
              if (node.cells.length !== 1) continue;
              const cell = node.cells[0]!;
              const eliminations = evaluateDiscontinuousStrong(grid, graph, start);
              if (eliminations.length === 0) continue;
              return {
                kind: 'discontinuous-strong',
                startNode: start,
                edges: loopEdges,
                eliminations,
                placements: [{ cell, digit: node.digit }],
              };
            } else {
              const eliminations = evaluateDiscontinuousWeak(grid, graph, start);
              if (eliminations.length === 0) continue;
              return {
                kind: 'discontinuous-weak',
                startNode: start,
                edges: loopEdges,
                eliminations,
                placements: [],
              };
            }
          } else {
            // Continuous loop: require at least 4 nodes.
            if (item.path.length < 4) continue;
            const eliminations = evaluateContinuousLoop(grid, graph, loopEdges);
            if (eliminations.length === 0) continue;
            return {
              kind: 'continuous',
              startNode: start,
              edges: loopEdges,
              eliminations,
              placements: [],
            };
          }
        }

        if (item.visited.has(v)) continue;
        const visited = new Set(item.visited);
        visited.add(v);
        queue.push({
          path: [...item.path, v],
          edges: [...item.edges, { from: cur, to: v, type: item.nextType }],
          nextType: opposite(item.nextType),
          visited,
        });
      }
    }
    return null;
  }

  for (let s = 0; s < n; s++) {
    for (const firstType of ['strong', 'weak'] as LinkType[]) {
      const neighbors = graph.adjacency[s]!
        .filter((e) => e.type === firstType)
        .map((e) => e.to)
        .sort((a, b) => a - b);
      for (const nxt of neighbors) {
        // Avoid trivial back-and-forth loops (s -> nxt -> s).
        const res = tryLoop(s, { from: s, to: nxt, type: firstType });
        if (res) return res;
      }
    }
  }
  return null;
}

export function niceLoopEdgesToLinks(graph: LinkGraph, edges: NiceLoopEdge[]): Link[] {
  const links: Link[] = [];
  for (const e of edges) {
    const a = graph.nodes[e.from]!;
    const b = graph.nodes[e.to]!;
    const link: Link = {
      from: { cell: a.cells[0]!, digit: a.digit },
      to: { cell: b.cells[0]!, digit: b.digit },
      type: e.type,
    };
    if (a.cells.length > 1) link.fromCells = [...a.cells];
    if (b.cells.length > 1) link.toCells = [...b.cells];
    links.push(link);
  }
  return links;
}
