import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import {
  buildLinkGraph,
  chainToLinks,
  commonPeersWithDigit,
  edgeOther,
  type ChainPath,
  type LinkEdge,
} from './_links.js';

const MAX_CHAIN_EDGES = 9;

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'AIC' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid);

    for (const start of graph.nodes) {
      const visited = new Set<number>([start.id]);
      const nodeIds = [start.id];
      const edges: LinkEdge[] = [];

      const step = dfs(
        grid,
        graph,
        start.id,
        'strong',
        visited,
        nodeIds,
        edges,
        this.id,
      );
      if (step) return step;
    }

    return null;
  },
};

function dfs(
  grid: Grid,
  graph: ReturnType<typeof buildLinkGraph>,
  currentId: number,
  expect: 'strong' | 'weak',
  visited: Set<number>,
  nodeIds: number[],
  pathEdges: LinkEdge[],
  strategyId: string,
): Step | null {
  if (pathEdges.length >= MAX_CHAIN_EDGES) return null;

  for (const edge of graph.adjacency[currentId] ?? []) {
    if (edge.type !== expect) continue;
    const nextId = edgeOther(edge, currentId);
    const startId = nodeIds[0]!;
    if (nextId !== startId && visited.has(nextId)) continue;

    nodeIds.push(nextId);
    pathEdges.push(edge);

    const step = maybeType1Elimination(grid, graph, { nodeIds: [...nodeIds], edges: [...pathEdges] }, strategyId);
    if (step) return step;

    if (nextId !== startId) {
      visited.add(nextId);
      const deeper = dfs(
        grid,
        graph,
        nextId,
        expect === 'strong' ? 'weak' : 'strong',
        visited,
        nodeIds,
        pathEdges,
        strategyId,
      );
      if (deeper) return deeper;
      visited.delete(nextId);
    }

    pathEdges.pop();
    nodeIds.pop();
  }

  return null;
}

function maybeType1Elimination(
  grid: Grid,
  graph: ReturnType<typeof buildLinkGraph>,
  chain: ChainPath,
  strategyId: string,
): Step | null {
  if (chain.edges.length < 3) return null;
  if (chain.edges[0]!.type !== 'strong') return null;
  if (chain.edges[chain.edges.length - 1]!.type !== 'strong') return null;

  const start = graph.nodes[chain.nodeIds[0]!]!;
  const end = graph.nodes[chain.nodeIds[chain.nodeIds.length - 1]!]!;
  if (start.id === end.id) return null;
  if (start.digit !== end.digit) return null;

  const digit = start.digit;
  const chainCells = new Set(chain.nodeIds.map((id) => graph.nodes[id]!.cell));
  const targets = commonPeersWithDigit(grid, start.cell, end.cell, digit).filter((cell) => !chainCells.has(cell));
  if (targets.length === 0) return null;

  return {
    strategyId,
    placements: [],
    eliminations: targets.map((cell) => ({ cell, digit })),
    highlights: {
      cells: Array.from(new Set(chain.nodeIds.map((id) => graph.nodes[id]!.cell).concat(targets))),
      candidates: Array.from(
        new Map(
          chain
            .nodeIds
            .map((id) => graph.nodes[id]!)
            .map((n) => [
              `${n.cell}:${n.digit}`,
              {
                cell: n.cell,
                digit: n.digit,
              },
            ]),
        ).values(),
      ),
      links: chainToLinks(chain, graph.nodes),
    },
    explanation: {
      zh: `AIC（Type 1）链两端为同一数字 ${digit} 且首尾为强链接，因此可删除同时看见两端的 ${digit}。`,
      en: `This AIC Type 1 has same-digit endpoints (${digit}) with strong links at both ends; eliminate ${digit} from cells that see both endpoints.`,
    },
  };
}
