import { ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf, popcount, ROWS, COLS, BOXES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link } from '../trace.js';

export interface LinkNode {
  cell: number;
  digit: number;
}

export class LinkGraph {
  private strongMap: Map<string, LinkNode[]> = new Map();
  private weakMap: Map<string, LinkNode[]> = new Map();

  private key(node: LinkNode): string {
    return `${node.cell}:${node.digit}`;
  }

  addStrong(from: LinkNode, to: LinkNode): void {
    this.push(this.strongMap, this.key(from), to);
    this.push(this.strongMap, this.key(to), from);
  }

  addWeak(from: LinkNode, to: LinkNode): void {
    this.push(this.weakMap, this.key(from), to);
    this.push(this.weakMap, this.key(to), from);
  }

  strongNeighbors(node: LinkNode): LinkNode[] {
    return this.strongMap.get(this.key(node)) ?? [];
  }

  weakNeighbors(node: LinkNode): LinkNode[] {
    return this.weakMap.get(this.key(node)) ?? [];
  }

  neighbors(node: LinkNode, type: 'strong' | 'weak'): LinkNode[] {
    return type === 'strong' ? this.strongNeighbors(node) : this.weakNeighbors(node);
  }

  allNodes(): LinkNode[] {
    const seen = new Map<string, LinkNode>();
    for (const [k] of this.strongMap) {
      const [cell, digit] = k.split(':');
      seen.set(k, { cell: Number(cell), digit: Number(digit) });
    }
    for (const [k] of this.weakMap) {
      const [cell, digit] = k.split(':');
      seen.set(k, { cell: Number(cell), digit: Number(digit) });
    }
    return [...seen.values()];
  }

  private push(map: Map<string, LinkNode[]>, key: string, node: LinkNode): void {
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(node);
  }
}

export function buildLinkGraph(grid: Grid): LinkGraph {
  const graph = new LinkGraph();
  const allHouses = [...ROWS, ...COLS, ...BOXES];

  for (const house of allHouses) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const locs: number[] = [];
      for (const c of house) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) locs.push(c);
      }
      if (locs.length === 2) {
        graph.addStrong({ cell: locs[0]!, digit: d }, { cell: locs[1]!, digit: d });
      } else if (locs.length >= 3) {
        for (let i = 0; i < locs.length; i++) {
          for (let j = i + 1; j < locs.length; j++) {
            graph.addWeak({ cell: locs[i]!, digit: d }, { cell: locs[j]!, digit: d });
          }
        }
      }
    }
  }

  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0) continue;
    const mask = grid.candidatesOf(c);
    if (popcount(mask) === 2) {
      const ds = digitsOf(mask);
      graph.addStrong({ cell: c, digit: ds[0]! }, { cell: c, digit: ds[1]! });
    } else if (popcount(mask) >= 3) {
      const ds = digitsOf(mask);
      for (let i = 0; i < ds.length; i++) {
        for (let j = i + 1; j < ds.length; j++) {
          graph.addWeak({ cell: c, digit: ds[i]! }, { cell: c, digit: ds[j]! });
        }
      }
    }
  }

  return graph;
}

export interface AICChain {
  nodes: LinkNode[];
  linkTypes: ('strong' | 'weak')[];
  links: Link[];
}

export function searchAIC(graph: LinkGraph, grid: Grid, maxLen: number = 10): AICChain | null {
  const nodes = graph.allNodes();

  for (const start of nodes) {
    const result = dfsAIC(graph, grid, start, maxLen);
    if (result) return result;
  }
  return null;
}

function dfsAIC(graph: LinkGraph, grid: Grid, start: LinkNode, maxLen: number): AICChain | null {
  const path: LinkNode[] = [start];
  const types: ('strong' | 'weak')[] = [];
  const visited = new Set<string>();
  visited.add(`${start.cell}:${start.digit}`);

  const result = backtrackAIC(graph, grid, start, path, types, visited, maxLen, true);
  if (result) return result;

  visited.delete(`${start.cell}:${start.digit}`);

  return null;
}

function backtrackAIC(
  graph: LinkGraph,
  grid: Grid,
  current: LinkNode,
  path: LinkNode[],
  types: ('strong' | 'weak')[],
  visited: Set<string>,
  maxLen: number,
  needStrong: boolean,
): AICChain | null {
  if (path.length >= maxLen) return null;

  const nextType = needStrong ? 'strong' : 'weak';
  const neighbors = graph.neighbors(current, nextType);

  for (const next of neighbors) {
    const nk = `${next.cell}:${next.digit}`;
    if (visited.has(nk)) continue;

    path.push(next);
    types.push(nextType);
    visited.add(nk);

    if (path.length >= 3 && isAlternating(types)) {
      const evalResult = evaluateAIC(grid, path, types);
      if (evalResult) {
        const links = buildLinks(path, types);
        return { nodes: [...path], linkTypes: [...types], links };
      }
    }

    const deeper = backtrackAIC(graph, grid, next, path, types, visited, maxLen, !needStrong);
    if (deeper) return deeper;

    path.pop();
    types.pop();
    visited.delete(nk);
  }

  return null;
}

