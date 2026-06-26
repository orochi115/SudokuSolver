/** Turbot Fish — presentation alias for a short single-digit strong-link chain. */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '涡轮鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'chain-length'],
  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 8 });
      if (!result || result.eliminations.length === 0) continue;
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells.map((cell) => ({ cell, digit: graph.nodes[i]!.digit }))).concat(result.eliminations),
          links: result.links,
        },
        explanation: {
          zh: `涡轮鱼：数字 ${digit} 的单数字强弱链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，看见两端的格可消去 ${digit}。`,
          en: `Turbot Fish: a single-digit strong/weak chain for ${digit} connects ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; cells seeing both endpoints can eliminate ${digit}.`,
        },
      };
    }
    return null;
  },
};
