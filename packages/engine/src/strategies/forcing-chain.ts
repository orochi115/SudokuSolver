import type { Grid } from '../grid.js';
import { getStrategyOptions } from '../strategy-options.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { buildLinkGraph, chainToLinks, edgeOther, type LinkEdge } from './_links.js';

interface ImplicationEdge {
  from: number;
  to: number;
  via: LinkEdge;
}

interface SearchState {
  literal: number;
  depth: number;
}

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid: Grid): Step | null {
    const options = getStrategyOptions().forcingBoundary;
    const graph = buildLinkGraph(grid);
    const implications = buildImplications(graph);

    for (const node of graph.nodes) {
      const trueLit = literalOf(node.id, true);
      const falseLit = literalOf(node.id, false);

      const contradictionFromTrue = findPath(
        implications,
        trueLit,
        falseLit,
        options.maxChainLength,
        options.allowBranching,
      );
      if (contradictionFromTrue) {
        return {
          strategyId: this.id,
          placements: [],
          eliminations: [{ cell: node.cell, digit: node.digit }],
          highlights: {
            cells: Array.from(new Set(contradictionFromTrue.nodeIds.map((id) => graph.nodes[id]!.cell).concat([node.cell]))),
            candidates: contradictionFromTrue.nodeIds.map((id) => {
              const n = graph.nodes[id]!;
              return { cell: n.cell, digit: n.digit };
            }),
            links: chainToLinks({ nodeIds: contradictionFromTrue.nodeIds, edges: contradictionFromTrue.linkEdges }, graph.nodes),
          },
          explanation: {
            zh: `强制链推出矛盾：若 ${node.digit} 在该格为真会导致自我否定，因此删除该候选。`,
            en: `The forcing chain reaches a contradiction: assuming ${node.digit} true in this cell implies its negation, so eliminate it.`,
          },
        };
      }

      const truthFromFalse = findPath(
        implications,
        falseLit,
        trueLit,
        options.maxChainLength,
        options.allowBranching,
      );
      if (truthFromFalse) {
        return {
          strategyId: this.id,
          placements: [{ cell: node.cell, digit: node.digit }],
          eliminations: [],
          highlights: {
            cells: Array.from(new Set(truthFromFalse.nodeIds.map((id) => graph.nodes[id]!.cell).concat([node.cell]))),
            candidates: truthFromFalse.nodeIds.map((id) => {
              const n = graph.nodes[id]!;
              return { cell: n.cell, digit: n.digit };
            }),
            links: chainToLinks({ nodeIds: truthFromFalse.nodeIds, edges: truthFromFalse.linkEdges }, graph.nodes),
          },
          explanation: {
            zh: `强制链推出定值：否定 ${node.digit} 会导出矛盾，因此该格必须填入 ${node.digit}。`,
            en: `The forcing chain proves placement: denying ${node.digit} leads to contradiction, so this cell must be ${node.digit}.`,
          },
        };
      }
    }

    return null;
  },
};

function literalOf(nodeId: number, truth: boolean): number {
  return nodeId * 2 + (truth ? 0 : 1);
}

function nodeFromLiteral(literal: number): number {
  return Math.floor(literal / 2);
}

function buildImplications(graph: ReturnType<typeof buildLinkGraph>): ImplicationEdge[][] {
  const count = graph.nodes.length * 2;
  const out: ImplicationEdge[][] = Array.from({ length: count }, () => []);

  const add = (from: number, to: number, via: LinkEdge): void => {
    out[from]!.push({ from, to, via });
  };

  for (const edge of graph.edges) {
    const a = edge.from;
    const b = edge.to;
    if (edge.type === 'weak') {
      add(literalOf(a, true), literalOf(b, false), edge);
      add(literalOf(b, true), literalOf(a, false), edge);
    } else {
      add(literalOf(a, false), literalOf(b, true), edge);
      add(literalOf(b, false), literalOf(a, true), edge);
    }
  }

  return out;
}

function findPath(
  graph: ImplicationEdge[][],
  start: number,
  goal: number,
  maxDepth: number,
  allowBranching: boolean,
): { nodeIds: number[]; linkEdges: LinkEdge[] } | null {
  if (allowBranching) {
    return bfsPath(graph, start, goal, maxDepth);
  }
  return dfsSinglePath(graph, start, goal, maxDepth);
}

function bfsPath(
  graph: ImplicationEdge[][],
  start: number,
  goal: number,
  maxDepth: number,
): { nodeIds: number[]; linkEdges: LinkEdge[] } | null {
  const queue: SearchState[] = [{ literal: start, depth: 0 }];
  const parent = new Map<number, { prev: number; edge: ImplicationEdge }>();
  const seen = new Set<number>([start]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.literal === goal) return rebuildPath(parent, start, goal);
    if (cur.depth >= maxDepth) continue;

    for (const edge of graph[cur.literal] ?? []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      parent.set(edge.to, { prev: cur.literal, edge });
      queue.push({ literal: edge.to, depth: cur.depth + 1 });
    }
  }

  return null;
}

function dfsSinglePath(
  graph: ImplicationEdge[][],
  start: number,
  goal: number,
  maxDepth: number,
): { nodeIds: number[]; linkEdges: LinkEdge[] } | null {
  const seen = new Set<number>([start]);
  const litPath: number[] = [start];
  const edgePath: ImplicationEdge[] = [];

  const walk = (lit: number, depth: number): boolean => {
    if (lit === goal) return true;
    if (depth >= maxDepth) return false;
    for (const edge of graph[lit] ?? []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      litPath.push(edge.to);
      edgePath.push(edge);
      if (walk(edge.to, depth + 1)) return true;
      edgePath.pop();
      litPath.pop();
      seen.delete(edge.to);
    }
    return false;
  };

  if (!walk(start, 0)) return null;

  return {
    nodeIds: litPath.map(nodeFromLiteral),
    linkEdges: edgePath.map((x) => orient(x.via, nodeFromLiteral(x.from))),
  };
}

function rebuildPath(
  parent: Map<number, { prev: number; edge: ImplicationEdge }>,
  start: number,
  goal: number,
): { nodeIds: number[]; linkEdges: LinkEdge[] } {
  const lits: number[] = [goal];
  const edges: ImplicationEdge[] = [];
  let cur = goal;
  while (cur !== start) {
    const p = parent.get(cur)!;
    edges.push(p.edge);
    cur = p.prev;
    lits.push(cur);
  }
  lits.reverse();
  edges.reverse();

  return {
    nodeIds: lits.map(nodeFromLiteral),
    linkEdges: edges.map((e) => orient(e.via, nodeFromLiteral(e.from))),
  };
}

function orient(edge: LinkEdge, fromNodeId: number): LinkEdge {
  if (edge.from === fromNodeId) return edge;
  if (edge.to === fromNodeId) return { from: edge.to, to: edge.from, type: edge.type };
  const other = edgeOther(edge, fromNodeId);
  return { from: fromNodeId, to: other, type: edge.type };
}
