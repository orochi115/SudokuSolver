/**
 * Chain-derived human strategies (Roadmap ② P0).
 *
 * All three strategies are PRESENTATION ALIASES over the shared chain
 * engine. They expose distinct `strategyId` labels so the trace names the
 * technique a human would recognise.
 *
 *   - `turbot-fish`  — generic 3-link (two strong + one weak) single-digit
 *                      chain. Implemented as the shortest grouped or length>2
 *                      single-digit alternating chain that yields eliminations.
 *                      Skyscraper / 2-string-kite / empty-rectangle fire first
 *                      by their own difficulty; this catches the rest.
 *
 *   - `xy-chain`    — bivalue-cell chain whose two endpoints share a free
 *                      digit Z. We restrict the BFS to single-cell bivalue
 *                      nodes, with in-cell strong links (standard XY-chain
 *                      semantics) and between-cell weak links. Different
 *                      from the general AIC: strong links must be IN-CELL,
 *                      not row/col/box conjugate pairs.
 *
 *   - `nice-loop`   — alternating chain closed onto itself (continuous or
 *                      discontinuous per Nice-Loop Rules 1/2/3). Uses
 *                      `searchNiceLoop` from `aic-search.ts`.
 *
 * Per Roadmap ② gate 6 the chain engine is shared; these strategies only
 * differ in their link graph constraint, chain shape, and trace id.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph, type ChainNode } from '../chain/graph.js';
import { searchAic, searchNiceLoop } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function boxOf(cell: number): number {
  return BOX_OF[cell]!;
}

function seesCell(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || boxOf(a) === boxOf(b);
}

/**
 * Check if a WEAK link between (c1, d) and (c2, d) is a CONJUGATE PAIR
 * (exactly two cells in the shared unit hold d). This is required for
 * the XY-Chain to be bi-directional (and thus for the standard
 * "see-both" elimination to apply). If the shared unit has more than 2
 * cells holding d, the link is "at most one" and the chain cannot be
 * read in both directions.
 */
function isConjugatePair(grid: Grid, c1: number, c2: number, digit: number): boolean {
  const bit = maskOf(digit);
  // Same row?
  if (ROW_OF[c1] === ROW_OF[c2]) {
    const row = ROWS[ROW_OF[c1]!]!;
    let count = 0;
    for (const c of row) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  // Same column?
  if (COL_OF[c1] === COL_OF[c2]) {
    const col = COLS[COL_OF[c1]!]!;
    let count = 0;
    for (const c of col) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  // Same box?
  if (BOX_OF[c1] === BOX_OF[c2]) {
    const box = BOXES[BOX_OF[c1]!]!;
    let count = 0;
    for (const c of box) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) count++;
    }
    if (count === 2) return true;
  }
  return false;
}

/**
 * Turbot Fish: shortest single-digit alternating chain that yields
 * eliminations and whose chain shape is not already claimed by the lower
 * skyscraper / 2-string-kite / empty-rectangle detectors. We restrict the
 * search to chains containing a grouped node OR length > 2 — that excludes
 * the trivial 2-node alternating pair so we don't shadow x-chain.
 */
export function makeTurbotFish(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'turbot-fish',
    name: { zh: '多宝鱼', en: 'Turbot Fish' },
    difficulty: 510,
    tieBreak: ['digit', 'chain-length'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const graph = buildLinkGraph(grid, { digit: d, grouped: true });
        const result = searchAic(grid, graph, policy);
        if (!result || result.eliminations.length === 0) continue;
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        const grouped = start.cells.length > 1 || end.cells.length > 1
          || result.chainNodes.some((i) => graph.nodes[i]!.cells.length > 1);
        if (!grouped && result.chainNodes.length <= 2) continue;
        const chainCells = result.chainNodes.flatMap((i) => graph.nodes[i]!.cells);
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: {
            cells: [...new Set([...chainCells, ...result.eliminations.map((e) => e.cell)])],
            candidates: [
              ...chainCells.map((c) => ({ cell: c, digit: d })),
              ...result.eliminations,
            ],
            links: result.links,
          },
          explanation: {
            zh: `多宝鱼（单数字强链族统一）：数字 ${d} 沿强弱交替链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}；两端至少其一为 ${d}，故可见两端的格可排除 ${d}（多宝鱼 / Turbot Fish）。`,
            en: `Turbot Fish (unified single-digit strong-link chain): digit ${d} alternates strong/weak between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; at least one end is ${d}, so cells seeing both can drop ${d}.`,
          },
        };
      }
      return null;
    },
  };
}

