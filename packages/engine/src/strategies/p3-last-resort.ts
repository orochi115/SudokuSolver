/**
 * P3 Last-Resort strategy stubs — Roadmap ② Phase 3 (Red-Line / Last Resort).
 *
 * RED-LINE ISOLATION INVARIANT:
 *   Every strategy in this file MUST be listed in `LAST_RESORT_IDS` in
 *   `profiles.ts`.  None of these ids must appear in `HUMAN_DEFAULT_STRATEGIES`.
 *   The test `test/strategy-profiles.test.ts` enforces this via machine checks.
 *
 * These strategies involve multi-branch reasoning (forcing chains/nets),
 * enumeration (POM, Templates, Tabling), or near-enumeration (GEM).
 * They are "last resort" because they cannot be compactly explained as a
 * single named deduction step — they require exploring multiple hypothetical
 * branches or exhaustive digit-pattern overlays.
 *
 * Difficulty band: 9xxx (all above `forcing-chain` 9000, non-overlapping).
 * All implementations are logically sound pattern detectors — no external
 * oracle functions are called; every elimination/placement is derived from
 * named human deductions over the candidate graph.
 *
 * Implementation status: stubs (apply() returns null). The forcing-chain
 * sub-types reuse the engine from `forcing-chain.ts` under different ids;
 * forcing-net, kraken-fish, tabling, POM, templates, and GEM will each
 * need dedicated detectors once implemented beyond stub level.
 *
 * Difficulty assignments (9xxx band, per checklist):
 *   digit-forcing-chain        9010
 *   nishio-forcing-chain       9020
 *   cell-forcing-chain         9030
 *   region-forcing-chain       9040
 *   dic                        9050
 *   forcing-net                9100
 *   kraken-fish                9200
 *   tabling                    9300
 *   pom                        9400
 *   templates                  9500
 *   gem                        9600
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  CELLS, HOUSES, PEERS_OF, maskOf, popcount, digitsOf,
  ROW_OF, COL_OF,
} from '../grid.js';
import { buildLinkGraph, nodeKey } from '../chain/graph.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function makeSingleStep(
  strategyId: string,
  premiseCells: readonly number[],
  placements: { cell: number; digit: number }[],
  eliminations: { cell: number; digit: number }[],
  zh: string,
  en: string,
  grid: Grid,
): Step {
  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([...premiseCells, ...placements.map((p) => p.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [
        ...placements,
        ...eliminations,
      ],
      links: [],
    },
    explanation: { zh, en },
  };
}

// ─── Propagation engine (shared by forcing-chain sub-types) ──────────────────

/**
 * Propagate implications from a single node assumption using the link graph.
 * Returns null if a contradiction is reached within the bounded walk.
 */
function propagateLinkGraph(
  graph: ReturnType<typeof buildLinkGraph>,
  startNode: number,
  maxSteps: number,
): Map<number, boolean> | null {
  const state = new Map<number, boolean>([[startNode, true]]);
  const queue = [startNode];
  let steps = 0;

  while (queue.length > 0 && steps < maxSteps * 4) {
    steps++;
    const current = queue.shift()!;
    const currentValue = state.get(current)!;

    for (const edge of graph.adjacency[current]!) {
      const targetValue = currentValue && edge.type === 'weak' ? false
        : !currentValue && edge.type === 'strong' ? true
        : undefined;
      if (targetValue === undefined) continue;

      const existing = state.get(edge.to);
      if (existing === undefined) {
        state.set(edge.to, targetValue);
        queue.push(edge.to);
        if (state.size > maxSteps) return state; // truncate large states
      } else if (existing !== targetValue) {
        return null; // contradiction
      }
    }
  }

  return state;
}

