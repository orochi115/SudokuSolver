import { BOXES, BOX_OF, COLS, COL_OF, HOUSES, ROWS, ROW_OF, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';

export interface HouseMeta {
  kind: 'row' | 'col' | 'box';
  index: number;
  cells: readonly number[];
}

export const ALL_HOUSES: readonly HouseMeta[] = [
  ...ROWS.map((cells, index) => ({ kind: 'row' as const, index, cells })),
  ...COLS.map((cells, index) => ({ kind: 'col' as const, index, cells })),
  ...BOXES.map((cells, index) => ({ kind: 'box' as const, index, cells })),
];

export function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function houseName(h: HouseMeta): string {
  if (h.kind === 'row') return `R${h.index + 1}`;
  if (h.kind === 'col') return `C${h.index + 1}`;
  return `B${h.index + 1}`;
}

export function candidatesInHouse(grid: Grid, house: readonly number[], digit: number): number[] {
  return house.filter((cell) => grid.hasCandidate(cell, digit));
}

export function combinations<T>(items: readonly T[], choose: number): T[][] {
  const out: T[][] = [];
  const path: T[] = [];
  const n = items.length;

  const dfs = (start: number): void => {
    if (path.length === choose) {
      out.push([...path]);
      return;
    }
    const need = choose - path.length;
    for (let i = start; i <= n - need; i++) {
      path.push(items[i]!);
      dfs(i + 1);
      path.pop();
    }
  };

  dfs(0);
  return out;
}

export function peersIntersection(cellsA: readonly number[], cellsB: readonly number[]): number[] {
  const setB = new Set(cellsB);
  return cellsA.filter((cell) => setB.has(cell));
}

export function boxCells(box: number): readonly number[] {
  return BOXES[box]!;
}

export function houseCells(houseIndex: number): readonly number[] {
  return HOUSES[houseIndex]!;
}

export function rowIndexOf(cell: number): number {
  return ROW_OF[cell]!;
}

export function colIndexOf(cell: number): number {
  return COL_OF[cell]!;
}

export function boxIndexOf(cell: number): number {
  return BOX_OF[cell]!;
}

export function maskDigits(mask: number): number[] {
  return digitsOf(mask);
}

export function digitMask(digit: number): number {
  return maskOf(digit);
}
