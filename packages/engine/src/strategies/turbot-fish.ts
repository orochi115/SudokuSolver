/**
 * Turbot Fish (T3/T4) — 多宝鱼
 *
 * Turbot Fish is the generic 4-cell, 3-link (strong-weak-strong) single-digit
 * alternating chain pattern. It is the unified name for:
 *   - Skyscraper (two parallel conjugate pairs sharing a line)
 *   - 2-String Kite (row + col conjugate pair sharing a box)
 *   - Empty Rectangle / generic (any arrangement with a group node)
 *
 * The skyscraper/2-string-kite/empty-rectangle strategies fire first (lower difficulty),
 * so turbot-fish at 510 catches all remaining generic 4-node single-digit chains.
 *
 * Implementation: uses the single-digit link graph (buildLinkGraph with digit:d)
 * and searches for exactly 4-node alternating chains (strong-weak-strong) via BFS,
 * exactly like x-chain but restricted to 4 nodes (and group nodes allowed).
 *
 * E2: turbot-fish is now a member of the single-digit-strong-link overlap family.
 */

import {
  CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import type { ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Policy that only allows chains of exactly 4 nodes (3 links: S-W-S). */
const TURBOT_POLICY: ChainPolicy = {
  maxChainLength: 4, // exactly 4 nodes
  maxForcingWidth: 1,
  allowCellForcing: false,
  allowDigitForcing: false,
  allowNets: false,
  allowUniqueness: false,
};

function tryTurbotFish(grid: Grid, d: number, strategyId: string): Step | null {
  const graph = buildLinkGraph(grid, { digit: d, grouped: true });
  const result = searchAic(grid, graph, TURBOT_POLICY);
  if (!result || result.eliminations.length === 0) return null;
  if (result.chainNodes.length !== 4) return null; // only 4-node chains

  const start = graph.nodes[result.startNode]!;
  const end = graph.nodes[result.endNode]!;

  const chainCells = result.chainNodes.flatMap((i) => graph.nodes[i]!.cells);
  const startLabel = start.cells.map(cellLabel).join('/');
  const endLabel = end.cells.map(cellLabel).join('/');

  return {
    strategyId,
    placements: [],
    eliminations: result.eliminations,
    highlights: {
      cells: [...new Set([...chainCells, ...result.eliminations.map((e) => e.cell)])],
      candidates: [
        ...result.chainNodes.flatMap((i) =>
          graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: d })),
        ),
        ...result.eliminations,
      ],
      links: result.links,
    },
    explanation: {
      zh: `多宝鱼：数字 ${d} 的四格强弱强链，端点 ${startLabel} 和 ${endLabel} 至少一个含 ${d}，可从公共可见格消去 ${d}。`,
      en: `Turbot Fish: digit ${d} — four-node strong/weak/strong chain, endpoints ${startLabel} and ${endLabel}; at least one holds ${d}, eliminate ${d} from common peers.`,
    },
  };
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryTurbotFish(grid, d, 'turbot-fish');
      if (step) return step;
    }
    return null;
  },
};