/** Extract cell:digit consequences from a propagation state map. */
function extractConsequences(
  graph: ReturnType<typeof buildLinkGraph>,
  state: Map<number, boolean>,
): { trues: Set<string>; falses: Set<string> } {
  const trues = new Set<string>();
  const falses = new Set<string>();
  for (const [nodeIndex, value] of state) {
    const node = graph.nodes[nodeIndex]!;
    if (node.cells.length !== 1) continue;
    const key = `${node.cells[0]}:${node.digit}`;
    if (value) trues.add(key); else falses.add(key);
  }
  return { trues, falses };
}

/** Given two propagation states, find common trues (placements) and common falses (eliminations). */
function intersectConsequences(
  a: { trues: Set<string>; falses: Set<string> },
  b: { trues: Set<string>; falses: Set<string> },
  grid: Grid,
  premiseCells: readonly number[],
): { placements: { cell: number; digit: number }[]; eliminations: { cell: number; digit: number }[] } {
  const placements: { cell: number; digit: number }[] = [];
  const eliminations: { cell: number; digit: number }[] = [];

  for (const key of a.trues) {
    if (!b.trues.has(key)) continue;
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (!premiseCells.includes(cell) && grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
      placements.push({ cell, digit });
    }
  }
  for (const key of a.falses) {
    if (!b.falses.has(key)) continue;
    const [cell, digit] = key.split(':').map(Number) as [number, number];
    if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
  }
  return { placements, eliminations };
}

// ─── 9010 Digit Forcing Chain ─────────────────────────────────────────────────

/**
 * Digit Forcing Chain: a forcing chain that starts from the two possible
 * positions of a digit within a house (conjugate pair).  If both branches
 * lead to the same conclusion, that conclusion holds.
 *
 * This is a named sub-type of the general forcing-chain technique, focused
 * on single-digit strong links within a house as the starting premise.
 * Red-line: multi-branch; last-resort only.
 */
export const digitForcingChain: Strategy = {
  id: 'digit-forcing-chain',
  name: { zh: '数字强制链', en: 'Digit Forcing Chain' },
  difficulty: 9010,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    const graph = buildLinkGraph(grid, { grouped: false });
    const nodeIndex = (cell: number, digit: number): number | undefined =>
      graph.indexOfKey.get(nodeKey(digit, [cell]));

    for (const house of HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const positions = house.filter(
          (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        );
        if (positions.length !== 2) continue;

        const [cellA, cellB] = positions as [number, number];
        const nodeA = nodeIndex(cellA, digit);
        const nodeB = nodeIndex(cellB, digit);
        if (nodeA === undefined || nodeB === undefined) continue;

        const stateA = propagateLinkGraph(graph, nodeA, policy.maxChainLength);
        const stateB = propagateLinkGraph(graph, nodeB, policy.maxChainLength);

        // If one branch contradicts, the other must hold
        if (stateA === null && stateB !== null && grid.hasCandidate(cellB, digit)) {
          return makeSingleStep(
            'digit-forcing-chain',
            [cellA, cellB],
            [{ cell: cellB, digit }],
            [],
            `数字 ${digit} 在房屋两个位置，${cellLabel(cellA)}=${digit} 导致矛盾，故 ${cellLabel(cellB)}=${digit}。`,
            `digit ${digit} in house: assuming ${cellLabel(cellA)}=${digit} leads to contradiction, so ${cellLabel(cellB)}=${digit}.`,
            grid,
          );
        }
        if (stateB === null && stateA !== null && grid.hasCandidate(cellA, digit)) {
          return makeSingleStep(
            'digit-forcing-chain',
            [cellA, cellB],
            [{ cell: cellA, digit }],
            [],
            `数字 ${digit} 在房屋两个位置，${cellLabel(cellB)}=${digit} 导致矛盾，故 ${cellLabel(cellA)}=${digit}。`,
            `digit ${digit} in house: assuming ${cellLabel(cellB)}=${digit} leads to contradiction, so ${cellLabel(cellA)}=${digit}.`,
            grid,
          );
        }
        if (stateA === null || stateB === null) continue;

        const cA = extractConsequences(graph, stateA);
        const cB = extractConsequences(graph, stateB);
        const { placements, eliminations } = intersectConsequences(cA, cB, grid, [cellA, cellB]);

        if (placements.length > 0) {
          const p = placements[0]!;
          return makeSingleStep(
            'digit-forcing-chain',
            [cellA, cellB],
            [p],
            [],
            `数字 ${digit} 在房屋两个位置均导致 ${cellLabel(p.cell)}=${p.digit}；故填入。`,
            `both positions of digit ${digit} in house lead to ${cellLabel(p.cell)}=${p.digit}; place it.`,
            grid,
          );
        }
        if (eliminations.length > 0) {
          const e = eliminations[0]!;
          return makeSingleStep(
            'digit-forcing-chain',
            [cellA, cellB],
            [],
            [e],
            `数字 ${digit} 在房屋两个位置均排除 ${cellLabel(e.cell)} 中的 ${e.digit}；故消去。`,
            `both positions of digit ${digit} in house eliminate ${e.digit} from ${cellLabel(e.cell)}; eliminate it.`,
            grid,
          );
        }
      }
    }
    return null;
  },
};

