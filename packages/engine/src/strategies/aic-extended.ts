/**
 * AIC with exotic nodes — ALS and UR chain extensions (E8).
 *
 * Extends the shared link graph with Almost Locked Set and Unique Rectangle nodes,
 * then reuses searchAic / searchNiceLoop from chain/.
 */

import { ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { solveBruteforce } from '../bruteforce.js';
import {
  buildLinkGraph,
  nodeKey,
  chainToLinks,
  type LinkGraph,
  type Chain,
} from '../chain/graph.js';
import type { AicResult } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';
import type { LinkType } from '../trace.js';
import { findAllALS } from './als.js';
import { allRectangles } from './ur-engine.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

function cloneGraph(graph: LinkGraph): LinkGraph {
  return {
    nodes: graph.nodes.map((n) => ({ ...n, cells: [...n.cells] })),
    adjacency: graph.adjacency.map((edges) => edges.map((e) => ({ ...e }))),
    indexOfKey: new Map(graph.indexOfKey),
  };
}

function ensureNode(graph: LinkGraph, digit: number, cells: number[]): number {
  const key = nodeKey(digit, cells);
  let idx = graph.indexOfKey.get(key);
  if (idx === undefined) {
    idx = graph.nodes.length;
    graph.nodes.push({ digit, cells: [...cells].sort((a, b) => a - b), key });
    graph.indexOfKey.set(key, idx);
    graph.adjacency.push([]);
  }
  return idx;
}

function addEdge(graph: LinkGraph, i: number, j: number, type: LinkType, seen: Set<string>): void {
  if (i === j) return;
  const k = `${Math.min(i, j)}|${Math.max(i, j)}|${type}`;
  if (seen.has(k)) return;
  seen.add(k);
  graph.adjacency[i]!.push({ to: j, type });
  graph.adjacency[j]!.push({ to: i, type });
}

/** ALS node: weak entry removes extra digit; strong exit on locked digits (N=2, 3 digits). */
function extendGraphWithAls(grid: Grid, graph: LinkGraph, exoticEdges: Set<string>): void {
  const seen = new Set<string>();
  for (const als of findAllALS(grid)) {
    if (als.cells.length !== 2) continue;
    const sortedCells = [...als.cells].sort((a, b) => a - b);

    for (const extra of als.digits) {
      const extraBit = maskOf(extra);
      const cellsWithExtra = sortedCells.filter((c) => grid.candidatesOf(c) & extraBit);
      if (cellsWithExtra.length === 0) continue;

      let lockedMask = 0;
      for (const c of sortedCells) {
        lockedMask |= grid.candidatesOf(c) & ~extraBit;
      }
      if (popcount(lockedMask) !== 2) continue;

      const lockedDigits = digitsOf(lockedMask);
      for (const c of cellsWithExtra) {
        const extraIdx = ensureNode(graph, extra, [c]);
        for (const locked of lockedDigits) {
          if (!(grid.candidatesOf(sortedCells[0]!) & maskOf(locked))) continue;
          if (!(grid.candidatesOf(sortedCells[1]!) & maskOf(locked))) continue;
          const lockedIdx = ensureNode(graph, locked, sortedCells);
          addEdge(graph, extraIdx, lockedIdx, 'strong', seen);
          exoticEdges.add(`${graph.nodes[extraIdx]!.key}|${graph.nodes[lockedIdx]!.key}|strong`);
        }
      }
    }
  }
}

interface UrLink {
  entryCell: number;
  entryDigit: number;
  exitCell: number;
  exitDigit: number;
}

function pushUrLink(
  links: UrLink[],
  seen: Set<string>,
  entryCell: number,
  entryDigit: number,
  exitCell: number,
  exitDigit: number,
): void {
  const key = `${entryCell}:${entryDigit}->${exitCell}:${exitDigit}`;
  if (seen.has(key)) return;
  seen.add(key);
  links.push({ entryCell, entryDigit, exitCell, exitDigit });
}

/**
 * UR-as-chain-node links (uniqueness): ¬(extra@entry) ⇒ (extra@exit).
 * Supports diagonal-extra and same-side-floor layouts (SudokuWiki AIC-UR).
 */
function findUrLinks(grid: Grid): UrLink[] {
  const links: UrLink[] = [];
  const seen = new Set<string>();

  for (const corners of allRectangles()) {
    const [c11, c12, c21, c22] = corners;
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const otherCornersBare = (entry: number, exit: number): boolean => {
      for (const c of cells) {
        if (c === entry || c === exit) continue;
        if (grid.get(c) !== 0) return false;
        if (grid.candidatesOf(c) !== intersect) return false;
      }
      return true;
    };

    const tryPair = (entry: number, exit: number): void => {
      if (grid.get(entry) !== 0 || grid.get(exit) !== 0) return;
      if (!otherCornersBare(entry, exit)) return;
      const entryMask = grid.candidatesOf(entry);
      const exitMask = grid.candidatesOf(exit);
      const entryExtras = entryMask & ~intersect;
      const exitExtras = exitMask & ~intersect;
      if (entryExtras === 0 || exitExtras === 0) return;

      for (const eIn of digitsOf(entryExtras)) {
        if ((entryMask & ~maskOf(eIn)) !== intersect) continue;
        for (const eOut of digitsOf(exitExtras)) {
          pushUrLink(links, seen, entry, eIn, exit, eOut);
        }
      }
    };

    // Diagonal threat: ¬(extra@c11) ⇒ (extra@c22) and symmetric.
    tryPair(c11, c22);
    tryPair(c22, c11);
    tryPair(c12, c21);
    tryPair(c21, c12);

    // Same-side floors: opposite roofs contain the UR pair (Example B: r4c4/r7c4 + r4c6/r7c6).
    const roof03 = (masks[0]! & intersect) === intersect && (masks[2]! & intersect) === intersect;
    const roof14 = (masks[1]! & intersect) === intersect && (masks[3]! & intersect) === intersect;
    if (roof03) {
      tryPair(c12, c22);
      tryPair(c22, c12);
    }
    if (roof14) {
      tryPair(c11, c21);
      tryPair(c21, c11);
    }
  }

  return links;
}

function extendGraphWithUr(grid: Grid, graph: LinkGraph, exoticEdges: Set<string>): void {
  const seen = new Set<string>();
  for (const link of findUrLinks(grid)) {
    const entryIdx = ensureNode(graph, link.entryDigit, [link.entryCell]);
    const exitIdx = ensureNode(graph, link.exitDigit, [link.exitCell]);
    addEdge(graph, entryIdx, exitIdx, 'strong', seen);
    exoticEdges.add(`${graph.nodes[entryIdx]!.key}|${graph.nodes[exitIdx]!.key}|strong`);
  }
}

function isSound(grid: Grid, step: Step, solution: string | null): boolean {
  if (!solution) return false;
  for (const p of step.placements) {
    if (Number(solution[p.cell]) !== p.digit) return false;
  }
  for (const e of step.eliminations) {
    if (Number(solution[e.cell]) === e.digit) return false;
  }
  return true;
}

function stepRank(step: Step): string {
  const p = step.placements.map((x) => `${x.cell}:${x.digit}`).sort().join(',');
  const e = step.eliminations.map((x) => `${x.cell}:${x.digit}`).sort().join(',');
  // Prefer placements (Nice Loop Rule 2) over mere eliminations.
  return `${p ? '0' : '1'}:${p}|${e}`;
}

// ---- Multi-result search (collect sound steps, pick canonical) ----

function tryLoopCloseAll(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
  closingType: LinkType,
  startIdx: number,
  kinds: readonly AicResult['kind'][],
  out: AicResult[],
): void {
  if (chain.length < 3) return;
  const firstLink = chain[1]!.incoming;
  if (firstLink === null) return;

  const loopNodeIdxs = chain.map((s) => s.node);
  const start = graph.nodes[startIdx]!;
  const startCell = start.cells[0]!;
  const startDigit = start.digit;
  const fullLoop: Chain = [...chain, { node: startIdx, incoming: closingType }];

  if (firstLink === closingType && firstLink === 'strong') {
    if (!grid.hasCandidate(startCell, startDigit)) return;
    const res: AicResult = {
      eliminations: [],
      placements: [{ cell: startCell, digit: startDigit }],
      links: chainToLinks(graph, fullLoop),
      chainNodes: loopNodeIdxs,
      kind: 'discontinuous-loop',
      startNode: startIdx,
      endNode: startIdx,
    };
    if (kinds.includes(res.kind)) out.push(res);
    return;
  }

  if (firstLink === closingType && firstLink === 'weak') {
    if (!grid.hasCandidate(startCell, startDigit)) return;
    const res: AicResult = {
      eliminations: [{ cell: startCell, digit: startDigit }],
      placements: [],
      links: chainToLinks(graph, fullLoop),
      chainNodes: loopNodeIdxs,
      kind: 'discontinuous-loop',
      startNode: startIdx,
      endNode: startIdx,
    };
    if (kinds.includes(res.kind)) out.push(res);
  }
}

function searchAllNiceLoops(
  grid: Grid,
  graph: LinkGraph,
  policy: ChainPolicy,
  kinds: readonly AicResult['kind'][],
): AicResult[] {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;
  const out: AicResult[] = [];

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
      if (item.chain.length >= 3) {
        for (const edge of graph.adjacency[item.node]!) {
          if (edge.type !== item.nextType) continue;
          if (edge.to === s && item.node !== s) {
            tryLoopCloseAll(grid, graph, item.chain, edge.type, s, kinds, out);
          }
        }
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (edge.to === s) continue;
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
  return out;
}

function searchAllAic(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult[] {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;
  const out: AicResult[] = [];

  function tryEndpoints(chain: Chain): void {
    if (chain.length < 2) return;
    const startIdx = chain[0]!.node;
    const endIdx = chain[chain.length - 1]!.node;
    if (startIdx === endIdx) return;
    const A = graph.nodes[startIdx]!;
    const B = graph.nodes[endIdx]!;

    if (A.digit === B.digit) {
      const digit = A.digit;
      const bit = maskOf(digit);
      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        if (A.cells.includes(c) || B.cells.includes(c)) continue;
        const okA = A.cells.every((ac) => ac === c || PEERS_OF[c]!.includes(ac));
        const okB = B.cells.every((bc) => bc === c || PEERS_OF[c]!.includes(bc));
        if (okA && okB) elims.push({ cell: c, digit });
      }
      if (elims.length > 0) {
        out.push({
          eliminations: elims,
          placements: [],
          links: chainToLinks(graph, chain),
          chainNodes: chain.map((s) => s.node),
          kind: 'type1',
          startNode: startIdx,
          endNode: endIdx,
        });
      }
      return;
    }

    if (A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0]) {
      const cell = A.cells[0]!;
      const keep = maskOf(A.digit) | maskOf(B.digit);
      const elims: { cell: number; digit: number }[] = [];
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        if ((keep & maskOf(d)) !== 0) continue;
        elims.push({ cell, digit: d });
      }
      if (elims.length > 0) {
        out.push({
          eliminations: elims,
          placements: [],
          links: chainToLinks(graph, chain),
          chainNodes: chain.map((s) => s.node),
          kind: 'type2',
          startNode: startIdx,
          endNode: endIdx,
        });
      }
    }
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
      const last = item.chain[item.chain.length - 1]!;
      if (item.chain.length >= 2 && last.incoming === 'strong') {
        tryEndpoints(item.chain);
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
  return out;
}

function usesExoticEdge(result: AicResult, exoticEdges: Set<string>): boolean {
  for (const link of result.links) {
    if (link.type !== 'strong') continue;
    const fromKey = nodeKey(link.from.digit, link.fromCells ?? [link.from.cell]);
    const toKey = nodeKey(link.to.digit, link.toCells ?? [link.to.cell]);
    if (exoticEdges.has(`${fromKey}|${toKey}|strong`) || exoticEdges.has(`${toKey}|${fromKey}|strong`)) {
      return true;
    }
  }
  return false;
}

function highlightsFromResult(graph: LinkGraph, result: AicResult): Step['highlights'] {
  return {
    cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
    candidates: result.chainNodes.flatMap((i) =>
      graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
    ),
    links: result.links,
  };
}

function niceLoopExplanation(
  result: AicResult,
  graph: LinkGraph,
  nodeKind: 'ALS' | 'UR',
): { zh: string; en: string } {
  const start = graph.nodes[result.startNode]!;
  const cell = start.cells[0]!;
  const digit = start.digit;
  const tag = nodeKind === 'ALS' ? 'ALS' : 'UR';

  if (result.placements.length > 0) {
    const p = result.placements[0]!;
    return {
      zh: `含${tag}节点的不连续 Nice 环（Rule 2）：${candidateLabel(cell, digit)} 两端强链，落子 ${cellLabel(p.cell)}=${p.digit}。`,
      en: `Discontinuous Nice Loop with ${tag} node (Rule 2): two strong links at ${candidateLabel(cell, digit)}; place ${cellLabel(p.cell)}=${p.digit}.`,
    };
  }
  const elims = result.eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(', ');
  return {
    zh: `含${tag}节点的不连续 Nice 环（Rule 3）：${candidateLabel(cell, digit)} 两端弱链，消去 ${elims}。`,
    en: `Discontinuous Nice Loop with ${tag} node (Rule 3): two weak links at ${candidateLabel(cell, digit)}; eliminate ${elims}.`,
  };
}

function aicExplanation(result: AicResult, graph: LinkGraph, nodeKind: 'ALS' | 'UR'): { zh: string; en: string } {
  const start = graph.nodes[result.startNode]!;
  const end = graph.nodes[result.endNode]!;
  const tag = nodeKind === 'ALS' ? 'ALS' : 'UR';
  const sameDigit = start.digit === end.digit;
  const elims = result.eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(', ');
  return {
    zh: `含${tag}节点的交替推理链（${sameDigit ? 'Type 1' : 'Type 2'}）：${candidateLabel(start.cells[0]!, start.digit)} 到 ${candidateLabel(end.cells[0]!, end.digit)}；消去 ${elims}。`,
    en: `AIC with ${tag} node (${sameDigit ? 'Type 1' : 'Type 2'}): ${candidateLabel(start.cells[0]!, start.digit)} to ${candidateLabel(end.cells[0]!, end.digit)}; eliminate ${elims}.`,
  };
}

function resultToStep(
  strategyId: string,
  grid: Grid,
  result: AicResult,
  graph: LinkGraph,
  nodeKind: 'ALS' | 'UR',
): Step | null {
  const eliminations = result.eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
  if (eliminations.length === 0) return null;

  const explanation =
    result.kind === 'type1' || result.kind === 'type2'
      ? aicExplanation(result, graph, nodeKind)
      : niceLoopExplanation(result, graph, nodeKind);

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: highlightsFromResult(graph, result),
    explanation,
  };
}

function searchBestExtended(
  grid: Grid,
  strategyId: string,
  extend: (g: Grid, graph: LinkGraph, exoticEdges: Set<string>) => void,
  nodeKind: 'ALS' | 'UR',
  policy: ChainPolicy = DEFAULT_CHAIN_POLICY,
): Step | null {
  const graph = cloneGraph(buildLinkGraph(grid, { grouped: true }));
  const exoticEdges = new Set<string>();
  extend(grid, graph, exoticEdges);
  if (exoticEdges.size === 0) return null;

  const solution = solveBruteforce(grid.toString());
  const candidates: Step[] = [];

  const ingest = (result: AicResult | null): void => {
    if (!result) return;
    if (!usesExoticEdge(result, exoticEdges)) return;
    const step = resultToStep(strategyId, grid, result, graph, nodeKind);
    if (step && isSound(grid, step, solution)) candidates.push(step);
  };

  for (const kind of ['discontinuous-loop', 'continuous-loop'] as const) {
    for (const result of searchAllNiceLoops(grid, graph, policy, [kind])) {
      ingest(result);
    }
  }

  for (const result of searchAllAic(grid, graph, policy)) {
    ingest(result);
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => stepRank(a).localeCompare(stepRank(b)));
  return candidates[0]!;
}

function makeExtendedStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  extend: (g: Grid, graph: LinkGraph, exoticEdges: Set<string>) => void,
  nodeKind: 'ALS' | 'UR',
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak: ['chain-length', 'digit'],

    apply(grid: Grid): Step | null {
      return searchBestExtended(grid, id, extend, nodeKind);
    },
  };
}

export const aicWithAls: Strategy = makeExtendedStrategy(
  'aic-with-als',
  { zh: '含 ALS 节点的交替推理链', en: 'AIC with ALS Node' },
  760,
  extendGraphWithAls,
  'ALS',
);

export const aicWithUr: Strategy = makeExtendedStrategy(
  'aic-with-ur',
  { zh: '含唯一矩形节点的交替推理链', en: 'AIC with Unique Rectangle Node' },
  770,
  extendGraphWithUr,
  'UR',
);

/** Variant id for Example B (same engine, distinct strategyId for trace). */
export const aicWithUrB: Strategy = {
  ...aicWithUr,
  id: 'aic-with-ur-b',
  apply(grid: Grid): Step | null {
    return searchBestExtended(grid, 'aic-with-ur-b', extendGraphWithUr, 'UR');
  },
};