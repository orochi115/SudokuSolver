/**
 * Nice Loop (P0) — Nice Loop / X-Cycle
 *
 * Takes ownership of AicResult '*-loop' kinds per E6. Continuous and
 * discontinuous loops. Reuses buildLinkGraph + searchAic.
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic, type AicResult } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function isLoopKind(kind: AicResult['kind']): boolean {
  return kind === 'continuous-loop' || kind === 'discontinuous-loop';
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    // Try single-digit first (X-Cycle presentation)
    for (let d = 1; d <= 9; d++) {
      const graph = buildLinkGraph(grid, { digit: d, grouped: true });
      const res = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
      if (res && res.eliminations.length > 0 && isLoopKind(res.kind)) {
        const start = graph.nodes[res.startNode]!;
        const end = graph.nodes[res.endNode]!;
        return {
          strategyId: 'nice-loop',
          placements: res.placements,
          eliminations: res.eliminations,
          highlights: {
            cells: res.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: res.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: res.links,
          },
          explanation: {
            zh: `Nice环（单数字 X-Cycle）：${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)} 形成闭合强弱交替环；据环规则消去/填入。`,
            en: `Nice Loop (X-Cycle) on digit ${d}: closed alternating chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; apply loop rules for elims/placements.`,
          },
        };
      }
    }

    // General AIC loop
    const graph = buildLinkGraph(grid, { grouped: true });
    const res = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
    if (res && res.eliminations.length > 0 && isLoopKind(res.kind)) {
      const start = graph.nodes[res.startNode]!;
      const end = graph.nodes[res.endNode]!;
      const same = start.digit === end.digit;
      return {
        strategyId: 'nice-loop',
        placements: res.placements,
        eliminations: res.eliminations,
        highlights: {
          cells: res.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
          candidates: res.chainNodes.flatMap((i) =>
            graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          links: res.links,
        },
        explanation: {
          zh: `Nice环（${same ? '连续/不连续' : 'AIC'}）：${cellLabel(start.cells[0]!)}(${start.digit}) 到 ${cellLabel(end.cells[0]!)}(${end.digit}) 闭环；按环规则行动。`,
          en: `Nice Loop (${same ? 'continuous/discontinuous' : 'AIC'}): from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit} closing the loop; apply appropriate rule.`,
        },
      };
    }
    return null;
  },
};