// ─── 9020 Nishio Forcing Chain ────────────────────────────────────────────────

/**
 * Nishio: assume a digit in a cell; propagate via naked/hidden singles until
 * either a contradiction arises (eliminating that digit) or the assumption
 * completes without contradiction.  Named after Tetsuya Nishio.
 *
 * Implementation: bounded single-branch contradiction search — specifically
 * the "try one digit, detect contradiction via propagation" form.
 * Red-line: contradiction search; last-resort only.
 */
export const nishioForcingChain: Strategy = {
  id: 'nishio-forcing-chain',
  name: { zh: 'Nishio强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const maxSteps = DEFAULT_CHAIN_POLICY.maxChainLength * 4;

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const candidates = digitsOf(grid.candidatesOf(cell));
      if (candidates.length < 2) continue;

      for (const digit of candidates) {
        // Propagate: place digit in cell and forward naked/hidden singles
        if (!grid.hasCandidate(cell, digit)) continue;

        const values = grid.values.slice();
        const cands = grid.candidates.slice();
        values[cell] = digit;
        cands[cell] = 0;
        const queue = [cell];
        let contradiction = false;
        let steps = 0;

        propagationLoop: while (queue.length > 0 && steps < maxSteps) {
          steps++;
          const placed = queue.shift()!;
          const placedDigit = values[placed]!;
          const bit = maskOf(placedDigit);

          for (const peer of PEERS_OF[placed]!) {
            if (values[peer] !== 0) {
              if (values[peer] === placedDigit) { contradiction = true; break propagationLoop; }
              continue;
            }
            if ((cands[peer]! & bit) === 0) continue;
            cands[peer]! &= ~bit;
            if (cands[peer] === 0) { contradiction = true; break propagationLoop; }
            if (popcount(cands[peer]!) === 1) {
              const forced = digitsOf(cands[peer]!)[0]!;
              values[peer] = forced;
              cands[peer] = 0;
              queue.push(peer);
            }
          }
        }

        if (contradiction) {
          return makeSingleStep(
            'nishio-forcing-chain',
            [cell],
            [],
            [{ cell, digit }],
            `Nishio: 假设 ${cellLabel(cell)}=${digit} 在传播中产生矛盾；消去候选 ${digit}。`,
            `Nishio: assuming ${cellLabel(cell)}=${digit} produces a contradiction during propagation; eliminate candidate ${digit}.`,
            grid,
          );
        }
      }
    }
    return null;
  },
};

// ─── 9030 Cell Forcing Chain ──────────────────────────────────────────────────

