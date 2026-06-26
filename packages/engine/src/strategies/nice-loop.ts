/** Nice Loop — continuous/discontinuous loop presentation over the shared AIC graph. */

import { CELLS, ROW_OF, COL_OF, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchNiceLoop } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice Loop', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'chain-length'],
  apply(grid: Grid): Step | null {
    for (let cell = 0; cell < CELLS; cell++) {
      const mask = grid.candidatesOf(cell);
      if (mask !== 0 && popcount(mask) > 2) return null;
    }
    const graph = buildLinkGraph(grid, { grouped: false });
    const result = searchNiceLoop(grid, graph, DEFAULT_CHAIN_POLICY);
    if (!result) return null;
    const start = graph.nodes[result.startNode]!;
    return {
      strategyId: this.id,
      placements: result.placements,
      eliminations: result.eliminations,
      highlights: {
        cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
        candidates: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells.map((cell) => ({ cell, digit: graph.nodes[i]!.digit }))).concat(result.eliminations),
        links: result.links,
      },
      explanation: {
        zh: `Nice Loop（${result.kind === 'continuous-loop' ? '连续环' : '不连续环'}）：链从 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 出发并闭合，环上的弱链给出候选消除。`,
        en: `Nice Loop (${result.kind === 'continuous-loop' ? 'continuous' : 'discontinuous'}): the alternating chain closes at ${cellLabel(start.cells[0]!)}=${start.digit}; weak links on the loop yield eliminations.`,
      },
    };
  },
};
