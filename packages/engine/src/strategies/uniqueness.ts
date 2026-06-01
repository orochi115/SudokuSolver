import { BOX_OF, CELLS, COL_OF, ROW_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import { getStrategyOptions } from '../strategy-options.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性技巧', en: 'Uniqueness Techniques' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    if (!getStrategyOptions().enableUniqueness) return null;
    return findUniqueRectangleType1(grid, this.id) ?? findAvoidableRectangle(grid, this.id) ?? findBugPlusOne(grid, this.id);
  },
};

function rectangleCorners(r1: number, r2: number, c1: number, c2: number): [number, number, number, number] {
  return [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
}

function isBiValueMask(mask: number): boolean {
  return popcount(mask) === 2;
}

function findUniqueRectangleType1(grid: Grid, strategyId: string): Step | null {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells = rectangleCorners(r1, r2, c1, c2);
          if (cells.some((c) => grid.get(c) !== 0)) continue;
          const masks = cells.map((c) => grid.candidatesOf(c));

          for (let extraIdx = 0; extraIdx < 4; extraIdx++) {
            const base = masks.filter((_, i) => i !== extraIdx);
            if (!base.every((m) => m === base[0] && isBiValueMask(m))) continue;
            const extraMask = masks[extraIdx]!;
            if ((extraMask & base[0]!) !== base[0]!) continue;
            if (popcount(extraMask) <= 2) continue;

            const [d1, d2] = digitsOf(base[0]!);
            if (!d1 || !d2) continue;
            const targetCell = cells[extraIdx]!;
            const eliminations = [d1, d2]
              .filter((d) => grid.hasCandidate(targetCell, d))
              .map((digit) => ({ cell: targetCell, digit }));
            if (eliminations.length === 0) continue;

            return {
              strategyId,
              placements: [],
              eliminations,
              highlights: {
                cells,
                candidates: cells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
                links: [],
              },
              explanation: {
                zh: `Unique Rectangle Type 1：若角点保留 ${d1}/${d2} 将形成致命矩形，故从该角删除 ${d1}/${d2}。`,
                en: `Unique Rectangle Type 1: keeping ${d1}/${d2} in the extra corner creates a deadly pattern, so ${d1}/${d2} are removed there.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function findAvoidableRectangle(grid: Grid, strategyId: string): Step | null {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells = rectangleCorners(r1, r2, c1, c2);
          const solved = cells.filter((c) => grid.get(c) !== 0);
          if (solved.length !== 1) continue;
          const unsolved = cells.filter((c) => grid.get(c) === 0);
          const baseDigit = grid.get(solved[0]!);
          const masks = unsolved.map((c) => grid.candidatesOf(c));
          const common = masks.reduce((acc, m) => acc & m, masks[0]!);
          if ((common & (1 << (baseDigit - 1))) === 0) continue;

          for (const cell of unsolved) {
            if (!grid.hasCandidate(cell, baseDigit)) continue;
            const elimination = { cell, digit: baseDigit };
            return {
              strategyId,
              placements: [],
              eliminations: [elimination],
              highlights: {
                cells,
                candidates: unsolved.flatMap((u) => digitsOf(grid.candidatesOf(u)).map((digit) => ({ cell: u, digit }))),
                links: [],
              },
              explanation: {
                zh: `Avoidable Rectangle：利用唯一解假设，删除可能导致可交换矩形的候选 ${baseDigit}。`,
                en: `Avoidable Rectangle: under uniqueness, remove candidate ${baseDigit} that would permit a swappable rectangle.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function findBugPlusOne(grid: Grid, strategyId: string): Step | null {
  let triCell = -1;
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const n = popcount(grid.candidatesOf(cell));
    if (n === 2) continue;
    if (n === 3 && triCell === -1) {
      triCell = cell;
      continue;
    }
    return null;
  }
  if (triCell < 0) return null;

  const triDigits = digitsOf(grid.candidatesOf(triCell));
  for (const digit of triDigits) {
    const inRow = countCandidateInHouse(grid, 'row', ROW_OF[triCell]!, digit);
    const inCol = countCandidateInHouse(grid, 'col', COL_OF[triCell]!, digit);
    const inBox = countCandidateInHouse(grid, 'box', BOX_OF[triCell]!, digit);
    if (inRow === 3 && inCol === 3 && inBox === 3) {
      return {
        strategyId,
        placements: [{ cell: triCell, digit }],
        eliminations: [],
        highlights: {
          cells: [triCell],
          candidates: triDigits.map((d) => ({ cell: triCell, digit: d })),
          links: [],
        },
        explanation: {
          zh: `BUG+1：仅有一个三值格，且数字 ${digit} 在其行列宫都出现 3 次，故该格必须为 ${digit}。`,
          en: `BUG+1: with one tri-value cell, digit ${digit} appears 3 times in its row/column/box candidate sets, so that cell must be ${digit}.`,
        },
      };
    }
  }

  return null;
}

function countCandidateInHouse(grid: Grid, kind: 'row' | 'col' | 'box', index: number, digit: number): number {
  let count = 0;
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (kind === 'row' && ROW_OF[cell] !== index) continue;
    if (kind === 'col' && COL_OF[cell] !== index) continue;
    if (kind === 'box' && BOX_OF[cell] !== index) continue;
    if (grid.hasCandidate(cell, digit)) count++;
  }
  return count;
}