/**
 * Cell Forcing Chain: start from all candidates of a bivalue (or multi-value)
 * cell; propagate each branch; if ALL branches lead to the same conclusion,
 * that conclusion holds regardless of which candidate is true.
 *
 * This generalises the two-candidate case (bivalue cell) to cells with 3+
 * candidates (General Cell Forcing Chain).  Uses the link graph for inference.
 * Red-line: multi-branch; last-resort only.
 */
export const cellForcingChain: Strategy = {
  id: 'cell-forcing-chain',
  name: { zh: '格强制链', en: 'Cell Forcing Chain' },
  difficulty: 9030,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    const graph = buildLinkGraph(grid, { grouped: false });
    const nodeIndex = (cell: number, digit: number): number | undefined =>
      graph.indexOfKey.get(nodeKey(digit, [cell]));

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const candidates = digitsOf(grid.candidatesOf(cell));
      if (candidates.length < 2 || candidates.length > 4) continue;

      const branchStates: Map<number, boolean>[] = [];
      const contradictions: number[] = [];

      for (const digit of candidates) {
        const ni = nodeIndex(cell, digit);
        if (ni === undefined) { contradictions.push(digit); continue; }
        const state = propagateLinkGraph(graph, ni, policy.maxChainLength);
        if (state === null) contradictions.push(digit);
        else branchStates.push(state);
      }

      if (contradictions.length > 0) {
        const digit = contradictions[0]!;
        if (grid.hasCandidate(cell, digit)) {
          return makeSingleStep(
            'cell-forcing-chain',
            [cell],
            [],
            [{ cell, digit }],
            `格强制链：假设 ${cellLabel(cell)}=${digit} 导致矛盾；消去候选 ${digit}。`,
            `cell forcing chain: assuming ${cellLabel(cell)}=${digit} leads to contradiction; eliminate candidate ${digit}.`,
            grid,
          );
        }
      }

      if (branchStates.length < 2) continue;

      // Find a common conclusion across ALL branches
      const first = extractConsequences(graph, branchStates[0]!);
      let commonTrues = new Set(first.trues);
      let commonFalses = new Set(first.falses);
      for (let i = 1; i < branchStates.length; i++) {
        const c = extractConsequences(graph, branchStates[i]!);
        commonTrues = new Set([...commonTrues].filter((k) => c.trues.has(k)));
        commonFalses = new Set([...commonFalses].filter((k) => c.falses.has(k)));
      }

      for (const key of commonTrues) {
        const [targetCell, targetDigit] = key.split(':').map(Number) as [number, number];
        if (targetCell === cell) continue;
        if (grid.get(targetCell) !== 0 || !grid.hasCandidate(targetCell, targetDigit)) continue;
        return makeSingleStep(
          'cell-forcing-chain',
          [cell, targetCell],
          [{ cell: targetCell, digit: targetDigit }],
          [],
          `格强制链：从 ${cellLabel(cell)} 各候选均推出 ${cellLabel(targetCell)}=${targetDigit}；故填入。`,
          `cell forcing chain: all candidates of ${cellLabel(cell)} lead to ${cellLabel(targetCell)}=${targetDigit}; place it.`,
          grid,
        );
      }

      for (const key of commonFalses) {
        const [targetCell, targetDigit] = key.split(':').map(Number) as [number, number];
        if (!grid.hasCandidate(targetCell, targetDigit)) continue;
        return makeSingleStep(
          'cell-forcing-chain',
          [cell, targetCell],
          [],
          [{ cell: targetCell, digit: targetDigit }],
          `格强制链：从 ${cellLabel(cell)} 各候选均排除 ${cellLabel(targetCell)} 中的 ${targetDigit}；故消去。`,
          `cell forcing chain: all candidates of ${cellLabel(cell)} eliminate ${targetDigit} from ${cellLabel(targetCell)}; eliminate it.`,
          grid,
        );
      }
    }
    return null;
  },
};

// ─── 9040 Region Forcing Chain ────────────────────────────────────────────────

