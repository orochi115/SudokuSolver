/**
 * Nice Loop — 连续与不连续 Nice 环 (T4/T5)
 */

import { buildLinkGraph } from '../chain/graph.js';
import { searchNiceLoop } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';
import type { Grid } from '../grid.js';
import { ROW_OF, COL_OF } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function makeNiceLoop(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'nice-loop',
    name: { zh: 'Nice 环', en: 'Nice Loop' },
    difficulty: 720,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchNiceLoop(grid, graph, policy);

      if (result && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        const isContinuous = result.kind === 'continuous-loop';

        const actionZh = isContinuous ? '连续 Nice 环' : '不连续 Nice 环';
        const actionEn = isContinuous ? 'Continuous Nice Loop' : 'Discontinuous Nice Loop';

        return {
          strategyId: this.id,
          placements: result.placements,
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `${actionZh}：从 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 沿强弱交替环推导；两端在起始格产生矛盾或形成完美闭环，消去相应候选。`,
            en: `${actionEn}: from ${cellLabel(start.cells[0]!)}=${start.digit} along an alternating strong/weak loop; endpoints clash or close perfectly, yielding eliminations.`,
          },
        };
      }
      return null;
    },
  };
}

export const niceLoop: Strategy = makeNiceLoop();