export const turbotFish: Strategy = makeTurbotFish();

/**
 * Build Link[] from a chain of node indices, using actual edge types.
 * The hop digit is the digit shared between the two consecutive cells.
 */
function buildChainLinksFromGraph(graph: LinkGraph, chain: readonly number[]): Link[] {
  const links: Link[] = [];
  for (let k = 1; k < chain.length; k++) {
    const a = graph.nodes[chain[k - 1]!]!;
    const b = graph.nodes[chain[k]!]!;
    const shared = (graph.adjacency[chain[k - 1]!] ?? []).find((e) => e.to === chain[k]!);
    const type: 'strong' | 'weak' = shared?.type ?? 'weak';
    const aCell = a.cells[0]!;
    const bCell = b.cells[0]!;
    if (aCell === bCell) {
      // In-cell link: link is the other digit at the cell.
      const otherDigit = a.digit === b.digit ? a.digit : (a.digit === b.digit ? a.digit : a.digit);
      // Use a.digit and b.digit as the link's `digit` for symmetry.
      const digit = a.digit;
      links.push({
        from: { cell: aCell, digit },
        to: { cell: bCell, digit: b.digit },
        type,
      });
    } else {
      // Between-cell link: hop digit is the shared digit between cells.
      const sharedMask = (a.digit & b.digit);
      const hopD = (a.digit === b.digit) ? a.digit : a.digit;
      links.push({
        from: { cell: aCell, digit: hopD },
        to: { cell: bCell, digit: hopD },
        type,
      });
      void sharedMask;
    }
  }
  return links;
}

/**
 * BFS for an XY-Chain starting at a bivalue node.
 *
 * The chain alternates:
 *   - WEAK link: between two different bivalue cells on the SAME digit
 *     (the two cells peer each other).
 *   - STRONG link: IN-CELL of a bivalue cell (the two digits of that cell).
 *
 * We do NOT use row/col/box conjugate-pair strong links — those are not
 * standard XY-chain semantics.
 *
 * Endpoint: a different bivalue cell (single-cell node) on the START digit.
 * The chain forces an alternation T, F, T, F, ...; both endpoints are on
 * digit Z. The standard XY-Chain elimination: any cell seeing BOTH
 * endpoints can have Z removed.
 */
