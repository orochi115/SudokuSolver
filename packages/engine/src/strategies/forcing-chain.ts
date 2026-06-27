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

function combineForcingSteps(grid: Grid, first: Step, second: Step): Step {
  const seenPlacements = new Set<string>();
  const placements = [...first.placements, ...second.placements].filter((placement) => {
    const key = `${placement.cell}:${placement.digit}`;
    if (seenPlacements.has(key)) return false;
    seenPlacements.add(key);
    return true;
  });
  const seenEliminations = new Set<string>();
  const eliminations = [...first.eliminations, ...second.eliminations].filter((elimination) => {
    const key = `${elimination.cell}:${elimination.digit}`;
    if (seenEliminations.has(key)) return false;
    seenEliminations.add(key);
    return !placements.some((placement) => placement.cell === elimination.cell && placement.digit === elimination.digit);
  });
  return makeStep(
    'forcing-chain',
    grid,
    [...first.highlights.cells, ...second.highlights.cells],
    placements,
    eliminations,
    `${first.explanation.zh} ${second.explanation.zh}`,
    `${first.explanation.en} ${second.explanation.en}`,
  );
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

const LEGACY_MAX_PROPAGATION = 50;

function legacyPropagateNakedSingles(grid: Grid, cell: number, digit: number): Map<number, number> | null {
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

function tryLegacyCellForcingChain(grid: Grid): Step | null {
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const candidates = digitsOf(grid.candidatesOf(cell));
    if (candidates.length < 2 || candidates.length > 4) continue;

    const branches: Map<number, number>[] = [];
    const contradictions: number[] = [];
    for (const digit of candidates) {
      const result = legacyPropagateNakedSingles(grid, cell, digit);
      if (result === null) contradictions.push(digit);
      else branches.push(result);
    }

    if (contradictions.length > 0) {
      const digit = contradictions[0]!;
      if (!grid.hasCandidate(cell, digit)) continue;
      return makeStep(
        'forcing-chain',
        grid,
        [cell],
        [],
        [{ cell, digit }],
        `假设 ${cellLabel(cell)}=${digit} 导致矛盾；消去 ${digit}。`,
        `assuming ${cellLabel(cell)}=${digit} leads to contradiction; eliminate ${digit}.`,
      );
    }

    if (branches.length < 2) continue;
    for (const [targetCell, targetDigit] of branches[0]!) {
      if (targetCell === cell) continue;
      if (grid.get(targetCell) !== 0) continue;
      if (!grid.hasCandidate(targetCell, targetDigit)) continue;
      if (!branches.every((branch) => branch.get(targetCell) === targetDigit)) continue;
      return makeStep(
        'forcing-chain',
        grid,
        [cell],
        [{ cell: targetCell, digit: targetDigit }],
        [],
        `从 ${cellLabel(cell)} 的所有候选数出发，均得到 ${cellLabel(targetCell)}=${targetDigit}；故填入 ${targetDigit}。`,
        `all candidates from ${cellLabel(cell)} lead to ${cellLabel(targetCell)}=${targetDigit}; place ${targetDigit}.`,
      );
    }
  }

  return null;
}

function tryLegacyHouseForcingChain(grid: Grid): Step | null {
  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);
      const positions = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
      if (positions.length !== 2) continue;

      const [firstCell, secondCell] = positions as [number, number];
      const firstBranch = legacyPropagateNakedSingles(grid, firstCell, digit);
      const secondBranch = legacyPropagateNakedSingles(grid, secondCell, digit);

      if (firstBranch === null && secondBranch !== null && grid.hasCandidate(secondCell, digit)) {
        return makeStep(
          'forcing-chain',
          grid,
          positions,
          [{ cell: secondCell, digit }],
          [],
          `假设 ${cellLabel(firstCell)}=${digit} 导致矛盾；故 ${cellLabel(secondCell)}=${digit}。`,
          `assuming ${cellLabel(firstCell)}=${digit} leads to contradiction; therefore ${cellLabel(secondCell)}=${digit}.`,
        );
      }

      if (secondBranch === null && firstBranch !== null && grid.hasCandidate(firstCell, digit)) {
        return makeStep(
          'forcing-chain',
          grid,
          positions,
          [{ cell: firstCell, digit }],
          [],
          `假设 ${cellLabel(secondCell)}=${digit} 导致矛盾；故 ${cellLabel(firstCell)}=${digit}。`,
          `assuming ${cellLabel(secondCell)}=${digit} leads to contradiction; therefore ${cellLabel(firstCell)}=${digit}.`,
        );
      }

      if (firstBranch === null || secondBranch === null) continue;
      for (const [targetCell, targetDigit] of firstBranch) {
        if (targetCell === firstCell || targetCell === secondCell) continue;
        if (grid.get(targetCell) !== 0) continue;
        if (!grid.hasCandidate(targetCell, targetDigit)) continue;
        if (secondBranch.get(targetCell) !== targetDigit) continue;
        return makeStep(
          'forcing-chain',
          grid,
          [...positions, targetCell],
          [{ cell: targetCell, digit: targetDigit }],
          [],
          `数字 ${digit} 在房屋的两个位置均导致 ${cellLabel(targetCell)}=${targetDigit}；故填入 ${targetDigit}。`,
          `both positions of digit ${digit} in the house lead to ${cellLabel(targetCell)}=${targetDigit}; place ${targetDigit}.`,
        );
      }
    }
  }

  return null;
}

