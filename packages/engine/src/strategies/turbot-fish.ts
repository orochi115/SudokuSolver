/**
 * Turbot Fish (P0) — 多宝鱼 / Turbot Fish
 *
 * Presentation alias for short (3-link) single-digit strong-link chains.
 * Reuses the x-chain / single-digit AIC engine (no independent search per E2 guidance).
 * When a short single-digit AIC result matches the turbot geometry we emit under this id.
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const graph = buildLinkGraph(grid, { digit: d, grouped: true });
      const res = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
      if (!res || res.eliminations.length === 0) continue;

      // Heuristic: short chain (length 3 links ~ 4 nodes) single digit => turbot presentation
      const len = res.chainNodes.length;
      if (len >= 3 && len <= 5) {
        const start = graph.nodes[res.startNode]!;
        const end = graph.nodes[res.endNode]!;
        return {
          strategyId: 'turbot-fish',
          placements: [],
          eliminations: res.eliminations,
          highlights: {
            cells: res.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: res.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: res.links,
          },
          explanation: {
            zh: `多宝鱼（单数字短强链）：数字 ${d} 在 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)} 之间形成短交替链；消去公共可见格中的 ${d}。`,
            en: `Turbot Fish: digit ${d} short single-digit AIC between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; eliminate ${d} from cells seeing both ends.`,
          },
        };
      }
    }
    return null;
  },
};
