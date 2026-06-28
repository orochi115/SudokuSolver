import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf, CELLS,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* combineK<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combineK(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combineK(rest, k);
}

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function tryExtSdC(
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

    for (let neededLC = Math.max(0, L_digits.length - N); neededLC <= Math.min(restLine.length, 3); neededLC++) {
      const neededBC = L_digits.length + B_digits.length - N - neededLC;
      if (neededBC < 0 || neededBC > restBox.length || neededBC > 3) continue;
      if (neededLC === 0 && neededBC === 0 && L_digits.length <= N && B_digits.length <= N) {
        continue;
      }

      const lineCompanionCandidates = restLine.filter((c) => {
        const m = grid.candidatesOf(c);
        return m !== 0 && (m & ~L_mask) === 0;
      });

      if (lineCompanionCandidates.length < neededLC) continue;

      const boxCompanionCandidates = restBox.filter((c) => {
        const m = grid.candidatesOf(c);
        return m !== 0 && (m & ~B_mask) === 0;
      });

      if (boxCompanionCandidates.length < neededBC) continue;

      for (const lComp of combineK(lineCompanionCandidates, neededLC)) {
        let coveredL = 0;
        for (const c of emptyIntersect) coveredL |= (grid.candidatesOf(c) & L_mask);
        for (const c of lComp) coveredL |= (grid.candidatesOf(c) & L_mask);
        if (coveredL !== L_mask) continue;

        const L_confinedInLine = restLine.every((c) => {
          if (lComp.includes(c)) return true;
          return (grid.candidatesOf(c) & L_mask) === 0;
        });
        if (!L_confinedInLine) continue;

        for (const bComp of combineK(boxCompanionCandidates, neededBC)) {
          let coveredB = 0;
          for (const c of emptyIntersect) coveredB |= (grid.candidatesOf(c) & B_mask);
          for (const c of bComp) coveredB |= (grid.candidatesOf(c) & B_mask);
          if (coveredB !== B_mask) continue;

          const B_confinedInBox = restBox.every((c) => {
            if (bComp.includes(c)) return true;
            return (grid.candidatesOf(c) & B_mask) === 0;
          });
          if (!B_confinedInBox) continue;

          const isBasic = neededLC === 1 && neededBC === 1 && N === 2;
          if (isBasic) continue;

          const elims: { cell: number; digit: number }[] = [];

          for (const c of restLine) {
            if (lComp.includes(c)) continue;
            for (const d of L_digits) {
              if (grid.hasCandidate(c, d)) {
                elims.push({ cell: c, digit: d });
              }
            }
          }

          for (const c of restBox) {
            if (bComp.includes(c)) continue;
            for (const d of B_digits) {
              if (grid.hasCandidate(c, d)) {
                elims.push({ cell: c, digit: d });
              }
            }
          }

          const lockedInside = intersectDigits.filter((d) => {
            const bit = maskOf(d);
            return !(L_mask & bit) && !(B_mask & bit);
          });
          for (const d of lockedInside) {
            for (const c of restLine) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
            for (const c of restBox) {
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
          if (uniqueElims.length === 0) continue;

          const involved = [...emptyIntersect, ...lComp, ...bComp];

          return {
            strategyId: 'sue-de-coq-extended',
            placements: [],
            eliminations: uniqueElims,
            highlights: {
              cells: [...new Set([...involved, ...uniqueElims.map((e) => e.cell)])],
              candidates: involved.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `扩展苏德蔻：${emptyIntersect.length} 格（${lineLabel} ∩ ${boxLabel}）候选数 {${intersectDigits.join(',')}} 分为行/列部分 {${L_digits.join(',')}} 和宫部分 {${B_digits.join(',')}}（含扩展格）；行/列部分从行/列其余格消去，宫部分从宫其余格消去。`,
              en: `Extended Sue de Coq: ${emptyIntersect.length} cells (${lineLabel} ∩ ${boxLabel}) with candidates {${intersectDigits.join(',')}} split into line-part {${L_digits.join(',')}} and box-part {${B_digits.join(',')}} (with extended companions); eliminate line-part from rest of line, box-part from rest of box.`,
            },
          };
        }
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
        const step = tryExtSdC(grid, rowCells, BOXES[b]!, `Row ${r + 1}`, `Box B${b + 1}`);
        if (step) return step;
      }
    }

    for (let col = 0; col < 9; col++) {
      const colCells = COLS[col]!;
      for (let b = 0; b < 9; b++) {
        if (!colCells.some((c) => BOX_OF[c] === b)) continue;
        const step = tryExtSdC(grid, colCells, BOXES[b]!, `Col ${col + 1}`, `Box B${b + 1}`);
        if (step) return step;
      }
    }

    return null;
  },
};
