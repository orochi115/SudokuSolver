import { ROW_OF, COL_OF, PEERS_OF, maskOf, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import type { LinkGraph, Chain } from '../chain/graph.js';
import { chainToLinks } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function seesAllOfNode(cell: number, nodeCells: number[]): boolean {
  if (nodeCells.includes(cell)) return false;
  for (const nc of nodeCells) {
    if (cell === nc) return false;
    if (!PEERS_OF[cell]!.includes(nc)) return false;
  }
  return true;
}

interface LoopResult {
  kind: 'continuous' | 'discontinuous';
  chain: Chain;
  discontDigit?: number;
  discontCell?: number;
}

function searchNiceLoops(grid: Grid, graph: LinkGraph, maxLen: number): LoopResult | null {
  const n = graph.nodes.length;
  const perStartBudget = 3000;

  for (let s = 0; s < n; s++) {
    let budget = perStartBudget;
    interface QItem {
      node: number;
      nextType: 'strong' | 'weak';
      chain: Chain;
      visited: Set<number>;
    }
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      if (item.chain.length >= maxLen) continue;

      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;

        if (edge.to === s && item.chain.length >= 4) {
          const firstLink = item.chain[1]!.incoming;
          const lastLink = edge.type;
          if (firstLink === 'strong' && lastLink === 'strong') {
            return { kind: 'continuous', chain: item.chain };
          }
          if (firstLink === 'weak' && lastLink === 'weak') {
            const startNode = graph.nodes[s]!;
            if (startNode.cells.length === 1) {
              return {
                kind: 'discontinuous',
                chain: item.chain,
                discontDigit: startNode.digit,
                discontCell: startNode.cells[0]!,
              };
            }
          }
          if (firstLink !== lastLink) {
            return { kind: 'continuous', chain: item.chain };
          }
        }

        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        queue.push({
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          visited,
        });
      }
    }
  }
  return null;
}

function continuousLoopEliminations(grid: Grid, graph: LinkGraph, chain: Chain): CellDigit[] {
  const elims: CellDigit[] = [];
  const chainNodeSet = new Set(chain.map((s) => s.node));

  for (let i = 0; i < chain.length; i++) {
    const curr = chain[i]!;
    const prev = chain[(i - 1 + chain.length) % chain.length]!;
    const next = chain[(i + 1) % chain.length]!;

    const prevLink = curr.incoming;
    const nextLink = next.incoming;

    if (prevLink === 'strong' && nextLink === 'strong') {
      const node = graph.nodes[curr.node]!;
      const bit = maskOf(node.digit);
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        if (node.cells.includes(c)) continue;
        if (seesAllOfNode(c, node.cells)) {
          let inChain = false;
          for (const cn of chainNodeSet) {
            if (graph.nodes[cn]!.cells.includes(c)) { inChain = true; break; }
          }
          if (!inChain) elims.push({ cell: c, digit: node.digit });
        }
      }
    }
  }

  const seen = new Set<string>();
  return elims.filter((e) => {
    const k = `${e.cell},${e.digit}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildNiceLoopStep(
  grid: Grid,
  graph: LinkGraph,
  result: LoopResult,
): Step | null {
  if (result.kind === 'continuous') {
    const eliminations = continuousLoopEliminations(grid, graph, result.chain);
    if (eliminations.length === 0) return null;

    const links = chainToLinks(graph, result.chain);
    const chainCells = result.chain.flatMap((s) => graph.nodes[s.node]!.cells);

    return {
      strategyId: 'nice-loop',
      placements: [],
      eliminations,
      highlights: {
        cells: [...new Set([...chainCells, ...eliminations.map((e) => e.cell)])],
        candidates: [
          ...result.chain.flatMap((s) =>
            graph.nodes[s.node]!.cells.map((c) => ({ cell: c, digit: graph.nodes[s.node]!.digit })),
          ),
          ...eliminations,
        ],
        links,
      },
      explanation: {
        zh: `连续 Nice Loop：强弱交替链形成闭环，链上每个弱链连接的候选数必为真，可消去链外可见这些候选数的格。`,
        en: `Continuous Nice Loop: alternating strong/weak links form a closed cycle; candidates connected by weak links in the loop must be true, allowing eliminations of those candidates outside the loop.`,
      },
    };
  }

  const discontDigit = result.discontDigit!;
  const discontCell = result.discontCell!;
  if (!grid.hasCandidate(discontCell, discontDigit)) return null;

  const links = chainToLinks(graph, result.chain);
  const chainCells = result.chain.flatMap((s) => graph.nodes[s.node]!.cells);

  return {
    strategyId: 'nice-loop',
    placements: [],
    eliminations: [{ cell: discontCell, digit: discontDigit }],
    highlights: {
      cells: [...new Set([...chainCells, discontCell])],
      candidates: [
        ...result.chain.flatMap((s) =>
          graph.nodes[s.node]!.cells.map((c) => ({ cell: c, digit: graph.nodes[s.node]!.digit })),
        ),
        { cell: discontCell, digit: discontDigit },
      ],
      links,
    },
    explanation: {
      zh: `不连续 Nice Loop：链两端在 ${cellLabel(discontCell)} 以弱链汇合，该格候选数 ${discontDigit} 导致矛盾，可消去。`,
      en: `Discontinuous Nice Loop: chain ends meet at ${cellLabel(discontCell)} with weak links; candidate ${discontDigit} creates a contradiction and can be eliminated.`,
    },
  };
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice Loop', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoops(grid, graph, 16);
    if (!result) return null;
    return buildNiceLoopStep(grid, graph, result);
  },
};
