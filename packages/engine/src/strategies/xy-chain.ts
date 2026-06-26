/**
 * XY-Chain — XY 链.
 *
 * Chain together **bivalue cells** so that consecutive cells share one digit
 * (a "hop"). If the two free end-digits are the **same digit Z**, then at
 * least one end of the chain is Z, so any cell seeing both endpoints loses Z.
 *
 *   node = bivalue cell
 *   strong link = in-cell bivalue (¬x ⇒ y)
 *   weak link   = peer same-digit (x ⇒ ¬y)
 *   alternating sequence: Z[C₁]+a[C₁] -a[C₂]+b[C₂] -…-w[Cₙ]+Z[Cₙ]
 *
 * Reuses the chain engine's `buildLinkGraph` and restricts the search to
 * bivalue cells (single-cell nodes whose grid cell has popcount=2). Open
 * XY-Chain → eliminate Z from cells seeing both ends. Closed XY-Chain is a
 * continuous Nice Loop and is owned by `nice-loop` (E6).
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const MAX_XY_CHAIN_LENGTH = 12;

interface XyChain {
  cells: number[];
  endCells: [number, number];
  endDigit: number;
  links: Link[];
}

interface BivNodeRef {
  cell: number;
  digit: number;
  nodeIdx: number;
}

function bivalueCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (popcount(grid.candidatesOf(c)) === 2) out.push(c);
  }
  return out;
}

function buildBivNodeMap(graph: LinkGraph, bivalue: Set<number>): Map<number, BivNodeRef[]> {
  const map = new Map<number, BivNodeRef[]>();
  for (let i = 0; i < graph.nodes.length; i++) {
    const n = graph.nodes[i]!;
    if (n.cells.length !== 1) continue;
    const cell = n.cells[0]!;
    if (!bivalue.has(cell)) continue;
    if (!map.has(cell)) map.set(cell, []);
    map.get(cell)!.push({ cell, digit: n.digit, nodeIdx: i });
  }
  // Each bivalue cell should have exactly 2 single-cell nodes (one per digit).
  for (const [cell, refs] of map) {
    if (refs.length !== 2) map.delete(cell);
  }
  return map;
}

function findXyChains(grid: Grid, maxLen: number): XyChain[] {
  const bivalueSet = new Set(bivalueCells(grid));
  if (bivalueSet.size < 2) return [];
  const graph = buildLinkGraph(grid, { grouped: true });
  const nodeMap = buildBivNodeMap(graph, bivalueSet);
  if (nodeMap.size < 2) return [];

  const hits: XyChain[] = [];
  for (const [startCell, startRefs] of nodeMap) {
    // Try both orientations of the start's digits as the "Z" endpoint.
    for (let i = 0; i < 2; i++) {
      const zRef = startRefs[i]!;
      const otherRef = startRefs[1 - i]!;
      const startZ = zRef.digit;
      const startOther = otherRef.digit;
      const visited = new Set<number>([startCell]);
      const pathCells: number[] = [startCell];
      const pathLinks: Link[] = [];
      extend(
        graph,
        nodeMap,
        startCell,
        zRef,
        otherRef,
        startZ,
        startOther,
        visited,
        maxLen,
        pathCells,
        pathLinks,
        hits,
      );
    }
  }
  return hits;
}

function extend(
  graph: LinkGraph,
  nodeMap: Map<number, BivNodeRef[]>,
  currentCell: number,
  curZRef: BivNodeRef,
  curOtherRef: BivNodeRef,
  startZ: number,
  startOtherAtStart: number,
  visited: Set<number>,
  maxLen: number,
  pathCells: number[],
  pathLinks: Link[],
  out: XyChain[],
): void {
  // Strong link in-cell: -startZ[C]+otherDigit[C] (digit switch).
  pathLinks.push({
    from: { cell: currentCell, digit: curZRef.digit },
    to: { cell: currentCell, digit: curOtherRef.digit },
    type: 'strong',
  });

  if (pathCells.length >= maxLen) {
    pathLinks.pop();
    return;
  }

  // Walk weak-link neighbors of (currentCell, otherDigit) → peer bivalue cells.
  let extended = false;
  for (const edge of graph.adjacency[curOtherRef.nodeIdx]!) {
    if (edge.type !== 'weak') continue;
    const nextNode = graph.nodes[edge.to]!;
    if (nextNode.cells.length !== 1) continue;
    const nextCell = nextNode.cells[0]!;
    if (visited.has(nextCell)) continue;
    const nextRefs = nodeMap.get(nextCell);
    if (!nextRefs) continue;

    // The other digit of the next cell (i.e., the digit that is NOT the hop digit).
    const hopDigit = curOtherRef.digit;
    const zRefNext = nextRefs.find((r) => r.digit === hopDigit);
    const otherRefNext = nextRefs.find((r) => r.digit !== hopDigit);
    if (!zRefNext || !otherRefNext) continue;

    // Add weak link to (nextCell, hopDigit).
    pathLinks.push({
      from: { cell: currentCell, digit: hopDigit },
      to: { cell: nextCell, digit: hopDigit },
      type: 'weak',
    });
    visited.add(nextCell);
    pathCells.push(nextCell);

    // Check if nextCell's other digit = startZ → end of open XY-Chain.
    if (otherRefNext.digit === startZ) {
      // Close with strong link: -hopDigit+startZ at nextCell.
      pathLinks.push({
        from: { cell: nextCell, digit: hopDigit },
        to: { cell: nextCell, digit: startZ },
        type: 'strong',
      });
      out.push({
        cells: [...pathCells],
        endCells: [pathCells[0]!, nextCell],
        endDigit: startZ,
        links: [...pathLinks],
      });
      pathLinks.pop(); // close link
    } else {
      // Extend further. The new "Z endpoint" is now the other digit of nextCell, and
      // the new "other digit" (used to find weak-link hops) is hopDigit.
      extend(
        graph,
        nodeMap,
        nextCell,
        zRefNext,        // (nextCell, hopDigit) — "current Z" = hopDigit
        otherRefNext,    // (nextCell, otherRefNext.digit) — new "other"
        startZ,          // unchanged start Z
        startOtherAtStart,
        visited,
        maxLen,
        pathCells,
        pathLinks,
        out,
      );
    }

    pathCells.pop();
    visited.delete(nextCell);
    pathLinks.pop();
    extended = true;
  }

  pathLinks.pop();
  void extended;
}

function chainEliminations(grid: Grid, chain: XyChain): { cell: number; digit: number }[] {
  const [c1, cN] = chain.endCells;
  const Z = chain.endDigit;
  const out: { cell: number; digit: number }[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    if (!HOUSES[h]!.includes(c1) || !HOUSES[h]!.includes(cN)) continue;
    for (const c of HOUSES[h]!) {
      if (c === c1 || c === cN) continue;
      if (grid.get(c) !== 0) continue;
      if (!grid.hasCandidate(c, Z)) continue;
      out.push({ cell: c, digit: Z });
    }
  }
  return out;
}

export function makeXyChain(): Strategy {
  return {
    id: 'xy-chain',
    name: { zh: 'XY 链', en: 'XY-Chain' },
    difficulty: 715,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      const chains = findXyChains(grid, MAX_XY_CHAIN_LENGTH);
      // Tie-break: longest chain first (more constrained), then smallest start cell.
      chains.sort((a, b) => {
        if (a.cells.length !== b.cells.length) return b.cells.length - a.cells.length;
        return a.cells[0]! - b.cells[0]!;
      });
      for (const chain of chains) {
        const eliminations = chainEliminations(grid, chain);
        if (eliminations.length === 0) continue;
        return {
          strategyId: 'xy-chain',
          placements: [],
          eliminations,
          highlights: {
            cells: [
              ...new Set([
                ...chain.cells,
                ...eliminations.map((e) => e.cell),
              ]),
            ],
            candidates: [
              ...chain.cells.map((c) => ({ cell: c, digit: chain.endDigit })),
              ...eliminations,
            ],
            links: chain.links,
          },
          explanation: {
            zh: `XY 链：双值格链 ${chain.cells.map((c) => cellLabel(c)).join('→')} 端点同含 ${chain.endDigit}；消去同时看到两端的格子中的 ${chain.endDigit}。`,
            en: `XY-Chain: bivalue-cell chain ${chain.cells.map((c) => cellLabel(c)).join('→')} has both ends carrying ${chain.endDigit}; eliminate ${chain.endDigit} from cells seeing both endpoints.`,
          },
        };
      }
      return null;
    },
  };
}

export const xyChain: Strategy = makeXyChain();

// Avoid unused-import warnings.
void popcount;
void maskOf;
void digitsOf;
