/**
 * Nice Loop / X-Cycle (T4) — 连续与不连续 Nice 环 / X-Cycle
 *
 * A Nice Loop is a closed AIC — the chain's last link connects back to the start.
 * Three rules based on how the loop closes:
 *
 *   Rule 1 (continuous loop, even nodes): all links alternate properly;
 *     eliminate d from off-loop cells in each weak link's house.
 *
 *   Rule 2 (discontinuous, two strong links meet): the start candidate is forced ON;
 *     place digit d in that cell.
 *
 *   Rule 3 (discontinuous, two weak links meet): the start candidate is forced OFF;
 *     eliminate digit d from that cell.
 *
 * This strategy owns the *-loop AicResult kinds (E6); the AIC strategy must not
 * emit loop results.
 *
 * Research card: research/sudoku-human-solving/local-library/techniques/08-chains-aic/nice-loops.md
 */

import {
  CELLS, SIZE, HOUSES, PEERS_OF, maskOf, popcount, digitsOf,
  ROW_OF, COL_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import type { LinkGraph, ChainNode, Chain } from '../chain/graph.js';
import { chainToLinks } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface LoopResult {
  kind: 'continuous' | 'rule2' | 'rule3';
  chain: Chain;
  startNode: number;
  eliminations: { cell: number; digit: number }[];
  placements: { cell: number; digit: number }[];
}

/**
 * Off-chain eliminations for a continuous loop.
 * For each weak link in the loop, remove d from off-loop cells in the shared house.
 */
function continuousLoopEliminations(
  grid: Grid,
  graph: LinkGraph,
  chain: Chain,
): { cell: number; digit: number }[] {
  const loopCellDigits = new Set<number>();
  for (const step of chain) {
    const node = graph.nodes[step.node]!;
    for (const c of node.cells) {
      loopCellDigits.add(c * 10 + node.digit);
    }
  }

  const elims: { cell: number; digit: number }[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < chain.length; i++) {
    const stepI = chain[i]!;
    // The link from chain[i] to chain[(i+1) % chain.length]
    const nextIdx = (i + 1) % chain.length;
    const stepJ = chain[nextIdx]!;
    // The link type for the next step
    const linkType = stepJ.incoming;
    if (linkType !== 'weak') continue;

    const nodeA = graph.nodes[stepI.node]!;
    const nodeB = graph.nodes[stepJ.node]!;

    if (nodeA.digit !== nodeB.digit) {
      // In-cell weak link: remove all candidates other than nodeA.digit and nodeB.digit from the cell
      // Only applies for single-cell nodes
      if (nodeA.cells.length === 1 && nodeB.cells.length === 1 && nodeA.cells[0] === nodeB.cells[0]) {
        const cell = nodeA.cells[0]!;
        const keepMask = maskOf(nodeA.digit) | maskOf(nodeB.digit);
        for (const d of digitsOf(grid.candidatesOf(cell))) {
          if (keepMask & maskOf(d)) continue;
          const key = cell * 10 + d;
          if (!seen.has(key) && !loopCellDigits.has(key)) {
            seen.add(key);
            elims.push({ cell, digit: d });
          }
        }
      }
      continue;
    }

    // Same digit weak link: remove digit from off-loop cells in the shared house(s)
    const digit = nodeA.digit;
    const bit = maskOf(digit);

    // Find houses that contain all cells of both nodeA and nodeB
    const allLoopCells = new Set([...nodeA.cells, ...nodeB.cells]);
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      if (!nodeA.cells.every((c) => house.includes(c))) continue;
      if (!nodeB.cells.every((c) => house.includes(c))) continue;
      // This house contains both nodes
      for (const cell of house) {
        if (allLoopCells.has(cell)) continue;
        if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
        const key = cell * 10 + digit;
        if (seen.has(key)) continue;
        seen.add(key);
        elims.push({ cell, digit });
      }
    }
  }

  return elims;
}

/**
 * Search for nice loops using BFS over the link graph.
 * We look for closed chains (start node appears again at the end via a link).
 */
