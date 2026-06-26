/**
 * Nice Loop / XY-Chain / Turbot Fish strategies (P0) — 链引擎家族特例
 *
 * Three related strategy ids that share `buildLinkGraph` + `searchAic` as the
 * underlying engine (Roadmap ② gate 6 — chain engine boundaries). They differ
 * only in what they accept and how they emit:
 *
 *   - `nice-loop`   — closed alternating chains (continuous & discontinuous
 *                     Nice Loops, including single-digit X-Cycles). Owns the
 *                     `*-loop` AicResult kinds that `aic` must NOT emit (E6).
 *   - `xy-chain`    — open alternating chains restricted to bivalue cells
 *                     (Remote Pairs ⊂ XY-Chain ⊂ AIC).
 *   - `turbot-fish` — single-digit strong-link presentation alias for
 *                     `x-chain` (E2 unification: shares owner x-chain and the
 *                     same detector; turbot-fish is a thinner / preferred
 *                     presentation of the same generic single-digit chain).
 *
 * All three reuse the shared chain engine; no new search detectors are added.
 */

import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, chainToLinks, type LinkGraph, type ChainNode, type Chain, type ChainStep } from '../chain/graph.js';
import { searchAic, type AicResult } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

// ============================================================================
// nice-loop: closed alternating chains (continuous & discontinuous)
// ============================================================================

/**
 * Check whether the 2-coloring of a closed alternating chain is achievable
 * given the current grid. Returns true if at least one of the two color
 * classes is consistent with the candidate masks.
 *
 * For each color class (set of nodes), the class is achievable iff:
 *   - For every "strong" link A<->B (same color), the link is satisfiable:
 *     (both have d) OR (both don't have d). Concretely, at least one of
 *     the link's endpoint cells carries d as candidate AND the cells
 *     that must NOT have d don't.
 *   - For every "weak" link A->B (opposite colors), the link is
 *     satisfiable: (A has d) -> (B doesn't), and (B has d) -> (A doesn't).
 *
 * We only need to verify that at least one color class is achievable
 * (i.e., that the "ON" set can be assigned a digit value consistently).
 * For the specific case of a single-digit Nice Loop, the digit d is fixed
 * and we check: in color class X, can at least one cell be assigned d?
 * And in color class Y, can no cell be assigned d?
 *
 * Simpler check: for color class X, every node must have at least one
 * cell that is a d-candidate. For color class Y, every node must allow
 * the possibility of no d (i.e., not all cells in the node MUST be d).
 */
function isLoopColorable(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
  closingType: 'strong' | 'weak',
): boolean {
  // Determine the 2-coloring: nodes at even positions in the chain share
  // one color, nodes at odd positions share the other. (We assume the
  // alternation holds; the DFS already enforces it.)
  const colorOf = new Map<number, 0 | 1>();
  for (let i = 0; i < chain.length; i++) {
    colorOf.set(chain[i]!.node, (i % 2) as 0 | 1);
  }
  // The closing link is the implicit link from chain[chain.length-1] back
  // to chain[0]. If the closing link is WEAK, the two endpoint nodes have
  // OPPOSITE colors. The alternation already ensured this (we check
  // continuous loops, which are even-length; the alternation then requires
  // the closing link to be opposite of the last link, and the first link
  // to be opposite of the closing, so colors alternate).
  // If the closing link is STRONG, same colors — but in continuous loops
  // (even length), the closing link type alternates, so it's WEAK.
  // (Discontinuous loops are handled separately and not continuous.)
  void closingType;
  // Build the two color classes (sets of node indices).
  const class0 = new Set<number>();
  const class1 = new Set<number>();
  for (const [nodeIdx, c] of colorOf) {
    if (c === 0) class0.add(nodeIdx);
    else class1.add(nodeIdx);
  }
  // Check achievability of each color class.
  return isClassAchievable(grid, graph, class0) || isClassAchievable(grid, graph, class1);
}