/**
 * Region Forcing Chain (House Forcing Chain): start from all positions of a
 * digit within a house; if ALL branches lead to the same conclusion, that
 * conclusion holds.  This is the house-centric dual of Cell Forcing Chain.
 *
 * Red-line: multi-branch; last-resort only.
 */
export const regionForcingChain: Strategy = {
  id: 'region-forcing-chain',
  name: { zh: '区域强制链', en: 'Region Forcing Chain' },
  difficulty: 9040,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    const graph = buildLinkGraph(grid, { grouped: false });
    const nodeIndex = (cell: number, digit: number): number | undefined =>
      graph.indexOfKey.get(nodeKey(digit, [cell]));

    for (const house of HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const bit = maskOf(digit);
        const positions = house.filter(
          (cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0,
        );
        if (positions.length < 2 || positions.length > 4) continue;

        const branchStates: Map<number, boolean>[] = [];
        const contradictions: number[] = [];

        for (const cell of positions) {
          const ni = nodeIndex(cell, digit);
          if (ni === undefined) { contradictions.push(cell); continue; }
          const state = propagateLinkGraph(graph, ni, policy.maxChainLength);
          if (state === null) contradictions.push(cell);
          else branchStates.push(state);
        }

        if (contradictions.length > 0) {
          const cell = contradictions[0]!;
          if (grid.hasCandidate(cell, digit)) {
            return makeSingleStep(
              'region-forcing-chain',
              positions,
              [],
              [{ cell, digit }],
              `区域强制链：假设 ${cellLabel(cell)}=${digit} 导致矛盾；消去候选。`,
              `region forcing chain: assuming ${cellLabel(cell)}=${digit} leads to contradiction; eliminate candidate.`,
              grid,
            );
          }
        }

        if (branchStates.length < 2) continue;

        const first = extractConsequences(graph, branchStates[0]!);
        let commonTrues = new Set(first.trues);
        let commonFalses = new Set(first.falses);
        for (let i = 1; i < branchStates.length; i++) {
          const c = extractConsequences(graph, branchStates[i]!);
          commonTrues = new Set([...commonTrues].filter((k) => c.trues.has(k)));
          commonFalses = new Set([...commonFalses].filter((k) => c.falses.has(k)));
        }

        for (const key of commonTrues) {
          const [targetCell, targetDigit] = key.split(':').map(Number) as [number, number];
          if (positions.includes(targetCell)) continue;
          if (grid.get(targetCell) !== 0 || !grid.hasCandidate(targetCell, targetDigit)) continue;
          return makeSingleStep(
            'region-forcing-chain',
            [...positions, targetCell],
            [{ cell: targetCell, digit: targetDigit }],
            [],
            `区域强制链：数字 ${digit} 在房屋各位置均推出 ${cellLabel(targetCell)}=${targetDigit}；故填入。`,
            `region forcing chain: all positions of digit ${digit} in house lead to ${cellLabel(targetCell)}=${targetDigit}; place it.`,
            grid,
          );
        }

        for (const key of commonFalses) {
          const [targetCell, targetDigit] = key.split(':').map(Number) as [number, number];
          if (!grid.hasCandidate(targetCell, targetDigit)) continue;
          return makeSingleStep(
            'region-forcing-chain',
            [...positions, targetCell],
            [],
            [{ cell: targetCell, digit: targetDigit }],
            `区域强制链：数字 ${digit} 在房屋各位置均排除 ${cellLabel(targetCell)} 中的 ${targetDigit}；故消去。`,
            `region forcing chain: all positions of digit ${digit} in house eliminate ${targetDigit} from ${cellLabel(targetCell)}; eliminate it.`,
            grid,
          );
        }
      }
    }
    return null;
  },
};

// ─── 9050 DIC (Double Implication Chain) ─────────────────────────────────────

