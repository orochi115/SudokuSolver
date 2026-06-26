import { COL_OF, ROW_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Link, LinkType, Step } from '../trace.js';
import { buildLinkGraph, chainToLinks, type Chain, type LinkGraph } from '../chain/graph.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function label(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function linkBetween(graph: LinkGraph, a: number, b: number, type: LinkType): boolean {
  return graph.adjacency[a]!.some((edge) => edge.to === b && edge.type === type);
}

function findNiceLoop(grid: Grid): Step | null {
  const graph = buildLinkGraph(grid, { grouped: true });
  const maxLen = DEFAULT_CHAIN_POLICY.maxChainLength;
  for (let start = 0; start < graph.nodes.length; start++) {
    for (const firstType of ['strong', 'weak'] as LinkType[]) {
      const queue: Array<{ node: number; nextType: LinkType; chain: Chain; visited: Set<number> }> = [
        { node: start, nextType: firstType, chain: [{ node: start, incoming: null }], visited: new Set([start]) },
      ];
      while (queue.length > 0) {
        const item = queue.shift()!;
        if (item.chain.length >= 4 && item.nextType === firstType && linkBetween(graph, item.node, start, item.nextType)) {
          const baseLinks = chainToLinks(graph, item.chain);
          const last = graph.nodes[item.node]!;
          const first = graph.nodes[start]!;
          const closing: Link = { from: { cell: last.cells[0]!, digit: last.digit }, to: { cell: first.cells[0]!, digit: first.digit }, type: item.nextType };
          if (last.cells.length > 1) closing.fromCells = [...last.cells];
          if (first.cells.length > 1) closing.toCells = [...first.cells];
          const links = [...baseLinks, closing];
          const placements = firstType === 'strong' && first.cells.length === 1 && grid.hasCandidate(first.cells[0]!, first.digit)
            ? [{ cell: first.cells[0]!, digit: first.digit }]
            : [];
          const eliminations = firstType === 'weak' && first.cells.length === 1 && grid.hasCandidate(first.cells[0]!, first.digit)
            ? [{ cell: first.cells[0]!, digit: first.digit }]
            : [];
          if (placements.length > 0 || eliminations.length > 0) {
            return {
              strategyId: 'nice-loop',
              placements,
              eliminations,
              highlights: {
                cells: [...new Set([...item.chain.flatMap((s) => graph.nodes[s.node]!.cells), ...eliminations.map((e) => e.cell), ...placements.map((p) => p.cell)])],
                candidates: item.chain.flatMap((s) => graph.nodes[s.node]!.cells.map((cell) => ({ cell, digit: graph.nodes[s.node]!.digit }))).concat(eliminations, placements),
                links,
              },
              explanation: {
                zh: firstType === 'strong'
                  ? '不连续 Nice Loop：同一候选处两条强链相遇；若该候选为假会推出其为真，因此必须填入。'
                  : '不连续 Nice Loop：同一候选处两条弱链相遇；若该候选为真会推出其为假，因此可消去。',
                en: firstType === 'strong'
                  ? 'Discontinuous Nice Loop: two strong links meet at the same candidate; if it were false the loop would force it true, so it is placed.'
                  : 'Discontinuous Nice Loop: two weak links meet at the same candidate; if it were true the loop would force it false, so it is eliminated.',
              },
            };
          }
        }
        if (item.chain.length >= maxLen) continue;
        for (const edge of graph.adjacency[item.node]!) {
          if (edge.type !== item.nextType || item.visited.has(edge.to)) continue;
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
  }
  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice Loop', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid): Step | null {
    const step = findNiceLoop(grid);
    if (!step) return null;
    const first = step.highlights.links[0]?.from;
    const last = step.highlights.links.at(-1)?.to;
    if (first && last) {
      step.explanation.zh += ` 起点 ${label(first.cell)}，闭合到 ${label(last.cell)}。`;
      step.explanation.en += ` Starts at ${label(first.cell)} and closes at ${label(last.cell)}.`;
    }
    return step;
  },
};
