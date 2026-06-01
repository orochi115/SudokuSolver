import {
  BOXES,
  CELLS,
  COLS,
  HOUSES,
  PEERS_OF,
  ROW_OF,
  COL_OF,
  ROWS,
  digitsOf,
  maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';

export type HouseKind = 'row' | 'col' | 'box';

export interface HouseRef {
  kind: HouseKind;
  index: number;
  cells: readonly number[];
}

export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const HOUSE_REFS: readonly HouseRef[] = [
  ...ROWS.map((cells, index) => ({ kind: 'row' as const, index, cells })),
  ...COLS.map((cells, index) => ({ kind: 'col' as const, index, cells })),
  ...BOXES.map((cells, index) => ({ kind: 'box' as const, index, cells })),
];

export function houseName(kind: HouseKind, index: number): string {
  if (kind === 'row') return `R${index + 1}`;
  if (kind === 'col') return `C${index + 1}`;
  return `B${index + 1}`;
}

export function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function uniqueCells(cells: readonly number[]): number[] {
  return [...new Set(cells)];
}

export function isPeer(a: number, b: number): boolean {
  return a !== b && PEERS_OF[a]!.includes(b);
}

export function maskOfDigits(digits: readonly number[]): number {
  let mask = 0;
  for (const d of digits) mask |= maskOf(d);
  return mask;
}

export function candidatesInHouse(grid: Grid, house: readonly number[], digit: number): number[] {
  const out: number[] = [];
  for (const cell of house) {
    if (grid.hasCandidate(cell, digit)) out.push(cell);
  }
  return out;
}

export function cellsSeeingBoth(grid: Grid, a: number, b: number, digit: number): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (cell === a || cell === b) continue;
    if (!grid.hasCandidate(cell, digit)) continue;
    if (isPeer(cell, a) && isPeer(cell, b)) out.push(cell);
  }
  return out;
}

export function boxIndexOfCell(cell: number): number {
  for (let b = 0; b < BOXES.length; b++) {
    if (BOXES[b]!.includes(cell)) return b;
  }
  return -1;
}

export function boxLineCells(boxIndex: number, kind: 'row' | 'col', lineIndex: number): number[] {
  const out: number[] = [];
  for (const cell of BOXES[boxIndex]!) {
    if ((kind === 'row' ? ROW_OF[cell] : COL_OF[cell]) === lineIndex) out.push(cell);
  }
  return out;
}

export function* combinations<T>(items: readonly T[], size: number): Generator<T[]> {
  if (size <= 0 || size > items.length) return;
  const picked: T[] = [];
  function* walk(start: number): Generator<T[]> {
    if (picked.length === size) {
      yield [...picked];
      return;
    }
    for (let i = start; i < items.length; i++) {
      picked.push(items[i]!);
      yield* walk(i + 1);
      picked.pop();
    }
  }
  yield* walk(0);
}

export function otherHouseTypeOfPeers(a: number, b: number): HouseKind | null {
  if (a === b) return null;
  if (ROW_OF[a] === ROW_OF[b]) return 'row';
  if (COL_OF[a] === COL_OF[b]) return 'col';
  const boxA = boxIndexOfCell(a);
  const boxB = boxIndexOfCell(b);
  return boxA === boxB ? 'box' : null;
}

export function allHouseCells(kind: HouseKind, index: number): readonly number[] {
  if (kind === 'row') return ROWS[index]!;
  if (kind === 'col') return COLS[index]!;
  return BOXES[index]!;
}

export function digitsFromMask(mask: number): number[] {
  return digitsOf(mask);
}

export { HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, maskOf };
