/**
 * Chain strategies — Nice Loop, XY-Chain, Turbot Fish (P0).
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { searchNiceLoop } from '../chain/loop-search.js';
import { searchXyChain } from '../chain/xy-chain-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function chainHighlights(graph: ReturnType<typeof buildLinkGraph>, chainNodes: number[], links: Step['highlights']['links']) {
  return {
    cells: chainNodes.flatMap((i) => graph.nodes[i]!.cells),
    candidates: chainNodes.flatMap((i) =>
      graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
    ),
    links,
  };
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
      if (result && result.eliminations.length > 0 && result.chainNodes.length === 4) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: chainHighlights(graph, result.chainNodes, result.links),
          explanation: {
            zh: `多宝鱼（单数字强链）：数字 ${digit} 经强弱交替链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故可见两端的格可排除 ${digit}。`,
            en: `Turbot Fish: digit ${digit} forms a strong-weak-strong chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
          },
        };
      }
    }
    return null;
  },
};

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: false });
    const result = searchXyChain(grid, graph, DEFAULT_CHAIN_POLICY);
    if (!result || result.eliminations.length === 0) return null;
    const start = graph.nodes[result.startNode]!;
    const end = graph.nodes[result.endNode]!;
    return {
      strategyId: this.id,
      placements: [],
      eliminations: result.eliminations,
      highlights: chainHighlights(graph, result.chainNodes, result.links),
      explanation: {
        zh: `XY 链：双值格链两端均为 ${result.endDigit}（${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}），至少一端为真，故公共可见格可消去 ${result.endDigit}。`,
        en: `XY-Chain: bivalue chain ends share digit ${result.endDigit} at ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; at least one end is true, eliminating ${result.endDigit} from cells seeing both.`,
      },
    };
  },
};

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoop(grid, graph, DEFAULT_CHAIN_POLICY);
    if (!result) return null;
    if (result.eliminations.length === 0 && result.placements.length === 0) return null;

    const breakNode = graph.nodes[result.startNode]!;
    const isContinuous = result.kind === 'continuous-loop';
    const isPlacement = result.placements.length > 0;

    let zh: string;
    let en: string;
    if (isContinuous) {
      zh = `连续 Nice 环：强弱交替闭合环，弱链所在宫的离链候选可消去。`;
      en = `Continuous Nice Loop: alternating closed loop; eliminate off-chain candidates on weak-link units.`;
    } else if (isPlacement) {
      zh = `不连续 Nice 环（Rule 2）：${cellLabel(breakNode.cells[0]!)} 的 ${breakNode.digit} 两端均为强链，必须填入 ${breakNode.digit}。`;
      en = `Discontinuous Nice Loop (Rule 2): two strong links at ${cellLabel(breakNode.cells[0]!)}=${breakNode.digit}; must place ${breakNode.digit}.`;
    } else {
      zh = `不连续 Nice 环（Rule 3）：${cellLabel(breakNode.cells[0]!)} 的 ${breakNode.digit} 两端均为弱链，消去该候选。`;
      en = `Discontinuous Nice Loop (Rule 3): two weak links at ${cellLabel(breakNode.cells[0]!)}=${breakNode.digit}; eliminate ${breakNode.digit}.`;
    }

    return {
      strategyId: this.id,
      placements: result.placements,
      eliminations: result.eliminations,
      highlights: chainHighlights(graph, result.chainNodes, result.links),
      explanation: { zh, en },
    };
  },
};