/**
 * DIC — Double Implication Chain: a forcing chain where the premise is a
 * pair of assumptions that are mutually exclusive (one strong link), and
 * the conclusions from both branches are combined.  This is essentially a
 * two-branch forcing chain over a conjugate pair as a single chain step.
 *
 * Red-line: multi-branch (two simultaneous branches from a conjugate pair);
 * last-resort only.
 */
export const dic: Strategy = {
  id: 'dic',
  name: { zh: '双向蕴含链', en: 'Double Implication Chain (DIC)' },
  difficulty: 9050,
  tieBreak: ['chain-length', 'cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // DIC is equivalent to a two-branch forcing chain over any bivalue cell
    // or conjugate pair — covered already by digit-forcing-chain and
    // cell-forcing-chain at 9010/9030.  This stub registers the id for
    // completeness and adds a link-graph based version targeting cells with
    // exactly two candidates (bivalue) that are NOT yet handled by the lower
    // difficulty variants.
    //
    // Implementation: try all bivalue cells; for each, propagate both branches
    // through the link graph and look for common conclusions beyond same-house
    // peers (which would already be caught by nice-loop/AIC).

    const policy = DEFAULT_CHAIN_POLICY;
    const graph = buildLinkGraph(grid, { grouped: false });
    const nodeIndex = (cell: number, digit: number): number | undefined =>
      graph.indexOfKey.get(nodeKey(digit, [cell]));

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const candidates = digitsOf(grid.candidatesOf(cell));
      if (candidates.length !== 2) continue;

      const [dA, dB] = candidates as [number, number];
      const niA = nodeIndex(cell, dA);
      const niB = nodeIndex(cell, dB);
      if (niA === undefined || niB === undefined) continue;

      const stateA = propagateLinkGraph(graph, niA, policy.maxChainLength);
      const stateB = propagateLinkGraph(graph, niB, policy.maxChainLength);

      if (stateA === null) {
        // dA leads to contradiction → place dB
        if (grid.hasCandidate(cell, dB)) {
          return makeSingleStep(
            'dic',
            [cell],
            [{ cell, digit: dB }],
            [],
            `DIC: 双值格 ${cellLabel(cell)}: 假设 =${dA} 导致矛盾；故 ${cellLabel(cell)}=${dB}。`,
            `DIC: bivalue cell ${cellLabel(cell)}: assuming =${dA} leads to contradiction; so ${cellLabel(cell)}=${dB}.`,
            grid,
          );
        }
      }
      if (stateB === null) {
        if (grid.hasCandidate(cell, dA)) {
          return makeSingleStep(
            'dic',
            [cell],
            [{ cell, digit: dA }],
            [],
            `DIC: 双值格 ${cellLabel(cell)}: 假设 =${dB} 导致矛盾；故 ${cellLabel(cell)}=${dA}。`,
            `DIC: bivalue cell ${cellLabel(cell)}: assuming =${dB} leads to contradiction; so ${cellLabel(cell)}=${dA}.`,
            grid,
          );
        }
      }
      if (stateA === null || stateB === null) continue;

      const cA = extractConsequences(graph, stateA);
      const cB = extractConsequences(graph, stateB);
      const { placements, eliminations } = intersectConsequences(cA, cB, grid, [cell]);

      if (placements.length > 0) {
        const p = placements[0]!;
        return makeSingleStep(
          'dic',
          [cell, p.cell],
          [p],
          [],
          `DIC: 双向蕴含链——${cellLabel(cell)} 的两种假设均推出 ${cellLabel(p.cell)}=${p.digit}；故填入。`,
          `DIC: both assumptions of ${cellLabel(cell)} imply ${cellLabel(p.cell)}=${p.digit}; place it.`,
          grid,
        );
      }
      if (eliminations.length > 0) {
        const e = eliminations[0]!;
        return makeSingleStep(
          'dic',
          [cell, e.cell],
          [],
          [e],
          `DIC: 双向蕴含链——${cellLabel(cell)} 的两种假设均排除 ${cellLabel(e.cell)} 中的 ${e.digit}；故消去。`,
          `DIC: both assumptions of ${cellLabel(cell)} eliminate ${e.digit} from ${cellLabel(e.cell)}; eliminate it.`,
          grid,
        );
      }
    }
    return null;
  },
};

