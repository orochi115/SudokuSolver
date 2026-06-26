/**
 * VWXYZ-Wing — size-5 bent wing (WXYZ size-ladder generalization).
 */

import {
  CELLS,
  ROWS,
  COLS,
  BOXES,
  ROW_OF,
  COL_OF,
  BOX_OF,
  PEERS_OF,
  maskOf,
  popcount,
  digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* combinations<T>(arr: readonly T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let b = 0; b < 9; b++) {
      const boxCells = BOXES[b]!;
      const r0 = Math.floor(b / 3) * 3;
      const c0 = b % 3;
      const intersectingLines = [
        { lineCells: ROWS[r0]!, lineIdx: r0 },
        { lineCells: ROWS[r0 + 1]!, lineIdx: r0 + 1 },
        { lineCells: ROWS[r0 + 2]!, lineIdx: r0 + 2 },
        { lineCells: COLS[c0]!, lineIdx: 9 + c0 },
        { lineCells: COLS[c0 + 1]!, lineIdx: 9 + c0 + 1 },
        { lineCells: COLS[c0 + 2]!, lineIdx: 9 + c0 + 2 },
      ];

      for (const { lineCells, lineIdx } of intersectingLines) {
        const bentUnion = new Set([...boxCells, ...lineCells]);
        const emptyBent = [...bentUnion].filter((c) => grid.get(c) === 0);
        if (emptyBent.length < 5) continue;

        for (const combo of combinations(emptyBent, 5)) {
          if (combo.every((c) => BOX_OF[c] === b)) continue;
          if (combo.every((c) => lineCells.includes(c))) continue;

          let unionMask = 0;
          for (const c of combo) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== 5) continue;

          const ds = digitsOf(unionMask);
          let unrestricted = -1;
          const digitCells = new Map<number, number[]>();

          for (const d of ds) {
            const dBit = maskOf(d);
            const withD = combo.filter((c) => (grid.candidatesOf(c) & dBit) !== 0);
            digitCells.set(d, withD);

            let restricted = true;
            for (let i = 0; i < withD.length; i++) {
              for (let j = i + 1; j < withD.length; j++) {
                if (!PEERS_OF[withD[i]!]!.includes(withD[j]!)) {
                  restricted = false;
                  break;
                }
              }
              if (!restricted) break;
            }

            if (!restricted) {
              if (unrestricted !== -1) {
                unrestricted = -2;
                break;
              }
              unrestricted = d;
            }
          }

          if (unrestricted < 1) continue;

          const z = unrestricted;
          const zBit = maskOf(z);
          const zCells = digitCells.get(z)!;
          const elims: { cell: number; digit: number }[] = [];

          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0 || combo.includes(c)) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            const peers = new Set(PEERS_OF[c]!);
            if (zCells.every((zc) => peers.has(zc))) {
              elims.push({ cell: c, digit: z });
            }
          }

          if (elims.length === 0) continue;

          const lineLabel = lineIdx < 9 ? `Row ${lineIdx + 1}` : `Col ${lineIdx - 9 + 1}`;
          return {
            strategyId: 'vwxyz-wing',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...combo, ...elims.map((e) => e.cell)],
              candidates: [
                ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `VWXYZ翼：五格局限于宫 B${b + 1} 与 ${lineLabel}，候选 {${ds.join(',')}}，非受限数 ${z} 必真；消去同时看到所有 ${z} 的格。`,
              en: `VWXYZ-Wing: five cells confined to box B${b + 1} and ${lineLabel}, candidates {${ds.join(',')}} with non-restricted ${z}; eliminate ${z} from cells seeing every ${z} in the pattern.`,
            },
          };
        }
      }
    }
    return null;
  },
};