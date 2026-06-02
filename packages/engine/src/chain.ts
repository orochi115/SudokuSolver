/**
 * Chain infrastructure for AIC engine.
 *
 * Nodes: CellDigit pairs (cell, digit)
 * Edges: Strong or Weak links between candidates
 *
 * Strong link: if A is false, B is true (binary relationship)
 * Weak link: if A is true, B is false
 *
 * A chain alternates: Strong - Weak - Strong - Weak ...
 *
 * Grouped links allow multiple cells to act as one node (ALS, etc.)
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from './grid.js';
import type { Grid } from './grid.js';
import type { CellDigit, Link, LinkType } from './trace.js';

export interface ChainNode {
  cells: number[];
  digits: number[];
}

export interface ChainLink {
  from: ChainNode;
  to: ChainNode;
  type: LinkType;
}

export type LinkMap = Map<string, ChainLink[]>;

export function nodeKey(cells: number[], digits: number[]): string {
  return `${cells.sort().join(',')}:${digits.sort().join(',')}`;
}

function cdKey(cd: CellDigit): string {
  return `${cd.cell}:${cd.digit}`;
}

export function parseKey(key: string): { cells: number[]; digits: number[] } {
  const [cellsStr, digitsStr] = key.split(':');
  if (!cellsStr || !digitsStr) return { cells: [], digits: [] };
  return {
    cells: cellsStr.split(',').map(Number),
    digits: digitsStr.split(',').map(Number),
  };
}

/** Find all strong links for a given digit.
 * A strong link exists when two cells in the same house both contain digit D
 * and no other cell in that house can have D.
 * Strong link = binary (exactly two candidates for the digit in the house).
 */
export function findStrongLinksForDigit(grid: Grid, digit: number): ChainLink[] {
  const links: ChainLink[] = [];
  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    for (const c of house) {
      if (grid.values[c] === 0 && (grid.candidates[c]! & maskOf(digit))) {
        cellsWithDigit.push(c);
      }
    }
    if (cellsWithDigit.length === 2) {
      links.push({
        from: { cells: [cellsWithDigit[0]!], digits: [digit] },
        to: { cells: [cellsWithDigit[1]!], digits: [digit] },
        type: 'strong',
      });
    }
  }
  return links;
}

/** Find all weak links for a given digit.
 * A weak link exists when two cells in the same house both contain digit D
 * but there could be more than two.
 * Weak link = if A is true, B is not (not binary).
 */
export function findWeakLinksForDigit(grid: Grid, digit: number): ChainLink[] {
  const links: ChainLink[] = [];
  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    for (const c of house) {
      if (grid.values[c] === 0 && (grid.candidates[c]! & maskOf(digit))) {
        cellsWithDigit.push(c);
      }
    }
    if (cellsWithDigit.length >= 2) {
      for (let i = 0; i < cellsWithDigit.length - 1; i++) {
        for (let j = i + 1; j < cellsWithDigit.length; j++) {
          links.push({
            from: { cells: [cellsWithDigit[i]!], digits: [digit] },
            to: { cells: [cellsWithDigit[j]!], digits: [digit] },
            type: 'weak',
          });
        }
      }
    }
  }
  return links;
}

/** Build a link map for a digit: candidate -> links */
export function buildLinkMap(grid: Grid, digit: number): Map<string, ChainLink[]> {
  const strongLinks = findStrongLinksForDigit(grid, digit);
  const weakLinks = findWeakLinksForDigit(grid, digit);
  const linkMap = new Map<string, ChainLink[]>();

  const addLink = (link: ChainLink) => {
    const fromKey = nodeKey(link.from.cells, link.from.digits);
    const toKey = nodeKey(link.to.cells, link.to.digits);
    if (!linkMap.has(fromKey)) linkMap.set(fromKey, []);
    linkMap.get(fromKey)!.push({ from: link.from, to: link.to, type: link.type });
  };

  for (const link of strongLinks) addLink(link);
  for (const link of weakLinks) addLink(link);
  return linkMap;
}

