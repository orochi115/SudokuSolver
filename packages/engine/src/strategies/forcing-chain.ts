/**
 * Forcing Chains (T4, last resort) — 强制链.
 *
 * Bounded two-branch forcing over the same strong/weak link graph used by AIC.
 * This avoids full forcing nets: each premise has exactly two alternatives, and
 * each alternative is propagated as a non-branching implication fixpoint.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, nodeKey, type LinkGraph } from '../chain/graph.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

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

function propagate(graph: LinkGraph, start: number, maxChainLength: number): Map<number, boolean> | null {
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

function consequences(graph: LinkGraph, state: Map<number, boolean>): { trues: Set<string>; falses: Set<string> } {
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

function makeStep(
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
      zh: `强制链：${zhWhat}`,
      en: `Forcing chain: ${enWhat}`,
    },
  };
}

function forceFromTwo(
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
      return makeStep(strategyId, grid, premiseCells, [{ cell: node.cells[0]!, digit: node.digit }], [], description.zh, description.en);
    }
  }

  if (second === null && first !== null) {
    const node = graph.nodes[firstNode]!;
    if (node.cells.length === 1) {
      return makeStep(strategyId, grid, premiseCells, [{ cell: node.cells[0]!, digit: node.digit }], [], description.zh, description.en);
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
    return makeStep(strategyId, grid, premiseCells, [placements[0]!], [], description.zh, description.en);
  }
  if (eliminations.length > 0) {
    return makeStep(strategyId, grid, premiseCells, [], eliminations, description.zh, description.en);
  }
  return null;
}

function contradictionFromAssumption(grid: Grid, cell: number, digit: number, maxChainLength: number): boolean {
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

function tryBoundedContradiction(grid: Grid, maxChainLength: number): Step | null {
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) < 2) continue;
    for (const digit of digitsOf(grid.candidatesOf(cell))) {
      if (!contradictionFromAssumption(grid, cell, digit, maxChainLength)) continue;
      return makeStep(
        'forcing-chain',
        grid,
        [cell],
        [],
        [{ cell, digit }],
        `假设 ${cellLabel(cell)}=${digit} 会在有限传播中造成矛盾；消去该候选。`,
        `assuming ${cellLabel(cell)}=${digit} reaches a contradiction within bounded propagation; eliminate that candidate.`,
      );
    }
  }
  return null;
}

export function makeForcingChain(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'forcing-chain',
    name: { zh: '强制链', en: 'Forcing Chain' },
    difficulty: 100,

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: false });
      const nodeIndex = (cell: number, digit: number): number | undefined => graph.indexOfKey.get(nodeKey(digit, [cell]));
      let graphStep: Step | null = null;

      if (policy.allowCellForcing) {
        for (let cell = 0; cell < CELLS && !graphStep; cell++) {
          if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) !== 2) continue;
          const [firstDigit, secondDigit] = digitsOf(grid.candidatesOf(cell)) as [number, number];
          const firstNode = nodeIndex(cell, firstDigit);
          const secondNode = nodeIndex(cell, secondDigit);
          if (firstNode === undefined || secondNode === undefined) continue;

          const step = forceFromTwo(this.id, grid, graph, firstNode, secondNode, [cell], policy, {
            zh: `双值格 ${cellLabel(cell)}{${firstDigit},${secondDigit}} 的两种取值分别推演，得到共同结论。`,
            en: `both values of bivalue cell ${cellLabel(cell)}{${firstDigit},${secondDigit}} lead to the same conclusion.`,
          });
          if (step) graphStep = step;
        }
      }

      if (policy.allowDigitForcing && !graphStep) {
        for (const house of HOUSES) {
          for (let digit = 1; digit <= 9 && !graphStep; digit++) {
            const bit = maskOf(digit);
            const positions = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
            if (positions.length !== 2) continue;
            const [firstCell, secondCell] = positions as [number, number];
            const firstNode = nodeIndex(firstCell, digit);
            const secondNode = nodeIndex(secondCell, digit);
            if (firstNode === undefined || secondNode === undefined) continue;

            const step = forceFromTwo(this.id, grid, graph, firstNode, secondNode, [firstCell, secondCell], policy, {
              zh: `数字 ${digit} 在房屋中的两个落点 ${cellLabel(firstCell)}、${cellLabel(secondCell)} 分别推演，得到共同结论。`,
              en: `the two spots of digit ${digit} (${cellLabel(firstCell)}, ${cellLabel(secondCell)}) lead to the same conclusion.`,
            });
            if (step) graphStep = step;
          }
        }
      }

      const contradictionStep = tryBoundedContradiction(grid, policy.maxChainLength * 4);
      if (!graphStep) return contradictionStep;
      if (
        contradictionStep?.eliminations.length === 1 &&
        graphStep.eliminations.length === 1 &&
        contradictionStep.eliminations[0]!.digit === graphStep.eliminations[0]!.digit
      ) {
        return contradictionStep;
      }
      return graphStep;
    },
  };
}

export const forcingChain: Strategy = makeForcingChain();
