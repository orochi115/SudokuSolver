import { BOXES, COLS, PEERS_OF, ROWS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import { getStrategyOptions } from '../strategy-options.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { combinations } from './_common.js';

interface Partition {
  baseCells: number[];
  sideA: number[];
  sideB: number[];
  maskBase: number;
  maskA: number;
  maskB: number;
  rowLike: boolean;
  lineIndex: number;
  boxIndex: number;
}

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: '苏德科克', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid: Grid): Step | null {
    if (!getStrategyOptions().enableSueDeCoq) return null;

    for (let box = 0; box < 9; box++) {
      const boxCells = BOXES[box]!;

      for (let row = 0; row < 9; row++) {
        const inter = boxCells.filter((c) => ROWS[row]!.includes(c) && grid.get(c) === 0);
        if (inter.length < 2) continue;
        const step = findSueDeCoqOnIntersection(grid, inter, ROWS[row]!, boxCells, true, row, box, this.id);
        if (step) return step;
      }

      for (let col = 0; col < 9; col++) {
        const inter = boxCells.filter((c) => COLS[col]!.includes(c) && grid.get(c) === 0);
        if (inter.length < 2) continue;
        const step = findSueDeCoqOnIntersection(grid, inter, COLS[col]!, boxCells, false, col, box, this.id);
        if (step) return step;
      }
    }
    return null;
  },
};

function findSueDeCoqOnIntersection(
  grid: Grid,
  intersection: readonly number[],
  lineCells: readonly number[],
  boxCells: readonly number[],
  rowLike: boolean,
  lineIndex: number,
  boxIndex: number,
  strategyId: string,
): Step | null {
  const lineOnly = lineCells.filter((c) => !intersection.includes(c) && grid.get(c) === 0);
  const boxOnly = boxCells.filter((c) => !intersection.includes(c) && grid.get(c) === 0);
  if (lineOnly.length === 0 || boxOnly.length === 0) return null;

  for (const baseCells of combinations(intersection, 2)) {
    const maskBase = unionMask(grid, baseCells);
    if (popcount(maskBase) < 4) continue;

    for (let aSize = 1; aSize <= Math.min(2, lineOnly.length); aSize++) {
      for (const sideA of combinations(lineOnly, aSize)) {
        const maskA = unionMask(grid, sideA);
        if (maskA === 0) continue;
        for (let bSize = 1; bSize <= Math.min(2, boxOnly.length); bSize++) {
          for (const sideB of combinations(boxOnly, bSize)) {
            const maskB = unionMask(grid, sideB);
            if (maskB === 0) continue;
            if ((maskA & maskB) !== 0) continue;

            if (sideA.length !== 1 || sideB.length !== 1) continue;
            if (popcount(maskA) !== 2 || popcount(maskB) !== 2) continue;

            const inBaseA = maskBase & maskA;
            const inBaseB = maskBase & maskB;
            if (popcount(inBaseA) !== sideA.length) continue;
            if (popcount(inBaseB) !== sideB.length) continue;
            if (popcount(maskBase) !== baseCells.length + sideA.length + sideB.length) continue;
            if (popcount(maskBase) !== 4) continue;

            const part: Partition = {
              baseCells: [...baseCells],
              sideA,
              sideB,
              maskBase,
              maskA,
              maskB,
              rowLike,
              lineIndex,
              boxIndex,
            };
            const step = buildStep(grid, part, strategyId);
            if (step) return step;
          }
        }
      }
    }
  }

  return null;
}

function buildStep(grid: Grid, part: Partition, strategyId: string): Step | null {
  const lineDigits = digitsOf(part.maskBase & part.maskA);
  const boxDigits = digitsOf(part.maskBase & part.maskB);
  const used = new Set([...part.baseCells, ...part.sideA, ...part.sideB]);
  const eliminations: { cell: number; digit: number }[] = [];
  const lineSources = sourceCellsByDigit(grid, lineDigits, [...part.baseCells, ...part.sideA]);
  const boxSources = sourceCellsByDigit(grid, boxDigits, [...part.baseCells, ...part.sideB]);

  const lineCells = part.rowLike ? ROWS[part.lineIndex]! : COLS[part.lineIndex]!;
  for (const cell of lineCells) {
    if (used.has(cell)) continue;
    if (grid.get(cell) !== 0) continue;
    for (const digit of lineDigits) {
      if (!grid.hasCandidate(cell, digit)) continue;
      const src = lineSources.get(digit) ?? [];
      if (src.length === 0) continue;
      if (!seesAll(cell, src)) continue;
      eliminations.push({ cell, digit });
    }
  }

  const boxCells = BOXES[part.boxIndex]!;
  for (const cell of boxCells) {
    if (used.has(cell)) continue;
    if (grid.get(cell) !== 0) continue;
    for (const digit of boxDigits) {
      if (!grid.hasCandidate(cell, digit)) continue;
      const src = boxSources.get(digit) ?? [];
      if (src.length === 0) continue;
      if (!seesAll(cell, src)) continue;
      eliminations.push({ cell, digit });
    }
  }

  if (eliminations.length === 0) return null;

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: [...used, ...eliminations.map((e) => e.cell)],
      candidates: [...used].flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
      links: [],
    },
    explanation: {
      zh: 'Sue de Coq：线-宫交叠中的候选被拆分为互斥子集，可据此删除线侧/宫侧其余格中的对应候选。',
      en: 'Sue de Coq: the line-box overlap splits into disjoint candidate groups, allowing eliminations on the remaining line-side and box-side cells.',
    },
  };
}

function unionMask(grid: Grid, cells: readonly number[]): number {
  let mask = 0;
  for (const c of cells) mask |= grid.candidatesOf(c);
  return mask;
}

function sourceCellsByDigit(
  grid: Grid,
  digits: readonly number[],
  cells: readonly number[],
): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const d of digits) {
    out.set(
      d,
      cells.filter((c) => grid.hasCandidate(c, d)),
    );
  }
  return out;
}

function seesAll(cell: number, others: readonly number[]): boolean {
  const peerSet = new Set<number>(PEERS_OF[cell]!);
  return others.every((o) => peerSet.has(o));
}