function bfsXyChain(
  grid: Grid,
  graph: LinkGraph,
  bivalueNode: ReadonlySet<number>,
  startNode: number,
  z: number,
  policy: ChainPolicy,
): { chain: number[]; eliminations: { cell: number; digit: number }[]; links: Link[] } | null {
  interface State { node: number; chain: number[]; nextType: 'strong' | 'weak'; }
  const startCell = graph.nodes[startNode]!.cells[0]!;
  const queue: State[] = [
    { node: startNode, chain: [startNode], nextType: 'weak' },
  ];
  const maxLen = policy.maxChainLength;
  let budget = 4000;
  const bit = maskOf(z);

  while (queue.length) {
    if (--budget <= 0) break;
    const item = queue.shift()!;
    const popped = graph.nodes[item.node]!;

    // Endpoint check: chain long enough, on start digit, different cell.
    if (item.chain.length >= 3
      && popped.digit === z
      && popped.cells[0] !== startCell
      && popped.cells.length === 1) {
      const endCell = popped.cells[0]!;
      // Standard XY-chain elimination rule (cells seeing both endpoints
      // can't have Z) only applies when the chain is consistent:
      //   - XOR chains (odd number of links) are always consistent.
      //   - AND chains (even number of links) are consistent only when the
      //     endpoints do NOT see each other (otherwise the chain forces
      //     a contradiction). For an AND chain with conflicting endpoints,
      //     the chain still deduces `startCell ≠ Z` and `endCell ≠ Z`, but
      //     the standard "see-both" elimination does not apply (a cell
      //     seeing both endpoints may legitimately be Z).
      const numLinks = item.chain.length - 1;
      if (numLinks % 2 === 0 && seesCell(startCell, endCell)) continue;
      const targets: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        if (c === startCell || c === endCell) continue;
        if (!seesCell(c, startCell) || !seesCell(c, endCell)) continue;
        targets.push({ cell: c, digit: z });
      }
      if (targets.length === 0) continue;
      const links = buildChainLinksFromGraph(graph, item.chain);
      return { chain: item.chain, eliminations: targets, links };
    }

    if (item.chain.length >= maxLen) continue;
    for (const edge of graph.adjacency[item.node]!) {
      if (edge.type !== item.nextType) continue;
      if (!bivalueNode.has(edge.to)) continue;
      if (item.chain.includes(edge.to)) continue;
      // Restrict WEAK links to BETWEEN cells (skip the trivial in-cell W
      // link, which would only lead to a dead end at the next strong hop).
      // Restrict STRONG links to IN-CELL only (XY-chain semantics).
      const a = graph.nodes[item.node]!;
      const b = graph.nodes[edge.to]!;
      if (edge.type === 'weak' && a.cells[0] === b.cells[0]) continue;
      if (edge.type === 'strong' && a.cells[0] !== b.cells[0]) continue;
      // For WEAK links, require the link to be a CONJUGATE PAIR (exactly
      // 2 cells in the shared unit hold the digit). Otherwise the link
      // is "at most one" and the chain cannot be read in both directions,
      // which breaks the standard XY-Chain elimination rule.
      if (edge.type === 'weak') {
        const aCell = a.cells[0]!;
        const bCell = b.cells[0]!;
        if (!isConjugatePair(grid, aCell, bCell, z)) continue;
      }
      queue.push({
        node: edge.to,
        chain: [...item.chain, edge.to],
        nextType: item.nextType === 'strong' ? 'weak' : 'strong',
      });
    }
  }
  return null;
}

/**
 * XY-Chain: bivalue-cell chain whose two endpoints share a free digit Z.
 * Uses a dedicated BFS restricted to in-cell strong links (standard
 * XY-chain semantics). Returns the first valid chain (BFS = shortest).
 */