/** Check if two ChainNodes overlap (share any cell) */
function nodesOverlap(a: ChainNode, b: ChainNode): boolean {
  for (const c of a.cells) {
    if (b.cells.includes(c)) return true;
  }
  return false;
}

/** Check if node a sees node b (any cell of a sees any cell of b) */
export function nodeSeeNode(a: ChainNode, b: ChainNode): boolean {
  for (const c1 of a.cells) {
    for (const c2 of b.cells) {
      if (c1 === c2 || PEERS_OF[c1]!.includes(c2)) return true;
    }
  }
  return false;
}

/** All candidates (as CellDigit) for a ChainNode */
export function nodeToCellDigits(node: ChainNode): CellDigit[] {
  const result: CellDigit[] = [];
  for (const cell of node.cells) {
    for (const digit of node.digits) {
      result.push({ cell, digit });
    }
  }
  return result;
}

/** Check if a ChainNode is a single candidate */
function isSingleNode(node: ChainNode): boolean {
  return node.cells.length === 1 && node.digits.length === 1;
}

/** Check if node contains a specific CellDigit */
export function nodeHasCellDigit(node: ChainNode, cd: CellDigit): boolean {
  return node.cells.includes(cd.cell) && node.digits.includes(cd.digit);
}

/** Find all candidates (cell, digit) for a given digit in the grid */
export function allCandidatesForDigit(grid: Grid, digit: number): CellDigit[] {
  const result: CellDigit[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] === 0 && grid.hasCandidate(cell, digit)) {
      result.push({ cell, digit });
    }
  }
  return result;
}

/** Find X-Chain: a chain of strong links on one digit.
 * Returns a chain of alternating nodes. If the chain forms a discontinuity
 * (endpoints see each other), we get eliminations.
 */
export interface XChainResult {
  chain: ChainNode[];
  links: Link[];
  eliminations: CellDigit[];
}

export function findXChain(grid: Grid, digit: number): XChainResult | null {
  const strongLinks = findStrongLinksForDigit(grid, digit);
  if (strongLinks.length < 2) return null;

  const adj = new Map<string, Set<string>>();
  for (const link of strongLinks) {
    const fromKey = nodeKey(link.from.cells, link.from.digits);
    const toKey = nodeKey(link.to.cells, link.to.digits);
    if (!adj.has(fromKey)) adj.set(fromKey, new Set());
    if (!adj.has(toKey)) adj.set(toKey, new Set());
    adj.get(fromKey)!.add(toKey);
    adj.get(toKey)!.add(fromKey);
  }

  const nodeKeys = [...adj.keys()];
  const results: XChainResult | null[] = nodeKeys.map(() => null);

  for (let startIdx = 0; startIdx < nodeKeys.length; startIdx++) {
    for (let endIdx = startIdx + 1; endIdx < nodeKeys.length; endIdx++) {
      const startKey = nodeKeys[startIdx]!;
      const endKey = nodeKeys[endIdx]!;

      const path = bfsPath(adj, startKey, endKey);
      if (!path || path.length < 2) continue;

      const chainNodes = path.map(k => parseKey(k));
      const links: Link[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const from = parseKey(path[i]!);
        const to = parseKey(path[i + 1]!);
        const fromCd = { cell: from.cells[0]!, digit: from.digits[0]! };
        const toCd = { cell: to.cells[0]!, digit: to.digits[0]! };
        links.push({ from: fromCd, to: toCd, type: 'strong' });
      }

      const startNode = parseKey(startKey);
      const endNode = parseKey(endKey);
      const elims: CellDigit[] = [];

      if (nodeSeeNode(startNode, endNode)) {
        for (const c1 of startNode.cells) {
          for (const c2 of endNode.cells) {
            if (c1 !== c2 && PEERS_OF[c1]!.includes(c2)) {
              if (grid.hasCandidate(c2, digit)) {
                elims.push({ cell: c2, digit });
              }
            }
          }
        }
      }

      if (elims.length > 0 || path.length >= 4) {
        return { chain: chainNodes, links, eliminations: elims };
      }
    }
  }

  return null;
}

