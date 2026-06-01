import type { Strategy } from '../strategy.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import {
  DIGITS,
  HOUSE_REFS,
  combinations,
  digitsFromMask,
  houseName,
  maskOf,
  maskOfDigits,
  uniqueCells,
} from './_utils.js';
import { popcount } from '../grid.js';

function buildNakedSubsetStep(
  strategyId: string,
  subsetNameZh: string,
  subsetNameEn: string,
  grid: Grid,
  size: number,
): Step | null {
  for (const house of HOUSE_REFS) {
    const empties = house.cells.filter((cell) => grid.get(cell) === 0 && grid.candidatesOf(cell) !== 0);
    if (empties.length < size + 1) continue;

    for (const combo of combinations(empties, size)) {
      let union = 0;
      let valid = true;
      for (const cell of combo) {
        const mask = grid.candidatesOf(cell);
        const bits = popcount(mask);
        if (bits < 2 || bits > size) {
          valid = false;
          break;
        }
        union |= mask;
      }
      if (!valid || popcount(union) !== size) continue;

      const digits = digitsFromMask(union);
      const eliminations: { cell: number; digit: number }[] = [];
      for (const other of empties) {
        if (combo.includes(other)) continue;
        for (const digit of digits) {
          if (grid.hasCandidate(other, digit)) eliminations.push({ cell: other, digit });
        }
      }
      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: uniqueCells([...combo, ...eliminations.map((e) => e.cell)]),
          candidates: [
            ...combo.flatMap((cell) => digitsFromMask(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${houseName(house.kind, house.index)} 中这 ${size} 格只包含 ${digits.join('/')}（${subsetNameZh}），因此其余格可删除这些候选。`,
          en: `In ${houseName(house.kind, house.index)}, these ${size} cells contain only ${digits.join('/')} (${subsetNameEn}), so remove those digits from other cells in the house.`,
        },
      };
    }
  }
  return null;
}

function buildHiddenSubsetStep(
  strategyId: string,
  subsetNameZh: string,
  subsetNameEn: string,
  grid: Grid,
  size: number,
): Step | null {
  for (const house of HOUSE_REFS) {
    const empties = house.cells.filter((cell) => grid.get(cell) === 0 && grid.candidatesOf(cell) !== 0);
    if (empties.length < size) continue;

    for (const digitSet of combinations(DIGITS, size)) {
      const targetMask = maskOfDigits(digitSet);
      const coverCells = empties.filter((cell) => (grid.candidatesOf(cell) & targetMask) !== 0);
      if (coverCells.length !== size) continue;

      let everyDigitCovered = true;
      for (const digit of digitSet) {
        if (!coverCells.some((cell) => grid.hasCandidate(cell, digit))) {
          everyDigitCovered = false;
          break;
        }
      }
      if (!everyDigitCovered) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const cell of coverCells) {
        const mask = grid.candidatesOf(cell);
        for (let digit = 1; digit <= 9; digit++) {
          if ((targetMask & maskOf(digit)) !== 0) continue;
          if (mask & maskOf(digit)) eliminations.push({ cell, digit });
        }
      }
      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: uniqueCells([...coverCells, ...eliminations.map((e) => e.cell)]),
          candidates: [
            ...coverCells.flatMap((cell) =>
              digitSet.filter((digit) => grid.hasCandidate(cell, digit)).map((digit) => ({ cell, digit })),
            ),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${houseName(house.kind, house.index)} 中数字 ${digitSet.join('/')} 只出现在这 ${size} 格（${subsetNameZh}），因此这几格中的其他候选可删除。`,
          en: `In ${houseName(house.kind, house.index)}, digits ${digitSet.join('/')} are confined to these ${size} cells (${subsetNameEn}), so remove other candidates from those cells.`,
        },
      };
    }
  }
  return null;
}

function createNakedSubsetStrategy(
  id: string,
  zh: string,
  en: string,
  difficulty: number,
  size: number,
): Strategy {
  return {
    id,
    name: { zh, en },
    difficulty,
    apply(grid: Grid): Step | null {
      return buildNakedSubsetStep(id, zh, en, grid, size);
    },
  };
}

function createHiddenSubsetStrategy(
  id: string,
  zh: string,
  en: string,
  difficulty: number,
  size: number,
): Strategy {
  return {
    id,
    name: { zh, en },
    difficulty,
    apply(grid: Grid): Step | null {
      return buildHiddenSubsetStep(id, zh, en, grid, size);
    },
  };
}

export const nakedPair = createNakedSubsetStrategy('naked-pair', '显性数对', 'Naked Pair', 24, 2);
export const nakedTriple = createNakedSubsetStrategy('naked-triple', '显性三数组', 'Naked Triple', 26, 3);
export const nakedQuad = createNakedSubsetStrategy('naked-quad', '显性四数组', 'Naked Quad', 28, 4);

export const hiddenPair = createHiddenSubsetStrategy('hidden-pair', '隐性数对', 'Hidden Pair', 25, 2);
export const hiddenTriple = createHiddenSubsetStrategy('hidden-triple', '隐性三数组', 'Hidden Triple', 27, 3);
export const hiddenQuad = createHiddenSubsetStrategy('hidden-quad', '隐性四数组', 'Hidden Quad', 29, 4);
