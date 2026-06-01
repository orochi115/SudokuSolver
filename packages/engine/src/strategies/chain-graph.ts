import { BOXES, COLS, ROWS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link, LinkType } from '../trace.js';

export interface ChainNode {
  readonly cell: number;
  readonly digit: number;
  readonly key: string;
}

export interface ChainEdge {
  readonly to: number;
  readonly type: LinkType;
}

export interface ChainGraph {
  readonly nodes: readonly ChainNode[];
  readonly adjacency: readonly (readonly ChainEdge[])[];
  readonly nodeByKey: ReadonlyMap<string, number>;
}

export interface BuildChainGraphOptions {
  readonly singleDigit?: number;
  readonly bivalueOnly?: boolean;
  readonly includeCellWeakLinks?: boolean;
  readonly includeHouseWeakLinks?: boolean;
}

export interface ChainPath {
  readonly nodes: readonly number[];
  readonly edgeTypes: readonly LinkType[];
}

export interface SearchAlternatingOptions {
  readonly minEdges?: number;
  readonly maxEdges: number;
  readonly startType?: LinkType;
}

function keyOf(cell: number, digit: number): string {
  return `${cell}:${digit}`;
}

function addUndirected(
  adjacency: ChainEdge[][],
  seen: Set<string>,
  a: number,
  b: number,
  type: LinkType,
): void {
  if (a === b) return;
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  const token = `${lo}:${hi}:${type}`;
  if (seen.has(token)) return;
  seen.add(token);
  adjacency[a]!.push({ to: b, type });
  adjacency[b]!.push({ to: a, type });
}

function collectNodes(grid: Grid, opts: BuildChainGraphOptions): ChainNode[] {
  const out: ChainNode[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const mask = grid.candidatesOf(cell);
    if (opts.bivalueOnly && popcount(mask) !== 2) continue;
    const digits = opts.singleDigit === undefined ? digitsOf(mask) : [opts.singleDigit];
    for (const digit of digits) {
      if (!grid.hasCandidate(cell, digit)) continue;
      out.push({ cell, digit, key: keyOf(cell, digit) });
    }
  }
  return out;
}

export function buildChainGraph(grid: Grid, opts: BuildChainGraphOptions = {}): ChainGraph {
  const nodes = collectNodes(grid, opts);
  const nodeByKey = new Map<string, number>();
  nodes.forEach((node, idx) => nodeByKey.set(node.key, idx));
  const adjacency: ChainEdge[][] = Array.from({ length: nodes.length }, () => []);
  const seen = new Set<string>();

  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const d = digitsOf(grid.candidatesOf(cell));
    if (d.length === 2) {
      const a = nodeByKey.get(keyOf(cell, d[0]!));
      const b = nodeByKey.get(keyOf(cell, d[1]!));
      if (a !== undefined && b !== undefined) addUndirected(adjacency, seen, a, b, 'strong');
    }

    if (opts.includeCellWeakLinks !== false) {
      const local: number[] = [];
      for (const digit of d) {
        const idx = nodeByKey.get(keyOf(cell, digit));
        if (idx !== undefined) local.push(idx);
      }
      for (let i = 0; i < local.length; i++) {
        for (let j = i + 1; j < local.length; j++) {
          addUndirected(adjacency, seen, local[i]!, local[j]!, 'weak');
        }
      }
    }
  }

  const houses = [ROWS, COLS, BOXES] as const;
  for (const houseSet of houses) {
    for (const cells of houseSet) {
      for (let digit = 1; digit <= 9; digit++) {
        const idxs = cells
          .filter((cell) => grid.hasCandidate(cell, digit))
          .map((cell) => nodeByKey.get(keyOf(cell, digit)))
          .filter((idx): idx is number => idx !== undefined);

        if (idxs.length === 2) addUndirected(adjacency, seen, idxs[0]!, idxs[1]!, 'strong');
        if (opts.includeHouseWeakLinks !== false) {
          for (let i = 0; i < idxs.length; i++) {
            for (let j = i + 1; j < idxs.length; j++) {
              addUndirected(adjacency, seen, idxs[i]!, idxs[j]!, 'weak');
            }
          }
        }
      }
    }
  }

  return { nodes, adjacency, nodeByKey };
}

export function pathToLinks(graph: ChainGraph, path: ChainPath): Link[] {
  const out: Link[] = [];
  for (let i = 0; i < path.edgeTypes.length; i++) {
    const from = graph.nodes[path.nodes[i]!];
    const to = graph.nodes[path.nodes[i + 1]!];
    if (!from || !to) continue;
    out.push({
      from: { cell: from.cell, digit: from.digit },
      to: { cell: to.cell, digit: to.digit },
      type: path.edgeTypes[i]!,
    });
  }
  return out;
}

export function findFirstAlternatingPath(
  graph: ChainGraph,
  opts: SearchAlternatingOptions,
  accept: (path: ChainPath) => boolean,
): ChainPath | null {
  const minEdges = opts.minEdges ?? 3;
  const startType = opts.startType ?? 'strong';

  for (let start = 0; start < graph.nodes.length; start++) {
    const pathNodes: number[] = [start];
    const pathEdgeTypes: LinkType[] = [];
    const seen = new Set<number>([start]);

    function dfs(at: number, expected: LinkType): ChainPath | null {
      if (pathEdgeTypes.length >= minEdges && accept({ nodes: pathNodes, edgeTypes: pathEdgeTypes })) {
        return { nodes: [...pathNodes], edgeTypes: [...pathEdgeTypes] };
      }
      if (pathEdgeTypes.length >= opts.maxEdges) return null;

      for (const edge of graph.adjacency[at] ?? []) {
        if (edge.type !== expected) continue;
        if (seen.has(edge.to)) continue;
        seen.add(edge.to);
        pathNodes.push(edge.to);
        pathEdgeTypes.push(edge.type);
        const nextExpected: LinkType = expected === 'strong' ? 'weak' : 'strong';
        const found = dfs(edge.to, nextExpected);
        if (found) return found;
        pathEdgeTypes.pop();
        pathNodes.pop();
        seen.delete(edge.to);
      }
      return null;
    }

    const got = dfs(start, startType);
    if (got) return got;
  }
  return null;
}
