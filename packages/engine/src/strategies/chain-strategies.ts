/**
 * Chain strategies: Nice Loop, XY-Chain, Turbot Fish (P0).
 *
 * Nice Loop owns continuous/discontinuous loop kinds (E6).
 * XY-Chain is bivalue-only AIC (subset of aic family).
 * Turbot Fish is a presentation alias on single-digit x-chain search (E2).
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import {
  searchAic,
  searchNiceLoop,
  searchXyChain,
  isTurbotFishPattern,
  type AicResult,
} from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';
import type { LinkGraph } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

function highlightsFromResult(graph: LinkGraph, result: AicResult) {
  return {
    cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
    candidates: result.chainNodes.flatMap((i) =>
      graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
    ),
    links: result.links,
  };
}

function niceLoopExplanation(result: AicResult, graph: LinkGraph): { zh: string; en: string } {
  const start = graph.nodes[result.startNode]!;
  const cell = start.cells[0]!;
  const digit = start.digit;
  if (result.kind === 'continuous-loop') {
    const elims = result.eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(', ');
    return {
      zh: `连续 Nice 环：数字 ${digit} 形成完美交替闭环；弱链所在宫/行/列上的链外格可消去 ${elims}。`,
      en: `Continuous Nice Loop: digit ${digit} forms a perfect alternating loop; off-chain eliminations along weak links: ${elims}.`,
    };
  }
  if (result.placements.length > 0) {
    return {
      zh: `不连续 Nice 环（Rule 2）：在 ${candidateLabel(cell, digit)} 两端均为强链，该格必为 ${digit}。`,
      en: `Discontinuous Nice Loop (Rule 2): two strong links meet at ${candidateLabel(cell, digit)}; must place ${digit}.`,
    };
  }
  return {
    zh: `不连续 Nice 环（Rule 3）：在 ${candidateLabel(cell, digit)} 两端均为弱链，该格不能为 ${digit}。`,
    en: `Discontinuous Nice Loop (Rule 3): two weak links meet at ${candidateLabel(cell, digit)}; eliminate ${digit}.`,
  };
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'digit'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoop(grid, graph, DEFAULT_CHAIN_POLICY);
    if (!result) return null;
    if (result.eliminations.length === 0 && result.placements.length === 0) return null;
    return {
      strategyId: this.id,
      placements: result.placements,
      eliminations: result.eliminations,
      highlights: highlightsFromResult(graph, result),
      explanation: niceLoopExplanation(result, graph),
    };
  },
};

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'digit'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: false });
    const result = searchXyChain(grid, graph, DEFAULT_CHAIN_POLICY);
    if (!result || result.eliminations.length === 0) return null;
    const start = graph.nodes[result.startNode]!;
    const end = graph.nodes[result.endNode]!;
    const digit = start.digit;
    const elims = result.eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(', ');
    return {
      strategyId: this.id,
      placements: [],
      eliminations: result.eliminations,
      highlights: highlightsFromResult(graph, result),
      explanation: {
        zh: `XY 链：双值格链两端均为 ${digit}（${candidateLabel(start.cells[0]!, digit)} 与 ${candidateLabel(end.cells[0]!, digit)}），至少一端为真；消去 ${elims}。`,
        en: `XY-Chain: bivalue chain with matching end-digit ${digit} (${candidateLabel(start.cells[0]!, digit)} & ${candidateLabel(end.cells[0]!, digit)}); at least one end is true; eliminate ${elims}.`,
      },
    };
  },
};

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
      if (!result || result.eliminations.length === 0) continue;
      if (!isTurbotFishPattern(graph, result)) continue;
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const elims = result.eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(', ');
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: highlightsFromResult(graph, result),
        explanation: {
          zh: `多宝鱼：数字 ${digit} 的强-弱-强四环链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}；消去 ${elims}。`,
          en: `Turbot Fish: digit ${digit} strong-weak-strong 4-link between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; eliminate ${elims}.`,
        },
      };
    }
    return null;
  },
};