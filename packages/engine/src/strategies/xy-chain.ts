import { popcount, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph, type ChainNode, type GraphEdge } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function buildXyChainGraph(grid: Grid): LinkGraph {
  const graph = buildLinkGraph(grid, { grouped: false });
  const keptNodeIndices = new Set<number>();
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i]!;
    if (node.cells.length === 1 && popcount(grid.candidatesOf(node.cells[0]!)) === 2) {
      keptNodeIndices.add(i);
    }
  }

  const newNodes: ChainNode[] = [];
  const oldToNew = new Map<number, number>();
  for (let i = 0; i < graph.nodes.length; i++) {
    if (keptNodeIndices.has(i)) {
      oldToNew.set(i, newNodes.length);
      newNodes.push(graph.nodes[i]!);
    }
  }

  const newAdjacency: GraphEdge[][] = newNodes.map(() => []);
  for (let i = 0; i < graph.nodes.length; i++) {
    if (!keptNodeIndices.has(i)) continue;
    const newFrom = oldToNew.get(i)!;
    for (const edge of graph.adjacency[i]!) {
      if (keptNodeIndices.has(edge.to)) {
        newAdjacency[newFrom]!.push({
          to: oldToNew.get(edge.to)!,
          type: edge.type,
        });
      }
    }
  }

  const newIndexOfKey = new Map<string, number>();
  for (let i = 0; i < newNodes.length; i++) {
    newIndexOfKey.set(newNodes[i]!.key, i);
  }

  return {
    nodes: newNodes,
    adjacency: newAdjacency,
    indexOfKey: newIndexOfKey,
  };
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY-Chain', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    const graph = buildXyChainGraph(grid);
    const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
    if (result && result.eliminations.length > 0) {
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap((i) =>
            graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          links: result.links,
        },
        explanation: {
          zh: `XY-Chain：从双值格 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 沿双值格交替链推理到 ${cellLabel(end.cells[0]!)} 的 ${end.digit}；消去受其共同制约的相应候选数。`,
          en: `XY-Chain: from bivalue cell ${cellLabel(start.cells[0]!)}=${start.digit} along a bivalue chain to ${cellLabel(end.cells[0]!)}=${end.digit}; eliminate candidates seen by both ends.`,
        },
      };
    }
    return null;
  },
};
