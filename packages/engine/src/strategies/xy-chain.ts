/**
 * XY-Chain (P0) — XY 链
 *
 * A chain of bivalue cells where consecutive cells share one digit (the "hop").
 * If the two free end-digits are the same digit Z, then at least one end of the
 * chain is Z, so any cell seeing both ends can have Z eliminated.
 *
 * Reuses the AIC chain engine (buildLinkGraph + searchAic), filtering to
 * chains where the endpoints share the same digit Z and have common peers.
 * This is a special-case presentation of AIC (bivalue-only AIC).
 */

import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';
import { ROW_OF, COL_OF, PEERS_OF, maskOf } from '../grid.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function searchXyChain(grid: Grid): Step | null {
  const graph = buildLinkGraph(grid, { grouped: true });
  const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
  if (!result || result.eliminations.length === 0) return null;

  const start = graph.nodes[result.startNode]!;
  const end = graph.nodes[result.endNode]!;

  // XY-Chain requires same end-digit (Z) — Type 1 AIC
  if (start.digit !== end.digit) return null;

  // Verify all strong links are bivalue cell links
  // (cells in the chain that are bivalue)
  const chainCells = new Set<number>();
  for (const ni of result.chainNodes) {
    const n = graph.nodes[ni]!;
    if (n.cells.length === 1) chainCells.add(n.cells[0]!);
  }

  const z = start.digit;
  const common = commonPeers(start.cells[0]!, end.cells[0]!);
  const eliminations = result.eliminations.filter((e) =>
    e.digit === z && common.includes(e.cell),
  );
  if (eliminations.length === 0) return null;

  return {
    strategyId: 'xy-chain',
    placements: [],
    eliminations,
    highlights: {
      cells: [...result.chainNodes.flatMap((i) => graph.nodes[i]!.cells), ...eliminations.map((e) => e.cell)],
      candidates: [
        ...result.chainNodes.flatMap((i) =>
          graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
        ),
        ...eliminations,
      ],
      links: result.links,
    },
    explanation: {
      zh: `XY链：双值格链 ${cellLabel(start.cells[0]!)}(${start.digit}) 到 ${cellLabel(end.cells[0]!)}(${end.digit})，两端均可为 ${z}；消去公共可见格中的 ${z}。`,
      en: `XY-Chain: bivalue chain from ${cellLabel(start.cells[0]!)}(${start.digit}) to ${cellLabel(end.cells[0]!)}(${end.digit}), both ends can be ${z}; eliminate ${z} from their common peers.`,
    },
  };
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    return searchXyChain(grid);
  },
};