// ─── 9100 Forcing Net ─────────────────────────────────────────────────────────

/**
 * Forcing Net: a multi-branch forcing tree where each branch may itself
 * fork into sub-branches (unlike a forcing chain which keeps each branch
 * linear).  Kinds: cell-net, region-net, contradiction-net, verity-net.
 *
 * This is strictly more powerful than forcing chains and is the strongest
 * logically-sound technique short of trial-and-error.
 *
 * Implementation: stub — returns null.  Full implementation would build a
 * DAG of implications over the candidate graph and detect common nodes
 * across all branches from a given starting premise.
 *
 * Red-line: multi-branch / DAG search; last-resort only.
 */
export const forcingNet: Strategy = {
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9100,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    // Stub: full Forcing Net search is not yet implemented.
    // When implemented, this will: build an implication DAG from each
    // candidate in a cell/house, propagate through all strong/weak links
    // (including grouped nodes), and look for nodes reachable from all
    // branches (verity) or unreachable from any branch (contradiction).
    return null;
  },
};

// ─── 9200 Kraken Fish ─────────────────────────────────────────────────────────

/**
 * Kraken Fish: a fish pattern (X-Wing, Swordfish, etc.) where one or more
 * fin cells are connected via a forcing chain rather than a direct peer
 * relationship.  This dramatically extends the reach of fish patterns.
 *
 * Two main types:
 *   Type 1 (Kraken Fish Type 1): fin → chain → cover sector
 *   Type 2 (Kraken Fish Type 2): fin → chain → victim
 *
 * Red-line: combines fish detection with chain search; last-resort only.
 */
export const krakenFish: Strategy = {
  id: 'kraken-fish',
  name: { zh: '海妖鱼', en: 'Kraken Fish' },
  difficulty: 9200,
  tieBreak: ['digit', 'size', 'cell-index'],

  apply(_grid: Grid): Step | null {
    // Stub: full Kraken Fish detection is not yet implemented.
    // When implemented, this will: enumerate all fish patterns (X-Wing,
    // Swordfish, Jellyfish, including Franken/Mutant variants); for each
    // fin cell, check whether there exists a forcing chain connecting that
    // fin to a cell that would normally be the elimination target; if so,
    // produce the elimination via the combined fish+chain argument.
    return null;
  },
};

// ─── 9300 Tabling (Trebor's Tables) ──────────────────────────────────────────

/**
 * Tabling (Trebor's Tables): an enumeration technique that systematically
 * lists all implications of each candidate assignment in a table.  For each
 * candidate A=x, propagate all necessary consequences, then for each candidate
 * B=y in the resulting table, propagate THOSE consequences, building a
 * two-level implication table.  Conclusions common to all cells of a table
 * entry are safe deductions.
 *
 * Distinct from forcing chains in that it uses a two-level nested propagation
 * (hence "tables" rather than "chains").
 *
 * Red-line: nested enumeration; last-resort only.
 */
export const tabling: Strategy = {
  id: 'tabling',
  name: { zh: 'Tabling表格法', en: 'Tabling (Trebor\'s Tables)' },
  difficulty: 9300,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    // Stub: full Tabling implementation is not yet implemented.
    // When implemented, this will build a two-level implication table:
    // outer loop over all cell-digit candidates, inner loop propagating
    // implications of each combination, then detecting cross-table common
    // conclusions (verity) or universal falsifications (contradiction).
    return null;
  },
};

// ─── 9400 POM (Pattern Overlay Method) ───────────────────────────────────────

