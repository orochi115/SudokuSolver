import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf, type Grid } from '../grid.js';
import type { CellDigit, Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type ChainNode } from '../chain/graph.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(c: CellDigit): string {
  return `${cellLabel(c.cell)}(${c.digit})`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((cell) => peersA.has(cell));
}

function dedupe(items: CellDigit[]): CellDigit[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.cell}:${item.digit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bivalueDigits(grid: Grid, cell: number): [number, number] | null {
  if (grid.get(cell) !== 0) return null;
  const ds = digitsOf(grid.candidatesOf(cell));
  return ds.length === 2 ? [ds[0]!, ds[1]!] : null;
}

function makeChainStep(
  strategyId: string,
  placements: CellDigit[],
  eliminations: CellDigit[],
  chainCandidates: CellDigit[],
  links: Link[],
  zh: string,
  en: string,
): Step | null {
  if (placements.length === 0 && eliminations.length === 0) return null;
  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([...chainCandidates.map((c) => c.cell), ...placements.map((p) => p.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [...chainCandidates, ...placements, ...eliminations],
      links,
    },
    explanation: { zh, en },
  };
}

function searchXyChain(grid: Grid, strategyId: string): Step | null {
  const maxCells = 12;

  for (let startCell = 0; startCell < CELLS; startCell++) {
    const startDigits = bivalueDigits(grid, startCell);
    if (!startDigits) continue;
    for (const endDigit of startDigits) {
      const firstOn = startDigits.find((d) => d !== endDigit)!;
      const pathCells = [startCell];
      const pathCandidates: CellDigit[] = [{ cell: startCell, digit: endDigit }, { cell: startCell, digit: firstOn }];
      const links: Link[] = [{ from: { cell: startCell, digit: endDigit }, to: { cell: startCell, digit: firstOn }, type: 'strong' }];
      const visited = new Set([startCell]);

      function dfs(currentCell: number, onDigit: number): Step | null {
        if (pathCells.length > maxCells) return null;
        for (let nextCell = 0; nextCell < CELLS; nextCell++) {
          if (visited.has(nextCell)) continue;
          if (!PEERS_OF[currentCell]!.includes(nextCell)) continue;
          const nextDigits = bivalueDigits(grid, nextCell);
          if (!nextDigits || !nextDigits.includes(onDigit)) continue;
          const nextOn = nextDigits.find((d) => d !== onDigit)!;

          const weak: Link = { from: { cell: currentCell, digit: onDigit }, to: { cell: nextCell, digit: onDigit }, type: 'weak' };
          const strong: Link = { from: { cell: nextCell, digit: onDigit }, to: { cell: nextCell, digit: nextOn }, type: 'strong' };
          visited.add(nextCell);
          pathCells.push(nextCell);
          pathCandidates.push({ cell: nextCell, digit: onDigit }, { cell: nextCell, digit: nextOn });
          links.push(weak, strong);

          if (nextOn === endDigit && pathCells.length >= 3) {
            const eliminations = commonPeers(startCell, nextCell)
              .filter((cell) => !pathCells.includes(cell) && grid.hasCandidate(cell, endDigit))
              .map((cell) => ({ cell, digit: endDigit }));
            if (eliminations.length > 0) {
              return makeChainStep(
                strategyId,
                [],
                eliminations,
                [...pathCandidates],
                [...links],
                `XY链：两端 ${cellLabel(startCell)} 与 ${cellLabel(nextCell)} 至少一个为 ${endDigit}，可从同时看见两端的格中消去 ${endDigit}。`,
                `XY-Chain: at least one endpoint (${cellLabel(startCell)} or ${cellLabel(nextCell)}) is ${endDigit}, so cells seeing both endpoints can drop ${endDigit}.`,
              );
            }
          }

          const found = dfs(nextCell, nextOn);
          if (found) return found;
          links.pop();
          links.pop();
          pathCandidates.pop();
          pathCandidates.pop();
          pathCells.pop();
          visited.delete(nextCell);
        }
        return null;
      }

      const step = dfs(startCell, firstOn);
      if (step) return step;
    }
  }
  return null;
}

interface StrongLink {
  a: number;
  b: number;
  house: number;
}

function strongLinksForDigit(grid: Grid, digit: number): StrongLink[] {
  const bit = maskOf(digit);
  const out: StrongLink[] = [];
  for (let house = 0; house < HOUSES.length; house++) {
    const cells = HOUSES[house]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) out.push({ a: cells[0]!, b: cells[1]!, house });
  }
  return out;
}

function searchTurbotFish(grid: Grid, strategyId: string): Step | null {
  for (let digit = 1; digit <= 9; digit++) {
    const links = strongLinksForDigit(grid, digit);
    for (const left of links) {
      for (const [leftEnd, leftInner] of [[left.a, left.b], [left.b, left.a]] as [number, number][]) {
        for (const right of links) {
          if (right === left) continue;
          for (const [rightInner, rightEnd] of [[right.a, right.b], [right.b, right.a]] as [number, number][]) {
            const cells = [leftEnd, leftInner, rightInner, rightEnd];
            if (new Set(cells).size !== 4) continue;
            if (!PEERS_OF[leftInner]!.includes(rightInner)) continue;
            const eliminations = commonPeers(leftEnd, rightEnd)
              .filter((cell) => !cells.includes(cell) && grid.hasCandidate(cell, digit))
              .map((cell) => ({ cell, digit }));
            if (eliminations.length === 0) continue;
            return makeChainStep(
              strategyId,
              [],
              eliminations,
              cells.map((cell) => ({ cell, digit })),
              [
                { from: { cell: leftEnd, digit }, to: { cell: leftInner, digit }, type: 'strong' },
                { from: { cell: leftInner, digit }, to: { cell: rightInner, digit }, type: 'weak' },
                { from: { cell: rightInner, digit }, to: { cell: rightEnd, digit }, type: 'strong' },
              ],
              `多宝鱼：数字 ${digit} 的两条强链由弱链连接，端点 ${cellLabel(leftEnd)} / ${cellLabel(rightEnd)} 至少一个为真；消去同时看见两端的 ${digit}。`,
              `Turbot Fish: two strong links on digit ${digit} are joined by a weak link, so one endpoint (${cellLabel(leftEnd)} / ${cellLabel(rightEnd)}) is true; eliminate ${digit} from cells seeing both.`,
            );
          }
        }
      }
    }
  }
  return null;
}

function nodeCandidate(node: ChainNode): CellDigit {
  return { cell: node.cells[0]!, digit: node.digit };
}

function nodeSeesCell(node: ChainNode, cell: number): boolean {
  return !node.cells.includes(cell) && node.cells.every((nodeCell) => PEERS_OF[cell]!.includes(nodeCell));
}

function continuousLoopEliminations(grid: Grid, nodes: ChainNode[], links: Link[]): CellDigit[] {
  const loopCells = new Set(nodes.flatMap((node) => node.cells));
  const eliminations: CellDigit[] = [];
  for (const link of links) {
    if (link.type !== 'weak') continue;
    const fromNode = nodes.find((node) => node.digit === link.from.digit && node.cells.includes(link.from.cell));
    const toNode = nodes.find((node) => node.digit === link.to.digit && node.cells.includes(link.to.cell));
    if (!fromNode || !toNode) continue;
    if (fromNode.digit === toNode.digit) {
      for (let cell = 0; cell < CELLS; cell++) {
        if (loopCells.has(cell) || !grid.hasCandidate(cell, fromNode.digit)) continue;
        if (nodeSeesCell(fromNode, cell) && nodeSeesCell(toNode, cell)) eliminations.push({ cell, digit: fromNode.digit });
      }
    } else if (fromNode.cells.length === 1 && toNode.cells.length === 1 && fromNode.cells[0] === toNode.cells[0]) {
      const keep = maskOf(fromNode.digit) | maskOf(toNode.digit);
      for (const digit of digitsOf(grid.candidatesOf(fromNode.cells[0]!))) {
        if ((keep & maskOf(digit)) === 0) eliminations.push({ cell: fromNode.cells[0]!, digit });
      }
    }
  }
  return dedupe(eliminations);
}

function searchNiceLoop(grid: Grid, strategyId: string): Step | null {
  const graph = buildLinkGraph(grid, { grouped: true });
  const maxNodes = 12;

  for (let start = 0; start < graph.nodes.length; start++) {
    for (const firstType of ['strong', 'weak'] as const) {
      const path = [start];
      const linkTypes: ('strong' | 'weak')[] = [];
      const visited = new Set([start]);

      function dfs(current: number, nextType: 'strong' | 'weak'): Step | null {
        if (path.length >= 4) {
          const closing = graph.adjacency[current]!.find((edge) => edge.to === start && edge.type === nextType);
          if (closing) {
            const pathNodes = path.map((idx) => graph.nodes[idx]!);
            const chainLinks: Link[] = [];
            for (let i = 1; i < path.length; i++) {
              const from = graph.nodes[path[i - 1]!]!;
              const to = graph.nodes[path[i]!]!;
              const link: Link = { from: nodeCandidate(from), to: nodeCandidate(to), type: linkTypes[i - 1]! };
              if (from.cells.length > 1) link.fromCells = [...from.cells];
              if (to.cells.length > 1) link.toCells = [...to.cells];
              chainLinks.push(link);
            }
            const currentNode = graph.nodes[current]!;
            const startNode = graph.nodes[start]!;
            const closeLink: Link = { from: nodeCandidate(currentNode), to: nodeCandidate(startNode), type: closing.type };
            if (currentNode.cells.length > 1) closeLink.fromCells = [...currentNode.cells];
            if (startNode.cells.length > 1) closeLink.toCells = [...startNode.cells];
            chainLinks.push(closeLink);

            if (closing.type === firstType && startNode.cells.length === 1) {
              const candidate = nodeCandidate(startNode);
              if (closing.type === 'weak') {
                return makeChainStep(
                  strategyId,
                  [],
                  grid.hasCandidate(candidate.cell, candidate.digit) ? [candidate] : [],
                  pathNodes.map(nodeCandidate),
                  chainLinks,
                  `不连续 Nice 环：两个弱链在 ${candidateLabel(candidate)} 相遇，若该候选为真会推出其为假，故消去。`,
                  `Discontinuous Nice Loop: two weak links meet at ${candidateLabel(candidate)}; if it were true the loop would force it false, so eliminate it.`,
                );
              }
              if (grid.hasCandidate(candidate.cell, candidate.digit)) {
                return makeChainStep(
                  strategyId,
                  [candidate],
                  [],
                  pathNodes.map(nodeCandidate),
                  chainLinks,
                  `不连续 Nice 环：两个强链在 ${candidateLabel(candidate)} 相遇，该候选必须为真。`,
                  `Discontinuous Nice Loop: two strong links meet at ${candidateLabel(candidate)}, forcing that candidate true.`,
                );
              }
            } else if (closing.type !== firstType) {
              const eliminations = continuousLoopEliminations(grid, pathNodes, chainLinks);
              if (eliminations.length > 0) {
                return makeChainStep(
                  strategyId,
                  [],
                  eliminations,
                  pathNodes.map(nodeCandidate),
                  chainLinks,
                  '连续 Nice 环：环上弱链成为共轭关系，可消去弱链单元中的环外候选。',
                  'Continuous Nice Loop: every weak link in the loop becomes conjugate, eliminating off-loop candidates in those units.',
                );
              }
            }
          }
        }

        if (path.length >= maxNodes) return null;
        for (const edge of graph.adjacency[current]!) {
          if (edge.type !== nextType) continue;
          if (visited.has(edge.to)) continue;
          visited.add(edge.to);
          path.push(edge.to);
          linkTypes.push(edge.type);
          const found = dfs(edge.to, nextType === 'strong' ? 'weak' : 'strong');
          if (found) return found;
          linkTypes.pop();
          path.pop();
          visited.delete(edge.to);
        }
        return null;
      }

      const found = dfs(start, firstType);
      if (found) return found;
    }
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index', 'digit'],
  apply: (grid) => searchXyChain(grid, 'xy-chain'),
};

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index', 'digit'],
  apply: (grid) => searchNiceLoop(grid, 'nice-loop'),
};

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'cell-index'],
  apply: (grid) => searchTurbotFish(grid, 'turbot-fish'),
};
