import { HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, LinkType } from '../trace.js';
import { candidateCells, hasDigit, sees } from './common.js';

export interface CandidateNode extends CellDigit {}

export interface CandidateEdge extends Link {}

export function nodeKey(node: CandidateNode): string {
  return `${node.cell}:${node.digit}`;
}

export function sameNode(a: CandidateNode, b: CandidateNode): boolean {
  return a.cell === b.cell && a.digit === b.digit;
}

export function candidateNodes(grid: Grid): CandidateNode[] {
  const out: CandidateNode[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    for (const digit of digitsOf(grid.candidatesOf(cell))) out.push({ cell, digit });
  }
  return out;
}

export function candidatesSee(a: CandidateNode, b: CandidateNode): boolean {
  if (sameNode(a, b)) return false;
  return a.cell === b.cell || (a.digit === b.digit && sees(a.cell, b.cell));
}

export function candidateLink(a: CandidateNode, b: CandidateNode, type: LinkType): Link {
  return { from: a, to: b, type };
}

export function addUndirectedEdge(map: Map<string, CandidateEdge[]>, a: CandidateNode, b: CandidateNode, type: LinkType): void {
  const ka = nodeKey(a);
  const kb = nodeKey(b);
  map.set(ka, [...(map.get(ka) ?? []), candidateLink(a, b, type)]);
  map.set(kb, [...(map.get(kb) ?? []), candidateLink(b, a, type)]);
}

export function buildLinkGraph(grid: Grid): Map<string, CandidateEdge[]> {
  const edges = new Map<string, CandidateEdge[]>();
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const digits = digitsOf(grid.candidatesOf(cell));
    for (let i = 0; i < digits.length; i++) {
      for (let j = i + 1; j < digits.length; j++) {
        const type: LinkType = digits.length === 2 ? 'strong' : 'weak';
        addUndirectedEdge(edges, { cell, digit: digits[i]! }, { cell, digit: digits[j]! }, type);
        if (type === 'strong') addUndirectedEdge(edges, { cell, digit: digits[i]! }, { cell, digit: digits[j]! }, 'weak');
      }
    }
  }

  for (let digit = 1; digit <= 9; digit++) {
    for (const house of HOUSES) {
      const cells = candidateCells(grid, house, digit);
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const type: LinkType = cells.length === 2 ? 'strong' : 'weak';
          addUndirectedEdge(edges, { cell: cells[i]!, digit }, { cell: cells[j]!, digit }, type);
          if (type === 'strong') addUndirectedEdge(edges, { cell: cells[i]!, digit }, { cell: cells[j]!, digit }, 'weak');
        }
      }
    }
  }
  return edges;
}

export function commonCandidatePeers(grid: Grid, a: CandidateNode, b: CandidateNode): CellDigit[] {
  if (a.digit !== b.digit) return [];
  const pathCells = new Set([a.cell, b.cell]);
  return PEERS_OF[a.cell]!
    .filter((cell) => !pathCells.has(cell) && PEERS_OF[b.cell]!.includes(cell) && grid.hasCandidate(cell, a.digit))
    .map((cell) => ({ cell, digit: a.digit }));
}

export interface AlmostLockedSet {
  cells: number[];
  mask: number;
  digits: number[];
}

export function findAlmostLockedSets(grid: Grid, maxSize = 4): AlmostLockedSet[] {
  const out: AlmostLockedSet[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const unsolved = house.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) > 0);
    for (let size = 1; size <= Math.min(maxSize, unsolved.length); size++) {
      for (const cells of combinations(unsolved, size)) {
        let mask = 0;
        for (const cell of cells) mask |= grid.candidatesOf(cell);
        if (popcount(mask) !== size + 1) continue;
        const key = [...cells].sort((a, b) => a - b).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ cells: [...cells], mask, digits: digitsOf(mask) });
      }
    }
  }
  return out;
}

export function cellsWithDigit(grid: Grid, cells: readonly number[], digit: number): number[] {
  return cells.filter((cell) => hasDigit(grid.candidatesOf(cell), digit));
}

export function combinations<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const chosen: T[] = [];
  function visit(start: number): void {
    if (chosen.length === size) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i]!);
      visit(i + 1);
      chosen.pop();
    }
  }
  visit(0);
  return out;
}
