/**
 * AIC — Alternating Inference Chains (T4) / 交替推理链.
 *
 * Uses a shared strong/weak link graph with grouped same-digit nodes. Grouped
 * links let X-Chain/AIC traverse box-line candidate groups instead of only raw
 * single-cell conjugate pairs.
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function makeAic(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'aic',
    name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
    difficulty: 70,

    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        const graph = buildLinkGraph(grid, { digit, grouped: true });
        const result = searchAic(grid, graph, policy);
        if (result && result.eliminations.length > 0) {
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
              zh: `X-Chain（单数字交替链）：数字 ${digit} 沿强弱交替链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故可见两端的格可排除 ${digit}。`,
              en: `X-Chain: digit ${digit} forms an alternating strong/weak chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
            },
          };
        }
      }

      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchAic(grid, graph, policy);
      if (result && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        const sameDigit = start.digit === end.digit;
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
            zh: `交替推理链 AIC（${sameDigit ? 'Type 1' : 'Type 2'}）：从 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 经强弱交替链推到 ${cellLabel(end.cells[0]!)} 的 ${end.digit}；两端至少其一为真，据此可消除相应候选。`,
            en: `Alternating Inference Chain (${sameDigit ? 'Type 1' : 'Type 2'}): from ${cellLabel(start.cells[0]!)}=${start.digit} along an alternating chain to ${cellLabel(end.cells[0]!)}=${end.digit}; at least one end is true, yielding the eliminations.`,
          },
        };
      }
      return null;
    },
  };
}

export const aic: Strategy = makeAic();
