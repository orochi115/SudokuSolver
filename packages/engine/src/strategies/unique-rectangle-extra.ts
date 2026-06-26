import { BOX_OF, COL_OF, HOUSES, ROW_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

interface UrPattern {
  cells: [number, number, number, number];
  pairMask: number;
  pairDigits: [number, number];
  extras: Array<{ cell: number; mask: number }>;
}

function* rectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells: [number, number, number, number] = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          if (new Set(cells.map((c) => BOX_OF[c]!)).size === 2) yield cells;
        }
      }
    }
  }
}

function urPatterns(grid: Grid): UrPattern[] {
  const out: UrPattern[] = [];
  for (const cells of rectangles()) {
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const pairMask = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(pairMask) !== 2) continue;
    const pairDigits = digitsOf(pairMask) as [number, number];
    const extras = cells
      .map((cell, i) => ({ cell, mask: masks[i]! & ~pairMask }))
      .filter((e) => e.mask !== 0);
    out.push({ cells, pairMask, pairDigits, extras });
  }
  return out;
}

function sameHouse(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function seesAll(cell: number, cells: readonly number[]): boolean {
  return cells.every((other) => cell !== other && sameHouse(cell, other));
}

function commonHouses(a: number, b: number): number[] {
  const first = new Set([ROW_OF[a]!, 9 + COL_OF[a]!, 18 + BOX_OF[a]!]);
  return [ROW_OF[b]!, 9 + COL_OF[b]!, 18 + BOX_OF[b]!].filter((h) => first.has(h));
}

function* combinations<T>(values: readonly T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  if (values.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => values[i]!);
    let p = size - 1;
    while (p >= 0 && idx[p] === values.length - size + p) p--;
    if (p < 0) break;
    idx[p]!++;
    for (let q = p + 1; q < size; q++) idx[q] = idx[q - 1]! + 1;
  }
}

function buildStep(id: string, name: string, pattern: UrPattern, eliminations: { cell: number; digit: number }[]): Step | null {
  if (eliminations.length === 0) return null;
  const [a, b] = pattern.pairDigits;
  return {
    strategyId: id,
    placements: [],
    eliminations,
    highlights: {
      cells: [...new Set([...pattern.cells, ...eliminations.map((e) => e.cell)])],
      candidates: pattern.cells.flatMap((cell) => digitsOf(pattern.pairMask | (pattern.extras.find((e) => e.cell === cell)?.mask ?? 0)).map((digit) => ({ cell, digit }))).concat(eliminations),
      links: [],
    },
    explanation: {
      zh: `${name}：UR 对 {${a},${b}} 避免形成可交换致死矩形，因此删除列出的候选。`,
      en: `${name}: UR pair {${a},${b}} would otherwise form a swappable deadly rectangle, so the listed candidates are eliminated.`,
    },
  };
}

function tryType3(grid: Grid, id: string): Step | null {
  for (const p of urPatterns(grid)) {
    if (p.extras.length !== 2 || !sameHouse(p.extras[0]!.cell, p.extras[1]!.cell)) continue;
    const extraMask = p.extras[0]!.mask | p.extras[1]!.mask;
    const extraDigits = digitsOf(extraMask);
    if (extraDigits.length < 2 || extraDigits.length > 4) continue;
    for (const houseIdx of commonHouses(p.extras[0]!.cell, p.extras[1]!.cell)) {
      const house = HOUSES[houseIdx]!;
      const outside = house.filter((cell) => !p.cells.includes(cell) && grid.get(cell) === 0);
      for (const combo of combinations(outside, extraDigits.length - 1)) {
        const union = combo.reduce((m, cell) => m | (grid.candidatesOf(cell) & extraMask), 0) | extraMask;
        if (union !== extraMask) continue;
        if (combo.some((cell) => (grid.candidatesOf(cell) & ~extraMask) !== 0)) continue;
        const subset = new Set(combo);
        const eliminations = house
          .filter((cell) => !p.cells.includes(cell) && !subset.has(cell))
          .flatMap((cell) => extraDigits.filter((digit) => grid.hasCandidate(cell, digit)).map((digit) => ({ cell, digit })));
        const step = buildStep(id, '唯一矩形 Type 3 / Unique Rectangle Type 3', p, eliminations);
        if (step) return step;
      }
    }
  }
  return null;
}

