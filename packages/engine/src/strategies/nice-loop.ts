/**
 * Nice Loop (P0) — 连续 / 不连续 Nice 环
 *
 * Searches the shared AIC link graph for alternating cycles:
 *  - Continuous loop (Rule 1): off-loop candidates on every weak link are removed.
 *  - Discontinuous, two strong links (Rule 2): the break candidate is forced ON.
 *  - Discontinuous, two weak links (Rule 3): the break candidate is eliminated.
 */

import { buildLinkGraph } from '../chain/graph.js';
import { searchNiceLoop, niceLoopEdgesToLinks } from '../chain/nice-loop-search.js';
import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice Loop', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoop(grid, graph, DEFAULT_CHAIN_POLICY.maxChainLength);
    if (!result) return null;

    const links = niceLoopEdgesToLinks(graph, result.edges);
    const nodeCells = new Set<number>();
    for (const e of result.edges) {
      for (const c of graph.nodes[e.from]!.cells) nodeCells.add(c);
      for (const c of graph.nodes[e.to]!.cells) nodeCells.add(c);
    }

    const startNode = graph.nodes[result.startNode]!;
    const startCell = startNode.cells[0]!;

    if (result.kind === 'discontinuous-strong') {
      const placed = result.placements[0]!;
      return {
        strategyId: this.id,
        placements: [placed],
        eliminations: result.eliminations,
        highlights: {
          cells: [...nodeCells, placed.cell],
          candidates: [
            ...[...nodeCells].flatMap((c) => {
              const mask = grid.candidatesOf(c);
              return mask === 0 ? [] : [...Array.from({ length: 9 }, (_, i) => i + 1)].filter((d) => (mask & (1 << (d - 1))) !== 0).map((d) => ({ cell: c, digit: d }));
            }),
            ...result.eliminations,
          ],
          links,
        },
        explanation: {
          zh: `不连续 Nice Loop（双强链）：在 ${cellLabel(startCell)} 处两条强链交汇，迫使该格填入 ${placed.digit}。`,
          en: `Discontinuous Nice Loop (two strong links): two strong links meet at ${cellLabel(startCell)}, forcing ${placed.digit} into the cell.`,
        },
      };
    }

    if (result.kind === 'discontinuous-weak') {
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: [...nodeCells, ...result.eliminations.map((e) => e.cell)],
          candidates: [
            ...[...nodeCells].flatMap((c) => {
              const mask = grid.candidatesOf(c);
              return mask === 0 ? [] : [...Array.from({ length: 9 }, (_, i) => i + 1)].filter((d) => (mask & (1 << (d - 1))) !== 0).map((d) => ({ cell: c, digit: d }));
            }),
            ...result.eliminations,
          ],
          links,
        },
        explanation: {
          zh: `不连续 Nice Loop（双弱链）：在 ${cellLabel(startCell)} 处两条弱链交汇，消去该格的 ${startNode.digit}。`,
          en: `Discontinuous Nice Loop (two weak links): two weak links meet at ${cellLabel(startCell)}, eliminating ${startNode.digit} from the cell.`,
        },
      };
    }

    return {
      strategyId: this.id,
      placements: [],
      eliminations: result.eliminations,
      highlights: {
        cells: [...nodeCells, ...result.eliminations.map((e) => e.cell)],
        candidates: [
          ...[...nodeCells].flatMap((c) => {
            const mask = grid.candidatesOf(c);
            return mask === 0 ? [] : [...Array.from({ length: 9 }, (_, i) => i + 1)].filter((d) => (mask & (1 << (d - 1))) !== 0).map((d) => ({ cell: c, digit: d }));
          }),
          ...result.eliminations,
        ],
          links,
      },
      explanation: {
        zh: `连续 Nice Loop：环上弱链的共享单元格中，非环节点的候选数可被消去。`,
        en: `Continuous Nice Loop: candidates outside the loop that share a weak-link unit can be eliminated.`,
      },
    };
  },
};
