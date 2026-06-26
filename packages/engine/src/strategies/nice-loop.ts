/**
 * Nice Loop (Continuous/DIS) — 终边链
 *
 * Owns continuous and discontinuous single-digit loops that are Nice Loops.
 * Loop endpoints are linked by Really Nice Types and can have eliminations
 * based on the loop forming a contradiction.
 */

import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { type ChainPolicy, DEFAULT_CHAIN_POLICY } from '../chain/policy.js';
import type { Step, Link } from '../trace.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { CELLS } from '../grid.js';

import {ROW_OF, COL_OF} from '../grid.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function makeNiceLoop(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'nice-loop',
    name: { zh: '终边链', en: 'Nice Loop' },
    difficulty: 760, // Between AICChain and forcing patterns
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      // Search for single-digit nice loops (both continuous and discontinuous)
      for (let digit = 1; digit <= 9; digit++) {
        const graph = buildLinkGraph(grid, { digit, grouped: true, maxNodes: 1000 });
        const result = searchAic(grid, graph, {
          ...policy,
          maxLength: 30, // Nice loops can be longer
          onlyLoops: true, // Only look for loops
          allow-discontinuous: true,
        });
        
        if (result && result.isLoop && (result.eliminations.length > 0 || result.placements.length > 0)) {
          const start = graph.nodes[result.startNode]!;
          return {
            strategyId: 'nice-loop',
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
              zh: `终边链 Nice Loop：数字 ${digit} 形成一个终边链（${result.isDiscontinuous ? '不连续' : '连续'}）从 ${cellLabel(start.cells[0]!)} 回到自身，产生矛盾；据此可消除相应候选。`,
              en: `Nice Loop: digit ${digit} forms a loop back to itself (${result.isDiscontinuous ? 'discontinuous' : 'continuous'}); contradiction cancels the loop, enabling eliminations.`,
            },
          };
        }
      }
      return null;
    },
  };
}

export const niceLoop: Strategy = makeNiceLoop();
