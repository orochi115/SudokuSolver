/**
 * Nice Loop / X-Cycle (T4) — 连续/不连续 Nice 环
 *
 * A Nice Loop is an AIC closed onto itself. Three rules:
 *
 * Rule 1 — Continuous loop (even number of links, full alternation):
 *   The loop closes with the "correct" alternating type (strong→weak→...→strong closing).
 *   On every weak link: remove d from off-loop candidates sharing that unit.
 *   For in-cell weak links: remove other candidates from that cell.
 *   Requires path.length EVEN (even number of nodes) and closing type = weak.
 *
 * Rule 2 — Discontinuous, two strong links at break node (= startIdx):
 *   Chain: startIdx -[S]→ ... → node -[S]→ startIdx
 *   startIdx=OFF propagates to node=OFF (proved below) → strong link forces startIdx=ON.
 *   Contradiction → startIdx must be ON → place its digit.
 *   Requires path.length ODD (so node=OFF when startIdx=OFF), closing type='strong'.
 *
 * Rule 3 — Discontinuous, two weak links at break node (= node or startIdx):
 *   node=ON → closing weak → startIdx=OFF → chain → node=OFF. Contradiction.
 *   Requires path.length ODD (incomingType='weak'), closing type='weak'. Break at node.
 *   OR startIdx=ON → departure weak link (but we start strong, so not at startIdx).
 *
 * PARITY PROOF (start at startIdx=OFF, alternating S,W,S,... links):
 *   After k steps: value=ON if k ODD, OFF if k EVEN.
 *   - node (step path.length-1): ON if path.length EVEN, OFF if path.length ODD.
 *   Rule 2 at startIdx: need node=OFF → path.length ODD; closing='strong' → startIdx=ON. ✓
 *   Rule 3 at node: assume node=ON → closing='weak' → startIdx=OFF → chain → node position after
 *     path.length-1 steps = OFF if path.length ODD → contradiction with node=ON. ✓
 *   Rule 1 (continuous): closing='weak' at step path.length; alternation requires
 *     path.length EVEN (so closing step index is EVEN, type='strong'... wait, let me re-check).
 *
 * E6: This strategy owns all loop kinds. `aic` must NOT emit loop results.
 */

