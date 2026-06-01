/**
 * Forcing Chain (T4, last resort) — 强制链.
 *
 * Bounded forcing as defined by `docs/forcing-boundary.md` (FR-8). We take a
 * SINGLE premise of width 2 — either:
 *   - a bivalue cell {a,b} (allowCellForcing), or
 *   - a digit with exactly two placements in some house (allowDigitForcing) —
 * and follow, from each of the two alternatives, a NON-BRANCHING alternating
 * implication chain along the link graph. A consequence is recorded only if it
 * is common to BOTH branches (or if one branch self-contradicts, the other
 * premise is placed). Multi-branch forcing NETS are NOT performed (allowNets).
 *
 * The propagation is purely along strong/weak links (the same graph the AIC
 * search uses), so it is genuine alternating logic — not a constraint-propagation
 * "try it and run all singles" (which would resemble Nishio). This keeps it on
 * the logical side of the boundary while still cracking puzzles AIC misses.
 *
 * Pure: never mutates the grid.
 */

import { CELLS, SIZE, HOUSES, maskOf, popcount, digitsOf, cellLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, nodeKey, type LinkGraph } from '../chain/graph.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

/**
 * From an assumption that node `start` is TRUE, propagate forced truths/falsities
 * along the alternating graph without branching:
 *   - node TRUE  → all weak-linked neighbours are FALSE.
 *   - node FALSE → if a strong link makes exactly the partner forced TRUE, set it.
 * We iterate to a fixpoint, bounded by maxChainLength node visits. Returns the
 * map node→bool, or null if a contradiction (a node forced both true and false)
 * is reached (meaning the assumption was impossible).
 */
function propagate(graph: LinkGraph, start: number, maxLen: number): Map<number, boolean> | null {
  const state = new Map<number, boolean>();
  state.set(start, true);
  const queue: number[] = [start];
  let steps = 0;
  while (queue.length) {
    if (++steps > maxLen * 4) break;
    const cur = queue.shift()!;
    const curVal = state.get(cur)!;
    for (const edge of graph.adjacency[cur]!) {
      if (curVal && edge.type === 'weak') {
        // cur TRUE → partner FALSE
        if (setState(state, edge.to, false, queue) === 'contradiction') return null;
      } else if (!curVal && edge.type === 'strong') {
        // cur FALSE → partner TRUE (strong link)
        if (setState(state, edge.to, true, queue) === 'contradiction') return null;
      }
    }
    if (state.size > maxLen) break;
  }
  return state;
}

function setState(
  state: Map<number, boolean>,
  node: number,
  val: boolean,
  queue: number[],
): 'ok' | 'contradiction' {
  const existing = state.get(node);
  if (existing === undefined) {
    state.set(node, val);
    queue.push(node);
    return 'ok';
  }
  return existing === val ? 'ok' : 'contradiction';
}

/** Convert "node forced true/false" maps into concrete candidate truths. */
function consequences(graph: LinkGraph, state: Map<number, boolean>): {
  trues: Set<string>;
  falses: Set<string>;
} {
  const trues = new Set<string>();
  const falses = new Set<string>();
  for (const [idx, val] of state) {
    const node = graph.nodes[idx]!;
    if (node.cells.length !== 1) continue; // only single candidates are concrete
    const k = `${node.cells[0]}:${node.digit}`;
    if (val) trues.add(k);
    else falses.add(k);
  }
  return { trues, falses };
}

function makeStep(
  id: string,
  grid: Grid,
  premiseCells: number[],
  placements: CellDigit[],
  eliminations: CellDigit[],
  zhWhat: string,
  enWhat: string,
): Step {
  return {
    strategyId: id,
    placements,
    eliminations,
    highlights: {
      cells: premiseCells,
      candidates: premiseCells.flatMap((c) =>
        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
      ),
      links: [],
    },
    explanation: {
      zh: `强制链:${zhWhat}`,
      en: `Forcing chain: ${enWhat}`,
    },
  };
}

