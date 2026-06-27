/**
 * Nice Loop (T4) — Nice 环 / X-Cycle
 *
 * A Nice Loop is an Alternating Inference Chain that closes back onto itself.
 * This strategy implements all three Nice Loop rules:
 *
 * Rule 1 — Continuous loop (even nodes, unbroken alternation):
 *   Every weak link becomes conjugate → eliminate d from other cells in each
 *   weak link's shared unit (off-chain eliminations).
 *
 * Rule 2 — Discontinuous, two strong links meet:
 *   At the break cell/digit, the candidate is forced ON → PLACE it.
 *
 * Rule 3 — Discontinuous, two weak links meet:
 *   At the break cell/digit, placing it creates contradiction → ELIMINATE it.
 *
 * Single-digit Nice Loops = X-Cycles.
 * Multi-digit = AIC loops (in-cell strong links via bivalue cells).
 *
 * E6: This strategy takes over the *-loop kinds from AicResult (which the
 * existing aic strategy was not emitting); aic must not emit loop results.
 */

import {
  CELLS, SIZE, HOUSES, UNITS_OF, PEERS_OF,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface NLNode {
  cell: number;
  digit: number;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

/** Strong neighbors of a node: conjugate pairs in houses + bivalue in-cell */
function strongNeighbors(grid: Grid, node: NLNode): NLNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: NLNode[] = [];
  const bit = maskOf(node.digit);

  // House-based strong links (conjugate pair = only 2 cells with d in house)
  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const cands = house.filter(
      (c) => c !== node.cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
    );
    const total = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
    if (total === 2 && cands.length === 1) {
      neighbors.push({ cell: cands[0]!, digit: node.digit });
    }
  }

  // Bivalue in-cell strong links (digit switch)
  if (popcount(grid.candidatesOf(node.cell)) === 2) {
    for (const d of digitsOf(grid.candidatesOf(node.cell))) {
      if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
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

/** Weak neighbors of a node: peers with same digit + other digits in same cell */
function weakNeighbors(grid: Grid, node: NLNode): NLNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: NLNode[] = [];
  const bit = maskOf(node.digit);

  // Peer same-digit weak links
  for (const peer of PEERS_OF[node.cell]!) {
    if (grid.get(peer) === 0 && (grid.candidatesOf(peer) & bit) !== 0) {
      neighbors.push({ cell: peer, digit: node.digit });
    }
  }
  // In-cell weak links (other digits in same cell)
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

/** Check if two nodes are weakly linked (same cell different digit, or peers same digit) */
function isWeakLink(grid: Grid, a: NLNode, b: NLNode): boolean {
  if (a.cell === b.cell && a.digit !== b.digit) return true;
  if (a.digit === b.digit && a.cell !== b.cell && PEERS_OF[a.cell]!.includes(b.cell)) return true;
  return false;
}

/** Check if two nodes are strongly linked */
function isStrongLink(grid: Grid, a: NLNode, b: NLNode): boolean {
  return strongNeighbors(grid, a).some((n) => n.cell === b.cell && n.digit === b.digit);
}

const MAX_LOOP_LENGTH = 14;

interface LoopSearchState {
  path: NLNode[];
  linkAfter: LinkType[]; // link AFTER path[i] is linkAfter[i]
  visited: Set<number>;
}

/**
 * Search for Nice Loops starting from each node.
 * We use DFS alternating strong→weak→strong→...
 * We look for the chain to return to the start node.
 */
function searchNiceLoop(grid: Grid): Step | null {
  // Collect all candidate nodes
  const startNodes: NLNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if (strongNeighbors(grid, { cell: c, digit: d }).length > 0) {
        startNodes.push({ cell: c, digit: d });
      }
    }
  }

  for (const start of startNodes) {
    const state: LoopSearchState = {
      path: [start],
      linkAfter: [],
      visited: new Set([encodeNode(start.cell, start.digit)]),
    };

    const result = dfsStrong(grid, state, start, start);
    if (result) return result;
  }
  return null;
}

function dfsStrong(
  grid: Grid,
  state: LoopSearchState,
  current: NLNode,
  start: NLNode,
): Step | null {
  if (state.path.length >= MAX_LOOP_LENGTH) return null;

  for (const next of strongNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);

    // Check if we can close the loop back to start
    if (state.path.length >= 3) {
      // Rule 2: two strong links at start cell → close via strong link from next to start
      if (next.cell === start.cell && next.digit === start.digit) {
        // Loop closing with strong link at end
        // The start was entered via strong link, and the closing link is strong
        // → two strong links at start → Rule 2: place start
        const step = tryRule2Loop(
          grid,
          [...state.path, next],
          [...state.linkAfter, 'strong'],
          start,
        );
        if (step) return step;
      }

      // Rule 3: two weak links at start → check if next can weakly link to start
      if (isWeakLink(grid, next, start) && !state.visited.has(key)) {
        // Need to check if the link type from current→next is strong AND next→start is weak
        // that means both sides of start are weak... but we're in dfsStrong (arriving at next via strong)
        // Actually for Rule 3, the break at start: both neighbors are weak
        // But here we're looking at "next" that weakly links to start
        // The link state.path[-1] → next is strong (we're in dfsStrong)
        // So this is not Rule 3 (which needs both weak at start)
      }
    }

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('strong');

    const result = dfsWeak(grid, state, next, start);
    if (result) return result;

    state.path.pop();
    state.linkAfter.pop();
    state.visited.delete(key);
  }
  return null;
}

