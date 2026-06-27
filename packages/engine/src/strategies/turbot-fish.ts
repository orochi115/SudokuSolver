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
      const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 4 });
      if (result && result.eliminations.length > 0) {
        if (result.chainNodes.length === 4) {
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
              zh: `多宝鱼（单数字强链）：数字 ${d} 沿交替强弱链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故可见两端的格可排除 ${d}。`,
              en: `Turbot Fish: digit ${d} forms an alternating strong/weak chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${d}.`,
            },
          };
        }
      }
    }
    return null;
  },
};
