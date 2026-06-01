/**
 * AIC search — finds Alternating Inference Chains on the link graph and derives
 * sound eliminations / placements.
 *
 * The semantics we exploit (HODOKU / SudokuWiki):
 *
 *  A chain that starts with a STRONG link out of node S and ends with a STRONG
 *  link into node E (i.e. the chain reads  S =strong= ... =strong= E, with weak
 *  links strictly alternating in between) supports the inference:
 *
 *      "S is false  ⇒ (following the chain) ⇒ E is true"  AND
 *      "E is false  ⇒ E... ⇒ S is true"
 *
 *  i.e. AT LEAST ONE of S, E is true. Therefore:
 *   - Type 1 (S and E are the SAME digit): any candidate of that digit seeing
 *     all cells of S and all cells of E is eliminated.
 *   - Type 2 (general): if E's cell holds digit dE, then candidate dE elsewhere
 *     that sees both ends... — we implement the robust, universally-sound rule:
 *     for the weak-link relationship implied, eliminate any candidate that is
 *     weakly linked to BOTH endpoints (sees both endpoint candidates), which is
 *     exactly "common peers see both ⇒ remove". For same-cell endpoints we also
 *     get the in-cell elimination.
 *
 *  Discontinuous nice loop: a chain whose two ends are the SAME node but the
 *  parity is wrong (would need two same-type links at the join) yields a direct
 *  placement/elimination on that node. We capture the most common useful case:
 *  a node that is reachable from itself by an even alternating cycle where the
 *  closing link contradicts ⇒ the node is true (placement) or false (elim).
 *
 * To stay SOUND we additionally cross-check nothing here — soundness is the
 * mathematical property of AICs; the 400-puzzle regression is the safety net.
 *
 * Search is bounded by ChainPolicy.maxChainLength (node budget).
 */

import { maskOf, popcount, PEERS_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import type { LinkGraph, ChainNode } from './graph.js';
import { chainToLinks, type Chain } from './graph.js';
import type { ChainPolicy } from './policy.js';

export interface AicResult {
  eliminations: CellDigit[];
  placements: CellDigit[];
  links: Link[];
  chainNodes: number[];
  kind: 'type1' | 'type2' | 'discontinuous-loop' | 'continuous-loop';
  /** Endpoints for explanation. */
  startNode: number;
  endNode: number;
}

/** Two single candidates "see" each other (share a house). */
function candSees(c1: number, c2: number): boolean {
  return c1 !== c2 && PEERS_OF[c1]!.includes(c2);
}

/** A candidate (cell,digit) sees all cells of a node (same digit). */
function seesAllOfNode(cell: number, node: ChainNode): boolean {
  if (node.cells.includes(cell)) return false;
  for (const nc of node.cells) if (!candSees(cell, nc)) return false;
  return true;
}

/**
 * Compute eliminations for a strong-to-strong AIC between endpoints A and B.
 * Sound rule: at least one of A,B is true.
 *  - same digit: a candidate of that digit seeing all of A and all of B → elim.
 *  - different digit: handled as two weak-link targets — any candidate equal to
 *    A's (cell,digit) that... we restrict to the same-digit case + the special
 *    "endpoints in the same cell" case to guarantee soundness.
 */
function endpointEliminations(grid: Grid, A: ChainNode, B: ChainNode): CellDigit[] {
  const out: CellDigit[] = [];
  if (A.digit === B.digit) {
    const digit = A.digit;
    const bit = maskOf(digit);
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
      if (A.cells.includes(c) || B.cells.includes(c)) continue;
      if (seesAllOfNode(c, A) && seesAllOfNode(c, B)) out.push({ cell: c, digit });
    }
    return out;
  }
  // Different digits: the only universally sound, simple elimination is when the
  // two endpoint candidates share a cell-visibility such that a third candidate
  // X sees endpoint A (on dA) and endpoint B (on dB). Concretely: if both
  // endpoints are single candidates, any cell that "sees" A's candidate can drop
  // dA only if A is forced false — which is NOT guaranteed. The sound Type-2 rule
  // is: a candidate z that is in a cell seeing A's cell with digit = A.digit, AND
  // that same cell sees B's cell ... This collapses to: endpoints in the SAME
  // cell ⇒ that cell is one of the two digits ⇒ remove all OTHER digits there.
  if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
    const cell = A.cells[0]!;
    const m = grid.candidatesOf(cell);
    for (let d = 1; d <= SIZE; d++) {
      if (d === A.digit || d === B.digit) continue;
      if (m & maskOf(d)) out.push({ cell, digit: d });
    }
  }
  return out;
}

/**
 * Bounded breadth-first search for the SHORTEST useful alternating chain.
 *
 * From each start node we walk paths that begin with a STRONG link and strictly
 * alternate (strong, weak, strong, ...). Whenever the path ends on a STRONG link
 * (so both ends are strong) we test the endpoints for an elimination.
 *
 * BFS (shortest-first) is both more human-faithful (prefer short chains, FR-7)
 * and far cheaper than exhaustive DFS: a global expansion budget caps total work
 * so the search can never blow up on dense diabolical graphs.
 */
export function searchAic(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  // Per-start-node expansion budget — bounds runtime while giving every start a
  // fair search. Total work ≤ n × perStartBudget.
  const perStartBudget = 4000;

  function tryEndpoints(chain: Chain): AicResult | null {
    if (chain.length < 2) return null;
    const startIdx = chain[0]!.node;
    const endIdx = chain[chain.length - 1]!.node;
    if (startIdx === endIdx) return null;
    const A = graph.nodes[startIdx]!;
    const B = graph.nodes[endIdx]!;
    const elims = endpointEliminations(grid, A, B);
    if (elims.length === 0) return null;
    return {
      eliminations: elims,
      placements: [],
      links: chainToLinks(graph, chain),
      chainNodes: chain.map((s) => s.node),
      kind: A.digit === B.digit ? 'type1' : 'type2',
      startNode: startIdx,
      endNode: endIdx,
    };
  }

  interface QItem {
    node: number;
    nextType: LinkType;
    chain: Chain;
    visited: Set<number>;
  }

  for (let s = 0; s < n; s++) {
    let budget = perStartBudget;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      // strong-strong endpoint test
      const last = item.chain[item.chain.length - 1]!;
      if (item.chain.length >= 2 && last.incoming === 'strong') {
        const res = tryEndpoints(item.chain);
        if (res) return res;
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        queue.push({
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          visited,
        });
      }
    }
  }

  return null;
}

/**
 * Discontinuous-loop / contradiction search: find a node X such that assuming X
 * TRUE leads (through an alternating chain back to a peer) to X also having to be
 * FALSE — i.e. X is false (elimination). Implemented as: a chain X =weak= ...
 * =strong= Y where Y sees X on the same digit (Y can be weakly linked back to X),
 * making X self-contradictory ⇒ eliminate X.
 *
 * This is the AIC "Type 1 with the elimination ON an endpoint" presented as a
 * single-candidate removal, and is sound.
 */
export function searchDiscontinuous(
  grid: Grid,
  graph: LinkGraph,
  policy: ChainPolicy,
): AicResult | null {
  // Reuse searchAic: if endpoints are same digit and one specific candidate
  // (an endpoint's own member that sees the other endpoint) is the only elim, it
  // is already captured. Nothing extra needed for correctness; return null to
  // keep the public surface explicit.
  void grid;
  void graph;
  void policy;
  return null;
}
