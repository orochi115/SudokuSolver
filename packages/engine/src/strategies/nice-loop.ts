/**
 * Nice Loop (T4) — 美好回环
 *
 * A closed loop of alternating strong and weak links where the start and end
 * nodes are the same (continuous) or conjugate (discontinuous). In a Nice Loop,
 * no endpoint deductions are needed; the loop itself yields eliminations.
 *
 * Types:
 *   - Continuous: start === end
 *   - Discontinuous: start is conjugate to end (strong link joining start/end is tautology)
 *
 * Eliminations:
 *   Continuous: any cell seeing a strong node may lose its candidate.
 *   Discontinuous: candidates outside the loop that form strong links to two weak nodes can be eliminated.
 */

import { maskOf, PEERS_OF, SIZE, UNITS_OF, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchNiceLoop } from '../chain/nice-loop-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

export function makeNiceLoopStrategy(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'nice-loop',
    name: { zh: '美好回环', en: 'Nice Loop' },
    difficulty: 720,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      // We intentionally reuse the AIC infrastructure for Nice Loops
      // by delegating to a dedicated nice-loop search in the same graph
      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchNiceLoop(grid, graph, policy);
      if (!result || result.eliminations.length === 0) return null;

      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const ll = result.links.length;
      const kindLabel = ll === 0 ? 'continuous' : result.kind === 'continuous-loop' ? 'continuous' : 'discontinuous';
      const kindLabelZh = ll === 0 ? '连续' : result.kind === 'continuous-loop' ? '连续' : '不连续';

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
          zh: `${kindLabelZh}美好回环：从 ${start.digit} 经强弱交替回环闭合到 ${end.digit}，至少一条链脉冲为真，故可消去相应的候选候选。`,
          en: `${kindLabel} Nice Loop: from ${start.digit} through an alternating loop back to ${end.digit}; at least one link must be true, yielding eliminations.`,
        },
      };
    },
  };
}

// We'll create a stub export that delegates to the reef export
export const niceLoop: Strategy = makeNiceLoopStrategy();
