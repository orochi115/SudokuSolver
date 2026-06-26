/**
 * Tridagon / Anti-Tridagon (Thor's Hammer) — exotic deadly pattern.
 *
 * Implements the directly-usable Type-1 form: four boxes that form a rectangle
 * across two bands and two stacks, three transversal cells per box, eleven of
 * the twelve pattern cells restricted to a common digit triple D, and exactly
 * one cell (the guardian / target) carrying extra candidates outside D.
 * Because the all-D configuration is impossible, the guardian must be true,
 * so the three D-digits can be eliminated from the target cell.
 */

import { BOXES, BOX_OF, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Relative-row -> relative-column permutations that form a box transversal. */
const PERMUTATIONS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

interface Transversal {
  cells: readonly [number, number, number];
  unionMask: number;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Build every valid transversal inside a box and its candidate-union mask. */
function buildBoxTransversals(grid: Grid, boxIdx: number): Transversal[] {
  const cells = BOXES[boxIdx]!;
  const byRel = new Map<number, number>();
  for (const c of cells) {
    const key = (ROW_OF[c]! % 3) * 3 + (COL_OF[c]! % 3);
    byRel.set(key, c);
  }

  const out: Transversal[] = [];
  for (const p of PERMUTATIONS) {
    const t: number[] = [];
    for (let r = 0; r < 3; r++) {
      const c = byRel.get(r * 3 + p[r]!);
      if (c === undefined) break;
      if (grid.get(c) !== 0) break; // pattern cells must be unsolved
      t.push(c);
    }
    if (t.length !== 3) continue;

    const unionMask = grid.candidatesOf(t[0]!) | grid.candidatesOf(t[1]!) | grid.candidatesOf(t[2]!);
    if (popcount(unionMask) !== 3) continue; // box must jointly cover exactly 3 digits

    out.push({ cells: t as unknown as readonly [number, number, number], unionMask });
  }
  return out;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环 / 反三值死环（雷神之锤）', en: "Tridagon / Anti-Tridagon (Thor's Hammer)" },
  difficulty: 1100,
  tieBreak: ['house', 'digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const boxTransversals: Transversal[][] = Array.from({ length: 9 }, (_, b) => buildBoxTransversals(grid, b));

    // Iterate every rectangle of four boxes: two distinct bands and two distinct stacks.
    for (let band1 = 0; band1 < 3; band1++) {
      for (let band2 = band1 + 1; band2 < 3; band2++) {
        for (let stack1 = 0; stack1 < 3; stack1++) {
          for (let stack2 = stack1 + 1; stack2 < 3; stack2++) {
            const boxes: readonly [number, number, number, number] = [
              band1 * 3 + stack1,
              band1 * 3 + stack2,
              band2 * 3 + stack1,
              band2 * 3 + stack2,
            ];

            const ts0 = boxTransversals[boxes[0]!]!;
            const ts1 = boxTransversals[boxes[1]!]!;
            const ts2 = boxTransversals[boxes[2]!]!;
            const ts3 = boxTransversals[boxes[3]!]!;
            for (const t0 of ts0) {
              for (const t1 of ts1) {
                for (const t2 of ts2) {
                  for (const t3 of ts3) {
                    const D = t0.unionMask;
                    if (t1.unionMask !== D || t2.unionMask !== D || t3.unionMask !== D) continue;

                    const patternCells = [...t0.cells, ...t1.cells, ...t2.cells, ...t3.cells];
                    let target: number | null = null;
                    let guardianCells = 0;
                    for (const c of patternCells) {
                      if ((grid.candidatesOf(c) & ~D) !== 0) {
                        guardianCells++;
                        target = c;
                      }
                    }
                    if (guardianCells !== 1 || target === null) continue;

                    const elimDigits = digitsOf(D).filter((d) => grid.hasCandidate(target!, d));
                    if (elimDigits.length === 0) continue;

                    const dList = digitsOf(D);
                    const boxLabels = boxes.map((b) => `b${b + 1}`).join(',');
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: elimDigits.map((d) => ({ cell: target!, digit: d })),
                      highlights: {
                        cells: patternCells,
                        candidates: patternCells.flatMap((c) =>
                          digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
                        ),
                        links: [],
                      },
                      explanation: {
                        zh: `三值死环（雷神之锤）：宫 ${boxLabels} 的 12 个跨线格几乎被致命模式 {${dList.join(',')}} 覆盖，唯一守护格 ${cellLabel(target)} 必须填入额外候选数，消去该格的 {${dList.join(',')}}。`,
                        en: `Tridagon (Thor's Hammer): the 12 transversal cells in boxes ${boxLabels} are almost covered by the deadly pattern {${dList.join(',')}}; the sole guardian ${cellLabel(target)} must take an extra candidate, eliminating {${dList.join(',')}} from it.`,
                      },
                    };
                  }
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
