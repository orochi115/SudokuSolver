/**
 * Turbot Fish — 多宝鱼 / X-Cycle.
 *
 * The single-digit strong-link family. Per the project overlap registry (E2):
 *   Turbot Fish = generic 2-strong-link single-digit chain
 *               = Skyscraper / 2-String Kite / Empty Rectangle as geometric cases.
 *   X-Cycle (single-digit Nice Loop) = the loop version of the same chain.
 *
 * This strategy reuses the x-chain search (canonical owner per overlap.ts) and
 * emits under the `turbot-fish` id. It only fires when the chain is a short
 * "Turbot-shaped" pattern (length 4 / 3 strong links / 1 weak link) OR a
 * single-digit X-Cycle (loop) — other length-3+ single-digit patterns are
 * already covered by x-chain (or by nice-loop when they form a continuous loop).
 *
 * Per overlap.ts, the canonical owner is `x-chain` and `turbot-fish` is a
 * presentation alias; this implementation reuses x-chain's link graph.
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

/**
 * Find the first valid Turbot Fish / X-Cycle step: a single-digit alternating
 * chain with 2 strong + 1 weak link (Turbot), or any longer single-digit X-Cycle
 * (open or closed). Reuses x-chain's graph + search.
 */
export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'house'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const graph = buildLinkGraph(grid, { digit: d, grouped: true });
      const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
      if (!result || result.eliminations.length === 0) continue;
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const sameDigit = start.digit === end.digit;
      // Turbot Fish: short single-digit alternating chain. The classic shape is
      // length 4 (2 strong + 1 weak) — we accept chains up to length 6 to cover
      // the generic Turbot + 2-String Kite / Skyscraper / ER family without
      // duplicating x-chain's broader coverage.
      const chainLen = result.chainNodes.length;
      if (chainLen > 6) continue;
      // Require at least 2 strong links for a "Turbot" / X-Cycle identity.
      // We can detect strong-link count by examining the links.
      const strongCount = result.links.filter((l) => l.type === 'strong').length;
      if (strongCount < 2) continue;
      return {
        strategyId: 'turbot-fish',
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
          zh: `数字 ${d}：多宝鱼（Turbot Fish）。单数字强弱交替链从 ${cellLabel(start.cells[0]!)} 连接到 ${cellLabel(end.cells[0]!)}，其中必有一端为真；据此消去相应候选。`,
          en: `Digit ${d}: Turbot Fish. A single-digit alternating chain connects ${cellLabel(start.cells[0]!)} to ${cellLabel(end.cells[0]!)}, at least one end true; eliminate the off-chain candidates.`,
        },
      };
    }
    return null;
  },
};