function dfsWeak(
  grid: Grid,
  state: LoopSearchState,
  current: NLNode,
  start: NLNode,
): Step | null {
  if (state.path.length >= MAX_LOOP_LENGTH) return null;

  for (const next of weakNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);

    if (state.path.length >= 3) {
      // Check loop closure: can we close back to start?
      // Rule 3: both links at start are weak → start is eliminated
      if (next.cell === start.cell && next.digit === start.digit) {
        // current weakly links to start (prev link was weak FROM previous to current)
        // If the path's last link was weak (we're in dfsWeak), and closing via weak → Rule 3
        // But actually: in dfsWeak we're looking at weak links from current
        // We'd be adding weak link from current to start (= next)
        // The path: ... →strong→ current →weak→ start
        // At start: one side is weak (incoming from last strong's predecessor) and... 
        // Actually need to re-examine the path structure

        // The path ends with: path[-2] --strong--> path[-1]=current --weak--> start
        // At start: 
        //   - the OUTGOING link to path[1] was the first step = strong (from dfsStrong)
        //   - the INCOMING link = weak (current → start)
        // So start has: weak incoming, strong outgoing = mixed = no Rule 2/3
        // For Rule 3: BOTH neighbors of start must be weak
        // For that, the first link out of start must also be weak
        // But we always start with strong! Unless the first link IS weak...

        // Re-reading the spec:
        // Rule 2: two strong links MEET at a cell (the break is at that cell)
        // Rule 3: two weak links MEET at a cell
        // The "meet" is: the link INTO the break cell + the link OUT of the break cell
        // In our DFS starting with strong: start --strong--> path[1] --...
        // Closing: current --weak--> start means at start: outgoing=strong, incoming=weak → mixed
        // That's neither Rule 2 nor Rule 3 for start

        // For Rule 2 at start: incoming=strong, outgoing=strong
        // That only happens in dfsStrong (where we look for strong neighbors)
        
        // For Rule 3 at start: incoming=weak, outgoing=weak
        // That means we need to find a path where the FIRST link from start is ALSO weak
        // → we need to start from weak link too

        // So let me also check: can the loop close back to start as a different cell?
        // Actually Rule 2/3 break can be at any node, not just start!
        
        // The "start" of the written chain is just for bookkeeping. The break can be
        // wherever the two same-type links meet in the loop.
        // Since the loop is cyclic, any position can be the "break point".

        // For a closed loop traversal, we check all nodes in the path for the break:
        // After finding a valid alternating loop, check:
        // 1. Is it fully alternating (no break)? → Rule 1 (continuous)
        // 2. Is there a node with two strong links? → Rule 2
        // 3. Is there a node with two weak links? → Rule 3

        // So here: when we find current --weak--> start, we close the loop and evaluate.
        const closedPath = [...state.path];
        const closedLinks = [...state.linkAfter, 'weak'] as LinkType[];

        // The path forms a loop: path[0] --linkAfter[0]--> path[1] --...--> path[n-1] --weak--> path[0]
        const step = tryClosedLoop(grid, closedPath, closedLinks);
        if (step) return step;
      }

      // Also try: current --weak--> any node, which can itself close to start
      // with strong, giving Rule 2 at the non-start closing node
      if (!state.visited.has(key) && isStrongLink(grid, next, start) && state.path.length >= 4) {
        // next --strong--> start would close the loop, making path:
        // start --strong--> ... --weak--> current --weak(!)-->... 
        // actually we'd need the closing strong to be: next --strong--> start
        // path ends: current --weak--> next --strong--> start (=loop closed)
        // At start: outgoing = strong, incoming = strong → Rule 2!
        if (!state.visited.has(key)) {
          const closedPath = [...state.path, next];
          const closedLinks = [...state.linkAfter, 'weak', 'strong'] as LinkType[];
          // Closing: ..., current, next, (back to start via strong)
          const step = tryClosedLoop(grid, closedPath, closedLinks);
          if (step) return step;
        }
      }
    }

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkAfter.push('weak');

    const result = dfsStrong(grid, state, next, start);
    if (result) return result;

    state.path.pop();
    state.linkAfter.pop();
    state.visited.delete(key);
  }
  return null;
}

