/**
 * AIC with exotic links / Twinned XY-Chains (P2b) — 异域链
 *
 *  - aic-with-exotic-links: AIC engine on the grouped graph with extended
 *    chain length (12, vs 10 for aic-with-als/ur). Only fires if the chain
 *    uses group nodes OR is longer than 10. Same sound AIC endpoint rules.
 *
 *  - twinned-xy-chains: from a bivalue cell {X,Y}, propagate two short
 *    chains (depth 2); if both force the same candidate false, eliminate it.
 *    Bounded — NOT open-ended search.
 */

import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

// ---- AIC with exotic links ----
export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: '含异域链接的AIC', en: 'AIC with Exotic Links' },
  difficulty: 780,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    // Fast precheck: if no group nodes, only run if other strategies missed
    let hasGroup = false;
    for (const n of graph.nodes) if (n.cells.length > 1) { hasGroup = true; break; }

    // If no group nodes AND short chains suffice, skip (aic/aic-with-als/ur handle those)
    if (!hasGroup) return null;

    const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 12 });
    if (!result || result.eliminations.length === 0) return null;

    // Only claim if chain length > 10 (beyond aic-with-als/ur's reach) or has group node
    const hasGroupNode = result.chainNodes.some((i) => graph.nodes[i]!.cells.length > 1);
    if (!hasGroupNode && result.chainNodes.length <= 10) return null;

    const start = graph.nodes[result.startNode]!;
    const end = graph.nodes[result.endNode]!;
    const chainNodes = result.chainNodes;
    const allCells = [...new Set([...chainNodes.flatMap((i) => graph.nodes[i]!.cells), ...result.eliminations.map((e) => e.cell)])];

    return {
      strategyId: 'aic-with-exotic-links',
      placements: [],
      eliminations: result.eliminations,
      highlights: {
        cells: allCells,
        candidates: [
          ...chainNodes.flatMap((i) =>
            graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          ...result.eliminations,
        ],
        links: result.links,
      },
      explanation: {
        zh: `含异域链接的AIC：从 ${cellLabel(start.cells[0]!)}=${start.digit} 到 ${cellLabel(end.cells[0]!)}=${end.digit} 的扩展交替推理链（含分组/异域节点）；至少一端为真，据此消去。`,
        en: `AIC with exotic links: extended alternating chain from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit} (with group/exotic nodes); one end is true, yielding eliminations.`,
      },
    };
  },
};

// ---- Twinned XY-Chains ----
interface ForcedFalse { cell: number; digit: number; }

function propagateForced(
  grid: Grid,
  _graph: LinkGraph,
  startCell: number,
  startDigit: number,
  maxDepth: number,
): Set<string> {
  const forcedTrue = new Set<string>();
  const forcedFalse = new Set<string>();
  const queue: Array<{ cell: number; digit: number; depth: number }> = [];
  const keyOf = (c: number, d: number) => `${c},${d}`;

  forcedTrue.add(keyOf(startCell, startDigit));
  queue.push({ cell: startCell, digit: startDigit, depth: 0 });

  while (queue.length > 0) {
    const { cell, digit, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    for (const peer of PEERS_OF[cell]!) {
      if (grid.get(peer) !== 0) continue;
      const pkey = keyOf(peer, digit);
      if (forcedFalse.has(pkey) || forcedTrue.has(pkey)) continue;
      if (!grid.hasCandidate(peer, digit)) continue;
      forcedFalse.add(pkey);

      const remaining = digitsOf(grid.candidatesOf(peer)).filter((d) => !forcedFalse.has(keyOf(peer, d)));
      if (remaining.length === 1) {
        const rtkey = keyOf(peer, remaining[0]!);
        if (!forcedTrue.has(rtkey)) {
          forcedTrue.add(rtkey);
          queue.push({ cell: peer, digit: remaining[0]!, depth: depth + 1 });
        }
      }
    }

    if (grid.get(cell) === 0) {
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        if (d === digit) continue;
        forcedFalse.add(keyOf(cell, d));
      }
    }
  }

  return forcedFalse;
}

export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生XY链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index', 'chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: false });

    for (let p = 0; p < CELLS; p++) {
      if (grid.get(p) !== 0) continue;
      const m = grid.candidatesOf(p);
      if (popcount(m) !== 2) continue;
      const [x, y] = digitsOf(m) as [number, number];

      const forcedX = propagateForced(grid, graph, p, x, 2);
      const forcedY = propagateForced(grid, graph, p, y, 2);

      const common: ForcedFalse[] = [];
      for (const k of forcedY) {
        if (forcedX.has(k)) {
          const parts = k.split(',').map(Number);
          const c = parts[0]!, d = parts[1]!;
          if (c === p) continue;
          if (grid.hasCandidate(c, d)) common.push({ cell: c, digit: d });
        }
      }

      if (common.length === 0) continue;

      const eliminations = common.map((f) => ({ cell: f.cell, digit: f.digit }));
      return {
        strategyId: 'twinned-xy-chains',
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([p, ...eliminations.map((e) => e.cell)])],
          candidates: [
            { cell: p, digit: x }, { cell: p, digit: y },
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `孪生XY链：双值格 ${cellLabel(p)}{${x},${y}} 的两种取值经短链传播均迫使相同候选为假；故消去 ${eliminations.map((e) => `${cellLabel(e.cell)}≠${e.digit}`).join(', ')}。`,
          en: `Twinned XY-Chains: both values of bivalue ${cellLabel(p)}{${x},${y}} force the same candidates false via short chains; eliminate ${eliminations.map((e) => `${cellLabel(e.cell)}≠${e.digit}`).join(', ')}.`,
        },
      };
    }
    return null;
  },
};
