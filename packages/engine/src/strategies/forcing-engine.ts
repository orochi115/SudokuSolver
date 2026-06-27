/**
 * Shared forcing engine (P3 — last resort) — 强制推理引擎.
 *
 * This module factors the PROVEN-sound propagation/conclusion helpers out of
 * `forcing-chain.ts` so that the P3 forcing-chain sub-types (digit/cell/nishio/
 * region/dic), forcing-net, and the enumeration class (templates / tabling) can
 * reuse the exact same sound primitives instead of re-implementing them.
 *
 * Soundness contract (why every caller is safe on the 400 ground-truth set):
 *  - `forceConclusionsFromBranches`: a premise is a genuine dichotomy (the true
 *    candidate set is EXACTLY the union of the branches). Each branch propagates
 *    only valid implication links, so the INTERSECTION of "false" consequences is
 *    truly false and the INTERSECTION of "true" consequences is truly placed.
 *  - `contradictionFromAssumption`: assume candidate is true, propagate naked
 *    singles; if a cell loses all candidates, the assumption is impossible → the
 *    candidate is soundly eliminated. (Standard "singles to contradiction".)
 *  - `propagateNakedSingles`: full single-value propagation of a placement; null
 *    on contradiction, otherwise the exact forced placements.
 *
 * Nothing here calls the brute-force solver or reads answers — every deduction
 * is a nameable human implication chain.
 */