/**
 * Evaluate a closed loop path[0..n-1] with closing link back to path[0].
 * closedLinks[i] = the link from path[i] to path[(i+1) % n]
 */
function tryClosedLoop(
  grid: Grid,
  path: NLNode[],
  closedLinks: LinkType[],
): Step | null {
  if (path.length < 4) return null;

  const n = path.length;

  // Check each node for a break (two same-type links)
  for (let breakIdx = 0; breakIdx < n; breakIdx++) {
    const incomingLink = closedLinks[(breakIdx + n - 1) % n]!;
    const outgoingLink = closedLinks[breakIdx]!;

    if (incomingLink === 'strong' && outgoingLink === 'strong') {
      // Rule 2: place the digit at breakIdx
      const breakNode = path[breakIdx]!;
      if (!grid.hasCandidate(breakNode.cell, breakNode.digit)) continue;

      const links = buildLoopLinks(path, closedLinks, breakIdx);
      return {
        strategyId: 'nice-loop',
        placements: [{ cell: breakNode.cell, digit: breakNode.digit }],
        eliminations: [],
        highlights: {
          cells: [...new Set(path.map((n) => n.cell))],
          candidates: path.map((n) => ({ cell: n.cell, digit: n.digit })),
          links,
        },
        explanation: {
          zh: `Nice 环（不连续环，Rule 2）：${candidateLabel(breakNode.cell, breakNode.digit)} 两侧均为强链；假设其为假则形成矛盾，必须为真；填入 ${breakNode.digit}。`,
          en: `Nice Loop (Rule 2 - discontinuous, two strong links): ${candidateLabel(breakNode.cell, breakNode.digit)} has strong links on both sides; it must be true; place ${breakNode.digit}.`,
        },
      };
    }

    if (incomingLink === 'weak' && outgoingLink === 'weak') {
      // Rule 3: eliminate the digit at breakIdx
      const breakNode = path[breakIdx]!;
      if (!grid.hasCandidate(breakNode.cell, breakNode.digit)) continue;

      const links = buildLoopLinks(path, closedLinks, breakIdx);
      return {
        strategyId: 'nice-loop',
        placements: [],
        eliminations: [{ cell: breakNode.cell, digit: breakNode.digit }],
        highlights: {
          cells: [...new Set(path.map((n) => n.cell))],
          candidates: path.map((n) => ({ cell: n.cell, digit: n.digit })),
          links,
        },
        explanation: {
          zh: `Nice 环（不连续环，Rule 3）：${candidateLabel(breakNode.cell, breakNode.digit)} 两侧均为弱链；假设其为真则形成矛盾，必须为假；消去 ${breakNode.digit}。`,
          en: `Nice Loop (Rule 3 - discontinuous, two weak links): ${candidateLabel(breakNode.cell, breakNode.digit)} has weak links on both sides; it leads to contradiction; eliminate ${breakNode.digit}.`,
        },
      };
    }
  }

  // Check if fully alternating (continuous loop = Rule 1)
  let isAlternating = true;
  for (let i = 0; i < n; i++) {
    const curr = closedLinks[i]!;
    const next = closedLinks[(i + 1) % n]!;
    if (curr === next) {
      isAlternating = false;
      break;
    }
  }

  if (isAlternating && n % 2 === 0) {
    // Rule 1: continuous loop → off-chain eliminations on every weak link's unit
    return tryRule1Loop(grid, path, closedLinks);
  }

  return null;
}

/**
 * Rule 1: Continuous loop, eliminate off-chain candidates in weak-link units.
 */
