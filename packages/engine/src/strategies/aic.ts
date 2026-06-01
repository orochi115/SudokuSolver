/**
 * AIC — Alternating Inference Chains (T4) / 交替推理链
 *
 * Models candidates as nodes, with strong and weak links as edges.
 *
 * Node: (cell, digit) — a specific candidate.
 *
 * Strong link between (c1,d1) and (c2,d2):
 *   "If one is false, the other must be true."
 *   Cases:
 *   1. Same digit d, same house, exactly 2 candidates for d (conjugate pair).
 *   2. Same cell, different digits, exactly 2 candidates in that cell (bivalue).
 *
 * Weak link between (c1,d1) and (c2,d2):
 *   "If one is true, the other must be false."
 *   Cases:
 *   1. Same digit, cells see each other (peers).
 *   2. Same cell, different digits.
 *
 * AIC structure: the chain alternates strong-weak-strong-... links.
 * A strong link can also be used as a weak link.
 *
 * VALID AIC DEDUCTIONS:
 *
 * Type 1 (Discontinuous loop / same endpoint):
 *   If the chain starts and ends at the same candidate (c,d) but with
 *   different incoming link types, there's a contradiction:
 *   - Strong at both ends (off-chain): (c,d) must be true → place it
 *   - The candidate sees itself on a weak link: (c,d) must be false → eliminate
 *
 * Type 2 (Two-endpoint, same digit):
 *   Chain: A --S--> ... --S--> B, where A and B have the same digit d.
 *   "If A is false, B is true (and vice versa, since B ends on strong)."
 *   → At least one of A,B is true.
 *   → Eliminate d from any cell that sees both A and B.
 *   This is ONLY valid if the chain ends with a STRONG link (we're sure of direction).
 *
 * Type 3 (Two-endpoint, different digit, same cell):
 *   Chain: A(c,d1) --S--> ... --S--> B(c,d2) in the same cell.
 *   → At least one of d1,d2 is in that cell → eliminate all other candidates.
 *
 * KEY INSIGHT for correctness:
 *   A chain starting with strong link: "if start=false, end=true" (forward direction)
 *   AND  the chain read backwards also alternates correctly (ending on strong link)
 *   means: "if end=false, start=true" (backward direction)
 *   → BOTH directions → at least one endpoint is true.
 *
 * For correctness, the chain must:
 *   1. Start with a strong link (from the start node)
 *   2. End with a strong link (into the end node, from the previous node)
 *   3. Alternate strictly in between
 *
 * In our DFS, we track: "the LAST link type" and ensure alternation.
 * We always start by going OUT from start via a strong link.
 * The chain is valid when we arrive at a node via a strong link.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** A candidate node in the AIC graph. */
