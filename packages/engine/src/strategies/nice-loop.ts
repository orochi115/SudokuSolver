/**
 * Nice Loop (P0) — Nice 环
 *
 * Continuous & Discontinuous Nice Loops using the identical neighbor/DFS
 * infrastructure as the existing legacy AIC search (aic.ts), with added
 * loop detection (returning to start).
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface CandNode {
  cell: number;
  digit: number;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

function strongNeighbors(grid: Grid, node: CandNode): CandNode[] {
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

function weakNeighbors(grid: Grid, node: CandNode): CandNode[] {
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

const MAX_DEPTH = 12;

interface LoopResult {
  path: CandNode[];
  linkTypes: LinkType[];
  start: CandNode;
}

function searchNiceLoop(grid: Grid): Step | null {
  const startNodes: CandNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if (strongNeighbors(grid, { cell: c, digit: d }).length > 0) {
        startNodes.push({ cell: c, digit: d });
      }
    }
  }

  for (const start of startNodes) {
    const state = {
      path: [start] as CandNode[],
      linkTypes: [] as LinkType[],
      visited: new Set<number>([encodeNode(start.cell, start.digit)]),
    };

    const result = dfsStrong(grid, state, start, start);
    if (result) {
      const step = buildLoopStep(grid, result);
      if (step) return step;
    }
  }
  return null;
}

function dfsStrong(grid: Grid, state: { path: CandNode[]; linkTypes: LinkType[]; visited: Set<number> }, current: CandNode, start: CandNode): LoopResult | null {
  if (state.path.length >= MAX_DEPTH) return null;

  for (const next of strongNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);

    // Check for returning to start
    if (next.cell === start.cell && next.digit === start.digit && state.path.length >= 2) {
      const linkTypes: LinkType[] = [...state.linkTypes, 'strong'];
      return { path: [...state.path], linkTypes, start };
    }

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkTypes.push('strong');

    const result = dfsWeak(grid, state, next, start);
    state.path.pop();
    state.linkTypes.pop();
    state.visited.delete(key);
    if (result) return result;
  }
  return null;
}

function dfsWeak(grid: Grid, state: { path: CandNode[]; linkTypes: LinkType[]; visited: Set<number> }, current: CandNode, start: CandNode): LoopResult | null {
  if (state.path.length >= MAX_DEPTH) return null;

  for (const next of weakNeighbors(grid, current)) {
    const key = encodeNode(next.cell, next.digit);

    // Check for returning to start with WEAK link
    if (next.cell === start.cell && next.digit === start.digit && state.path.length >= 2) {
      const linkTypes: LinkType[] = [...state.linkTypes, 'weak'];
      return { path: [...state.path], linkTypes, start };
    }

    if (state.visited.has(key)) continue;
    state.visited.add(key);
    state.path.push(next);
    state.linkTypes.push('weak');

    const result = dfsStrong(grid, state, next, start);
    state.path.pop();
    state.linkTypes.pop();
    state.visited.delete(key);
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

function buildLoopStep(grid: Grid, loop: LoopResult): Step | null {
  const { path, linkTypes, start } = loop;
  if (path.length < 2) return null;

  const firstType = linkTypes[0]!;
  const lastType = linkTypes[linkTypes.length - 1]!;

  // Build links for display
  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: path[i]!.cell, digit: path[i]!.digit },
      to: { cell: path[i + 1]!.cell, digit: path[i + 1]!.digit },
      type: linkTypes[i]!,
    });
  }
  // Return link
  links.push({
    from: { cell: path[path.length - 1]!.cell, digit: path[path.length - 1]!.digit },
    to: { cell: start.cell, digit: start.digit },
    type: lastType,
  });

  const allCells = [...new Set(path.map((n) => n.cell))];
  const allCands = path.map((n) => ({ cell: n.cell, digit: n.digit }));

  // Classify loop
  const isContinuous = (firstType === 'strong' && lastType === 'weak')
    || (firstType === 'weak' && lastType === 'strong');

  if (isContinuous) {
    // Rule 1: off-chain eliminations on each weak link
    const eliminations: { cell: number; digit: number }[] = [];
    const loopCells = new Set(path.map((n) => n.cell));

    for (let i = 0; i < path.length; i++) {
      const j = (i + 1) % path.length;
      const a = path[i]!;
      const b = path[j]!;
      const linkType = i < linkTypes.length ? linkTypes[i]! : lastType;
      if (linkType !== 'weak' || a.digit !== b.digit) continue;

      const digit = a.digit;
      const bit = maskOf(digit);

      const sharedHouses: number[] = [];
      if (ROW_OF[a.cell] === ROW_OF[b.cell]) sharedHouses.push(ROW_OF[a.cell]!);
      if (COL_OF[a.cell] === COL_OF[b.cell]) sharedHouses.push(9 + COL_OF[a.cell]!);
      if (BOX_OF[a.cell] === BOX_OF[b.cell]) sharedHouses.push(18 + BOX_OF[a.cell]!);

      for (const h of sharedHouses) {
        for (const c of HOUSES[h]!) {
          if (loopCells.has(c)) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
            const key = c * 10 + digit;
            if (!eliminations.some((e) => e.cell === c && e.digit === digit)) {
              eliminations.push({ cell: c, digit });
            }
          }
        }
      }
    }

    if (eliminations.length === 0) return null;

    return {
      strategyId: 'nice-loop',
      placements: [],
      eliminations: deduplicateElims(eliminations),
      highlights: { cells: allCells, candidates: allCands, links },
      explanation: {
        zh: `连续 Nice 环：${path.map((n) => `${cellLabel(n.cell)}(${n.digit})`).join('-')} 构成连续环，弱链所在单元中消去 ${eliminations.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}。`,
        en: `Continuous Nice Loop: ${path.map((n) => `${cellLabel(n.cell)}(${n.digit})`).join('-')} is continuous; eliminate ${eliminations.length} candidates from weak-link houses.`,
      },
    };
  }

  // Discontinuous
  if (firstType === 'strong' && lastType === 'strong') {
    // Rule 2: placement
    const cell = start.cell;
    const digit = start.digit;
    if (grid.get(cell) !== 0) return null;

    return {
      strategyId: 'nice-loop',
      placements: [{ cell, digit }],
      eliminations: [],
      highlights: { cells: allCells, candidates: allCands, links },
      explanation: {
        zh: `不连续 Nice 环（R2）：两强链在 ${cellLabel(cell)}(${digit}) 相遇，必须填入 ${digit}。`,
        en: `Discontinuous Nice Loop (Rule 2): two strong links at ${cellLabel(cell)}(${digit}); must place ${digit}.`,
      },
    };
  }

  if (firstType === 'weak' && lastType === 'weak') {
    // Rule 3: elimination
    const cell = start.cell;
    const digit = start.digit;
    if (!grid.hasCandidate(cell, digit)) return null;

    return {
      strategyId: 'nice-loop',
      placements: [],
      eliminations: [{ cell, digit }],
      highlights: { cells: allCells, candidates: allCands, links },
      explanation: {
        zh: `不连续 Nice 环（R3）：两弱链在 ${cellLabel(cell)}(${digit}) 相遇，产生矛盾，消去该候选。`,
        en: `Discontinuous Nice Loop (Rule 3): two weak links at ${cellLabel(cell)}(${digit}); eliminate ${digit}.`,
      },
    };
  }

  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    return searchNiceLoop(grid);
  },
};