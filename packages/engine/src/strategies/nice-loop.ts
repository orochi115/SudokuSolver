import { CELLS, PEERS_OF, HOUSES, ROW_OF, COL_OF, maskOf, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, chainToLinks } from '../chain/graph.js';
import type { LinkGraph, Chain, ChainStep } from '../chain/graph.js';
import type { LinkType } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface LoopResult {
  kind: 'continuous' | 'discontinuous-strong' | 'discontinuous-weak';
  chain: Chain;
  startNode: number;
  eliminations: CellDigit[];
  placements: CellDigit[];
  links: Link[];
}

function candSees(c1: number, c2: number): boolean {
  return c1 !== c2 && PEERS_OF[c1]!.includes(c2);
}

function seesAllOfNode(cell: number, graph: LinkGraph, nodeIdx: number): boolean {
  const node = graph.nodes[nodeIdx]!;
  if (node.cells.includes(cell)) return false;
  for (const nc of node.cells) if (!candSees(cell, nc)) return false;
  return true;
}

function findContinuousLoopEliminations(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
): CellDigit[] {
  const elims: CellDigit[] = [];
  const chainNodeSet = new Set(chain.map((s) => s.node));

  for (let i = 0; i < chain.length; i++) {
    const nextI = (i + 1) % chain.length;
    const stepA = chain[i]!;
    const stepB = chain[nextI]!;
    const linkType = stepB.incoming;
    if (linkType !== 'weak') continue;

    const nodeA = graph.nodes[stepA.node]!;
    const nodeB = graph.nodes[stepB.node]!;

    if (nodeA.digit === nodeB.digit) {
      const digit = nodeA.digit;
      const bit = maskOf(digit);
      for (const house of HOUSES) {
        let aInHouse = false;
        let bInHouse = false;
        for (const c of nodeA.cells) if (house.includes(c)) aInHouse = true;
        for (const c of nodeB.cells) if (house.includes(c)) bInHouse = true;
        if (!aInHouse || !bInHouse) continue;

        for (const cell of house) {
          if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
          let inChain = false;
          for (const ni of chainNodeSet) {
            if (graph.nodes[ni]!.cells.includes(cell) && graph.nodes[ni]!.digit === digit) {
              inChain = true;
              break;
            }
          }
          if (inChain) continue;
          elims.push({ cell, digit });
        }
      }
    } else {
      if (nodeA.cells.length === 1 && nodeB.cells.length === 1 && nodeA.cells[0] === nodeB.cells[0]) {
        const cell = nodeA.cells[0]!;
        const m = grid.candidatesOf(cell);
        for (let d = 1; d <= SIZE; d++) {
          if (d === nodeA.digit || d === nodeB.digit) continue;
          if (m & maskOf(d)) elims.push({ cell, digit: d });
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

function searchNiceLoops(grid: Grid, graph: LinkGraph): LoopResult | null {
  const n = graph.nodes.length;
  const maxLen = 20;

  for (let startIdx = 0; startIdx < n; startIdx++) {
    interface QueueItem {
      node: number;
      nextType: LinkType;
      chain: Chain;
      visited: Set<number>;
    }

    const queue: QueueItem[] = [{
      node: startIdx,
      nextType: 'strong',
      chain: [{ node: startIdx, incoming: null }],
      visited: new Set([startIdx]),
    }];

    while (queue.length > 0) {
      const item = queue.shift()!;
      const lastStep = item.chain[item.chain.length - 1]!;

      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;

        if (edge.to === startIdx && item.chain.length >= 4) {
          const closeLink: LinkType = edge.type;
          const firstLink = item.chain[1]!.incoming!;

          const closingChain = [...item.chain, { node: startIdx, incoming: closeLink }];

          if (closeLink !== firstLink && item.chain.length % 2 === 0) {
            const elims = findContinuousLoopEliminations(grid, graph, item.chain);
            if (elims.length > 0) {
              return {
                kind: 'continuous',
                chain: closingChain,
                startNode: startIdx,
                eliminations: elims,
                placements: [],
                links: chainToLinks(graph, closingChain),
              };
            }
          }

          if (closeLink === firstLink && closeLink === 'strong') {
            const startNode = graph.nodes[startIdx]!;
            const placements: CellDigit[] = [];
            const eliminations: CellDigit[] = [];
            if (grid.get(startNode.cells[0]!) === 0) {
              placements.push({ cell: startNode.cells[0]!, digit: startNode.digit });
            }
            if (placements.length > 0 || eliminations.length > 0) {
              return {
                kind: 'discontinuous-strong',
                chain: closingChain,
                startNode: startIdx,
                eliminations,
                placements,
                links: chainToLinks(graph, closingChain),
              };
            }
          }

          if (closeLink === firstLink && closeLink === 'weak') {
            const startNode = graph.nodes[startIdx]!;
            const eliminations: CellDigit[] = [];
            if (grid.hasCandidate(startNode.cells[0]!, startNode.digit)) {
              eliminations.push({ cell: startNode.cells[0]!, digit: startNode.digit });
            }
            if (eliminations.length > 0) {
              return {
                kind: 'discontinuous-weak',
                chain: closingChain,
                startNode: startIdx,
                eliminations,
                placements: [],
                links: chainToLinks(graph, closingChain),
              };
            }
          }
        }

        if (item.visited.has(edge.to)) continue;
        if (item.chain.length >= maxLen) continue;

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

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoops(grid, graph);
    if (!result) return null;

    const startNode = graph.nodes[result.startNode]!;
    const chainCells = result.chain.flatMap((s) => graph.nodes[s.node]!.cells);

    let actionZh: string;
    let actionEn: string;
    if (result.kind === 'continuous') {
      actionZh = '连续环，弱链共享宫/行/列中的非环节候选数被消去';
      actionEn = 'continuous loop; off-chain candidates on weak-link houses eliminated';
    } else if (result.kind === 'discontinuous-strong') {
      actionZh = `不连续环（两强链交汇），${cellLabel(startNode.cells[0]!)} 必须为 ${startNode.digit}`;
      actionEn = `discontinuous loop (two strong links meet), ${cellLabel(startNode.cells[0]!)} must be ${startNode.digit}`;
    } else {
      actionZh = `不连续环（两弱链交汇），${cellLabel(startNode.cells[0]!)} 的 ${startNode.digit} 被消去`;
      actionEn = `discontinuous loop (two weak links meet), eliminate ${startNode.digit} from ${cellLabel(startNode.cells[0]!)}`;
    }

    return {
      strategyId: 'nice-loop',
      placements: result.placements,
      eliminations: result.eliminations,
      highlights: {
        cells: [...new Set([...chainCells, ...result.eliminations.map((e) => e.cell), ...result.placements.map((p) => p.cell)])],
        candidates: [
          ...result.chain.flatMap((s) =>
            graph.nodes[s.node]!.cells.map((c) => ({ cell: c, digit: graph.nodes[s.node]!.digit })),
          ),
          ...result.eliminations,
          ...result.placements,
        ],
        links: result.links,
      },
      explanation: {
        zh: `Nice环：${actionZh}。`,
        en: `Nice Loop: ${actionEn}.`,
      },
    };
  },
};