function searchNiceLoops(grid: Grid, graph: LinkGraph, onlyDigit?: number): LoopResult | null {
  const n = graph.nodes.length;
  const MAX_LOOP_LEN = 20;
  const PER_START_BUDGET = 2000;

  for (let s = 0; s < n; s++) {
    const startNode = graph.nodes[s]!;
    if (onlyDigit !== undefined && startNode.digit !== onlyDigit) continue;

    // BFS: we start with a strong link out of s (even-indexed links are strong)
    // chain = [{node: s, incoming: null}, {node: next, incoming: 'strong'}, ...]
    // We want to close the loop back to s with a link of the right type.

    interface QItem {
      node: number;
      nextType: 'strong' | 'weak';
      chain: Chain;
      visited: Set<number>;
    }

    let budget = PER_START_BUDGET;
    const queue: QItem[] = [
      {
        node: s,
        nextType: 'strong',
        chain: [{ node: s, incoming: null }],
        visited: new Set([s]),
      },
    ];

    while (queue.length > 0 && budget-- > 0) {
      const item = queue.shift()!;
      const chainLen = item.chain.length;

      if (chainLen >= MAX_LOOP_LEN) continue;

      for (const edge of graph.adjacency[item.node]!) {
        if (edge.type !== item.nextType) continue;

        // Check if we can close the loop back to start
        if (edge.to === s && chainLen >= 4) {
          // The closing link type
          const closingType = edge.type;
          const openingType = item.chain[1]?.incoming; // the first step's incoming = strong

          // Continuous loop: closing link is weak AND it closes evenly
          // Rule 2 / Rule 3 are determined by the types of links meeting at the start node
          // The "incoming" to start from the last step = edge.type
          // The "outgoing" from start = item.chain[1].incoming = 'strong' (we always start strong)

          const firstLink = item.chain[1]?.incoming ?? 'strong'; // always 'strong' (we start with strong)
          const lastLink = closingType;

          if (firstLink === 'strong' && lastLink === 'strong') {
            // Rule 2: two strong links meet at start → place digit in start cell
            // Only for single-cell start node
            if (startNode.cells.length === 1) {
              const cell = startNode.cells[0]!;
              const digit = startNode.digit;
              if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                return {
                  kind: 'rule2',
                  chain: [...item.chain],
                  startNode: s,
                  eliminations: [],
                  placements: [{ cell, digit }],
                };
              }
            }
          } else if (firstLink === 'weak' && lastLink === 'weak') {
            // Rule 3: two weak links meet at start → eliminate digit from start
            // Only for single-cell start node
            if (startNode.cells.length === 1) {
              const cell = startNode.cells[0]!;
              const digit = startNode.digit;
              if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                return {
                  kind: 'rule3',
                  chain: [...item.chain],
                  startNode: s,
                  eliminations: [{ cell, digit }],
                  placements: [],
                };
              }
            }
          } else if (firstLink === 'strong' && lastLink === 'weak') {
            // Continuous loop: opening strong, closing weak (properly alternating)
            // Verify even node count
            if (chainLen % 2 === 0) {
              const closedChain = [...item.chain];
              // Compute off-chain eliminations
              // Build a chain that includes the closing link conceptually
              const chainWithClose: Chain = [
                ...closedChain,
                { node: s, incoming: 'weak' },
              ];
              const elims = continuousLoopEliminations(grid, graph, chainWithClose);
              if (elims.length > 0) {
                return {
                  kind: 'continuous',
                  chain: closedChain,
                  startNode: s,
                  eliminations: elims,
                  placements: [],
                };
              }
            }
          }
          // Don't extend past the start if we're trying to close
          continue;
        }

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

function buildNiceLoopStep(
  grid: Grid,
  graph: LinkGraph,
  result: LoopResult,
  overrideStrategyId: string,
): Step | null {
  const { chain, kind, eliminations, placements, startNode } = result;
  const start = graph.nodes[chain[0]!.node]!;

  const allPlacements = placements.filter(
    (p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit),
  );
  const allElims = eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));

  if (allPlacements.length === 0 && allElims.length === 0) return null;

  const links = chainToLinks(graph, chain);

  const chainDesc = chain
    .map((s, i) => {
      const node = graph.nodes[s.node]!;
      const sign = i === 0 ? (kind === 'rule3' ? '+' : '-') : (s.incoming === 'strong' ? '+' : '-');
      return `${sign}${node.digit}[${cellLabel(node.cells[0]!)}]`;
    })
    .join('');

  let zhKind: string;
  let enKind: string;
  let actionZh: string;
  let actionEn: string;

  if (kind === 'continuous') {
    zhKind = '连续 Nice 环（Rule 1）';
    enKind = 'Continuous Nice Loop (Rule 1)';
    actionZh = `消去弱链所在房间的 ${allElims.map((e) => candidateLabel(e.cell, e.digit)).join(', ')} 等 ${allElims.length} 处候选数`;
    actionEn = `eliminate ${allElims.length} candidate(s) from weak-link houses: ${allElims.map((e) => candidateLabel(e.cell, e.digit)).join(', ')}`;
  } else if (kind === 'rule2') {
    zhKind = '不连续 Nice 环（Rule 2：双强链交汇）';
    enKind = 'Discontinuous Nice Loop (Rule 2: two strong links meet)';
    actionZh = `在 ${cellLabel(allPlacements[0]!.cell)} 填入 ${allPlacements[0]!.digit}`;
    actionEn = `place ${allPlacements[0]!.digit} in ${cellLabel(allPlacements[0]!.cell)}`;
  } else {
    zhKind = '不连续 Nice 环（Rule 3：双弱链交汇）';
    enKind = 'Discontinuous Nice Loop (Rule 3: two weak links meet)';
    actionZh = `消去 ${candidateLabel(allElims[0]!.cell, allElims[0]!.digit)}`;
    actionEn = `eliminate ${candidateLabel(allElims[0]!.cell, allElims[0]!.digit)}`;
  }

  return {
    strategyId: overrideStrategyId,
    placements: allPlacements,
    eliminations: allElims,
    highlights: {
      cells: [...new Set([
        ...chain.flatMap((s) => graph.nodes[s.node]!.cells),
        ...allElims.map((e) => e.cell),
        ...allPlacements.map((p) => p.cell),
      ])],
      candidates: [
        ...chain.flatMap((s) => {
          const node = graph.nodes[s.node]!;
          return node.cells.map((c) => ({ cell: c, digit: node.digit }));
        }),
        ...allElims,
        ...allPlacements,
      ],
      links,
    },
    explanation: {
      zh: `Nice 环（${zhKind}）：${chainDesc} … → 起点；${actionZh}。`,
      en: `Nice Loop (${enKind}): ${chainDesc} → back to start; ${actionEn}.`,
    },
  };
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['digit', 'chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    // Single-digit Nice Loop (X-Cycle) — scan all digits
    for (let d = 1; d <= 9; d++) {
      const graph = buildLinkGraph(grid, { digit: d, grouped: true });
      const result = searchNiceLoops(grid, graph, d);
      if (result) {
        const step = buildNiceLoopStep(grid, graph, result, 'nice-loop');
        if (step) return step;
      }
    }

    // General Nice Loop (multi-digit AIC loop)
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoops(grid, graph);
    if (result) {
      const step = buildNiceLoopStep(grid, graph, result, 'nice-loop');
      if (step) return step;
    }

    return null;
  },
};