function bfsPath(adj: Map<string, Set<string>>, start: string, end: string): string[] | null {
  if (start === end) return [start];
  const queue: string[][] = [[start]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const cur = path[path.length - 1]!;
    for (const nb of adj.get(cur) ?? []) {
      if (nb === end) return [...path, nb];
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([...path, nb]);
      }
    }
  }
  return null;
}

/** AIC Engine: generic alternating inference chain search.
 *
 * Searches for chains that alternate strong-weak-strong-weak...
 * Handles grouped nodes for ALS support.
 */
export interface AICSearchOptions {
  maxDepth?: number;
  allowContinuousLoop?: boolean;
  allowDiscontinuousLoop?: boolean;
}

export interface AICResult {
  chain: ChainNode[];
  links: Link[];
  eliminations: CellDigit[];
  isContinuousLoop: boolean;
}

export function findAIC(
  grid: Grid,
  options: AICSearchOptions = {}
): AICResult[] {
  const results: AICResult[] = [];
  const { maxDepth = 10, allowContinuousLoop = true, allowDiscontinuousLoop = true } = options;

  for (let digit = 1; digit <= 9; digit++) {
    const strongLinks = findStrongLinksForDigit(grid, digit);
    const weakLinks = findWeakLinksForDigit(grid, digit);

    const linkMap = new Map<string, { neighbor: string; type: LinkType }[]>();

    const addEdge = (from: string, to: string, type: LinkType) => {
      if (!linkMap.has(from)) linkMap.set(from, []);
      linkMap.get(from)!.push({ neighbor: to, type });
    };

    for (const link of strongLinks) {
      const fromKey = nodeKey(link.from.cells, link.from.digits);
      const toKey = nodeKey(link.to.cells, link.to.digits);
      addEdge(fromKey, toKey, 'strong');
      addEdge(toKey, fromKey, 'strong');
    }
    for (const link of weakLinks) {
      const fromKey = nodeKey(link.from.cells, link.from.digits);
      const toKey = nodeKey(link.to.cells, link.to.digits);
      addEdge(fromKey, toKey, 'weak');
      addEdge(toKey, fromKey, 'weak');
    }

    const nodes = [...linkMap.keys()];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const startKey = nodes[i]!;
        const endKey = nodes[j]!;

        const startNode = parseKey(startKey);
        const endNode = parseKey(endKey);

        const chains = dfsChains(linkMap, startKey, endKey, maxDepth, startKey);

        for (const chain of chains) {
          if (chain.length < 2) continue;

          const isContinuous = chain[0] === chain[chain.length - 1];
          if (isContinuous && !allowContinuousLoop) continue;

          const aicLinks: Link[] = [];
          for (let k = 0; k < chain.length - 1; k++) {
            const fromNode = parseKey(chain[k]!);
            const toNode = parseKey(chain[k + 1]!);
            const fromCd = { cell: fromNode.cells[0]!, digit: fromNode.digits[0]! };
            const toCd = { cell: toNode.cells[0]!, digit: toNode.digits[0]! };
            const linkType = k % 2 === 0 ? 'strong' : 'weak';
            aicLinks.push({ from: fromCd, to: toCd, type: linkType });
          }

          const elims = findAICEliminations(chain, grid, isContinuous);

          if (elims.length > 0 || aicLinks.length >= 4) {
            const chainNodes = chain.map(k => parseKey(k));
            results.push({
              chain: chainNodes,
              links: aicLinks,
              eliminations: elims,
              isContinuousLoop: isContinuous,
            });
          }
        }
      }
    }
  }

  return results;
}

function dfsChains(
  linkMap: Map<string, { neighbor: string; type: LinkType }[]>,
  start: string,
  end: string,
  maxDepth: number,
  pathStart: string
): string[][] {
  const results: string[][] = [];
  const visited = new Map<string, number>();

  function dfs(cur: string, target: string, depth: number, path: string[]): void {
    if (depth > maxDepth) return;

    const count = visited.get(cur) ?? 0;
    if (count >= 2) return;
    visited.set(cur, count + 1);

    if (cur === target && depth >= 2) {
      results.push([...path]);
      visited.set(cur, count);
      return;
    }

    const edges = linkMap.get(cur) ?? [];
    for (const edge of edges) {
      const expectedType = (path.length - 1) % 2 === 0 ? 'weak' : 'strong';
      if (edge.type !== expectedType) continue;

      if (!visited.has(edge.neighbor) || visited.get(edge.neighbor)! < 2) {
        dfs(edge.neighbor, target, depth + 1, [...path, edge.neighbor]);
      }
    }

    visited.set(cur, count);
  }

  dfs(start, end, 1, [start]);
  return results;
}

