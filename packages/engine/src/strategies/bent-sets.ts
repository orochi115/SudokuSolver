import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // 54 overlapping line-box pairs: 9 rows * 3 boxes, 9 cols * 3 boxes
    for (let r = 0; r < 9; r++) {
      const row_house = HOUSES[r]!;
      const overlapping_boxes = [
        Math.floor(r / 3) * 3,
        Math.floor(r / 3) * 3 + 1,
        Math.floor(r / 3) * 3 + 2,
      ];

      for (const b of overlapping_boxes) {
        const box_house = HOUSES[18 + b]!;
        const I = row_house.filter((c) => box_house.includes(c));
        const line_remainder = row_house.filter((c) => !I.includes(c));
        const box_remainder = box_house.filter((c) => !I.includes(c));

        const res = checkIntersection(grid, I, line_remainder, box_remainder);
        if (res) return res;
      }
    }

    for (let col = 0; col < 9; col++) {
      const col_house = HOUSES[9 + col]!;
      const overlapping_boxes = [
        0 * 3 + Math.floor(col / 3),
        1 * 3 + Math.floor(col / 3),
        2 * 3 + Math.floor(col / 3),
      ];

      for (const b of overlapping_boxes) {
        const box_house = HOUSES[18 + b]!;
        const I = col_house.filter((c) => box_house.includes(c));
        const line_remainder = col_house.filter((c) => !I.includes(c));
        const box_remainder = box_house.filter((c) => !I.includes(c));

        const res = checkIntersection(grid, I, line_remainder, box_remainder);
        if (res) return res;
      }
    }

    return null;
  },
};

function checkIntersection(
  grid: Grid,
  I: number[],
  line_remainder: number[],
  box_remainder: number[],
): Step | null {
  const line_unsolved = line_remainder.filter((c) => grid.get(c) === 0);
  const box_unsolved = box_remainder.filter((c) => grid.get(c) === 0);

  // S_size is 2 (Pair) or 3 (Triple)
  for (const S_size of [2, 3] as const) {
    const k = S_size - 1; // size of ALS cells (1 or 2)

    if (line_unsolved.length < k || box_unsolved.length < k) continue;

    // Loop over combinations of S_size digits
    for (let d1 = 1; d1 <= 9; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const d3_limit = S_size === 3 ? 9 : d2;
        for (let d3 = d2 + (S_size === 3 ? 1 : 0); d3 <= d3_limit; d3++) {
          const S = S_size === 2 ? [d1, d2] : [d1, d2, d3];
          const S_mask = S.reduce((m, d) => m | maskOf(d), 0);

          // Find all subsets L of line_unsolved of size k with candidates ⊆ S
          const L_candidates: number[][] = [];
          for (const combo of getCombinations(line_unsolved, k)) {
            if (combo.every((c) => (grid.candidatesOf(c) & ~S_mask) === 0)) {
              L_candidates.push(combo);
            }
          }

          // Find all subsets B of box_unsolved of size k with candidates ⊆ S
          const B_candidates: number[][] = [];
          for (const combo of getCombinations(box_unsolved, k)) {
            if (combo.every((c) => (grid.candidatesOf(c) & ~S_mask) === 0)) {
              B_candidates.push(combo);
            }
          }

          for (const L of L_candidates) {
            for (const B of B_candidates) {
              const elims: { cell: number; digit: number }[] = [];

              // Check Box-side fire
              const line_off_I_L = line_remainder.filter((c) => !L.includes(c));
              const line_confinement = line_off_I_L.every((c) => {
                if (grid.get(c) === 0) {
                  return (grid.candidatesOf(c) & S_mask) === 0;
                } else {
                  return (maskOf(grid.get(c)) & S_mask) === 0;
                }
              });
              if (line_confinement) {
                const box_off_I_B = box_remainder.filter((c) => !B.includes(c));
                for (const c of box_off_I_B) {
                  if (grid.get(c) !== 0) continue;
                  const cands = grid.candidatesOf(c);
                  for (const d of S) {
                    if (cands & maskOf(d)) {
                      elims.push({ cell: c, digit: d });
                    }
                  }
                }
              }

              // Check Line-side fire
              const box_off_I_B = box_remainder.filter((c) => !B.includes(c));
              const box_confinement = box_off_I_B.every((c) => {
                if (grid.get(c) === 0) {
                  return (grid.candidatesOf(c) & S_mask) === 0;
                } else {
                  return (maskOf(grid.get(c)) & S_mask) === 0;
                }
              });
              if (box_confinement) {
                const line_off_I_L = line_remainder.filter((c) => !L.includes(c));
                for (const c of line_off_I_L) {
                  if (grid.get(c) !== 0) continue;
                  const cands = grid.candidatesOf(c);
                  for (const d of S) {
                    if (cands & maskOf(d)) {
                      elims.push({ cell: c, digit: d });
                    }
                  }
                }
              }

              if (elims.length > 0) {
                const allCells = [...L, ...B, ...I];
                const sLabel = S.join('');
                return {
                  strategyId: 'bent-sets',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                    candidates: [
                      ...L.flatMap((c) =>
                        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                      ),
                      ...B.flatMap((c) =>
                        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                      ),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `弯曲集（Almost Locked Candidates）：线/宫交叉区域外，线侧 ALS {${L.map((c) => cellLabel(c)).join(',')}} 与宫侧 ALS {${B.map((c) => cellLabel(c)).join(',')}} 共享候选数 {${sLabel}}，弯曲连接；消去非交叉非 ALS 区域中的对应候选数。`,
                    en: `Bent Sets (Almost Locked Candidates): line-ALS {${L.map((c) => cellLabel(c)).join(',')}} and box-ALS {${B.map((c) => cellLabel(c)).join(',')}} share candidates {${sLabel}} at line-box intersection; eliminate candidates {${sLabel}} from non-ALS remainder cells.`,
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
}

function getCombinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  function run(start: number, path: number[]) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]!);
      run(i + 1, path);
      path.pop();
    }
  }
  run(0, []);
  return result;
}
