import { ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, digitsOf, popcount, maskOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性技巧', en: 'Uniqueness Techniques' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    const urStep = findURType1(grid);
    if (urStep) return urStep;
    return null;
  },
};

function findURType1(grid: Grid): Step | null {
  for (let bi = 0; bi < 9; bi++) {
    const baseRow = Math.floor(bi / 3) * 3;
    const baseCol = (bi % 3) * 3;

    for (let r1 = baseRow; r1 < baseRow + 3; r1++) {
      for (let r2 = r1 + 1; r2 < baseRow + 3; r2++) {
        for (let c1 = baseCol; c1 < baseCol + 3; c1++) {
          for (let c2 = c1 + 1; c2 < baseCol + 3; c2++) {
            const corners = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
            const result = checkURType1(grid, corners);
            if (result) return result;
          }
        }
      }
    }
  }
  return null;
}

function checkURType1(grid: Grid, corners: number[]): Step | null {
  const emptyCorners: number[] = [];
  const filledCornerValues: number[] = [];
  const emptyMasks: Map<number, number> = new Map();

  for (const c of corners) {
    if (grid.get(c) === 0) {
      emptyCorners.push(c);
      emptyMasks.set(c, grid.candidatesOf(c));
    } else {
      filledCornerValues.push(grid.get(c)!);
    }
  }

  if (emptyCorners.length !== 3) return null;
  if (filledCornerValues.length !== 1) return null;

  const emptyMasksList = emptyCorners.map(c => emptyMasks.get(c)!);

  let bivalueMask = 0;
  let extraCell = -1;

  for (let i = 0; i < 3; i++) {
    const mask = emptyMasksList[i]!;
    if (popcount(mask) === 2) {
      if (bivalueMask === 0) {
        bivalueMask = mask;
      } else if (mask !== bivalueMask) {
        return null;
      }
    } else {
      if (extraCell !== -1) return null;
      extraCell = i;
    }
  }

  if (bivalueMask === 0 || extraCell === -1) return null;

  const extraMask = emptyMasksList[extraCell]!;
  if ((extraMask & bivalueMask) !== bivalueMask) return null;

  const extraDigits = extraMask & ~bivalueMask;
  if (extraDigits === 0) return null;

  const eliminations: { cell: number; digit: number }[] = [];
  for (const d of digitsOf(extraDigits)) {
    eliminations.push({ cell: emptyCorners[extraCell]!, digit: d });
  }

  const pairDigits = digitsOf(bivalueMask);
  const cornerStrs = corners.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`);

  return {
    strategyId: 'uniqueness',
    placements: [],
    eliminations,
    highlights: {
      cells: corners,
      candidates: [
        ...emptyCorners.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `唯一矩形(Type 1): ${cornerStrs.join(',')}构成致命模式{${pairDigits.join(',')}}，排除${cornerStrs[emptyCorners[extraCell]!]}的额外候选数。`,
      en: `Unique Rectangle (Type 1): ${cornerStrs.join(',')} form a deadly pattern {${pairDigits.join(',')}}, eliminating extra candidates from ${cornerStrs[emptyCorners[extraCell]!]}.`,
    },
  };
}

function findBUGPlusOne(grid: Grid): Step | null {
  let trivalueCell = -1;
  let trivalueMask = 0;
  let bivalueCount = 0;
  let emptyCount = 0;

  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0) continue;
    emptyCount++;
    const cnt = popcount(grid.candidatesOf(c));
    if (cnt === 2) {
      bivalueCount++;
    } else if (cnt === 3) {
      if (trivalueCell !== -1) return null;
      trivalueCell = c;
      trivalueMask = grid.candidatesOf(c);
    } else if (cnt > 3) {
      return null;
    }
  }

  if (trivalueCell === -1) return null;
  if (bivalueCount !== emptyCount - 1) return null;

  const tvDigits = digitsOf(trivalueMask);

  for (const d of tvDigits) {
    const dBit = maskOf(d);
    let allHousesConjugate = true;

    for (const house of [...ROWS, ...COLS, ...BOXES]) {
      if (!house.includes(trivalueCell)) continue;
      const locs: number[] = [];
      for (const c of house) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & dBit) !== 0) locs.push(c);
      }
      if (locs.length !== 2 || !locs.includes(trivalueCell)) { allHousesConjugate = false; break; }
      const otherLoc = locs.find(c => c !== trivalueCell)!;
      if (popcount(grid.candidatesOf(otherLoc)) !== 2) { allHousesConjugate = false; break; }
    }
    if (!allHousesConjugate) continue;

    const otherMask = trivalueMask & ~dBit;
    const eliminations: { cell: number; digit: number }[] = [];
    for (const od of digitsOf(otherMask)) {
      eliminations.push({ cell: trivalueCell, digit: od });
    }

    const tvStr = `R${ROW_OF[trivalueCell]! + 1}C${COL_OF[trivalueCell]! + 1}`;
    return {
      strategyId: 'uniqueness',
      placements: [],
      eliminations,
      highlights: {
        cells: [trivalueCell],
        candidates: [
          ...tvDigits.map(dd => ({ cell: trivalueCell, digit: dd })),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `BUG+1: ${tvStr}是唯一三值格，数字${d}在所有相关单元为共轭对，排除其他候选数。`,
        en: `BUG+1: ${tvStr} is the only trivalue cell, digit ${d} has conjugate pairs in all houses, eliminating other candidates.`,
      },
    };
  }
  return null;
}