function tryType5(grid: Grid, id: string): Step | null {
  for (const p of urPatterns(grid)) {
    if (p.extras.length !== 2 && p.extras.length !== 3) continue;
    if (p.extras.length === 2 && sameHouse(p.extras[0]!.cell, p.extras[1]!.cell)) continue;
    const commonExtra = p.extras.reduce((m, e) => m & e.mask, p.extras[0]!.mask);
    for (const digit of digitsOf(commonExtra)) {
      const extraCells = p.extras.map((e) => e.cell);
      const eliminations: { cell: number; digit: number }[] = [];
      for (let cell = 0; cell < 81; cell++) {
        if (p.cells.includes(cell) || !grid.hasCandidate(cell, digit)) continue;
        if (seesAll(cell, extraCells)) eliminations.push({ cell, digit });
      }
      const step = buildStep(id, '唯一矩形 Type 5 / Unique Rectangle Type 5', p, eliminations);
      if (step) return step;
    }
  }
  return null;
}

function tryType6(grid: Grid, id: string): Step | null {
  for (const p of urPatterns(grid)) {
    if (p.extras.length !== 2 || sameHouse(p.extras[0]!.cell, p.extras[1]!.cell)) continue;
    const rows = [...new Set(p.cells.map((c) => ROW_OF[c]!))];
    const cols = [...new Set(p.cells.map((c) => COL_OF[c]!))];
    for (const digit of p.pairDigits) {
      const bit = maskOf(digit);
      const rowOk = rows.every((row) => HOUSES[row]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0).every((cell) => p.cells.includes(cell)));
      const colOk = cols.every((col) => HOUSES[9 + col]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0).every((cell) => p.cells.includes(cell)));
      if (!rowOk || !colOk) continue;
      const eliminations = p.extras.filter((e) => grid.hasCandidate(e.cell, digit)).map((e) => ({ cell: e.cell, digit }));
      const step = buildStep(id, '唯一矩形 Type 6 / Unique Rectangle Type 6', p, eliminations);
      if (step) return step;
    }
  }
  return null;
}

function diagonalOf(cells: readonly number[], cell: number): number {
  const row = ROW_OF[cell]!;
  const col = COL_OF[cell]!;
  return cells.find((other) => ROW_OF[other] !== row && COL_OF[other] !== col)!;
}

function tryHidden(grid: Grid, id: string): Step | null {
  for (const p of urPatterns(grid)) {
    for (const start of p.cells) {
      if ((grid.candidatesOf(start) & ~p.pairMask) !== 0) continue;
      const opposite = diagonalOf(p.cells, start);
      if ((grid.candidatesOf(opposite) & ~p.pairMask) === 0) continue;
      for (const locked of p.pairDigits) {
        const other = p.pairDigits.find((d) => d !== locked)!;
        const bit = maskOf(locked);
        const rowClear = HOUSES[ROW_OF[opposite]!]!.every((cell) => p.cells.includes(cell) || grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0);
        const colClear = HOUSES[9 + COL_OF[opposite]!]!.every((cell) => p.cells.includes(cell) || grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0);
        if (!rowClear || !colClear || !grid.hasCandidate(opposite, other)) continue;
        const step = buildStep(id, '隐性唯一矩形 / Hidden Unique Rectangle', p, [{ cell: opposite, digit: other }]);
        if (step) return step;
      }
    }
  }
  return null;
}

export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],
  apply: (grid) => tryType3(grid, 'unique-rectangle-type-3'),
};

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],
  apply: (grid) => tryHidden(grid, 'hidden-unique-rectangle'),
};

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],
  apply: (grid) => tryType5(grid, 'unique-rectangle-type-5'),
};

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],
  apply: (grid) => tryType6(grid, 'unique-rectangle-type-6'),
};