function isClassAchievable(
  grid: Grid,
  graph: LinkGraph,
  nodeIndices: Set<number>,
): boolean {
  // For a single-digit Nice Loop, the color class is "achievable" iff:
  // - For every strong link A<->B (both endpoints in this class), the link
  //   is satisfiable: at least one endpoint has the digit as a candidate.
  // - For every weak link A->B (A in this class, B in other class), the
  //   link is satisfiable: A has the digit as a candidate, OR B has it
  //   (i.e., the link is not vacuously true).
  //
  // Simplification: a class is achievable iff every node in the class has
  // at least one cell that is a candidate of the digit. (This is necessary
  // but not sufficient for general loops; for our alternating chains it
  // is sufficient when the loop is otherwise valid.)
  //
  // Actually, we need a stronger check: for class X to be "ON", every node
  // in X must have at least one cell with the digit. For class Y to be
  // "OFF", every node in Y must have all cells NOT have the digit
  // (vacuously, since the cells have other candidates too).
  //
  // Hmm, actually we want: ONE of the two colorings is consistent.
  // Coloring A: X = ON, Y = OFF. Then every node in X has at least one
  // d-cell (achievable). Every node in Y has all d-cells (off).
  // Coloring B: X = OFF, Y = ON. Symmetric.
  //
  // For the loop's conclusions (Rule 1 off-chain eliminations) to apply,
  // we need a valid 2-coloring where one class is ON. The class X can
  // be ON iff every node in X has at least one d-candidate.
  // The class Y can be OFF iff every node in Y can have all d-cells
  // (i.e., not all d-cells in any node are forced).
  //
  // For the OFF class: if a node has only one cell AND that cell is
  // currently a d-candidate, it can be OFF (the cell might not be d).
  // But if the cell is the ONLY candidate for d in some house, then
  // it MUST be d, so the node can't be OFF.
  //
  // Simpler sufficient check: for class X to be ON, every node in X has
  // at least one d-candidate. If this holds, X is achievable.
  for (const nodeIdx of nodeIndices) {
    const node = graph.nodes[nodeIdx]!;
    let hasCandidate = false;
    for (const c of node.cells) {
      if (grid.hasCandidate(c, node.digit)) { hasCandidate = true; break; }
    }
    if (!hasCandidate) return false;
  }
  return true;
}

/**
 * Stronger 2-coloring check: at least one color class must be FORCED OFF
 * (i.e., contain a node that has no d-candidate, so it cannot be ON).
 * If both classes can be ON, neither is forced, and the loop gives no
 * eliminations. We return true only when at least one class is forced
 * OFF (and the other class is achievable ON), making the loop a valid
 * eliminative Nice Loop.
 */
function hasForcedColorClass(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
): { forcedOff: Set<number>; on: Set<number> } | null {
  // Determine color classes by chain position (even/odd).
  const class0 = new Set<number>();
  const class1 = new Set<number>();
  for (let i = 0; i < chain.length; i++) {
    if (i % 2 === 0) class0.add(chain[i]!.node);
    else class1.add(chain[i]!.node);
  }
  // Check if class 0 can be ON (every node has d-candidate) AND class 1 is
  // forced OFF (some node has no d-candidate).
  if (isClassAchievable(grid, graph, class0) && hasNoCandidateNode(grid, graph, class1)) {
    return { forcedOff: class1, on: class0 };
  }
  // Or vice versa.
  if (isClassAchievable(grid, graph, class1) && hasNoCandidateNode(grid, graph, class0)) {
    return { forcedOff: class0, on: class1 };
  }
  return null;
}

