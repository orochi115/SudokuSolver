import { BOX_OF, COL_OF, HOUSES, PEERS_OF, ROW_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link } from '../trace.js';

export function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function houseName(index: number): { zh: string; en: string } {
  if (index < 9) return { zh: `第 ${index + 1} 行`, en: `row ${index + 1}` };
  if (index < 18) return { zh: `第 ${index - 8} 列`, en: `column ${index - 8}` };
  return { zh: `第 ${index - 17} 宫`, en: `box ${index - 17}` };
}

export function candidateCells(grid: Grid, cells: readonly number[], digit: number): number[] {
  return cells.filter((cell) => grid.hasCandidate(cell, digit));
}

export function candidateHighlights(cells: readonly number[], digits: readonly number[]): CellDigit[] {
  const out: CellDigit[] = [];
  for (const cell of cells) {
    for (const digit of digits) out.push({ cell, digit });
  }
  return out;
}

export function eliminationsForMask(grid: Grid, cells: readonly number[], mask: number): CellDigit[] {
  const out: CellDigit[] = [];
  const digits = digitsOf(mask);
  for (const cell of cells) {
    for (const digit of digits) {
      if (grid.hasCandidate(cell, digit)) out.push({ cell, digit });
    }
  }
  return out;
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

export function maskUnion(grid: Grid, cells: readonly number[]): number {
  let union = 0;
  for (const cell of cells) union |= grid.candidatesOf(cell);
  return union;
}

export function sees(a: number, b: number): boolean {
  return a !== b && PEERS_OF[a]!.includes(b);
}

export function commonPeers(cells: readonly number[]): number[] {
  const [first, ...rest] = cells;
  if (first === undefined) return [];
  return PEERS_OF[first]!.filter((cell) => rest.every((other) => PEERS_OF[other]!.includes(cell)));
}

export function sameBox(a: number, b: number): boolean {
  return BOX_OF[a] === BOX_OF[b];
}

export function link(from: number, to: number, digit: number, type: 'strong' | 'weak'): Link {
  return { from: { cell: from, digit }, to: { cell: to, digit }, type };
}

export function bivalueCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) out.push(cell);
  }
  return out;
}

export function trivalueCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 3) out.push(cell);
  }
  return out;
}

export function strongLinks(grid: Grid, digit: number): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const cells = candidateCells(grid, HOUSES[houseIndex]!, digit);
    if (cells.length === 2) out.push([cells[0]!, cells[1]!, houseIndex]);
  }
  return out;
}

export function hasDigit(mask: number, digit: number): boolean {
  return (mask & maskOf(digit)) !== 0;
}