export function makeForcingChain(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'forcing-chain',
    name: { zh: '强制链', en: 'Forcing Chain' },
    difficulty: 100,

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: false });
      const idxOf = (cell: number, digit: number): number | undefined =>
        graph.indexOfKey.get(nodeKey(digit, [cell]));

      // ---- premise type A: bivalue cell ----
      if (policy.allowCellForcing) {
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || popcount(grid.candidatesOf(c)) !== 2) continue;
          const [d1, d2] = digitsOf(grid.candidatesOf(c)) as [number, number];
          const i1 = idxOf(c, d1);
          const i2 = idxOf(c, d2);
          if (i1 === undefined || i2 === undefined) continue;
          const step = forceFromTwo(this.id, grid, graph, i1, i2, [c], policy, {
            zh: `双值格 ${cellLabel(c)}{${d1},${d2}} 的两种取值分别推演,得到共同结论。`,
            en: `both values of bivalue cell ${cellLabel(c)}{${d1},${d2}} lead to the same conclusion.`,
          });
          if (step) return step;
        }
      }

      // ---- premise type B: digit with two spots in a house ----
      if (policy.allowDigitForcing) {
        for (let h = 0; h < HOUSES.length; h++) {
          for (let d = 1; d <= SIZE; d++) {
            const bit = maskOf(d);
            const spots = HOUSES[h]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
            if (spots.length !== 2) continue;
            const [s1, s2] = spots as [number, number];
            const i1 = idxOf(s1, d);
            const i2 = idxOf(s2, d);
            if (i1 === undefined || i2 === undefined) continue;
            const step = forceFromTwo(this.id, grid, graph, i1, i2, [s1, s2], policy, {
              zh: `数字 ${d} 在某房屋的两个落点 ${cellLabel(s1)}、${cellLabel(s2)} 分别推演,得到共同结论。`,
              en: `the two spots of digit ${d} (${cellLabel(s1)}, ${cellLabel(s2)}) lead to the same conclusion.`,
            });
            if (step) return step;
          }
        }
      }

      return null;
    },
  };
}

function forceFromTwo(
  id: string,
  grid: Grid,
  graph: LinkGraph,
  i1: number,
  i2: number,
  premiseCells: number[],
  policy: ChainPolicy,
  desc: { zh: string; en: string },
): Step | null {
  const s1 = propagate(graph, i1, policy.maxChainLength);
  const s2 = propagate(graph, i2, policy.maxChainLength);

  // If one branch self-contradicts, the other premise is forced TRUE.
  if (s1 === null && s2 !== null) {
    const n = graph.nodes[i2]!;
    if (n.cells.length === 1) {
      return makeStep(id, grid, premiseCells, [{ cell: n.cells[0]!, digit: n.digit }], [], desc.zh, desc.en);
    }
  }
  if (s2 === null && s1 !== null) {
    const n = graph.nodes[i1]!;
    if (n.cells.length === 1) {
      return makeStep(id, grid, premiseCells, [{ cell: n.cells[0]!, digit: n.digit }], [], desc.zh, desc.en);
    }
  }
  if (s1 === null || s2 === null) return null;

  const c1 = consequences(graph, s1);
  const c2 = consequences(graph, s2);

  // Common eliminations: a candidate forced FALSE in both branches.
  const elims: CellDigit[] = [];
  for (const k of c1.falses) {
    if (c2.falses.has(k)) {
      const [cell, digit] = k.split(':').map(Number) as [number, number];
      if (grid.hasCandidate(cell, digit)) elims.push({ cell, digit });
    }
  }
  // Common placements: a candidate forced TRUE in both branches.
  const placements: CellDigit[] = [];
  for (const k of c1.trues) {
    if (c2.trues.has(k)) {
      const [cell, digit] = k.split(':').map(Number) as [number, number];
      // avoid re-placing the premise itself unless it's the genuine common truth
      if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
        // skip the premise nodes themselves
        if (!premiseCells.includes(cell)) placements.push({ cell, digit });
      }
    }
  }

  if (placements.length === 0 && elims.length === 0) return null;
  // Prefer a single clean placement to keep the trace teaching-friendly.
  if (placements.length > 0) {
    return makeStep(id, grid, premiseCells, [placements[0]!], [], desc.zh, desc.en);
  }
  return makeStep(id, grid, premiseCells, [], elims, desc.zh, desc.en);
}

export const forcingChain: Strategy = makeForcingChain();