import { CELLS, PEERS_OF, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import { buildLinkGraph, nodeKey, type LinkGraph } from '../chain/graph.js';
import type { ChainPolicy } from '../chain/policy.js';

export function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ============================================================
// Graph-based two-branch propagation (reused by cell/digit/region/dic)
// ============================================================

function setState(
  state: Map<number, boolean>,
  node: number,
  value: boolean,
  queue: number[],
): 'ok' | 'contradiction' {
  const existing = state.get(node);
  if (existing === undefined) {
    state.set(node, value);
    queue.push(node);
    return 'ok';
  }
  return existing === value ? 'ok' : 'contradiction';
}

export function propagate(graph: LinkGraph, start: number, maxChainLength: number): Map<number, boolean> | null {
  const state = new Map<number, boolean>([[start, true]]);
  const queue = [start];
  let steps = 0;

  while (queue.length > 0) {
    if (++steps > maxChainLength * 4) break;
    const current = queue.shift()!;
    const currentValue = state.get(current)!;

    for (const edge of graph.adjacency[current]!) {
      if (currentValue && edge.type === 'weak') {
        if (setState(state, edge.to, false, queue) === 'contradiction') return null;
      } else if (!currentValue && edge.type === 'strong') {
        if (setState(state, edge.to, true, queue) === 'contradiction') return null;
      }
    }

    if (state.size > maxChainLength) break;
  }

  return state;
}

export interface Consequences {
  trues: Set<string>;
  falses: Set<string>;
}

export function consequences(graph: LinkGraph, state: Map<number, boolean>): Consequences {
  const trues = new Set<string>();
  const falses = new Set<string>();

  for (const [nodeIndex, value] of state) {
    const node = graph.nodes[nodeIndex]!;
    if (node.cells.length !== 1) continue;
    const key = `${node.cells[0]}:${node.digit}`;
    if (value) trues.add(key);
    else falses.add(key);
  }

  return { trues, falses };
}

export function buildGraph(grid: Grid, grouped = false): LinkGraph {
  return buildLinkGraph(grid, { grouped });
}

export function nodeIndexOf(graph: LinkGraph, cell: number, digit: number): number | undefined {
  return graph.indexOfKey.get(nodeKey(digit, [cell]));
}

// ============================================================
// Step construction (shared by every forcing subtype)
// ============================================================

export function makeForcingStep(
  strategyId: string,
  grid: Grid,
  premiseCells: readonly number[],
  placements: CellDigit[],
  eliminations: CellDigit[],
  zhWhat: string,
  enWhat: string,
): Step {
  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([...premiseCells, ...placements.map((p) => p.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [
        ...premiseCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
        ...placements,
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: zhWhat,
      en: enWhat,
    },
  };
}

// ============================================================
// Two-branch forcing over the link graph
// ============================================================

export function forceFromTwo(
  strategyId: string,
  grid: Grid,
  graph: LinkGraph,
  firstNode: number,
  secondNode: number,
  premiseCells: readonly number[],
  policy: ChainPolicy,
  description: { zh: string; en: string },
): Step | null {
  const first = propagate(graph, firstNode, policy.maxChainLength);
  const second = propagate(graph, secondNode, policy.maxChainLength);

  if (first === null && second !== null) {
    const node = graph.nodes[secondNode]!;
    if (node.cells.length === 1) {
      return makeForcingStep(strategyId, grid, premiseCells, [{ cell: node.cells[0]!, digit: node.digit }], [], description.zh, description.en);
    }
  }

  if (second === null && first !== null) {
    const node = graph.nodes[firstNode]!;
    if (node.cells.length === 1) {
      return makeForcingStep(strategyId, grid, premiseCells, [{ cell: node.cells[0]!, digit: node.digit }], [], description.zh, description.en);
    }
  }

  if (first === null || second === null) return null;

  const firstConsequences = consequences(graph, first);
  const secondConsequences = consequences(graph, second);

  const eliminations: CellDigit[] = [];
  for (const key of firstConsequences.falses) {
    if (!secondConsequences.falses.has(key)) continue;
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
  }

  const placements: CellDigit[] = [];
  for (const key of firstConsequences.trues) {
    if (!secondConsequences.trues.has(key)) continue;
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (!premiseCells.includes(cell) && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
      placements.push({ cell, digit });
    }
  }

  if (placements.length > 0) {
    return makeForcingStep(strategyId, grid, premiseCells, [placements[0]!], [], description.zh, description.en);
  }
  if (eliminations.length > 0) {
    return makeForcingStep(strategyId, grid, premiseCells, [], eliminations, description.zh, description.en);
  }
  return null;
}

// ============================================================
// Multi-branch forcing (forcing net) — intersection over N branches
// ============================================================

export function forceFromBranches(
  strategyId: string,
  grid: Grid,
  graph: LinkGraph,
  branchStartNodes: readonly number[],
  premiseCells: readonly number[],
  policy: ChainPolicy,
  description: { zh: string; en: string },
): Step | null {
  if (branchStartNodes.length < 2) return null;

  const branchResults: { consc: Consequences | null }[] = [];
  for (const start of branchStartNodes) {
    const state = propagate(graph, start, policy.maxChainLength);
    branchResults.push({ consc: state ? consequences(graph, state) : null });
  }

  // If exactly one branch contradicts, its start node is forced true.
  const contradicted = branchResults
    .map((r, i) => (r.consc === null ? i : -1))
    .filter((i) => i >= 0);
  if (contradicted.length === 1) {
    const node = graph.nodes[branchStartNodes[contradicted[0]!]!]!;
    if (node.cells.length === 1) {
      return makeForcingStep(strategyId, grid, premiseCells, [{ cell: node.cells[0]!, digit: node.digit }], [], description.zh, description.en);
    }
  }

  // Intersect the "false" sets and "true" sets across NON-contradicted branches.
  const live = branchResults.filter((r) => r.consc !== null);
  if (live.length < 2) return null;

  const commonFalses = new Set<string>(live[0]!.consc!.falses);
  for (let i = 1; i < live.length; i++) {
    for (const k of commonFalses) if (!live[i]!.consc!.falses.has(k)) commonFalses.delete(k);
  }
  const commonTrues = new Set<string>(live[0]!.consc!.trues);
  for (let i = 1; i < live.length; i++) {
    for (const k of commonTrues) if (!live[i]!.consc!.trues.has(k)) commonTrues.delete(k);
  }

  const premiseSet = new Set(premiseCells);
  const placements: CellDigit[] = [];
  for (const key of commonTrues) {
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (!premiseSet.has(cell) && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
      placements.push({ cell, digit });
    }
  }
  if (placements.length > 0) {
    return makeForcingStep(strategyId, grid, premiseCells, [placements[0]!], [], description.zh, description.en);
  }

  const eliminations: CellDigit[] = [];
  for (const key of commonFalses) {
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
  }
  if (eliminations.length > 0) {
    return makeForcingStep(strategyId, grid, premiseCells, [], eliminations, description.zh, description.en);
  }
  return null;
}

// ============================================================
// Contradiction-from-assumption (Bowman's Bingo / Nishio core)
// ============================================================

export function contradictionFromAssumption(grid: Grid, cell: number, digit: number, maxChainLength: number): boolean {
  if (!grid.hasCandidate(cell, digit)) return true;
  const values = grid.values.slice();
  const candidates = grid.candidates.slice();
  values[cell] = digit;
  candidates[cell] = 0;
  const queue = [cell];
  let steps = 0;

  while (queue.length > 0 && steps++ < maxChainLength) {
    const placed = queue.shift()!;
    const placedDigit = values[placed]!;
    const bit = maskOf(placedDigit);

    for (const peer of PEERS_OF[placed]!) {
      if (values[peer] !== 0) {
        if (values[peer] === placedDigit) return true;
        continue;
      }
      if ((candidates[peer]! & bit) === 0) continue;
      candidates[peer]! &= ~bit;
      if (candidates[peer] === 0) return true;
      if (popcount(candidates[peer]!) === 1) {
        values[peer] = digitsOf(candidates[peer]!)[0]!;
        candidates[peer] = 0;
        queue.push(peer);
      }
    }
  }

  return false;
}

// ============================================================
// Naked-singles propagation (legacy forcing chain core)
// ============================================================

const LEGACY_MAX_PROPAGATION = 50;

export function propagateNakedSingles(grid: Grid, cell: number, digit: number): Map<number, number> | null {
  const placements = new Map<number, number>();
  const work = grid.clone();

  if (!work.hasCandidate(cell, digit)) return null;
  work.place(cell, digit);
  placements.set(cell, digit);

  let changed = true;
  let steps = 0;
  while (changed && steps < LEGACY_MAX_PROPAGATION) {
    changed = false;
    steps++;

    for (let cellIndex = 0; cellIndex < CELLS; cellIndex++) {
      if (work.get(cellIndex) !== 0) continue;
      const mask = work.candidatesOf(cellIndex);
      if (mask === 0) return null;
      if (popcount(mask) === 1) {
        const forcedDigit = digitsOf(mask)[0]!;
        if (!placements.has(cellIndex)) placements.set(cellIndex, forcedDigit);
        work.place(cellIndex, forcedDigit);
        changed = true;
      }
    }
  }

  for (let cellIndex = 0; cellIndex < CELLS; cellIndex++) {
    if (work.get(cellIndex) !== 0) continue;
    if (work.candidatesOf(cellIndex) === 0) return null;
  }

  return placements;
}

// ============================================================
// Digit positions helper (for region/digit forcing premises)
// ============================================================

export function digitPositionsInHouse(grid: Grid, house: readonly number[], digit: number): number[] {
  const bit = maskOf(digit);
  return house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
}

export { HOUSES, maskOf, popcount, digitsOf };