function hasNoCandidateNode(
  grid: Grid,
  graph: LinkGraph,
  nodeIndices: Set<number>,
): boolean {
  for (const nodeIdx of nodeIndices) {
    const node = graph.nodes[nodeIdx]!;
    for (const c of node.cells) {
      if (grid.hasCandidate(c, node.digit)) {
        return false;
      }
    }
  }
  return true;
}
function loopEliminations(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
  linkTypes: readonly ('strong' | 'weak')[],
  closingType: 'strong' | 'weak',
): { placements: { cell: number; digit: number }[]; eliminations: { cell: number; digit: number }[] } {
  // Determine the closing link type (the one that closes the loop back to the start).
  // The start node is chain[0]; the last visited node is chain[chain.length-1].
  // We have `linkTypes[0..chain.length-2]` (links between consecutive nodes) and
  // the closing link from the last node back to the first (with `closingType`).
  const startNode = graph.nodes[chain[0]!.node]!;
  const endNode = graph.nodes[chain[chain.length - 1]!.node]!;
  const breakCell = startNode.cells[0]!;
  const breakDigit = startNode.digit;
  const breakMask = maskOf(breakDigit);

  // The two links meeting at the start node are: linkTypes[0] (start -> next)
  // and the closing link (end -> start) of type `closingType`.
  const linkAfterStart = linkTypes[0]!;
  const linkBeforeStart = closingType;
  const bothStrong = linkAfterStart === 'strong' && linkBeforeStart === 'strong';
  const bothWeak = linkAfterStart === 'weak' && linkBeforeStart === 'weak';

  // Rule 2: both strong -> place digit at break cell.
  if (bothStrong) {
    if (grid.hasCandidate(breakCell, breakDigit) && popcount(grid.candidatesOf(breakCell)) > 1) {
      return {
        placements: [{ cell: breakCell, digit: breakDigit }],
        eliminations: [],
      };
    }
    return { placements: [], eliminations: [] };
  }

  // Rule 3: both weak -> eliminate digit at break cell.
  if (bothWeak) {
    if (grid.hasCandidate(breakCell, breakDigit)) {
      return { placements: [], eliminations: [{ cell: breakCell, digit: breakDigit }] };
    }
    return { placements: [], eliminations: [] };
  }

  // Rule 1 (continuous): off-chain eliminations on every between-cell weak link,
  // plus in-cell weak-link digit cleanup.
  const loopNodes = chain.map((s: ChainStep) => graph.nodes[s.node]!);
  const loopCellSet = new Set<number>();
  for (const n of loopNodes) for (const c of n.cells) loopCellSet.add(c);

  const elims: { cell: number; digit: number }[] = [];
  const seen = new Set<number>();

  // For every weak link in the chain (between chain[i-1] and chain[i]) apply
  // Rule-1 eliminations. The closing weak link (if any) is handled separately
  // by the loopKind; for continuous Rule 1 the closing link is WEAK.
  for (let i = 0; i < chain.length; i++) {
    const a = loopNodes[i]!;
    const b = loopNodes[(i + 1) % loopNodes.length]!;
    const t = i + 1 < loopNodes.length ? linkTypes[i]! : closingType;
    if (t !== 'weak') continue;

    // In-cell weak link: same cell, different digit.
    if (a.cells.length === 1 && b.cells.length === 1 && a.cells[0] === b.cells[0]) {
      const cell = a.cells[0]!;
      const m = grid.candidatesOf(cell);
      // Remove all candidates other than a.digit, b.digit from this cell.
      const keepMask = maskOf(a.digit) | maskOf(b.digit);
      for (const d of digitsOf(m)) {
        if ((keepMask & maskOf(d)) !== 0) continue;
        if ((seen.has(cell * 10 + d))) continue;
        seen.add(cell * 10 + d);
        elims.push({ cell, digit: d });
      }
      continue;
    }

    // Between-cell weak link: remove digit from off-loop cells sharing a unit
    // (row/col/box) with BOTH aCell and bCell.
    const digit = a.digit;
    for (const aCell of a.cells) {
      for (const bCell of b.cells) {
        if (aCell === bCell) continue;
        if (!PEERS_OF[aCell]!.includes(bCell)) continue;
        // For each cell c in the shared unit of aCell & bCell that is NOT a
        // loop cell and carries d:
        const aPeers = new Set(PEERS_OF[aCell]!);
        for (const c of PEERS_OF[bCell]!) {
          if (!aPeers.has(c)) continue;
          if (loopCellSet.has(c)) continue;
          if (c === aCell || c === bCell) continue;
          if (grid.get(c) !== 0) continue;
          if ((grid.candidatesOf(c) & maskOf(digit)) === 0) continue;
          const key = c * 10 + digit;
          if (seen.has(key)) continue;
          seen.add(key);
          elims.push({ cell: c, digit });
        }
      }
    }
  }
  return { placements: [], eliminations: elims };
}

interface LoopSearchItem {
  node: number;
  nextType: 'strong' | 'weak';
  chain: Chain;
  linkTypes: ('strong' | 'weak')[];
  visited: Set<number>;
  visitedCells: Set<number>;
}

/**
 * Search for a closed alternating chain (loop) starting from each node in
 * the graph. Returns the first valid loop (Rule 1 / 2 / 3) with non-empty
 * deductions, or null.
 *
 * Validity: the chain must visit each CELL at most once (a single-cell node
 * revisiting the same cell as a group node would create a self-overlapping
 * chain that doesn't represent a valid Nice Loop). The DFS extends only to
 * nodes that contribute at least one new cell.
 */
