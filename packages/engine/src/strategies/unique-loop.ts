import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const cells = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
            const masks = cells.map((c) => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
            if (masks.includes(0)) continue;

            const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
            if (popcount(intersect) < 2) continue;

            const intDigits = digitsOf(intersect);
            for (let di = 0; di < intDigits.length; di++) {
              for (let dj = di + 1; dj < intDigits.length; dj++) {
                const dMask = maskOf(intDigits[di]!) | maskOf(intDigits[dj]!);
                const pureCells = cells.filter((_, i) => (masks[i]! & ~dMask) === 0);
                if (pureCells.length !== 4) continue;

                const loopDigits = digitsOf(dMask);

                const elims: { cell: number; digit: number }[] = [];
                for (const d of loopDigits) {
                  const bit = maskOf(d);
                  for (let r = 0; r < 9; r++) {
                    if (r === r1 || r === r2) continue;
                    for (const c of [c1, c2]) {
                      const cell = r * 9 + c;
                      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) {
                        elims.push({ cell, digit: d });
                      }
                    }
                  }
                  for (let c = 0; c < 9; c++) {
                    if (c === c1 || c === c2) continue;
                    for (const r of [r1, r2]) {
                      const cell = r * 9 + c;
                      if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) {
                        elims.push({ cell, digit: d });
                      }
                    }
                  }
                }

                if (elims.length > 0) {
                  return {
                    strategyId: 'unique-loop',
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells,
                      candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                      links: [],
                    },
                    explanation: {
                      zh: `唯一环：四格仅含 {${loopDigits.join(',')}} 构成唯一环；消去环所在行列上的这些数字。`,
                      en: `Unique Loop: four cells contain only {${loopDigits.join(',')}} forming a unique loop; eliminate these digits from the loop's rows and columns.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG Lite', en: 'BUG Lite' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      const bivalueCells = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) === 2);
      if (bivalueCells.length < 3) continue;

      for (let size = 3; size <= Math.min(bivalueCells.length, 5); size++) {
        for (const combo of combinations(bivalueCells, size)) {
          let unionMask = 0;
          for (const c of combo) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== size) continue;

          const extraCells = emptyCells.filter((c) => !combo.includes(c));
          const nonBivalueExtra = extraCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
          if (nonBivalueExtra.length !== 1) continue;

          const specialCell = nonBivalueExtra[0]!;
          const specialMask = grid.candidatesOf(specialCell);
          const extraDigits = digitsOf(specialMask & ~unionMask);
          if (extraDigits.length !== 1) continue;

          const bugDigit = extraDigits[0]!;

          const coverage = combo.filter((c) => grid.hasCandidate(c, bugDigit));
          if (coverage.length < 2) continue;

          return {
            strategyId: 'bug-lite',
            placements: [{ cell: specialCell, digit: bugDigit }],
            eliminations: [],
            highlights: {
              cells: [...combo, specialCell],
              candidates: [...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...digitsOf(grid.candidatesOf(specialCell)).map((d) => ({ cell: specialCell, digit: d }))],
              links: [],
            },
            explanation: {
              zh: `BUG Lite：${size} 个双值格构成 BUG Lite 模式，${cellLabel(specialCell)} 必须为 ${bugDigit} 以避免致命模式。`,
              en: `BUG Lite: ${size} bivalue cells form a BUG Lite pattern; ${cellLabel(specialCell)} must be ${bugDigit} to avoid the deadly pattern.`,
            },
          };
        }
      }
    }
    return null;
  },
};

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) emptyCells.push(c);
    }

    const nonBivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
    if (nonBivalue.length < 2 || nonBivalue.length > 4) return null;

    const bivalueCells = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) === 2);
    if (bivalueCells.length + nonBivalue.length !== emptyCells.length) return null;

    let allBivalueMask = 0;
    for (const c of bivalueCells) allBivalueMask |= grid.candidatesOf(c);
    const bivalueDigits = digitsOf(allBivalueMask);

    for (const specialCell of nonBivalue) {
      const specialMask = grid.candidatesOf(specialCell);
      const extraDigits = digitsOf(specialMask).filter((d) => !bivalueDigits.includes(d));
      if (extraDigits.length >= 1 && extraDigits.length <= 2) {
        const elims = digitsOf(specialMask)
          .filter((d) => !extraDigits.includes(d))
          .map((d) => ({ cell: specialCell, digit: d }));
        if (elims.length > 0) {
          return {
            strategyId: 'bug-plus-n',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [specialCell, ...bivalueCells],
              candidates: emptyCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `BUG+N：除 ${nonBivalue.length} 格外全为双值格；消去非双值格中多余的 BUG 候选。`,
              en: `BUG+N: all but ${nonBivalue.length} cells are bivalue; eliminate extra non-BUG candidates from non-bivalue cells.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  function go(start: number, chosen: T[]): void {
    if (chosen.length === k) { result.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      go(i + 1, chosen);
      chosen.pop();
    }
  }
  go(0, []);
  return result;
}