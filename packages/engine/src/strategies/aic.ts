import { CELLS, SIZE, ROW_OF, COL_OF, PEERS_OF, HOUSES, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface AICNode {
  cell: number;
  digit: number;
}

function nodeKey(n: AICNode): string {
  return `${n.cell},${n.digit}`;
}

function nodesSeeEachOther(a: AICNode, b: AICNode): boolean {
  if (a.cell === b.cell) return false;
  return PEERS_OF[a.cell]!.includes(b.cell);
}

function isConjugatePair(grid: Grid, a: AICNode, b: AICNode): boolean {
  if (a.digit !== b.digit) return false;
  if (!PEERS_OF[a.cell]!.includes(b.cell)) return false;
  const bit = maskOf(a.digit);
  for (const house of HOUSES) {
    if (!house.includes(a.cell) || !house.includes(b.cell)) continue;
    let count = 0;
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) count++;
    }
    return count === 2;
  }
  return false;
}

function isBivalueCell(grid: Grid, cell: number): boolean {
  if (grid.get(cell) !== 0) return false;
  return popcount(grid.candidatesOf(cell)) === 2;
}

function otherBivalueDigit(grid: Grid, cell: number, digit: number): number | null {
  const ds = digitsOf(grid.candidatesOf(cell));
  if (ds.length !== 2) return null;
  return ds[0] === digit ? ds[1]! : ds[0]!;
}

function strongLinksFrom(grid: Grid, node: AICNode): AICNode[] {
  const result: AICNode[] = [];
  const resultSet = new Set<string>();

  const bit = maskOf(node.digit);
  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const cells: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) cells.push(c);
    }
    if (cells.length === 2) {
      const other = cells[0] === node.cell ? cells[1]! : cells[0]!;
      const n: AICNode = { cell: other, digit: node.digit };
      const k = nodeKey(n);
      if (!resultSet.has(k)) { resultSet.add(k); result.push(n); }
    }
  }

  if (isBivalueCell(grid, node.cell)) {
    const otherD = otherBivalueDigit(grid, node.cell, node.digit);
    if (otherD !== null) {
      const n: AICNode = { cell: node.cell, digit: otherD };
      const k = nodeKey(n);
      if (!resultSet.has(k)) { resultSet.add(k); result.push(n); }
    }
  }

  return result;
}

function weakLinksFrom(grid: Grid, node: AICNode): AICNode[] {
  const result: AICNode[] = [];
  const resultSet = new Set<string>();
  const bit = maskOf(node.digit);

  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    for (const c of house) {
      if (c === node.cell) continue;
      if (grid.get(c) !== 0) continue;
      if (grid.candidatesOf(c) & bit) {
        const n: AICNode = { cell: c, digit: node.digit };
        const k = nodeKey(n);
        if (!resultSet.has(k)) { resultSet.add(k); result.push(n); }
      }
    }
  }

  return result;
}

function searchAIC(
  grid: Grid,
  path: AICNode[],
  visited: Set<string>,
  needStrongNext: boolean,
  results: AICNode[][],
): void {
  if (path.length >= 4 && path.length <= 10) {
    results.push([...path]);
    if (results.length > 200) return;
  }
  if (path.length >= 10) return;

  const current = path[path.length - 1]!;

  if (needStrongNext) {
    const strongTargets = strongLinksFrom(grid, current);
    for (const target of strongTargets) {
      const k = nodeKey(target);
      if (visited.has(k)) continue;
      visited.add(k);
      path.push(target);
      searchAIC(grid, path, visited, false, results);
      path.pop();
      visited.delete(k);
      if (results.length > 200) return;
    }
  } else {
    const weakTargets = weakLinksFrom(grid, current);
    for (const target of weakTargets) {
      const k = nodeKey(target);
      if (visited.has(k)) continue;
      const ss = strongLinksFrom(grid, target);
      if (ss.length === 0) continue;
      visited.add(k);
      path.push(target);
      searchAIC(grid, path, visited, true, results);
      path.pop();
      visited.delete(k);
      if (results.length > 200) return;
    }
  }
}