function searchNiceLoop(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  for (let s = 0; s < n; s++) {
    const startCells = new Set(graph.nodes[s]!.cells);
    let budget = perStartBudget;
    const stack: LoopSearchItem[] = [
      {
        node: s,
        nextType: 'strong',
        chain: [{ node: s, incoming: null }],
        linkTypes: [],
        visited: new Set([s]),
        visitedCells: new Set(startCells),
      },
    ];

    while (stack.length) {
      if (budget-- <= 0) break;
      const item = stack.pop()!;
      const last = item.chain[item.chain.length - 1]!;
      const lastNode = graph.nodes[item.node]!;
      const firstNode = graph.nodes[item.chain[0]!.node]!;

      // Check loop closure: edge from `last.node` back to start with right type.
      if (item.chain.length >= 3) {
        const linkAfterStart = item.linkTypes[0]!;
        for (const edge of graph.adjacency[item.node]!) {
          if (edge.to !== s) continue;
          if (edge.type !== item.nextType) continue;
          const linkBeforeStart = edge.type;
          const bothStrong = linkAfterStart === 'strong' && linkBeforeStart === 'strong';
          const bothWeak = linkAfterStart === 'weak' && linkBeforeStart === 'weak';

          // Continuous loop requires an even number of nodes.
          const isContinuous = item.chain.length % 2 === 0;
          if (!isContinuous) continue;

          // Validate the 2-coloring: at least one color class must be
          // FORCED OFF (so the other class is forced ON). Otherwise the
          // loop is structurally valid but logically unforced, and its
          // conclusions don't apply.
          const coloring = hasForcedColorClass(grid, graph, item.chain);
          if (!coloring) continue;

          const { placements, eliminations } = loopEliminations(
            grid,
            graph,
            item.chain,
            item.linkTypes,
            edge.type,
          );
          if (placements.length === 0 && eliminations.length === 0) continue;
          const links = chainToLinks(graph, item.chain);
          const lastN = graph.nodes[last.node]!;
          const firstN = graph.nodes[s]!;
          const closingLink: Link = {
            from: { cell: lastN.cells[0]!, digit: lastN.digit },
            to: { cell: firstN.cells[0]!, digit: firstN.digit },
            type: edge.type,
          };
          if (lastN.cells.length > 1) closingLink.fromCells = [...lastN.cells];
          if (firstN.cells.length > 1) closingLink.toCells = [...firstN.cells];
          links.push(closingLink);

          const kind: AicResult['kind'] = bothStrong
            ? 'discontinuous-loop'
            : bothWeak
              ? 'discontinuous-loop'
              : 'continuous-loop';
          return {
            placements,
            eliminations,
            links,
            chainNodes: item.chain.map((s: ChainStep) => s.node),
            kind,
            startNode: s,
            endNode: last.node,
          };
        }
      }

      if (item.chain.length >= maxLen) continue;

      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (item.visited.has(edge.to)) continue;
        // Require at least one NEW cell in the new node (no self-overlapping).
        const newNode = graph.nodes[edge.to]!;
        let hasNewCell = false;
        for (const c of newNode.cells) {
          if (!item.visitedCells.has(c)) { hasNewCell = true; break; }
        }
        if (!hasNewCell) continue;
        const visited = new Set(item.visited);
        visited.add(edge.to);
        const visitedCells = new Set(item.visitedCells);
        for (const c of newNode.cells) visitedCells.add(c);
        stack.push({
          node: edge.to,
          nextType: item.nextType === 'strong' ? 'weak' : 'strong',
          chain: [...item.chain, { node: edge.to, incoming: edge.type }],
          linkTypes: [...item.linkTypes, edge.type],
          visited,
          visitedCells,
        });
      }
    }
  }
  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    // Try single-digit graphs first (X-Cycles) — they are far more common.
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchNiceLoop(grid, graph, policy);
      if (result && (result.placements.length > 0 || result.eliminations.length > 0)) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        const kindLabel =
          result.kind === 'continuous-loop'
            ? '连续'
            : result.kind === 'discontinuous-loop'
              ? '不连续'
              : 'loop';
        return {
          strategyId: this.id,
          placements: result.placements,
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i: number) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i: number) =>
              graph.nodes[i]!.cells.map((c: number) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `Nice 环（${kindLabel}）：数字 ${digit} 沿强弱交替链闭合于 ${cellLabel(start.cells[0]!)}；据此${result.placements.length > 0 ? `在 R${ROW_OF[start.cells[0]!]! + 1}C${COL_OF[start.cells[0]!]! + 1} 填入 ${digit}` : '消去相应候选'}。`,
            en: `Nice Loop (${result.kind === 'continuous-loop' ? 'continuous' : 'discontinuous'}): digit ${digit} closes an alternating chain back to ${cellLabel(start.cells[0]!)}; ${result.placements.length > 0 ? `place ${digit} in R${ROW_OF[start.cells[0]!]! + 1}C${COL_OF[start.cells[0]!]! + 1}` : 'yielding the eliminations'}.`,
          },
        };
      }
    }
    // Then multi-digit Nice Loops (general AIC loops).
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoop(grid, graph, policy);
    if (result && (result.placements.length > 0 || result.eliminations.length > 0)) {
      const start = graph.nodes[result.startNode]!;
      return {
        strategyId: this.id,
        placements: result.placements,
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap((i: number) => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap((i: number) =>
            graph.nodes[i]!.cells.map((c: number) => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          links: result.links,
        },
        explanation: {
          zh: `Nice 环（${result.kind === 'continuous-loop' ? '连续' : '不连续'}）：从 ${candidateLabel(start.cells[0]!, start.digit)} 经强弱交替链闭合；据此${result.placements.length > 0 ? `填入 ${candidateLabel(start.cells[0]!, start.digit)}` : '消去相应候选'}。`,
          en: `Nice Loop (${result.kind === 'continuous-loop' ? 'continuous' : 'discontinuous'}): from ${candidateLabel(start.cells[0]!, start.digit)} along an alternating chain that closes; ${result.placements.length > 0 ? `place ${candidateLabel(start.cells[0]!, start.digit)}` : 'yielding the eliminations'}.`,
        },
      };
    }
    return null;
  },
};