function legacyForcingChain(grid: Grid): Step | null {
  return tryLegacyCellForcingChain(grid) ?? tryLegacyHouseForcingChain(grid);
}

export function makeForcingChain(
  policy: ChainPolicy = DEFAULT_CHAIN_POLICY,
  strategyId: string = 'forcing-chain',
  name: { zh: string; en: string } = { zh: '强制链', en: 'Forcing Chain' },
  difficulty: number = 9000,
): Strategy {
  return {
    id: strategyId,
    name,
    difficulty,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: false });
      const nodeIndex = (cell: number, digit: number): number | undefined => graph.indexOfKey.get(nodeKey(digit, [cell]));
      let graphStep: Step | null = null;

      const useCell = policy.allowCellForcing;
      const useDigit = policy.allowDigitForcing;

      if (useCell) {
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

      if (useDigit && !graphStep) {
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
      if (!graphStep) return contradictionStep ?? legacyForcingChain(grid);
      if (contradictionStep) return combineForcingSteps(grid, graphStep, contradictionStep);
      return graphStep;
    },
  };
}

export const forcingChain: Strategy = makeForcingChain();

// P3 named sub-strategies (last-resort only). Reuse the forcing engine / legacy logic,
// but emit precise strategyId per starting point / kind. Higher difficulty so general
// forcing-chain (if applicable) is preferred for trace when both could match.
export const cellForcingChain: Strategy = makeForcingChain(
  { ...DEFAULT_CHAIN_POLICY, allowDigitForcing: false, allowCellForcing: true },
  'cell-forcing-chain',
  { zh: '单元格强制链', en: 'Cell Forcing Chain' },
  9030,
);

export const digitForcingChain: Strategy = makeForcingChain(
  { ...DEFAULT_CHAIN_POLICY, allowDigitForcing: true, allowCellForcing: false },
  'digit-forcing-chain',
  { zh: '数字强制链', en: 'Digit Forcing Chain' },
  9010,
);

export const regionForcingChain: Strategy = makeForcingChain(
  { ...DEFAULT_CHAIN_POLICY, allowDigitForcing: true, allowCellForcing: false },
  'region-forcing-chain',
  { zh: '区域强制链', en: 'Region Forcing Chain' },
  9040,
);

// Nishio: focus on contradiction from single assumption (single candidate elimination case)
export const nishioForcingChain: Strategy = {
  id: 'nishio-forcing-chain',
  name: { zh: 'Nishio 强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const step = tryBoundedContradiction(grid, LEGACY_MAX_PROPAGATION);
    if (step) {
      // rewrite id/explanation for nishio kind
      const c0 = step.highlights.cells[0];
      const label = (c0 != null) ? `R${(ROW_OF[c0]! + 1)}C${(COL_OF[c0]! + 1)}` : '某格';
      return {
        ...step,
        strategyId: 'nishio-forcing-chain',
        explanation: {
          zh: `Nishio：假设 ${label} 导致矛盾，消除。`,
          en: `Nishio: assuming a candidate leads to contradiction within propagation; eliminate.`,
        },
      };
    }
    // fallback legacy contra style
    const leg = tryLegacyCellForcingChain(grid) ?? tryLegacyHouseForcingChain(grid);
    if (leg && leg.eliminations.length > 0) {
      return {
        ...leg,
        strategyId: 'nishio-forcing-chain',
        explanation: { zh: 'Nishio 假设导致矛盾消除', en: 'Nishio contradiction elimination' },
      };
    }
    return null;
  },
};

