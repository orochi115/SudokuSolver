import { BOXES, BOX_OF, COLS, COL_OF, HOUSES, PEERS_OF, ROWS, ROW_OF, SIZE, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';

export { BOXES, BOX_OF, COLS, COL_OF, HOUSES, PEERS_OF, ROWS, ROW_OF, SIZE, digitsOf, maskOf, popcount };

export function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function houseName(index: number): { zh: string; en: string } {
  if (index < 9) return { zh: `第 ${index + 1} 行`, en: `row ${index + 1}` };
  if (index < 18) return { zh: `第 ${index - 8} 列`, en: `column ${index - 8}` };
  return { zh: `第 ${index - 17} 宫`, en: `box ${index - 17}` };
}

export function sameBox(a: number, b: number): boolean {
  return BOX_OF[a] === BOX_OF[b];
}

export function sees(a: number, b: number): boolean {
  return a !== b && (ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b]);
}

export function commonPeers(cells: readonly number[]): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (cells.includes(cell)) continue;
    if (cells.every((other) => sees(cell, other))) out.push(cell);
  }
  return out;
}

export function combinations<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, chosen: T[]): void => {
    if (chosen.length === size) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i]!);
      pick(i + 1, chosen);
      chosen.pop();
    }
  };
  pick(0, []);
  return out;
}

export function candidateCellsIn(cells: readonly number[], grid: Grid, digit: number): number[] {
  return cells.filter((cell) => grid.hasCandidate(cell, digit));
}

export function eliminationsFromMask(grid: Grid, cells: readonly number[], mask: number): CellDigit[] {
  const eliminations: CellDigit[] = [];
  for (const cell of cells) {
    for (const digit of digitsOf(mask)) {
      if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
    }
  }
  return eliminations;
}

export function bivalueCells(grid: Grid): number[] {
  const cells: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) cells.push(cell);
  }
  return cells;
}

export function strongLinks(grid: Grid, digit: number): [number, number][] {
  const links: [number, number][] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const cells = candidateCellsIn(house, grid, digit);
    if (cells.length !== 2) continue;
    const [a, b] = cells as [number, number];
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (!seen.has(key)) {
      links.push([a, b]);
      seen.add(key);
    }
  }
  return links;
}

export function makeEliminationStep(
  strategyId: string,
  cells: number[],
  candidates: CellDigit[],
  eliminations: CellDigit[],
  zh: string,
  en: string,
): Step {
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: { cells, candidates, links: [] },
    explanation: { zh, en },
  };
}