function findAICEliminations(chain: string[], grid: Grid, isContinuousLoop: boolean): CellDigit[] {
  if (chain.length < 2) return [];

  const elims: CellDigit[] = [];
  const startNode = parseKey(chain[0]!);
  const endNode = parseKey(chain[chain.length - 1]!);

  if (chain[0] === chain[chain.length - 1]) {
    return [];
  }

  if (nodeSeeNode(startNode, endNode)) {
    const digit = endNode.digits[0]!;
    for (const c of endNode.cells) {
      if (grid.hasCandidate(c, digit)) {
        const seesStart = startNode.cells.some(c2 => c2 !== c && PEERS_OF[c]!.includes(c2));
        if (seesStart) {
          elims.push({ cell: c, digit });
        }
      }
    }
  }

  return elims;
}

/** Find XY-Chain: chain where each node is a bivalue cell with digits XY, YZ, etc. */
export interface XYChainResult {
  chain: ChainNode[];
  links: Link[];
  eliminations: CellDigit[];
}

export function findXYChain(grid: Grid): XYChainResult | null {
  const bivalueCells: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] === 0 && popcount(grid.candidatesOf(cell)) === 2) {
      bivalueCells.push(cell);
    }
  }

  const adj = new Map<string, { neighbor: string; sharedDigit: number }[]>();

  for (const c1 of bivalueCells) {
    const digits1 = digitsOf(grid.candidatesOf(c1));
    for (const c2 of bivalueCells) {
      if (c1 === c2) continue;
      if (!PEERS_OF[c1]!.includes(c2)) continue;

      const digits2 = digitsOf(grid.candidatesOf(c2));
      const shared = digits1.filter(d => digits2.includes(d));
      if (shared.length === 1) {
        const d = shared[0]!;
        const key1 = nodeKey([c1], [digits1.find(x => x !== d)!]);
        const key2 = nodeKey([c2], [digits2.find(x => x !== d)!]);
        if (!adj.has(key1)) adj.set(key1, []);
        adj.get(key1)!.push({ neighbor: key2, sharedDigit: d });
      }
    }
  }

  for (const [key, neighbors] of adj) {
    if (neighbors.length < 2) continue;

    for (let i = 0; i < neighbors.length - 1; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const ni = neighbors[i]!;
        const nj = neighbors[j]!;

        if (ni.neighbor === nj.neighbor) continue;

        const nodeI = parseKey(key);
        const nodeJ = parseKey(key);
        const endNodeI = parseKey(ni.neighbor);
        const endNodeJ = parseKey(nj.neighbor);

        if (nodeSeeNode(endNodeI, endNodeJ)) {
          const elimDigit = nj.sharedDigit;
          const elimCell = endNodeJ.cells[0]!;
          if (grid.hasCandidate(elimCell, elimDigit)) {
            return {
              chain: [nodeI, endNodeI, nodeJ, endNodeJ],
              links: [
                { from: { cell: nodeI.cells[0]!, digit: nodeI.digits[0]! }, to: { cell: endNodeI.cells[0]!, digit: endNodeI.digits[0]! }, type: 'strong' },
                { from: { cell: endNodeI.cells[0]!, digit: endNodeI.digits[0]! }, to: { cell: nodeJ.cells[0]!, digit: nodeJ.digits[0]! }, type: 'weak' },
                { from: { cell: nodeJ.cells[0]!, digit: nodeJ.digits[0]! }, to: { cell: endNodeJ.cells[0]!, digit: endNodeJ.digits[0]! }, type: 'strong' },
              ],
              eliminations: [{ cell: elimCell, digit: elimDigit }],
            };
          }
        }
      }
    }
  }

  return null;
}