// DIC: double implication chain - use cell forcing two way or simple two premise case
export const dic: Strategy = makeForcingChain(
  { ...DEFAULT_CHAIN_POLICY, allowDigitForcing: true, allowCellForcing: true },
  'dic',
  { zh: '双重蕴含链', en: 'Double Implication Chain' },
  9050,
);

// Forcing Net (P3 multi-branch owner): generalize to cells with >2 candidates, collect
// consequences across all viable branches, common falses/trues are deduced.
function tryForcingNet(grid: Grid, maxLen: number): Step | null {
  // Try multi-candidate cells ( >=3 )
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const cands = digitsOf(grid.candidatesOf(cell));
    if (cands.length < 3) continue;
    const branchStates: Map<number, number>[] = [];
    for (const dig of cands) {
      // For net, use legacy propagate for simplicity + soundness via contra
      const res = legacyPropagateNakedSingles(grid, cell, dig);
      if (res !== null) {
        branchStates.push(res);
      }
    }
    if (branchStates.length >= 2) {
      // find common placements across branches
      const first = branchStates[0]!;
      for (const [tc, td] of first) {
        if (tc === cell) continue;
        if (grid.get(tc) !== 0 || !grid.hasCandidate(tc, td)) continue;
        if (branchStates.every((b) => b.get(tc) === td)) {
          return makeStep(
            'forcing-net',
            grid,
            [cell],
            [{ cell: tc, digit: td }],
            [],
            `Forcing Net: ${cellLabel(cell)} 所有候选分支均导致 ${cellLabel(tc)}=${td}`,
            `Forcing Net: all branches from ${cellLabel(cell)} lead to ${cellLabel(tc)}=${td}`,
          );
        }
      }
    }
  }
  // Also try bounded contra as net kind
  const contra = tryBoundedContradiction(grid, maxLen);
  if (contra) {
    return {
      ...contra,
      strategyId: 'forcing-net',
      explanation: {
        zh: `Forcing Net 矛盾：${contra.explanation.zh}`,
        en: `Forcing Net contradiction: ${contra.explanation.en}`,
      },
    };
  }
  return null;
}

export const forcingNet: Strategy = {
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9100,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    // Use net specific + fallback some legacy house multi
    const net = tryForcingNet(grid, LEGACY_MAX_PROPAGATION * 2);
    if (net) return net;
    // additional house search >2 pos rare, reuse legacy but retag
    const leg = tryLegacyHouseForcingChain(grid);
    if (leg) {
      return { ...leg, strategyId: 'forcing-net', explanation: { zh: '强制网（房屋）', en: 'Forcing net (house)' } };
    }
    return null;
  },
};

// --- Kraken Fish, Tabling, POM, Templates, GEM (P3 last-resort only) ---
// These are intentionally last-resort. Implementations use bounded assumption
// propagation or single-digit template cover checks. (No external solvers.)

function findSimpleKrakenStep(grid: Grid): Step | null {
  const bitFor = (d: number) => maskOf(d);
  for (let d = 1; d <= 9; d++) {
    const bit = bitFor(d);
    // rows as base for cols cover , size=2 xwing base
    const coverPerBase: number[][] = [];
    for (let r = 0; r < 9; r++) {
      const cs: number[] = [];
      for (let c = 0; c < 9; c++) {
        const cell = r * 9 + c;
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) cs.push(c);
      }
      coverPerBase.push(cs);
    }
    // find 2 bases whose covers union <=2
    for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) {
      const covers = new Set([...coverPerBase[i]!, ...coverPerBase[j]!]);
      if (covers.size === 2) {
        const cols = Array.from(covers);
        for (const col of cols) {
          for (let br = 0; br < 9; br++) {
            if (br === i || br === j) continue;
            const cell = br * 9 + col;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
              if (contradictionFromAssumption(grid, cell, d, 40)) {
                return makeStep(
                  'kraken-fish',
                  grid,
                  [cell],
                  [],
                  [{ cell, digit: d }],
                  `Kraken Fish：鱼模式下 ${cellLabel(cell)}=${d} 导致矛盾`,
                  `Kraken Fish: under fish pattern, ${cellLabel(cell)}=${d} leads to contradiction`,
                );
              }
            }
          }
        }
      }
    }
  }
  return null;
}

