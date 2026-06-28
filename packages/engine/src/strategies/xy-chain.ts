/**
 * XY-Chain (T4) — XY 链
 *
 * A chain of alternating strong and weak links where each node alternates between
 * two digits in a bi-valued cell (XY) or a conjugate chain between two cells
 * containing the same two candidates.
 *
 * In a pure XY-Chain, the two endpoints are conjugate (strong link), forming a discontinuous
 * loop that yields eliminations (same behavior as xywing when chain length is 2).
 *
 * Remote Pairs are a special case of XY-Chain of length 2 where the two endpoints are peers.
 */

import { maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

export function makeXYChainStrategy(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'xy-chain',
    name: { zh: 'XY 链', en: 'XY-Chain' },
    difficulty: 715,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      // XY-Chain is a subset of AIC with specific constraints
      // We'll reuse the AIC infrastructure with xy-chain specific policy
      const graph = buildLinkGraph(grid, { grouped: false });
      const result = searchAic(grid, graph, { ...policy, xyChain: true });
      if (!result || result.eliminations.length === 0) return null;
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap((i) =>
            graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit }))
          ),
          links: result.links,
        },
        explanation: {
          zh: `XY 链：从 ${result.start} 经强弱交替至 ${result.end}，形成不连续回环，可消去相应候选。`,
          en: `XY-Chain: from ${result.start} through alternating strong/weak links to ${result.end}, forming a discontinuous loop, yielding eliminations.`,
        },
      };
    },
  };
}

export const xyChain: Strategy = makeXYChainStrategy();