interface CandNode {
  cell: number;
  digit: number;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

/**
 * Get all strong-link neighbors of a node.
 * Strong link: if this node is false, neighbor must be true.
 */
function getStrongNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];

  // Case 1: conjugate pair in some house (same digit, 2 candidates in house)
  const bit = maskOf(node.digit);
  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const cands = house.filter(
      (c) => c !== node.cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
    );
    // For strong link: exactly 2 total (including node itself) means 1 other
    const total = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
    if (total === 2 && cands.length === 1) {
      neighbors.push({ cell: cands[0]!, digit: node.digit });
    }
  }

  // Case 2: bivalue cell (same cell, exactly 2 candidates, other digit)
  if (popcount(grid.candidatesOf(node.cell)) === 2) {
    for (const d of digitsOf(grid.candidatesOf(node.cell))) {
      if (d !== node.digit) {
        neighbors.push({ cell: node.cell, digit: d });
      }
    }
  }

  // Deduplicate
  const seen = new Set<number>();
  return neighbors.filter((n) => {
    const key = encodeNode(n.cell, n.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get all weak-link neighbors (excluding strong-only neighbors for now).
 * Weak link: if this node is true, neighbor must be false.
 */
function getWeakNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];

  // Case 1: same digit, peer cell
  const bit = maskOf(node.digit);
  for (const peer of PEERS_OF[node.cell]!) {
    if (peer === node.cell) continue;
    if (grid.get(peer) === 0 && (grid.candidatesOf(peer) & bit) !== 0) {
      neighbors.push({ cell: peer, digit: node.digit });
    }
  }

  // Case 2: same cell, other digit
  for (const d of digitsOf(grid.candidatesOf(node.cell))) {
    if (d !== node.digit) {
      neighbors.push({ cell: node.cell, digit: d });
    }
  }

  const seen = new Set<number>();
  return neighbors.filter((n) => {
    const key = encodeNode(n.cell, n.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Cells that are peers of BOTH a and b. */
function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

/**
 * Check type-1 AIC deduction: same digit at both ends, different cells.
 * Both ends must be reachable by strong → weak → ... → strong chain.
 * "At least one of start or end is true" → eliminate digit from common peers.
 * Note: exclude the chain nodes themselves from eliminations.
 */
function checkType1(
  grid: Grid,
  start: CandNode,
  end: CandNode,
  chainCells: Set<number>,
): { cell: number; digit: number }[] {
  if (start.digit !== end.digit || start.cell === end.cell) return [];
  const d = start.digit;
  const elims: { cell: number; digit: number }[] = [];
  for (const c of commonPeers(start.cell, end.cell)) {
    if (chainCells.has(c)) continue; // exclude chain nodes
    if (c === start.cell || c === end.cell) continue;
    if (grid.hasCandidate(c, d)) {
      elims.push({ cell: c, digit: d });
    }
  }
  return elims;
}

/**
 * Check type-2 AIC deduction: different digits at both ends, same cell.
 * "At least one of d1 or d2 is placed" → eliminate all other candidates from that cell.
 */
function checkType2(grid: Grid, start: CandNode, end: CandNode): { cell: number; digit: number }[] {
  if (start.digit === end.digit || start.cell !== end.cell) return [];
  const cell = start.cell;
  const keepMask = maskOf(start.digit) | maskOf(end.digit);
  const elims: { cell: number; digit: number }[] = [];
  for (const d of digitsOf(grid.candidatesOf(cell))) {
    if (!(keepMask & maskOf(d))) {
      elims.push({ cell, digit: d });
    }
  }
  return elims;
}

const MAX_DEPTH = 14; // max nodes in chain

interface SearchState {
  path: CandNode[];
  // linkAfter[i] = type of link from path[i] to path[i+1]
  linkAfter: ('strong' | 'weak')[];
  visited: Set<number>;
}

/**
 * DFS search for AIC chains.
 *
 * We search for chains that:
 *   - Start from `start` with a strong link (step 0 → 1 is strong)
 *   - Alternate strong/weak, where strong can be used as weak
 *   - End at a node via a strong link (i.e., the last link is strong)
 *
 * When we reach a node via strong link (last link was strong), we can
 * check endpoint deductions.
 *
 * Then we continue by adding a weak link next.
 * After a weak link, we add a strong link.
 */
function searchAIC(grid: Grid): Step | null {
  // Collect all valid start nodes
  const startNodes: CandNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      // Only start from nodes that have at least one strong neighbor
      if (getStrongNeighbors(grid, { cell: c, digit: d }).length > 0) {
        startNodes.push({ cell: c, digit: d });
      }
    }
  }

  for (const start of startNodes) {
    const state: SearchState = {
      path: [start],
      linkAfter: [],
      visited: new Set([encodeNode(start.cell, start.digit)]),
    };

    const result = dfsStrong(grid, state, start);
    if (result) return result;
  }

  return null;
}

/**
 * DFS step where next link must be STRONG (from current node).
 * We just arrived at `current` via a weak link (or we're at the start).
 */
function dfsStrong(grid: Grid, state: SearchState, current: CandNode): Step | null {
  if (state.path.length >= MAX_DEPTH) return null;

  for (const next of getStrongNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);

    // Check if we're closing a "discontinuous loop" back to start with a strong link
    // This means: start is connected to end via strong; chain reads:
    // start --S-- n1 --W-- n2 --S-- ... --S-- start (end = start)
    // → start is the end of a strong link → start must be true → place it
    if (next.cell === state.path[0]!.cell && next.digit === state.path[0]!.digit && state.path.length >= 3) {
      // Discontinuous loop, start is proven true
      const startNode = state.path[0]!;
      if (grid.hasCandidate(startNode.cell, startNode.digit)) {
        const pathCopy = [...state.path];
        const linksCopy = [...state.linkAfter, 'strong' as const];
        return buildStep(grid, pathCopy, linksCopy, [{ cell: startNode.cell, digit: startNode.digit }], []);
      }
    }

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('strong');

    // We've arrived at `next` via a strong link → check endpoint deductions
    // (chain: start --S-- ... --S-- next, minimum 3 nodes = 2 strong links)
    if (state.path.length >= 3) {
      const start = state.path[0]!;
      const end = next;
      const chainCells = new Set(state.path.map((n) => n.cell));

      // Type 1: same digit, different cells
      const t1 = checkType1(grid, start, end, chainCells);
      if (t1.length > 0) {
        const pathCopy = [...state.path];
        const linksCopy = [...state.linkAfter];
        state.path.pop();
        state.linkAfter.pop();
        state.visited.delete(key);
        return buildStep(grid, pathCopy, linksCopy, [], t1);
      }

      // Type 2: different digits, same cell
      const t2 = checkType2(grid, start, end);
      if (t2.length > 0) {
        const pathCopy = [...state.path];
        const linksCopy = [...state.linkAfter];
        state.path.pop();
        state.linkAfter.pop();
        state.visited.delete(key);
        return buildStep(grid, pathCopy, linksCopy, [], t2);
      }
    }

    // Continue: after strong, must use weak
    const r = dfsWeak(grid, state, next);
    if (r) {
      state.path.pop();
      state.linkAfter.pop();
      state.visited.delete(key);
      return r;
    }

    state.path.pop();
    state.linkAfter.pop();
    state.visited.delete(key);
  }

  return null;
}

/**
 * DFS step where next link must be WEAK (from current node).
 * We just arrived at `current` via a strong link.
 * After the weak link, we try strong again.
 */
function dfsWeak(grid: Grid, state: SearchState, current: CandNode): Step | null {
  if (state.path.length >= MAX_DEPTH) return null;

  // All weak neighbors (which includes strong used as weak)
  const weakNeighbors = getWeakNeighbors(grid, current);

  for (const next of weakNeighbors) {
    const key = encodeNode(next.cell, next.digit);

    // Skip closing back to start via weak link (this would incorrectly eliminate start)
    // The valid "eliminate start" case requires start to appear at a STRONG discontinuous position.
    if (next.cell === state.path[0]!.cell && next.digit === state.path[0]!.digit) continue;

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('weak');

    // After weak, must use strong
    const r = dfsStrong(grid, state, next);
    if (r) {
      state.path.pop();
      state.linkAfter.pop();
      state.visited.delete(key);
      return r;
    }

    state.path.pop();
    state.linkAfter.pop();
    state.visited.delete(key);
  }

  return null;
}

function deduplicateElims(elims: { cell: number; digit: number }[]): { cell: number; digit: number }[] {
  const seen = new Set<number>();
  return elims.filter((e) => {
    const key = e.cell * 10 + e.digit;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildStep(
  grid: Grid,
  path: CandNode[],
  linkTypes: ('strong' | 'weak')[],
  rawPlacements: { cell: number; digit: number }[],
  rawElims: { cell: number; digit: number }[],
): Step | null {
  const placements = rawPlacements.filter((p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit));
  const elims = deduplicateElims(rawElims.filter((e) => grid.hasCandidate(e.cell, e.digit)));

  if (placements.length === 0 && elims.length === 0) return null;

  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: path[i]!.cell, digit: path[i]!.digit },
      to: { cell: path[i + 1]!.cell, digit: path[i + 1]!.digit },
      type: linkTypes[i] ?? 'strong',
    });
  }

  const start = path[0]!;
  const end = path[path.length - 1]!;
  const chainLen = path.length - 1;

  const startStr = `R${ROW_OF[start.cell]! + 1}C${COL_OF[start.cell]! + 1}(${start.digit})`;
  const endStr = `R${ROW_OF[end.cell]! + 1}C${COL_OF[end.cell]! + 1}(${end.digit})`;

  return {
    strategyId: 'aic',
    placements,
    eliminations: elims,
    highlights: {
      cells: [...new Set([...path.map((n) => n.cell), ...elims.map((e) => e.cell), ...placements.map((p) => p.cell)])],
      candidates: [
        ...path.map((n) => ({ cell: n.cell, digit: n.digit })),
        ...elims,
        ...placements,
      ],
      links,
    },
    explanation: {
      zh: `交替推理链（${chainLen} 步）：${startStr} 到 ${endStr}，强弱交替；${placements.length > 0 ? `填入 ${placements.map((p) => `R${ROW_OF[p.cell]! + 1}C${COL_OF[p.cell]! + 1}=${p.digit}`).join(',')}` : `消去 ${elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join(',')}`}。`,
      en: `AIC (${chainLen} links): ${startStr} to ${endStr}, alternating strong/weak; ${placements.length > 0 ? `place ${placements.map((p) => `R${ROW_OF[p.cell]! + 1}C${COL_OF[p.cell]! + 1}=${p.digit}`).join(',')}` : `eliminate ${elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join(',')}`}.`,
    },
  };
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chains' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    return searchAIC(grid);
  },
};
