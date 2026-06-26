/**
 * Turbot Fish (P0) — 多宝鱼
 *
 * A generic single-digit strong-link chain of length 4 (two strong links joined
 * by one weak link). Skyscraper, 2-String Kite and Empty Rectangle are special
 * geometric cases of this pattern and are reported by their own strategies first;
 * this strategy claims the remaining short single-digit AICs that reach the same
 * conclusion: one of the two endpoints holds the digit, so the digit can be
 * eliminated from cells seeing both endpoints.
 *
 * Implementation: presentation alias over the shared `x-chain` engine. We reuse
 * `findSingleDigitAic` with a max-node cap of 4 so that longer X-Cycles remain
 * under the `x-chain` strategy id.
 */

import { buildLinkGraph } from '../chain/graph.js';
import { findSingleDigitAic } from './aic.js';
import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const MAX_TURBOT_NODES = 4;

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const result = findSingleDigitAic(grid, DEFAULT_CHAIN_POLICY, MAX_TURBOT_NODES);
    if (!result) return null;
    const graph = buildLinkGraph(grid, { digit: result.digit, grouped: true });
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
        zh: `多宝鱼：数字 ${result.digit} 经两条强链与一条弱链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，至少一端为真；从能看到两端的格中消去 ${result.digit}。`,
        en: `Turbot Fish: digit ${result.digit} is chained by two strong links and one weak link between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; at least one endpoint is true, so cells seeing both lose ${result.digit}.`,
      },
    };
  },
};
