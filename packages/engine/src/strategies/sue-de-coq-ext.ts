import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function* combineK<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combineK(rest, k - 1)) yield [first!, ...combo];
  yield* combineK(rest, k);
}

function tryExtendedSdC(
  grid: Grid,
  lineCells: readonly number[],
  boxCells: readonly number[],
  lineLabel: string,
  boxLabel: string,
): Step | null {
  const intersectCells = lineCells.filter((c) => boxCells.includes(c));
  const emptyIntersect = intersectCells.filter((c) => grid.get(c) === 0);
  if (emptyIntersect.length < 2 || emptyIntersect.length > 3) return null;

  const restLine = lineCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);
  const restBox = boxCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);

  let intersectMask = 0;
  for (const c of emptyIntersect) intersectMask |= grid.candidatesOf(c);
  const intersectDigits = digitsOf(intersectMask);

  if (intersectDigits.length < 3) return null;

  const N = emptyIntersect.length;
  const numDigits = intersectDigits.length;

  for (let lineMask = 1; lineMask < (1 << numDigits) - 1; lineMask++) {
    const L_mask = intersectDigits.reduce((acc, d, i) => {
      return (lineMask & (1 << i)) ? acc | maskOf(d) : acc;
    }, 0);
    const B_mask = intersectMask & ~L_mask;
    if (B_mask === 0) continue;

    const L_digits = digitsOf(L_mask);
    const B_digits = digitsOf(B_mask);

    const neededLineCompanions = L_digits.length - N;
    const neededBoxCompanions = B_digits.length - N;

    if (neededLineCompanions < 0 || neededBoxCompanions < 0) continue;

    const lineCompanionCandidates = restLine.filter((c) => {
      const m = grid.candidatesOf(c);
      return m !== 0 && (m & ~L_mask) === 0;
    });

    const boxCompanionCandidates = restBox.filter((c) => {
      const m = grid.candidatesOf(c);
      return m !== 0 && (m & ~B_mask) === 0;
    });

    if (lineCompanionCandidates.length < neededLineCompanions) continue;
    if (boxCompanionCandidates.length < neededBoxCompanions) continue;

    for (const lComp of combineK(lineCompanionCandidates, neededLineCompanions)) {
      for (const bComp of combineK(boxCompanionCandidates, neededBoxCompanions)) {
        let coveredL = 0, coveredB = 0;
        for (const c of emptyIntersect) {
          coveredL |= grid.candidatesOf(c) & L_mask;
          coveredB |= grid.candidatesOf(c) & B_mask;
        }
        for (const c of lComp) coveredL |= grid.candidatesOf(c) & L_mask;
        for (const c of bComp) coveredB |= grid.candidatesOf(c) & B_mask;
        if (coveredL !== L_mask || coveredB !== B_mask) continue;

        const elims: { cell: number; digit: number }[] = [];
        const involvedCells = new Set([...emptyIntersect, ...lComp, ...bComp]);

        for (const c of restLine) {
          if (lComp.includes(c)) continue;
          for (const d of L_digits) {
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }
        for (const c of restBox) {
          if (bComp.includes(c)) continue;
          for (const d of B_digits) {
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }

        const lockedInside = intersectDigits.filter(
          (d) => !L_digits.includes(d) && !B_digits.includes(d),
        );
        for (const d of lockedInside) {
          for (const c of restLine) {
            if (involvedCells.has(c)) continue;
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
          for (const c of restBox) {
            if (involvedCells.has(c)) continue;
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }

        if (elims.length === 0) continue;
        const seen = new Set<number>();
        const uniqueElims = elims.filter((e) => {
          const key = e.cell * 10 + e.digit;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          strategyId: 'sue-de-coq-extended',
          placements: [],
          eliminations: uniqueElims,
          highlights: {
            cells: [...involvedCells, ...uniqueElims.map((e) => e.cell)],
            candidates: [
              ...emptyIntersect.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...lComp.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...bComp.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...uniqueElims,
            ],
            links: [],
          },
          explanation: {
            zh: `扩展苏德蔻：${emptyIntersect.length} 格（${lineLabel} ∩ ${boxLabel}）候选 {${intersectDigits.join(',')}} 扩大行/宫伴组消除。`,
            en: `Extended Sue de Coq: ${emptyIntersect.length} cells (${lineLabel} ∩ ${boxLabel}) with expanded line/box companion groups; extended elimination set.`,
          },
        };
      }
    }
  }

  return null;
}

export const sueDeCoqExtended: Strategy = {
  id: 'sue-de-coq-extended',
  name: { zh: '扩展苏德蔻', en: 'Extended Sue de Coq' },
  difficulty: 1015,
  tieBreak: ['house'],
  apply(grid: Grid): Step | null {
    for (let r = 0; r < 9; r++) {
      const rowCells = ROWS[r]!;
      for (let b = 0; b < 9; b++) {
        if (!rowCells.some((c) => BOX_OF[c] === b)) continue;
        const step = tryExtendedSdC(grid, rowCells, BOXES[b]!, `R${r + 1}`, `B${b + 1}`);
        if (step) return step;
      }
    }
    for (let col = 0; col < 9; col++) {
      const colCells = COLS[col]!;
      for (let b = 0; b < 9; b++) {
        if (!colCells.some((c) => BOX_OF[c] === b)) continue;
        const step = tryExtendedSdC(grid, colCells, BOXES[b]!, `C${col + 1}`, `B${b + 1}`);
        if (step) return step;
      }
    }
    return null;
  },
};