function isAlternating(types: ('strong' | 'weak')[]): boolean {
  for (let i = 1; i < types.length; i++) {
    if (types[i] === types[i - 1]) return false;
  }
  return true;
}

function evaluateAIC(grid: Grid, path: LinkNode[], types: ('strong' | 'weak')[]): CellDigit[] | null {
  const start = path[0]!;
  const end = path[path.length - 1]!;

  if (start.digit === end.digit) {
    const eliminations: CellDigit[] = [];
    const bit = maskOf(start.digit);
    for (const p of PEERS_OF[start.cell]!) {
      if (p === end.cell) continue;
      if (PEERS_OF[end.cell]!.includes(p) && grid.get(p) === 0 && (grid.candidatesOf(p) & bit) !== 0) {
        eliminations.push({ cell: p, digit: start.digit });
      }
    }
    if (eliminations.length > 0) return eliminations;
  }

  if (start.cell === end.cell && start.digit !== end.digit) {
    const otherMask = grid.candidatesOf(start.cell) & ~(maskOf(start.digit) | maskOf(end.digit));
    if (otherMask !== 0 && popcount(grid.candidatesOf(start.cell)) === 3) {
      const eliminations: CellDigit[] = [];
      for (const dd of digitsOf(otherMask)) {
        eliminations.push({ cell: start.cell, digit: dd });
      }
      if (eliminations.length > 0) return eliminations;
    }
  }

  if (PEERS_OF[start.cell]!.includes(end.cell) && start.digit !== end.digit) {
    const eliminations: CellDigit[] = [];
    const sBit = maskOf(start.digit);
    const eBit = maskOf(end.digit);
    for (const p of PEERS_OF[start.cell]!) {
      if (!PEERS_OF[end.cell]!.includes(p)) continue;
      if (p === start.cell || p === end.cell) continue;
      if (grid.get(p) !== 0) continue;
      const mask = grid.candidatesOf(p);
      if ((mask & sBit) !== 0 && (mask & eBit) !== 0) {
        for (const d of [start.digit, end.digit]) {
          eliminations.push({ cell: p, digit: d });
        }
      }
    }
    if (eliminations.length > 0) return eliminations;
  }

  return null;
}

function buildLinks(path: LinkNode[], types: ('strong' | 'weak')[]): Link[] {
  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: path[i]!.cell, digit: path[i]!.digit },
      to: { cell: path[i + 1]!.cell, digit: path[i + 1]!.digit },
      type: types[i]!,
    });
  }
  return links;
}

export function findNiceLoop(graph: LinkGraph, grid: Grid, maxLen: number = 10): AICChain | null {
  const nodes = graph.allNodes();

  for (const start of nodes) {
    const result = dfsNiceLoop(graph, grid, start, maxLen);
    if (result) return result;
  }
  return null;
}

function dfsNiceLoop(graph: LinkGraph, grid: Grid, start: LinkNode, maxLen: number): AICChain | null {
  const path: LinkNode[] = [start];
  const types: ('strong' | 'weak')[] = [];
  const visited = new Set<string>();
  visited.add(`${start.cell}:${start.digit}`);

  const result = backtrackNiceLoop(graph, grid, start, path, types, visited, maxLen, true, start);
  if (result) return result;

  return null;
}

function backtrackNiceLoop(
  graph: LinkGraph,
  grid: Grid,
  current: LinkNode,
  path: LinkNode[],
  types: ('strong' | 'weak')[],
  visited: Set<string>,
  maxLen: number,
  needStrong: boolean,
  start: LinkNode,
): AICChain | null {
  if (path.length >= maxLen) return null;

  const nextType = needStrong ? 'strong' : 'weak';
  const neighbors = graph.neighbors(current, nextType);

  for (const next of neighbors) {
    const nk = `${next.cell}:${next.digit}`;

    if (path.length >= 3 && next.cell === start.cell && next.digit === start.digit) {
      const loopTypes: ('strong' | 'weak')[] = [...types, nextType];
      if (isAlternating(loopTypes)) {
        const evalResult = evaluateContinuousLoop(grid, path, loopTypes);
        if (evalResult && evalResult.length > 0) {
          const links = buildLoopLinks(path, loopTypes);
          return { nodes: [...path], linkTypes: loopTypes, links };
        }
      }
    }

    if (visited.has(nk)) continue;

    path.push(next);
    types.push(nextType);
    visited.add(nk);

    const deeper = backtrackNiceLoop(graph, grid, next, path, types, visited, maxLen, !needStrong, start);
    if (deeper) return deeper;

    path.pop();
    types.pop();
    visited.delete(nk);
  }

  return null;
}

