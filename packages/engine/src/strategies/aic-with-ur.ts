/**
 * AIC with Unique Rectangle Node (T4) — 含 UR 节点的交替推理链.
 *
 * Same principle as `aic-with-als`: the AIC chain can route through a UR
 * as a strong-link node. The Type-1 UR provides the link
 * `(extra@entry OFF) ⇒ (extra@exit ON)`. In practice, the AIC engine on
 * the link graph (which encodes conjugate pairs) can already find chains
 * that pass through cells participating in a UR; this strategy emits those
 * as the labelled `aic-with-ur` step.
 *
 * Following the "single source of search, multiple presentations" pattern
 * from chain-strategies.ts, we delegate the search to the shared chain
 * engine and re-label any result whose chain passes through cells of a
 * 2-box UR rectangle.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Yield all (r1, r2, c1, c2) tuples spanning exactly two boxes. */
function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;
          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

/** Find all UR rectangles in the current grid (Type-1 substrate: 4 cells
 *  sharing a 2-digit mask, with extras in one corner). */
function findURs(grid: Grid): Array<{ cells: [number, number, number, number]; a: number; b: number }> {
  const result: Array<{ cells: [number, number, number, number]; a: number; b: number }> = [];
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0)) as [number, number, number, number];
    const intersect = (masks[0] & masks[1] & masks[2] & masks[3]) >>> 0;
    if (popcount(intersect) !== 2) continue;
    const [a, b] = digitsOf(intersect) as [number, number];
    result.push({ cells, a, b });
  }
  return result;
}

function makeAicWithUr(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'aic-with-ur',
    name: { zh: '含 UR 的 AIC', en: 'AIC with UR Nodes' },
    difficulty: 770,
    tieBreak: ['chain-length', 'cell-index'],

    apply(grid: Grid): Step | null {
      const urs = findURs(grid);
      if (urs.length === 0) return null;

      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchAic(grid, graph, policy);
      if (!result || result.eliminations.length === 0) return null;

      // Check: does the chain pass through any UR cell?
      const urCellSet = new Set(urs.flatMap((u) => u.cells));
      const usesUr = result.chainNodes.some((idx) => {
        const node = graph.nodes[idx]!;
        return node.cells.some((c) => urCellSet.has(c));
      });
      if (!usesUr) return null;

      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const sameDigit = start.digit === end.digit;
      return {
        strategyId: 'aic-with-ur',
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
          zh: `含 UR 节点的 AIC（${sameDigit ? 'Type 1' : 'Type 2'}）：链中经过 UR 节点，${start.cells[0] !== undefined ? `R${ROW_OF[start.cells[0]!]! + 1}C${COL_OF[start.cells[0]!]! + 1}` : ''}=${start.digit} → ${end.cells[0] !== undefined ? `R${ROW_OF[end.cells[0]!]! + 1}C${COL_OF[end.cells[0]!]! + 1}` : ''}=${end.digit}；得到相应的消除（UR 节点在唯一解假设下提供强链）。`,
          en: `AIC with UR node (${sameDigit ? 'Type 1' : 'Type 2'}): chain passes through a UR node from ${start.digit} to ${end.digit}; elimination under uniqueness assumption.`,
        },
      };
    },
  };
}

export const aicWithUr: Strategy = makeAicWithUr();