function tryRule1Loop(
  grid: Grid,
  path: NLNode[],
  closedLinks: LinkType[],
): Step | null {
  const n = path.length;
  const loopCells = new Set(path.map((node) => node.cell));
  const loopNodes = new Set(path.map((node) => encodeNode(node.cell, node.digit)));

  const eliminations: { cell: number; digit: number }[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (closedLinks[i] !== 'weak') continue;

    const nodeA = path[i]!;
    const nodeB = path[(i + 1) % n]!;

    if (nodeA.cell === nodeB.cell) {
      // In-cell weak link: eliminate all other digits from this cell
      const cellMask = grid.candidatesOf(nodeA.cell);
      const keepMask = maskOf(nodeA.digit) | maskOf(nodeB.digit);
      for (const d of digitsOf(cellMask)) {
        if (maskOf(d) & keepMask) continue;
        const key = encodeNode(nodeA.cell, d);
        if (!seen.has(key)) {
          seen.add(key);
          if (grid.hasCandidate(nodeA.cell, d)) {
            eliminations.push({ cell: nodeA.cell, digit: d });
          }
        }
      }
    } else if (nodeA.digit === nodeB.digit) {
      // Between-cell weak link: eliminate from cells seeing both
      const d = nodeA.digit;
      const bit = maskOf(d);
      // Find cells seeing both nodeA.cell and nodeB.cell with digit d
      for (const c of PEERS_OF[nodeA.cell]!) {
        if (!PEERS_OF[nodeB.cell]!.includes(c)) continue;
        if (loopNodes.has(encodeNode(c, d))) continue;
        if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        const key = encodeNode(c, d);
        if (!seen.has(key)) {
          seen.add(key);
          eliminations.push({ cell: c, digit: d });
        }
      }
      // Also: remove d from all other cells in any house shared by nodeA and nodeB
      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        if (!house.includes(nodeA.cell) || !house.includes(nodeB.cell)) continue;
        for (const c of house) {
          if (loopNodes.has(encodeNode(c, d))) continue;
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
          const key = encodeNode(c, d);
          if (!seen.has(key)) {
            seen.add(key);
            eliminations.push({ cell: c, digit: d });
          }
        }
      }
    }
  }

  if (eliminations.length === 0) return null;

  const links = buildLoopLinks(path, closedLinks, 0);
  const startNode = path[0]!;
  return {
    strategyId: 'nice-loop',
    placements: [],
    eliminations,
    highlights: {
      cells: [...new Set([...path.map((n) => n.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [...path.map((n) => ({ cell: n.cell, digit: n.digit })), ...eliminations],
      links,
    },
    explanation: {
      zh: `Nice 环（连续环，Rule 1）：从 ${candidateLabel(startNode.cell, startNode.digit)} 形成完全交替循环；每条弱链单元中的非环候选可被消去。`,
      en: `Nice Loop (Rule 1 - continuous): starting from ${candidateLabel(startNode.cell, startNode.digit)} forms a fully alternating loop; eliminate off-chain candidates in weak-link units.`,
    },
  };
}

function tryRule2Loop(
  grid: Grid,
  closedPath: NLNode[],
  closedLinks: LinkType[],
  start: NLNode,
): Step | null {
  // When called from dfsStrong on closing via strong link back to start:
  // path[-1] = start (duplicate), closedLinks[-1] = 'strong'
  // path[0] = start, closedLinks[0] = 'strong' (first step from start)
  // → two strong links at start → Rule 2 → place start digit
  const n = closedPath.length;
  if (n < 4) return null;
  if (!grid.hasCandidate(start.cell, start.digit)) return null;

  const path = closedPath.slice(0, -1); // remove duplicate start at end
  const links = buildLoopLinks(path, closedLinks.slice(0, -1), 0);

  return {
    strategyId: 'nice-loop',
    placements: [{ cell: start.cell, digit: start.digit }],
    eliminations: [],
    highlights: {
      cells: [...new Set(path.map((n) => n.cell))],
      candidates: path.map((n) => ({ cell: n.cell, digit: n.digit })),
      links,
    },
    explanation: {
      zh: `Nice 环（不连续环，Rule 2）：${candidateLabel(start.cell, start.digit)} 两侧均为强链；假设其为假则形成矛盾；填入 ${start.digit}。`,
      en: `Nice Loop (Rule 2 - discontinuous, two strong links at start): ${candidateLabel(start.cell, start.digit)} has strong links on both sides; must be true; place ${start.digit}.`,
    },
  };
}

function buildLoopLinks(path: NLNode[], closedLinks: LinkType[], startAt: number): Link[] {
  const n = path.length;
  const links: Link[] = [];
  for (let i = 0; i < n; i++) {
    const from = path[(i + startAt) % n]!;
    const to = path[(i + startAt + 1) % n]!;
    const type = closedLinks[(i + startAt) % n]!;
    links.push({
      from: { cell: from.cell, digit: from.digit },
      to: { cell: to.cell, digit: to.digit },
      type,
    });
  }
  return links;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return searchNiceLoop(grid);
  },
};