function evaluateContinuousLoop(grid: Grid, path: LinkNode[], types: ('strong' | 'weak')[]): CellDigit[] | null {
  const eliminations: CellDigit[] = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i]! !== 'weak') continue;
    const from = path[i]!;
    const to = path[(i + 1) % path.length]!;

    if (from.digit === to.digit) {
      const bit = maskOf(from.digit);
      for (const p of PEERS_OF[from.cell]!) {
        if (p === to.cell) continue;
        if (PEERS_OF[to.cell]!.includes(p) && grid.get(p) === 0 && (grid.candidatesOf(p) & bit) !== 0) {
          eliminations.push({ cell: p, digit: from.digit });
        }
      }
    }
  }
  return eliminations.length > 0 ? eliminations : null;
}

function buildLoopLinks(path: LinkNode[], types: ('strong' | 'weak')[]): Link[] {
  const links: Link[] = [];
  for (let i = 0; i < path.length; i++) {
    const next = path[(i + 1) % path.length]!;
    links.push({
      from: { cell: path[i]!.cell, digit: path[i]!.digit },
      to: { cell: next.cell, digit: next.digit },
      type: types[i]!,
    });
  }
  return links;
}

export function findXYChain(grid: Grid, graph: LinkGraph, maxLen: number = 8): AICChain | null {
  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0) continue;
    if (popcount(grid.candidatesOf(c)) !== 2) continue;

    const ds = digitsOf(grid.candidatesOf(c));
    for (const startDigit of ds) {
      const start: LinkNode = { cell: c, digit: startDigit };
      const result = dfsXYChain(graph, grid, start, maxLen);
      if (result) return result;
    }
  }
  return null;
}

function dfsXYChain(graph: LinkGraph, grid: Grid, start: LinkNode, maxLen: number): AICChain | null {
  const path: LinkNode[] = [start];
  const types: ('strong' | 'weak')[] = [];
  const visitedCells = new Set<number>();
  visitedCells.add(start.cell);

  const result = backtrackXYChain(graph, grid, start, path, types, visitedCells, maxLen, true);
  if (result) return result;

  return null;
}

function backtrackXYChain(
  graph: LinkGraph,
  grid: Grid,
  current: LinkNode,
  path: LinkNode[],
  types: ('strong' | 'weak')[],
  visitedCells: Set<number>,
  maxLen: number,
  needStrong: boolean,
): AICChain | null {
  if (path.length >= maxLen) return null;

  const nextType = needStrong ? 'strong' : 'weak';
  const neighbors = graph.neighbors(current, nextType);

  for (const next of neighbors) {
    if (visitedCells.has(next.cell)) {
      if (path.length >= 3 && next.cell === path[0]!.cell && next.digit !== path[0]!.digit) {
        if (isAlternating([...types, nextType])) {
          const mask = grid.candidatesOf(path[0]!.cell);
          const otherMask = mask & ~(maskOf(path[0]!.digit) | maskOf(next.digit));
          if (otherMask !== 0) {
            const eliminations: CellDigit[] = [];
            for (const dd of digitsOf(otherMask)) {
              eliminations.push({ cell: path[0]!.cell, digit: dd });
            }
            if (eliminations.length > 0) {
              const loopTypes: ('strong' | 'weak')[] = [...types, nextType];
              const links = buildLoopLinks(path, loopTypes);
              return { nodes: [...path], linkTypes: loopTypes, links };
            }
          }
        }
      }
      continue;
    }

    if (nextType === 'strong' && popcount(grid.candidatesOf(next.cell)) !== 2) continue;

    path.push(next);
    types.push(nextType);
    visitedCells.add(next.cell);

    const endDigit = next.digit;
    const endCell = next.cell;
    const startDigit = path[0]!.digit;

    if (path.length >= 3 && isAlternating(types) && startDigit !== endDigit && PEERS_OF[path[0]!.cell]!.includes(endCell)) {
      const eliminations: CellDigit[] = [];
      for (const p of PEERS_OF[path[0]!.cell]!) {
        if (p === endCell) continue;
        if (PEERS_OF[endCell]!.includes(p) && grid.get(p) === 0) {
          const pMask = grid.candidatesOf(p);
          if ((pMask & maskOf(startDigit)) !== 0 && (pMask & maskOf(endDigit)) !== 0) {
            eliminations.push({ cell: p, digit: startDigit });
            eliminations.push({ cell: p, digit: endDigit });
          }
        }
      }
      const uniqueElims = dedupCellDigits(eliminations);
      if (uniqueElims.length > 0) {
        const links = buildLinks(path, types);
        return { nodes: [...path], linkTypes: [...types], links };
      }
    }

    const deeper = backtrackXYChain(graph, grid, next, path, types, visitedCells, maxLen, !needStrong);
    if (deeper) return deeper;

    path.pop();
    types.pop();
    visitedCells.delete(next.cell);
  }

  return null;
}

function dedupCellDigits(elims: CellDigit[]): CellDigit[] {
  const seen = new Set<string>();
  const result: CellDigit[] = [];
  for (const e of elims) {
    const k = `${e.cell}:${e.digit}`;
    if (!seen.has(k)) {
      seen.add(k);
      result.push(e);
    }
  }
  return result;
}