// ============================================================================
// xy-chain: open alternating chain restricted to bivalue cells
// ============================================================================

/**
 * A node is a "bivalue node" iff it has exactly 1 cell AND that cell has
 * exactly 2 candidates. Strong links between two bivalue nodes are valid
 * in-cell (digit switch inside a bivalue cell); weak links between two
 * bivalue nodes are valid (the two cells share a peer unit on the hop digit).
 * Group nodes (cells.length > 1) are not XY-Chain nodes.
 */
function isXyChainNode(graph: LinkGraph, nodeIdx: number, grid: Grid): boolean {
  const n = graph.nodes[nodeIdx]!;
  if (n.cells.length !== 1) return false;
  const cell = n.cells[0]!;
  return popcount(grid.candidatesOf(cell)) === 2;
}

function searchXyChain(grid: Grid, graph: LinkGraph, policy: ChainPolicy): AicResult | null {
  const n = graph.nodes.length;
  const maxLen = policy.maxChainLength;
  const perStartBudget = 4000;

  interface QItem {
    node: number;
    nextType: 'strong' | 'weak';
    chain: Chain;
    visited: Set<number>;
  }

  for (let s = 0; s < n; s++) {
    // XY-Chain starts at a bivalue node and every node in the chain must be bivalue.
    if (!isXyChainNode(graph, s, grid)) continue;
    let budget = perStartBudget;
    const queue: QItem[] = [
      { node: s, nextType: 'strong', chain: [{ node: s, incoming: null }], visited: new Set([s]) },
    ];
    while (queue.length) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      const last = item.chain[item.chain.length - 1]!;
      if (item.chain.length >= 2 && last.incoming === 'strong') {
        const startIdx = item.chain[0]!.node;
        const endIdx = item.chain[item.chain.length - 1]!.node;
        if (startIdx !== endIdx) {
          const A = graph.nodes[startIdx]!;
          const B = graph.nodes[endIdx]!;
          // Both ends must be bivalue nodes.
          if (isXyChainNode(graph, endIdx, grid)) {
            // Open XY-Chain endpoints: both ends should have the same digit
            // for the cross-cell weak-link elimination to fire.
            if (A.digit === B.digit) {
              const digit = A.digit;
              const bit = maskOf(digit);
              // For each off-chain cell that peers BOTH end cells, eliminate d.
              // Since the chain alternates, A and B are weak-link endpoints on d.
              const elims: { cell: number; digit: number }[] = [];
              const chainCellSet = new Set<number>();
              for (const step of item.chain) for (const c of graph.nodes[step.node]!.cells) chainCellSet.add(c);
              for (let c = 0; c < 81; c++) {
                if (chainCellSet.has(c)) continue;
                if (grid.get(c) !== 0) continue;
                if ((grid.candidatesOf(c) & bit) === 0) continue;
                // c peers A's cell AND B's cell.
                const peersA = PEERS_OF[A.cells[0]!]!;
                if (!peersA.includes(c)) continue;
                if (!PEERS_OF[B.cells[0]!]!.includes(c)) continue;
                elims.push({ cell: c, digit });
              }
              if (elims.length > 0) {
                return {
                  placements: [],
                  eliminations: elims,
                  links: chainToLinks(graph, item.chain),
                  chainNodes: item.chain.map((s: { node: number }) => s.node),
                  kind: 'type1',
                  startNode: startIdx,
                  endNode: endIdx,
                };
              }
            }
          }
        }
      }
      if (item.chain.length >= maxLen) continue;
      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;
        if (!isXyChainNode(graph, edge.to, grid)) continue;
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
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    // XY-Chain is bivalue-only, so a multi-digit graph is fine (and necessary:
    // the chain may switch digits at each bivalue cell).
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchXyChain(grid, graph, policy);
    if (result && result.eliminations.length > 0) {
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      return {
        strategyId: this.id,
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap((i: number) => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap((i: number) =>
            graph.nodes[i]!.cells.map((c: number) => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          links: result.links,
        },
        explanation: {
          zh: `XY 链：双值格链 ${cellLabel(start.cells[0]!)}(${start.digit}) 到 ${cellLabel(end.cells[0]!)}(${end.digit})；至少一端为真，故可见两端的格消去 ${start.digit}。`,
          en: `XY-Chain: bivalue cells from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit} via alternating in-cell / between-cell links; at least one end holds ${start.digit}, so cells seeing both lose ${start.digit}.`,
        },
      };
    }
    return null;
  },
};

// ============================================================================
// turbot-fish: presentation alias for the single-digit strong-link chain
// (shares owner x-chain per E2 unification)
// ============================================================================

/**
 * Turbot Fish is the generic two-strong-link single-digit chain; the
 * x-chain strategy already implements the full single-digit alternating
 * chain search. Turbot-fish reuses that search but with a tighter
 * `maxChainLength` (4-6 links), so it returns the shorter, easier-to-read
 * Turbot patterns (skyscraper, kite, ER, generic 4-link) before x-chain
 * emits longer X-Cycles.
 *
 * Per overlap.ts (E2), this is a presentation alias that shares owner
 * x-chain. We still emit a distinct strategyId so the trace shows the
 * more readable Turbot name when the chain shape is a Turbot, without
 * duplicating the search.
 */
export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    // Search a single-digit alternating chain limited to <= 4 strong-link
    // edges (=> <= 6 nodes). This catches the Turbot-Fish family (skyscraper,
    // kite, ER, generic 4-link Turbot). Longer X-Cycles fall through to x-chain.
    const policy: ChainPolicy = { ...DEFAULT_CHAIN_POLICY, maxChainLength: 6 };
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
            cells: result.chainNodes.flatMap((i: number) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i: number) =>
              graph.nodes[i]!.cells.map((c: number) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `数字 ${digit}：多宝鱼（Turbot Fish）。单数字强弱交替短链 ${cellLabel(start.cells[0]!)} 到 ${cellLabel(end.cells[0]!)}；至少一端为真，故可见两端的格消去 ${digit}。`,
            en: `Digit ${digit}: Turbot Fish — a short single-digit strong-link chain from ${cellLabel(start.cells[0]!)} to ${cellLabel(end.cells[0]!)}; at least one end is true, so cells seeing both lose ${digit}.`,
          },
        };
      }
    }
    return null;
  },
};

// Silence unused-symbol warnings.
void ROWS;
void COLS;
void BOXES;
void BOX_OF;