import {
  HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

// ============================================================
// Loop search result types
// ============================================================

interface LoopResult {
  kind: 'continuous' | 'rule2' | 'rule3';
  path: number[];       // node indices (path[0] = startIdx)
  links: LinkType[];    // forward link types (length = path.length - 1)
  closingType: LinkType;
  breakNodeIdx: number; // startIdx for rule2; last path node for rule3
}

// ============================================================
// Core BFS
// ============================================================

function searchNiceLoops(graph: LinkGraph): LoopResult | null {
  const n = graph.nodes.length;
  const MAX_LEN = 20;
  const PER_START_BUDGET = 2000;

  interface QItem {
    node: number;
    nextType: LinkType;
    path: number[];
    links: LinkType[];
    visited: Set<number>;
  }

  for (let startIdx = 0; startIdx < n; startIdx++) {
    let budget = PER_START_BUDGET;

    const initial: QItem = {
      node: startIdx,
      nextType: 'strong',
      path: [startIdx],
      links: [],
      visited: new Set([startIdx]),
    };
    const queue: QItem[] = [initial];

    while (queue.length > 0) {
      if (budget-- <= 0) break;
      const item = queue.shift()!;
      const { node, nextType, path, links, visited } = item;
      const pathLen = path.length;

      // Minimum loop length: 4 nodes (3 links for discontinuous, 4+ for continuous)
      if (pathLen >= 4) {
        // Check closing edges back to startIdx
        for (const edge of graph.adjacency[node]!) {
          if (edge.to !== startIdx) continue;
          const closingType = edge.type;

          // ---- Rule 2: two strong links at startIdx ----
          // Condition: path.length ODD (node=OFF when startIdx=OFF) AND closing='strong'
          // With path.length ODD: nextType='strong' (after odd-count links starting with 'strong')
          // linksSoFar[k] = k%2=0 ? 'strong' : 'weak'. After pathLen-1 links, nextType = (pathLen-1)%2=0 ? 'weak' : 'strong'.
          // pathLen ODD → pathLen-1 EVEN → nextType='weak'... 
          // Wait: let me re-derive. We start with nextType='strong'. After extending with a link of type nextType,
          // we flip nextType. So after k extensions, nextType = k%2=0 ? 'strong' : 'weak'.
          // At 'node', we've done pathLen-1 extensions (links). nextType = (pathLen-1)%2=0 ? 'strong' : 'weak'.
          // pathLen ODD → pathLen-1 EVEN → nextType='strong'. ✓ 
          // pathLen EVEN → pathLen-1 ODD → nextType='weak'.
          //
          // Rule 2: nextType='strong' (pathLen ODD) AND closingType='strong'.
          // The departure from startIdx (links[0]) is always 'strong'. Closing INTO startIdx = 'strong'.
          // Two strong at startIdx → place startIdx's digit.
          if (nextType === 'strong' && closingType === 'strong') {
            return {
              kind: 'rule2',
              path,
              links,
              closingType,
              breakNodeIdx: startIdx,
            };
          }

          // ---- Rule 3: two weak links at break node `node` ----
          // At node: incoming='weak' (links[pathLen-2]='weak' → (pathLen-2)%2=1 → pathLen ODD → nextType='strong')
          // AND closing='weak'. node is the break node.
          // Assume node=ON → closing weak → startIdx=OFF → chain → after pathLen-1 steps (EVEN since pathLen ODD)
          // → value=OFF (EVEN steps → OFF) at node position. Contradiction with node=ON. ✓
          if (nextType === 'strong' && closingType === 'weak' && pathLen >= 4) {
            // incoming to node = links[pathLen-2]. With nextType='strong' at node, incoming was 'weak'.
            // links[pathLen-2] = (pathLen-2)%2=1 ? 'weak' : 'strong'. pathLen ODD → pathLen-2 ODD → 'weak'. ✓
            // Two weak at node (incoming 'weak', closing 'weak') → Rule 3 at node.
            return {
              kind: 'rule3',
              path,
              links,
              closingType,
              breakNodeIdx: node,
            };
          }

          // ---- Rule 1: Continuous loop ----
          // Need even pathLen AND closing alternates properly.
          // With even pathLen: nextType='weak'. Proper continuous close: closing='strong'... 
          // Actually, for a continuous loop the links alternate S,W,S,W,...,S,W fully around.
          // Forward links: links[0]='S', links[1]='W', ..., links[pathLen-2].
          // Closing link must be the alternating continuation: links[pathLen-1].
          // pathLen EVEN → links[pathLen-1] = (pathLen-1)%2=1 ? 'weak' : 'strong' → 'weak' if pathLen-1 ODD.
          // pathLen EVEN → pathLen-1 ODD → closing='weak'. And nextType='weak'. 
          // So: continuous loop condition: nextType='weak' AND closingType='weak'.
          if (nextType === 'weak' && closingType === 'weak') {
            return {
              kind: 'continuous',
              path,
              links,
              closingType,
              breakNodeIdx: startIdx, // not used for continuous
            };
          }

          // NOTE: Rule 3 at startIdx would require two weak at startIdx.
          // Departing from startIdx = links[0] = 'strong'. For two weak at startIdx,
          // we'd need links[0]='weak'. But we always start with nextType='strong', so links[0]='strong'.
          // Therefore Rule 3 at startIdx cannot be detected in this BFS.
          // It WILL be detected when startIdx itself is the 'node' break in another BFS iteration.
          //
          // Rule 2 at node (not startIdx): two strong at node means incoming='strong' AND closing='strong'.
          // incoming='strong' → (pathLen-2)%2=0 → pathLen EVEN → nextType='weak'.
          // But we check Rule 2 only at nextType='strong'. So Rule 2 at non-start node is NOT caught here.
          // It will be caught when that node is 'startIdx' in its own BFS run.
        }
      }

      if (pathLen >= MAX_LEN) continue;

      // Extend chain with valid alternating links
      for (const edge of graph.adjacency[node]!) {
        if (edge.type !== nextType) continue;
        if (visited.has(edge.to)) continue;
        const newVisited = new Set(visited);
        newVisited.add(edge.to);
        queue.push({
          node: edge.to,
          nextType: nextType === 'strong' ? 'weak' : 'strong',
          path: [...path, edge.to],
          links: [...links, nextType],
          visited: newVisited,
        });
      }
    }
  }

  return null;
}

// ============================================================
// Continuous loop: off-loop eliminations
// ============================================================

function continuousLoopEliminations(
  grid: Grid,
  graph: LinkGraph,
  result: LoopResult,
): { cell: number; digit: number }[] {
  const { path, links, closingType } = result;
  const pathLen = path.length;

  // Build full link sequence: links[0..pathLen-2] (forward) + closingType
  const allLinks: LinkType[] = [...links, closingType];
  // allLinks[i] is the type of link from path[i] to path[(i+1) % pathLen]

  const loopCells = new Set<number>();
  for (const ni of path) {
    for (const c of graph.nodes[ni]!.cells) loopCells.add(c);
  }

  const eliminations: { cell: number; digit: number }[] = [];
  const seenElim = new Set<string>();

  for (let i = 0; i < pathLen; i++) {
    if (allLinks[i] !== 'weak') continue; // only weak links produce eliminations

    const aIdx = path[i]!;
    const bIdx = path[(i + 1) % pathLen]!;
    const aNode = graph.nodes[aIdx]!;
    const bNode = graph.nodes[bIdx]!;

    if (aNode.digit === bNode.digit) {
      // Between-cell weak link: remove digit from off-loop cells in shared unit
      const digit = aNode.digit;
      const bit = maskOf(digit);
      for (const house of HOUSES) {
        const allACellsInHouse = aNode.cells.every((c) => house.includes(c));
        const allBCellsInHouse = bNode.cells.every((c) => house.includes(c));
        if (!allACellsInHouse || !allBCellsInHouse) continue;
        for (const cell of house) {
          if (loopCells.has(cell)) continue;
          if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
          const key = `${cell},${digit}`;
          if (seenElim.has(key)) continue;
          seenElim.add(key);
          eliminations.push({ cell, digit });
        }
      }
    } else {
      // In-cell weak link (digit switch in bivalue cell): remove other candidates from cell
      if (
        aNode.cells.length === 1 &&
        bNode.cells.length === 1 &&
        aNode.cells[0] === bNode.cells[0]
      ) {
        const cell = aNode.cells[0]!;
        const keepMask = maskOf(aNode.digit) | maskOf(bNode.digit);
        for (const d of digitsOf(grid.candidatesOf(cell))) {
          if (maskOf(d) & keepMask) continue;
          const key = `${cell},${d}`;
          if (seenElim.has(key)) continue;
          seenElim.add(key);
          eliminations.push({ cell, digit: d });
        }
      }
    }
  }

  return eliminations;
}

// ============================================================
// Build visualization links
// ============================================================

function buildLoopVizLinks(graph: LinkGraph, result: LoopResult): Link[] {
  const { path, links } = result;
  const vizLinks: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const aNode = graph.nodes[path[i]!]!;
    const bNode = graph.nodes[path[i + 1]!]!;
    const lt = links[i]!;
    const link: Link = {
      from: { cell: aNode.cells[0]!, digit: aNode.digit },
      to: { cell: bNode.cells[0]!, digit: bNode.digit },
      type: lt,
    };
    if (aNode.cells.length > 1) link.fromCells = [...aNode.cells];
    if (bNode.cells.length > 1) link.toCells = [...bNode.cells];
    vizLinks.push(link);
  }
  return vizLinks;
}