export function makeXyChain(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'xy-chain',
    name: { zh: 'XY 链', en: 'XY-Chain' },
    difficulty: 715,
    tieBreak: ['chain-length', 'cell-index'],

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: false });

      // Identify single-cell bivalue nodes.
      const bivalueNode = new Set<number>();
      for (let i = 0; i < graph.nodes.length; i++) {
        const n = graph.nodes[i]!;
        if (n.cells.length !== 1) continue;
        const cell = n.cells[0]!;
        if (grid.get(cell) !== 0) continue;
        if (popcount(grid.candidatesOf(cell)) !== 2) continue;
        bivalueNode.add(i);
      }
      if (bivalueNode.size < 2) return null;

      // Group bivalue nodes by digit; iterate per digit.
      const byDigit = new Map<number, number[]>();
      for (const i of bivalueNode) {
        const d = graph.nodes[i]!.digit;
        const list = byDigit.get(d) ?? [];
        list.push(i);
        byDigit.set(d, list);
      }

      for (const [z, startCandidates] of byDigit) {
        if (startCandidates.length < 2) continue;
        for (const startNode of startCandidates) {
          const res = bfsXyChain(grid, graph, bivalueNode, startNode, z, policy);
          if (res) {
            const startCell = graph.nodes[startNode]!.cells[0]!;
            const endCell = graph.nodes[res.chain[res.chain.length - 1]!]!.cells[0]!;
            const chainCells = res.chain.map((i) => graph.nodes[i]!.cells[0]!);
            return {
              strategyId: this.id,
              placements: [],
              eliminations: res.eliminations,
              highlights: {
                cells: [...new Set([...chainCells, ...res.eliminations.map((e) => e.cell)])],
                candidates: [
                  ...res.chain.map((i) => {
                    const n = graph.nodes[i]!;
                    return { cell: n.cells[0]!, digit: n.digit };
                  }),
                  ...res.eliminations,
                ],
                links: res.links,
              },
              explanation: {
                zh: `XY 链：双值格 ${cellLabel(startCell)}{${digitsOf(grid.candidatesOf(startCell)).join(',')}} … ${cellLabel(endCell)}{${digitsOf(grid.candidatesOf(endCell)).join(',')}} 沿强弱交替链相连，两端共同候选数 ${z}；可见两端的格消去 ${z}（XY 链）。`,
                en: `XY-Chain: bivalue cells ${cellLabel(startCell)}{${digitsOf(grid.candidatesOf(startCell)).join(',')}} … ${cellLabel(endCell)}{${digitsOf(grid.candidatesOf(endCell)).join(',')}} form an alternating chain sharing digit ${z}; eliminate ${z} from cells seeing both ends (XY-Chain).`,
              },
            };
          }
        }
      }
      return null;
    },
  };
}

export const xyChain: Strategy = makeXyChain();

/**
 * Nice Loop: continuous or discontinuous alternating chain closed back on
 * its start. Continuous → off-link eliminations; discontinuous (two strong
 * / two weak at start) → placement / elimination at the start node.
 */
export function makeNiceLoop(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'nice-loop',
    name: { zh: 'Nice 环', en: 'Nice Loop' },
    difficulty: 720,
    tieBreak: ['chain-length', 'digit'],

    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: true });
      const result = searchNiceLoop(grid, graph, policy);
      if (!result) return null;
      if (result.placements.length === 0 && result.eliminations.length === 0) return null;
      const start: ChainNode = graph.nodes[result.startNode]!;
      const chainCells = result.chainNodes.flatMap((i) => graph.nodes[i]!.cells);
      return {
        strategyId: this.id,
        placements: result.placements,
        eliminations: result.eliminations,
        highlights: {
          cells: [...new Set([...chainCells, ...result.eliminations.map((e) => e.cell), ...result.placements.map((p) => p.cell)])],
          candidates: [
            ...chainCells.map((c) => ({ cell: c, digit: start.digit })),
            ...result.eliminations,
            ...result.placements,
          ],
          links: result.links,
        },
        explanation: {
          zh:
            result.kind === 'continuous-loop'
              ? `连续 Nice 环（单数字 Rule 1）：链闭合后每一弱链所共享的房屋/格中其它候选数均可消去。`
              : result.placements.length > 0
                ? `不连续 Nice 环 Rule 2：两强链在 ${cellLabel(start.cells[0]!)}=${start.digit} 会合，必须填入 ${start.digit}。`
                : `不连续 Nice 环 Rule 3：两弱链在 ${cellLabel(start.cells[0]!)}=${start.digit} 会合，必须消去 ${start.digit}。`,
          en:
            result.kind === 'continuous-loop'
              ? `Continuous Nice Loop (Rule 1): every weak link's shared unit / cell has its off-loop candidates removed.`
              : result.placements.length > 0
                ? `Discontinuous Nice Loop Rule 2: two strong links meet at ${cellLabel(start.cells[0]!)}=${start.digit} → place ${start.digit}.`
                : `Discontinuous Nice Loop Rule 3: two weak links meet at ${cellLabel(start.cells[0]!)}=${start.digit} → eliminate ${start.digit}.`,
        },
      };
    },
  };
}

export const niceLoop: Strategy = makeNiceLoop();