function fmtNode(n: AICNode): string {
  return `R${ROW_OF[n.cell]! + 1}C${COL_OF[n.cell]! + 1}(${n.digit})`;
}

function processAICResult(path: AICNode[], grid: Grid): Step | null {
  if (path.length < 4) return null;
  const first = path[0]!;
  const last = path[path.length - 1]!;
  const cells = [...new Set(path.map((n) => n.cell))];
  const candidates = path.map((n) => ({ cell: n.cell, digit: n.digit }));
  const links: Link[] = buildLinks(path, grid);

  const eliminations: { cell: number; digit: number }[] = [];

  if (first.digit === last.digit && nodesSeeEachOther(first, last)) {
    const commonPeers = PEERS_OF[first.cell]!.filter((c) => PEERS_OF[last.cell]!.includes(c));
    for (const c of commonPeers) {
      if (c !== first.cell && c !== last.cell && grid.hasCandidate(c, first.digit)) {
        eliminations.push({ cell: c, digit: first.digit });
      }
    }
    if (eliminations.length > 0) {
      return {
        strategyId: 'aic', placements: [], eliminations,
        highlights: { cells, candidates, links },
        explanation: {
          zh: `X-Chain：${path.map(fmtNode).join(' - ')}，端点同数字 ${first.digit} 互见，排除共同影响格中的 ${first.digit}。`,
          en: `X-Chain: ${path.map(fmtNode).join(' - ')}, digit ${first.digit} endpoints see each other.`,
        },
      };
    }
  }

  if (first.digit !== last.digit && nodesSeeEachOther(first, last)) {
    if (grid.hasCandidate(first.cell, last.digit)) {
      eliminations.push({ cell: first.cell, digit: last.digit });
    }
    if (grid.hasCandidate(last.cell, first.digit)) {
      eliminations.push({ cell: last.cell, digit: first.digit });
    }
    if (eliminations.length > 0) {
      return {
        strategyId: 'aic', placements: [], eliminations,
        highlights: { cells, candidates, links },
        explanation: {
          zh: `XY-Chain：${path.map(fmtNode).join(' - ')}，排除交叉候选。`,
          en: `XY-Chain: ${path.map(fmtNode).join(' - ')}, eliminate crossed candidates.`,
        },
      };
    }
  }

  return null;
}

function buildLinks(path: AICNode[], grid: Grid): Link[] {
  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const conjugate = isConjugatePair(grid, a, b);
    const sameCell = a.cell === b.cell;
    const type: 'strong' | 'weak' = (conjugate || sameCell) ? 'strong' : 'weak';
    links.push({ from: { cell: a.cell, digit: a.digit }, to: { cell: b.cell, digit: b.digit }, type });
  }
  return links;
}

function buildAllNodes(grid: Grid): AICNode[] {
  const nodes: AICNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      nodes.push({ cell: c, digit: d });
    }
  }
  return nodes;
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    const allNodes = buildAllNodes(grid);
    const allChains: AICNode[][] = [];
    const seenChainKeys = new Set<string>();

    for (const node of allNodes) {
      const strongTargets = strongLinksFrom(grid, node);
      if (strongTargets.length === 0) continue;

      for (const target of strongTargets) {
        if (node.cell === target.cell && node.digit === target.digit) continue;
        const visited = new Set<string>();
        visited.add(nodeKey(node)); visited.add(nodeKey(target));
        searchAIC(grid, [node, target], visited, false, allChains);
        if (allChains.length > 200) break;
      }
      if (allChains.length > 200) break;
    }

    for (let len = 4; len <= 10; len += 2) {
      for (const chain of allChains) {
        if (chain.length !== len) continue;
        const ck = chain.map((n) => nodeKey(n)).join('|');
        if (seenChainKeys.has(ck)) continue;
        seenChainKeys.add(ck);
        const result = processAICResult(chain, grid);
        if (result) return result;
      }
    }

    return null;
  },
};