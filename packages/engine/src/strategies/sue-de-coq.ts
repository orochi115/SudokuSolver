/**
 * T4: Sue de Coq.
 *
 * At a line-box intersection, candidate sets can be partitioned into
 * overlapping locked subsets that eliminate candidates from the line and box.
 */

import { PEERS_OF, HOUSES, maskOf, digitsOf, ROWS, COLS, BOXES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: 'Sue de Coq', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid: Grid): Step | null {
    for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
      const result = trySueDeCoqLine(grid, rowIdx, 'row');
      if (result) return result;
    }

    for (let colIdx = 0; colIdx < 9; colIdx++) {
      const result = trySueDeCoqLine(grid, colIdx, 'col');
      if (result) return result;
    }

    return null;
  },
};

function trySueDeCoqLine(grid: Grid, lineIdx: number, lineType: 'row' | 'col'): Step | null {
  const line = lineType === 'row' ? ROWS[lineIdx]! : COLS[lineIdx]!;
  const lineCells = [...line].filter((c) => grid.get(c) === 0);

  if (lineCells.length < 2) return null;

  const lineBoxIntersection: number[] = [];
  for (const c of lineCells) {
    const boxIdx = 18 + (Math.floor(c / 27) * 3 + Math.floor((c % 9) / 3));
    const box = BOXES[boxIdx - 18]!;
    const intersection = box.filter((bc) => lineCells.includes(bc));
    if (intersection.length > 0 && !lineBoxIntersection.includes(c)) {
      lineBoxIntersection.push(c);
    }
  }

  if (lineBoxIntersection.length < 2) return null;

  const intersectionDigits = new Set<number>();
  for (const c of lineBoxIntersection) {
    if (grid.hasCandidate(c, intersectionDigits.size + 1)) {
      intersectionDigits.add(c);
    }
  }

  for (let digit = 1; digit <= 9; digit++) {
    const bit = maskOf(digit);
    let hasIntersection = false;
    for (const c of lineBoxIntersection) {
      if ((grid.candidatesOf(c) & bit) !== 0) {
        hasIntersection = true;
        break;
      }
    }
    if (!hasIntersection) continue;

    const lineExclIntersection = lineCells.filter((c) => !lineBoxIntersection.includes(c));
    const lineExclDigits = new Set<number>();
    for (const c of lineExclIntersection) {
      for (const d of digitsOf(grid.candidatesOf(c))) {
        lineExclDigits.add(d);
      }
    }

    const boxIdx = 18 + (Math.floor(lineBoxIntersection[0]! / 27) * 3 + Math.floor((lineBoxIntersection[0]! % 9) / 3));
    const box = BOXES[boxIdx - 18]!;
    const boxCells = [...box].filter((c) => grid.get(c) === 0);
    const boxExclIntersection = boxCells.filter((c) => !lineBoxIntersection.includes(c));
    const boxExclDigits = new Set<number>();
    for (const c of boxExclIntersection) {
      for (const d of digitsOf(grid.candidatesOf(c))) {
        boxExclDigits.add(d);
      }
    }

    const lineExcl = [...lineExclDigits].filter((d) => !intersectionDigits.has(d) && boxExclDigits.has(d));
    const boxExcl = [...boxExclDigits].filter((d) => !intersectionDigits.has(d) && lineExclDigits.has(d));

    if (lineExcl.length > 0 || boxExcl.length > 0) {
      const eliminations: CellDigit[] = [];

      for (const c of lineExclIntersection) {
        for (const d of lineExcl) {
          if (grid.hasCandidate(c, d)) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      for (const c of boxExclIntersection) {
        for (const d of boxExcl) {
          if (grid.hasCandidate(c, d)) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      if (eliminations.length > 0) {
        const lirc = Math.floor(lineBoxIntersection[0]! / 9) + 1;
        const licc = (lineBoxIntersection[0]! % 9) + 1;

        return {
          strategyId: 'sue-de-coq',
          placements: [],
          eliminations,
          highlights: {
            cells: [...lineBoxIntersection, ...lineExclIntersection, ...boxExclIntersection],
            candidates: lineBoxIntersection.flatMap((c) =>
              digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
            ),
            links: [],
          },
          explanation: {
            zh: `行/列与box交点 R${lirc}C${licc} 等形成 Sue de Coq 格局，线侧候选 ${lineExcl.join(',')} 与 箱侧候选 ${boxExcl.join(',')} 可分别从线侧和箱侧排除（Sue de Coq）。`,
            en: `Line-box intersection at R${lirc}C${licc} forms Sue de Coq; line candidates ${lineExcl.join(',')} and box candidates ${boxExcl.join(',')} eliminated from respective sides (Sue de Coq).`,
          },
        };
      }
    }
  }

  return null;
}
