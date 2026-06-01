import {
  BOX_OF,
  BOXES,
  COLS,
  HOUSES,
  PEERS_OF,
  ROWS,
  ROW_OF,
  COL_OF,
  digitsOf,
  popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit } from '../trace.js';

export interface HouseRef {
  readonly type: 'row' | 'col' | 'box';
  readonly index: number;
  readonly cells: readonly number[];
}

export const HOUSE_REFS: readonly HouseRef[] = [
  ...ROWS.map((cells, index) => ({ type: 'row' as const, index, cells })),
  ...COLS.map((cells, index) => ({ type: 'col' as const, index, cells })),
  ...BOXES.map((cells, index) => ({ type: 'box' as const, index, cells })),
];

export function rc(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function inSameRow(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b];
}

export function inSameCol(a: number, b: number): boolean {
  return COL_OF[a] === COL_OF[b];
}

export function inSameBox(a: number, b: number): boolean {
  return BOX_OF[a] === BOX_OF[b];
}

export function sees(a: number, b: number): boolean {
  return a !== b && (inSameRow(a, b) || inSameCol(a, b) || inSameBox(a, b));
}

export function candidateCells(grid: Grid, cells: readonly number[], digit: number): number[] {
  return cells.filter((cell) => grid.hasCandidate(cell, digit));
}

export function unsolvedCells(grid: Grid, cells: readonly number[]): number[] {
  return cells.filter((cell) => grid.get(cell) === 0);
}

export function uniqueEliminations(items: readonly CellDigit[]): CellDigit[] {
  const seen = new Set<string>();
  const out: CellDigit[] = [];
  for (const it of items) {
    const key = `${it.cell}:${it.digit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export function uniqueCells(cells: readonly number[]): number[] {
  return [...new Set(cells)];
}

export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const path: T[] = [];

  function dfs(start: number): void {
    if (path.length === k) {
      out.push([...path]);
      return;
    }
    const need = k - path.length;
    const end = items.length - need;
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (item === undefined) continue;
      path.push(item);
      dfs(i + 1);
      path.pop();
    }
  }

  if (k > 0 && k <= items.length) dfs(0);
  return out;
}

export function maskUnion(grid: Grid, cells: readonly number[]): number {
  let union = 0;
  for (const cell of cells) {
    union |= grid.candidatesOf(cell);
  }
  return union;
}

export function hasAny(mask: number, digitMask: number): boolean {
  return (mask & digitMask) !== 0;
}

export function allHouses(): readonly (readonly number[])[] {
  return HOUSES;
}

export function digitsInMask(mask: number): number[] {
  return digitsOf(mask);
}

export function maskSize(mask: number): number {
  return popcount(mask);
}

export function peersIntersection(a: number, b: number): number[] {
  const bPeers = new Set(PEERS_OF[b]!);
  return PEERS_OF[a]!.filter((cell) => bPeers.has(cell));
}