/**
 * Pattern Overlay Method (POM): for each digit, enumerate ALL possible valid
 * digit patterns (placements of that digit in 9 cells, one per row, one per
 * col, one per box).  Overlay all patterns to find cells where the digit
 * appears in EVERY valid pattern (→ placement) or NO valid pattern (→
 * elimination).
 *
 * Not a trial-and-error technique — it reasons about the set of valid
 * patterns for a single digit, which is a well-defined logical object.
 * However, the enumeration of all valid patterns can be expensive.
 *
 * Red-line: full digit pattern enumeration; last-resort only.
 */
export const pom: Strategy = {
  id: 'pom',
  name: { zh: 'POM图案覆盖法', en: 'POM (Pattern Overlay Method)' },
  difficulty: 9400,
  tieBreak: ['digit', 'cell-index'],

  apply(_grid: Grid): Step | null {
    // Stub: full POM implementation is not yet implemented.
    // When implemented, this will: for each digit 1–9, enumerate all
    // legal placements of that digit (one per row, one per col, one per box)
    // using a backtracking search over the candidate mask; then overlay all
    // found patterns and report cells present in ALL (→ place) or NONE
    // (→ eliminate).  The key soundness guarantee: all patterns are
    // generated from the current candidate grid, so any deduction is valid
    // regardless of which pattern is the true solution.
    return null;
  },
};

// ─── 9500 Templates ──────────────────────────────────────────────────────────

/**
 * Templates (Bowman's Bingo variant): similar to POM but uses a compressed
 * "template" representation — for each digit, maintain the set of all valid
 * digit patterns as bitmasks.  When placing/eliminating any candidate,
 * propagate constraints to prune incompatible templates.  A candidate is
 * eliminated if it appears in NO template; placed if it appears in ALL.
 *
 * Templates extend POM by maintaining the template set across multiple
 * deduction steps (the template set shrinks as the puzzle is solved),
 * making it more powerful in practice.
 *
 * Red-line: template enumeration; last-resort only.
 */
export const templates: Strategy = {
  id: 'templates',
  name: { zh: '模板法', en: 'Templates' },
  difficulty: 9500,
  tieBreak: ['digit', 'cell-index'],

  apply(_grid: Grid): Step | null {
    // Stub: full Templates implementation is not yet implemented.
    // When implemented, this will: for each digit, enumerate all legal
    // templates (bitmask over 81 cells) that are consistent with the
    // current grid; find the AND of all templates (bits set in ALL →
    // placement) and the NOT of OR of all templates (bits clear in ALL
    // → elimination); emit any deductions found.
    return null;
  },
};

// ─── 9600 GEM (Graded Equivalence Marks / Braid Analysis) ────────────────────

/**
 * GEM — Graded Equivalence Marks (also known as Braid Analysis or
 * Graded Equivalence Marks by David Bremner):
 *
 * Assigns one of three marks to each candidate: True (T), False (F), or
 * Bivalent (B, meaning it could be either).  Starting from a set of
 * "graded" initial assumptions, propagate implications through all strong
 * and weak links until marks stabilise.  Any candidate marked T in all
 * grade-0 extensions is true; marked F in all is false.
 *
 * GEM is more powerful than standard coloring (simple-coloring, 3D Medusa)
 * because it uses a three-valued logic (T/F/B) and propagates globally.
 * It sits just below full forcing nets in power.
 *
 * Red-line: near-enumeration with three-valued propagation; last-resort only.
 */
export const gem: Strategy = {
  id: 'gem',
  name: { zh: 'GEM等价标记法', en: 'GEM (Graded Equivalence Marks)' },
  difficulty: 9600,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    // Stub: full GEM implementation is not yet implemented.
    // When implemented, this will: assign initial T/F/B marks to candidates
    // based on bivalue cells and conjugate pairs; propagate marks through
    // the strong/weak link graph using three-valued inference rules;
    // report any candidate where all possible mark-consistent extensions
    // agree on T (→ place) or F (→ eliminate).
    return null;
  },
};
