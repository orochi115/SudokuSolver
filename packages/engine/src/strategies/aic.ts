/**
 * AIC — Alternating Inference Chains (T4) / 交替推理链.
 *
 * Uses a shared strong/weak link graph with grouped same-digit nodes. Grouped
 * links let X-Chain/AIC traverse box-line candidate groups instead of only raw
 * single-cell conjugate pairs.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';
import { tryALSChain, findAllALS } from './als.js';
import { tryURType3 } from './uniqueness.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface CandNode {
  cell: number;
  digit: number;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

function legacyStrongNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const cands = house.filter((c) => c !== node.cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    const total = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
    if (total === 2 && cands.length === 1) neighbors.push({ cell: cands[0]!, digit: node.digit });
  }

  if (popcount(grid.candidatesOf(node.cell)) === 2) {
    for (const d of digitsOf(grid.candidatesOf(node.cell))) {
      if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
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

function legacyWeakNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const peer of PEERS_OF[node.cell]!) {
    if (grid.get(peer) === 0 && (grid.candidatesOf(peer) & bit) !== 0) neighbors.push({ cell: peer, digit: node.digit });
  }
  for (const d of digitsOf(grid.candidatesOf(node.cell))) {
    if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
  }

  const seen = new Set<number>();
  return neighbors.filter((n) => {
    const key = encodeNode(n.cell, n.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function legacyType1(grid: Grid, start: CandNode, end: CandNode, chainCells: Set<number>): { cell: number; digit: number }[] {
  if (start.digit !== end.digit || start.cell === end.cell) return [];
  return commonPeers(start.cell, end.cell).filter((c) => !chainCells.has(c) && grid.hasCandidate(c, start.digit)).map((cell) => ({ cell, digit: start.digit }));
}

function legacyType2(grid: Grid, start: CandNode, end: CandNode): { cell: number; digit: number }[] {
  if (start.digit === end.digit || start.cell !== end.cell) return [];
  const keepMask = maskOf(start.digit) | maskOf(end.digit);
  return digitsOf(grid.candidatesOf(start.cell))
    .filter((digit) => (keepMask & maskOf(digit)) === 0)
    .map((digit) => ({ cell: start.cell, digit }));
}

const LEGACY_MAX_DEPTH = 14;

interface LegacySearchState {
  path: CandNode[];
  linkAfter: ('strong' | 'weak')[];
  visited: Set<number>;
}

function legacySearchAic(grid: Grid): Step | null {
  const startNodes: CandNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if (legacyStrongNeighbors(grid, { cell: c, digit: d }).length > 0) startNodes.push({ cell: c, digit: d });
    }
  }

  for (const start of startNodes) {
    const result = legacyDfsStrong(grid, {
      path: [start],
      linkAfter: [],
      visited: new Set([encodeNode(start.cell, start.digit)]),
    }, start);
    if (result) return result;
  }
  return null;
}

function legacyDfsStrong(grid: Grid, state: LegacySearchState, current: CandNode): Step | null {
  if (state.path.length >= LEGACY_MAX_DEPTH) return null;
  for (const next of legacyStrongNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);
    if (next.cell === state.path[0]!.cell && next.digit === state.path[0]!.digit && state.path.length >= 3) {
      continue;
    }
    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('strong');

    if (state.path.length >= 3) {
      const start = state.path[0]!;
      const chainCells = new Set(state.path.map((n) => n.cell));
      const t1 = legacyType1(grid, start, next, chainCells);
      if (t1.length > 0) {
        const step = legacyBuildStep(grid, [...state.path], [...state.linkAfter], [], t1);
        state.path.pop(); state.linkAfter.pop(); state.visited.delete(key);
        return step;
      }
      const t2 = legacyType2(grid, start, next);
      if (t2.length > 0) {
        const step = legacyBuildStep(grid, [...state.path], [...state.linkAfter], [], t2);
        state.path.pop(); state.linkAfter.pop(); state.visited.delete(key);
        return step;
      }
    }

    const result = legacyDfsWeak(grid, state, next);
    state.path.pop(); state.linkAfter.pop(); state.visited.delete(key);
    if (result) return result;
  }
  return null;
}

function legacyDfsWeak(grid: Grid, state: LegacySearchState, current: CandNode): Step | null {
  if (state.path.length >= LEGACY_MAX_DEPTH) return null;
  for (const next of legacyWeakNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);
    if (next.cell === state.path[0]!.cell && next.digit === state.path[0]!.digit) continue;
    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('weak');
    const result = legacyDfsStrong(grid, state, next);
    state.path.pop(); state.linkAfter.pop(); state.visited.delete(key);
    if (result) return result;
  }
  return null;
}

function deduplicateElims(elims: { cell: number; digit: number }[]): { cell: number; digit: number }[] {
  const seen = new Set<number>();
  return elims.filter((e) => {
    const key = encodeNode(e.cell, e.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function legacyBuildStep(
  grid: Grid,
  path: CandNode[],
  linkTypes: ('strong' | 'weak')[],
  rawPlacements: { cell: number; digit: number }[],
  rawElims: { cell: number; digit: number }[],
): Step | null {
  const placements = rawPlacements.filter((p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit));
  const eliminations = deduplicateElims(rawElims.filter((e) => grid.hasCandidate(e.cell, e.digit)));
  if (placements.length === 0 && eliminations.length === 0) return null;
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
  const actionZh = placements.length > 0
    ? `填入 ${placements.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}`
    : `消去 ${eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(',')}`;
  const actionEn = placements.length > 0
    ? `place ${placements.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}`
    : `eliminate ${eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(',')}`;
  return {
    strategyId: 'aic',
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([...path.map((n) => n.cell), ...eliminations.map((e) => e.cell), ...placements.map((p) => p.cell)])],
      candidates: [...path.map((n) => ({ cell: n.cell, digit: n.digit })), ...eliminations, ...placements],
      links,
    },
    explanation: {
      zh: `交替推理链：${candidateLabel(start.cell, start.digit)} 到 ${candidateLabel(end.cell, end.digit)}，强弱交替；${actionZh}。`,
      en: `AIC: ${candidateLabel(start.cell, start.digit)} to ${candidateLabel(end.cell, end.digit)}, alternating strong/weak; ${actionEn}.`,
    },
  };
}

function legacySearchPeerEndpointAic(grid: Grid): Step | null {
  const startNodes: CandNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if (legacyStrongNeighbors(grid, { cell: c, digit: d }).length > 0) startNodes.push({ cell: c, digit: d });
    }
  }

  const maxDepth = 10;
  const path: CandNode[] = [];
  const linkAfter: ('strong' | 'weak')[] = [];
  const visited = new Set<number>();

  function dfs(current: CandNode, nextLink: 'strong' | 'weak'): Step | null {
    if (path.length >= 4 && path.length % 2 === 0) {
      const start = path[0]!;
      const end = path[path.length - 1]!;
      if (start.cell !== end.cell && start.digit !== end.digit && PEERS_OF[start.cell]!.includes(end.cell)) {
        const eliminations: { cell: number; digit: number }[] = [];
        if (grid.hasCandidate(start.cell, end.digit)) eliminations.push({ cell: start.cell, digit: end.digit });
        if (grid.hasCandidate(end.cell, start.digit)) eliminations.push({ cell: end.cell, digit: start.digit });
        if (eliminations.length > 0) return legacyBuildStep(grid, [...path], [...linkAfter], [], eliminations);
      }
    }

    if (path.length >= maxDepth) return null;
    const neighbors = nextLink === 'strong' ? legacyStrongNeighbors(grid, current) : legacyWeakNeighbors(grid, current);
    for (const next of neighbors) {
      const key = encodeNode(next.cell, next.digit);
      if (visited.has(key)) continue;
      visited.add(key);
      path.push(next);
      linkAfter.push(nextLink);
      const result = dfs(next, nextLink === 'strong' ? 'weak' : 'strong');
      path.pop();
      linkAfter.pop();
      visited.delete(key);
      if (result) return result;
    }
    return null;
  }

  for (const start of startNodes) {
    const key = encodeNode(start.cell, start.digit);
    visited.add(key);
    path.push(start);
    const result = dfs(start, 'strong');
    path.pop();
    visited.delete(key);
    if (result) return result;
  }
  return null;
}

export function makeAic(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'aic',
    name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
    difficulty: 750,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      const peerEndpoint = legacySearchPeerEndpointAic(grid);

      if (peerEndpoint) return peerEndpoint;

      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchAic(grid, graph, policy);
      if (result && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        const sameDigit = start.digit === end.digit;
        return {
          strategyId: this.id,
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
            zh: `交替推理链 AIC（${sameDigit ? 'Type 1' : 'Type 2'}）：从 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 经强弱交替链推到 ${cellLabel(end.cells[0]!)} 的 ${end.digit}；两端至少其一为真，据此可消除相应候选。`,
            en: `Alternating Inference Chain (${sameDigit ? 'Type 1' : 'Type 2'}): from ${cellLabel(start.cells[0]!)}=${start.digit} along an alternating chain to ${cellLabel(end.cells[0]!)}=${end.digit}; at least one end is true, yielding the eliminations.`,
          },
        };
      }
      return legacySearchAic(grid);
    },
  };
}

export function makeXChain(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'x-chain',
    name: { zh: 'X-Chain', en: 'X-Chain' },
    difficulty: 710,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        const graph = buildLinkGraph(grid, { digit, grouped: true });
        const result = searchAic(grid, graph, policy);
        if (result && result.eliminations.length > 0) {
          const start = graph.nodes[result.startNode]!;
          const end = graph.nodes[result.endNode]!;
          return {
            strategyId: this.id,
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
              zh: `X-Chain（单数字交替链）：数字 ${digit} 沿强弱交替链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故可见两端的格可排除 ${digit}。`,
              en: `X-Chain: digit ${digit} forms an alternating strong/weak chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
            },
          };
        }
      }
      return null;
    },
  };
}

export const xChain: Strategy = makeXChain();
export const aic: Strategy = makeAic();

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的交替推理链', en: 'AIC with ALS nodes' },
  difficulty: 760,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid);
    return tryALSChain(grid, alsList, this.id, 3, 5);
  },
};

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含 UR 节点的交替推理链', en: 'AIC with UR nodes' },
  difficulty: 770,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryURType3(grid, this.id);
  },
};
