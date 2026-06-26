/**
 * Turbot Fish (P0) — 多宝鱼
 *
 * A generic single-digit alternating chain of length 4 (3 links: strong-weak-strong).
 * This is the same pattern as Skyscraper / 2-String Kite / Empty Rectangle, but
 * presented as a named strategy via the x-chain engine.
 *
 * Per the single-digit strong-link family overlap: turbot-fish reuses the x-chain
 * owner and is a presentation alias — it runs the same `buildLinkGraph` + `searchAic`
 * limited to single-digit, and returns the first applicable chain.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';
import { ROW_OF, COL_OF } from '../grid.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, {
        ...DEFAULT_CHAIN_POLICY,
        maxChainLength: 4,
      });
      if (result && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        // Validate this is a length-4 (3-link) chain
        if (result.chainNodes.length !== 4) continue;
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
            zh: `Turbot Fish（多宝鱼）：数字 ${digit} 形成单数字交替链 ${cellLabel(start.cells[0]!)} - ${cellLabel(end.cells[0]!)}，两端必有其一为真，故公共可见格可排除 ${digit}。`,
            en: `Turbot Fish: digit ${digit} forms a single-digit alternating chain ${cellLabel(start.cells[0]!)} - ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
          },
        };
      }
    }
    return null;
  },
};