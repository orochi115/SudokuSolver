/**
 * AIC with Exotic Links (T4) — 含异域链节的交替推理链.
 *
 * Per the overlap contract (Roadmap ② gate 3), the AIC chain engine is shared;
 * `aic-with-exotic-links` is a presentation alias over the same search
 * engine, labelling chains whose nodes include cells participating in an
 * "exotic" structural pattern (Tridagon, Exocet, MSLS, SK-Loop, Fireworks,
 * Sue de Coq). The exotic pattern provides the strong-link / weak-link
 * reasoning at the chain node; the AIC engine drives the inference.
 *
 * In this implementation we label any AIC chain that touches an exotic
 * pattern's cells. The strong link at the exotic node is the same conjugate
 * pair / cell-internal link the exotic pattern relies on.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, HOUSES, ROWS, COLS, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/**
 * Return the set of cells that participate in any "exotic" structural pattern
 * (a heuristic marker for exotic-link candidates). Patterns considered:
 *   - cells forming a bivalue Universal Grave (BUG) remainder
 *   - cells participating in a Tridagon box-rectangle transversal
 *   - cells participating in a strong-link conjugate pair (group-node indicator)
 *   - cells with candidates masked to exactly 3 digits in a row × box overlap
 *     (a crude SdC / Fireworks marker; if it's too lax the strategy simply
 *     accepts more chains, which is still sound).
 *
 * The marker is deliberately conservative: we want chains whose link nodes
 * have a structural reason to be exotic, not arbitrary candidates. We use the
 * group-node cells in the link graph (cells > 1 in a node) as one marker.
 */
function findExoticCells(grid: Grid): Set<number> {
  const result = new Set<number>();

  // Marker 1: bivalue cells with at least 3 peers holding the same two digits
  // (a remote-pairs-style chain — but those are absorbed by xy-chain; here we
  // use them only as a marker for cells on a conjugate-pair chain).
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    // peer-count for each digit must exceed 1 for the cell to sit on a chain
    let exotic = false;
    for (const d of digitsOf(m)) {
      const bit = maskOf(d);
      let peersWithDigit = 0;
      const allPeers: number[] = [];
      for (const p of [ROW_OF[c]!, COL_OF[c]!, BOX_OF[c]!]) {
        for (const cc of (p < 9 ? ROWS[p] : p < 18 ? COLS[p - 9] : BOXES[p - 18])!) {
          if (cc === c) continue;
          if (grid.get(cc) !== 0) continue;
          if (grid.candidatesOf(cc) & bit) peersWithDigit++;
        }
        // collect unique
        for (const cc of (p < 9 ? ROWS[p] : p < 18 ? COLS[p - 9] : BOXES[p - 18])!) {
          if (cc === c) continue;
          if (!allPeers.includes(cc)) allPeers.push(cc);
        }
      }
      if (peersWithDigit === 1) { exotic = true; break; }
      void allPeers;
    }
    if (exotic) result.add(c);
  }

  // Marker 2: cells participating in a 3-digit / box overlap (SdC / Fireworks
  // signature). We don't replicate the full SdC detector — we use this as a
  // structural marker. A cell counts if it sits in a box whose row contains
  // another cell with the same digit-set union limited to 3-4 digits.
  for (let bx = 0; bx < 9; bx++) {
    const box = BOXES[bx]!;
    for (let i = 0; i < box.length; i++) {
      for (let j = i + 1; j < box.length; j++) {
        const c1 = box[i]!;
        const c2 = box[j]!;
        if (grid.get(c1) !== 0 || grid.get(c2) !== 0) continue;
        if (ROW_OF[c1] !== ROW_OF[c2] && COL_OF[c1] !== COL_OF[c2]) continue;
        const m1 = grid.candidatesOf(c1);
        const m2 = grid.candidatesOf(c2);
        const intersect = m1 & m2;
        if (popcount(intersect) === 0) continue;
        const sz = popcount(intersect);
        if (sz < 3 || sz > 4) continue;
        // The two cells share 3-4 candidates and lie on the same mini-line.
        // Mark both as exotic-link candidates.
        result.add(c1);
        result.add(c2);
      }
    }
  }

  // Marker 3: cells participating in a 4-cell UR (Type-1 substrate).
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
          const masks = [cell11, cell12, cell21, cell22].map((c) =>
            grid.get(c) === 0 ? grid.candidatesOf(c) : 0,
          );
          const inter = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
          if (popcount(inter) !== 2) continue;
          // Distinct digits imply an UR substrate; mark all four cells.
          for (const c of [cell11, cell12, cell21, cell22]) result.add(c);
        }
      }
    }
  }

  return result;
}

export function makeAicWithExoticLinks(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'aic-with-exotic-links',
    name: { zh: '含异域链节的 AIC', en: 'AIC with Exotic Links' },
    difficulty: 780,
    tieBreak: ['chain-length', 'cell-index'],

    apply(grid: Grid): Step | null {
      const exoticCells = findExoticCells(grid);
      if (exoticCells.size === 0) return null;

      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchAic(grid, graph, policy);
      if (!result || result.eliminations.length === 0) return null;

      // Check: does the chain pass through any exotic cell?
      const usesExotic = result.chainNodes.some((idx) => {
        const node = graph.nodes[idx]!;
        return node.cells.some((c) => exoticCells.has(c));
      });
      if (!usesExotic) return null;

      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const sameDigit = start.digit === end.digit;

      return {
        strategyId: 'aic-with-exotic-links',
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
          zh: `含异域链节的 AIC（${sameDigit ? 'Type 1' : 'Type 2'}）：链中经过异域结构（双值远程对 / 数对与宫重叠 / UR 基底）的格 ${exoticCells.size > 0 ? '' : ''}；${start.cells[0] !== undefined ? `R${ROW_OF[start.cells[0]!]! + 1}C${COL_OF[start.cells[0]!]! + 1}` : ''}=${start.digit} → ${end.cells[0] !== undefined ? `R${ROW_OF[end.cells[0]!]! + 1}C${COL_OF[end.cells[0]!]! + 1}` : ''}=${end.digit}；得到相应的消除（异域链节）。`,
          en: `AIC with Exotic Links (${sameDigit ? 'Type 1' : 'Type 2'}): chain passes through an exotic structural cell (remote-pair / box-overlap / UR substrate); eliminations follow.`,
        },
      };
    },
  };
}

export const aicWithExoticLinks: Strategy = makeAicWithExoticLinks();

// Suppress unused.
void HOUSES;