// ============================================================
// Build Step from LoopResult
// ============================================================

function buildStep(grid: Grid, graph: LinkGraph, result: LoopResult, strategyId: string): Step | null {
  const { kind, path, breakNodeIdx } = result;
  const loopLen = path.length;

  const loopCells = new Set<number>();
  for (const ni of path) {
    for (const c of graph.nodes[ni]!.cells) loopCells.add(c);
  }

  const highlightCands = [...new Set(path)].flatMap((ni) =>
    graph.nodes[ni]!.cells.map((c) => ({ cell: c, digit: graph.nodes[ni]!.digit })),
  );

  const vizLinks = buildLoopVizLinks(graph, result);

  if (kind === 'continuous') {
    const elims = continuousLoopEliminations(grid, graph, result);
    if (elims.length === 0) return null;

    const firstNode = graph.nodes[path[0]!]!;
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...new Set([...loopCells, ...elims.map((e) => e.cell)])],
        candidates: [...highlightCands, ...elims],
        links: vizLinks,
      },
      explanation: {
        zh: `连续 Nice 环（Rule 1）：长度 ${loopLen} 节点的闭合交替链从 ${candidateLabel(firstNode.cells[0]!, firstNode.digit)} 出发；弱链单元中的非环候选数被消去。`,
        en: `Continuous Nice Loop (Rule 1): closed alternating loop with ${loopLen} nodes from ${candidateLabel(firstNode.cells[0]!, firstNode.digit)}; off-loop candidates in each weak-link unit eliminated.`,
      },
    };
  }

  if (kind === 'rule2') {
    const bNode = graph.nodes[breakNodeIdx]!;
    if (bNode.cells.length !== 1) return null;
    const cell = bNode.cells[0]!;
    const digit = bNode.digit;
    if (grid.get(cell) !== 0 || !grid.hasCandidate(cell, digit)) return null;

    return {
      strategyId,
      placements: [{ cell, digit }],
      eliminations: [],
      highlights: {
        cells: [...new Set([...loopCells, cell])],
        candidates: highlightCands,
        links: vizLinks,
      },
      explanation: {
        zh: `不连续 Nice 环（Rule 2）：${cellLabel(cell)} 处两条强链汇聚；该格必须填入 ${digit}。`,
        en: `Discontinuous Nice Loop (Rule 2): two strong links meet at ${cellLabel(cell)}; must place ${digit}.`,
      },
    };
  }

  if (kind === 'rule3') {
    const bNode = graph.nodes[breakNodeIdx]!;
    if (bNode.cells.length !== 1) return null;
    const cell = bNode.cells[0]!;
    const digit = bNode.digit;
    if (!grid.hasCandidate(cell, digit)) return null;

    return {
      strategyId,
      placements: [],
      eliminations: [{ cell, digit }],
      highlights: {
        cells: [...new Set([...loopCells, cell])],
        candidates: highlightCands,
        links: vizLinks,
      },
      explanation: {
        zh: `不连续 Nice 环（Rule 3）：${cellLabel(cell)}(${digit}) 处两条弱链汇聚；假设为真则矛盾，故消去 ${digit}。`,
        en: `Discontinuous Nice Loop (Rule 3): two weak links meet at ${cellLabel(cell)}(${digit}); contradiction, so eliminate ${digit}.`,
      },
    };
  }

  return null;
}

// ============================================================
// Strategy
// ============================================================

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchNiceLoops(graph);
    if (!result) return null;
    return buildStep(grid, graph, result, 'nice-loop');
  },
};
