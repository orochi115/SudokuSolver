import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName } from './common.js';
import { buildLinkGraph, candidateNodes, commonCandidatePeers, nodeKey, sameNode } from './advanced-common.js';
import type { CandidateEdge, CandidateNode } from './advanced-common.js';

const MAX_LINKS = 9;

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '强弱交替链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid): Step | null {
    const graph = buildLinkGraph(grid);
    const nodes = candidateNodes(grid);
    for (const start of nodes) {
      const result = search(grid, graph, start, start, [], new Set([nodeKey(start)]), 'strong');
      if (result) {
        const pathCells = [...new Set([result.start.cell, result.end.cell, ...result.links.flatMap((l) => [l.from.cell, l.to.cell])])];
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: { cells: pathCells, candidates: candidateHighlights(pathCells, [result.start.digit, result.end.digit]), links: result.links },
          explanation: {
            zh: `${cellName(result.start.cell)} 与 ${cellName(result.end.cell)} 的数字 ${result.start.digit} 是强弱交替链两端，至少一端为真，可删除同时看见两端的候选。`,
            en: `${cellName(result.start.cell)} and ${cellName(result.end.cell)} are same-digit endpoints of an AIC; at least one endpoint is true, so candidates seeing both endpoints are removed.`,
          },
        };
      }
    }
    return null;
  },
};

interface SearchResult {
  start: CandidateNode;
  end: CandidateNode;
  links: CandidateEdge[];
  eliminations: Array<{ cell: number; digit: number }>;
}

function search(grid: Parameters<Strategy['apply']>[0], graph: Map<string, CandidateEdge[]>, start: CandidateNode, current: CandidateNode, links: CandidateEdge[], visited: Set<string>, nextType: 'strong' | 'weak'): SearchResult | null {
  if (links.length >= 3 && links.length % 2 === 1 && links[0]!.type === 'strong' && links[links.length - 1]!.type === 'strong' && current.digit === start.digit && current.cell !== start.cell) {
    const eliminations = commonCandidatePeers(grid, start, current).filter((e) => !links.some((l) => l.from.cell === e.cell || l.to.cell === e.cell));
    if (eliminations.length > 0) return { start, end: current, links, eliminations };
  }
  if (links.length >= MAX_LINKS) return null;
  for (const edge of graph.get(nodeKey(current)) ?? []) {
    if (edge.type !== nextType) continue;
    const next = edge.to;
    const key = nodeKey(next);
    if (visited.has(key) || sameNode(start, next)) continue;
    visited.add(key);
    const result = search(grid, graph, start, next, [...links, edge], visited, nextType === 'strong' ? 'weak' : 'strong');
    if (result) return result;
    visited.delete(key);
  }
  return null;
}