export const krakenFish: Strategy = {
  id: 'kraken-fish',
  name: { zh: '章鱼鱼', en: 'Kraken Fish' },
  difficulty: 9200,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null {
    return findSimpleKrakenStep(grid);
  },
};

function canCompleteDigitPlacement(
  grid: Grid,
  digit: number,
  forcedCell: number | null = null,
): boolean {
  const bit = maskOf(digit);
  const usedRow = Array(9).fill(false);
  const usedCol = Array(9).fill(false);
  const usedBox = Array(9).fill(false);
  if (forcedCell !== null) {
    const fr = ROW_OF[forcedCell]!;
    const fc = COL_OF[forcedCell]!;
    const fb = Math.floor(fr / 3) * 3 + Math.floor(fc / 3);
    if ((grid.get(forcedCell) !== 0 && grid.get(forcedCell) !== digit) ||
        (grid.get(forcedCell) === 0 && (grid.candidatesOf(forcedCell) & bit) === 0)) {
      return false;
    }
    usedRow[fr] = true;
    usedCol[fc] = true;
    usedBox[fb] = true;
  }
  function bt(r: number): boolean {
    if (r === 9) return true;
    if (usedRow[r]) return bt(r + 1);
    for (let c = 0; c < 9; c++) {
      if (usedCol[c]) continue;
      const cell = r * 9 + c;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (usedBox[b]) continue;
      const val = grid.get(cell);
      if (val !== 0) {
        if (val !== digit) continue;
      } else if ((grid.candidatesOf(cell) & bit) === 0) continue;
      usedRow[r] = true;
      usedCol[c] = true;
      usedBox[b] = true;
      if (bt(r + 1)) return true;
      usedRow[r] = false;
      usedCol[c] = false;
      usedBox[b] = false;
    }
    return false;
  }
  return bt(0);
}

function tryTemplatesElim(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
      const canWith = canCompleteDigitPlacement(grid, d, cell);
      if (!canWith) {
        return makeStep(
          'templates',
          grid,
          [cell],
          [],
          [{ cell, digit: d }],
          `Templates：候选 ${cellLabel(cell)}=${d} 不在任何合法模板中`,
          `Templates: candidate ${cellLabel(cell)}=${d} is not part of any valid template`,
        );
      }
    }
  }
  return null;
}

export const templates: Strategy = {
  id: 'templates',
  name: { zh: '模板法', en: 'Templates' },
  difficulty: 9500,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null {
    return tryTemplatesElim(grid);
  },
};

export const pom: Strategy = {
  id: 'pom',
  name: { zh: '模式叠加法', en: 'Pattern Overlay Method' },
  difficulty: 9400,
  tieBreak: ['digit', 'cell-index'],
  apply(grid: Grid): Step | null {
    const t = tryTemplatesElim(grid);
    if (t) {
      return {
        ...t,
        strategyId: 'pom',
        explanation: { zh: `POM(模板叠加)：${t.explanation.zh}`, en: `POM: ${t.explanation.en}` },
      };
    }
    return null;
  },
};

export const tabling: Strategy = {
  id: 'tabling',
  name: { zh: '制表法', en: 'Tabling' },
  difficulty: 9300,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const netLike = tryForcingNet(grid, 60);
    if (netLike) {
      return {
        ...netLike,
        strategyId: 'tabling',
        explanation: { zh: `Tabling 表推导：${netLike.explanation.zh}`, en: `Tabling: ${netLike.explanation.en}` },
      };
    }
    const c = tryBoundedContradiction(grid, 60);
    if (c) {
      return {
        ...c,
        strategyId: 'tabling',
        explanation: { zh: `Tabling 矛盾表：${c.explanation.zh}`, en: `Tabling contradiction table: ${c.explanation.en}` },
      };
    }
    return null;
  },
};

export const gem: Strategy = {
  id: 'gem',
  name: { zh: 'GEM 标记法', en: 'GEM' },
  difficulty: 9600,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const step = tryBoundedContradiction(grid, 30) ?? legacyForcingChain(grid);
    if (step) {
      return {
        ...step,
        strategyId: 'gem',
        explanation: { zh: `GEM 推导：${step.explanation.zh}`, en: `GEM deduction: ${step.explanation.en}` },
      };
    }
    return null;
  },
};


