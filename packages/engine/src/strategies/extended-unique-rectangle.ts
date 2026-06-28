import { CELLS, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allEURConfigurations(): Generator<[number, number, number, number, number, number]> {
  // 1. Vertical: 3 rows, 2 cols
  for (let r1 = 0; r1 < 7; r1++) {
    for (let r2 = r1 + 1; r2 < 8; r2++) {
      for (let r3 = r2 + 1; r3 < 9; r3++) {
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const cell11 = r1 * 9 + c1;
            const cell12 = r1 * 9 + c2;
            const cell21 = r2 * 9 + c1;
            const cell22 = r2 * 9 + c2;
            const cell31 = r3 * 9 + c1;
            const cell32 = r3 * 9 + c2;

            const boxes = new Set([
              BOX_OF[cell11]!,
              BOX_OF[cell12]!,
              BOX_OF[cell21]!,
              BOX_OF[cell22]!,
              BOX_OF[cell31]!,
              BOX_OF[cell32]!,
            ]);
            if (boxes.size === 3) {
              yield [cell11, cell12, cell21, cell22, cell31, cell32];
            }
          }
        }
      }
    }
  }

  // 2. Horizontal: 2 rows, 3 cols
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 7; c1++) {
        for (let c2 = c1 + 1; c2 < 8; c2++) {
          for (let c3 = c2 + 1; c3 < 9; c3++) {
            const cell11 = r1 * 9 + c1;
            const cell12 = r1 * 9 + c2;
            const cell13 = r1 * 9 + c3;
            const cell21 = r2 * 9 + c1;
            const cell22 = r2 * 9 + c2;
            const cell23 = r2 * 9 + c3;

            const boxes = new Set([
              BOX_OF[cell11]!,
              BOX_OF[cell12]!,
              BOX_OF[cell13]!,
              BOX_OF[cell21]!,
              BOX_OF[cell22]!,
              BOX_OF[cell23]!,
            ]);
            if (boxes.size === 3) {
              yield [cell11, cell12, cell13, cell21, cell22, cell23];
            }
          }
        }
      }
    }
  }
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const config of allEURConfigurations()) {
      if (config.some((c) => grid.get(c) !== 0)) continue;

      // Loop over combinations of 3 digits
      for (let d1 = 1; d1 <= 7; d1++) {
        for (let d2 = d1 + 1; d2 <= 8; d2++) {
          for (let d3 = d2 + 1; d3 <= 9; d3++) {
            const S = [d1, d2, d3];
            const S_mask = maskOf(d1) | maskOf(d2) | maskOf(d3);

            // Check if every cell in config has some digits in S
            const has_S = config.every((c) => (grid.candidatesOf(c) & S_mask) !== 0);
            if (!has_S) continue;

            // Check if the union of candidates in S is exactly S
            let union_S = 0;
            for (const c of config) {
              union_S |= grid.candidatesOf(c) & S_mask;
            }
            if (union_S !== S_mask) continue;

            // Check Type 1: exactly one cell has extra candidates beyond S
            const extras = config.map((c) => {
              const extraMask = grid.candidatesOf(c) & ~S_mask;
              return { cell: c, extraMask };
            });

            const with_extras = extras.filter((x) => x.extraMask !== 0);
            if (with_extras.length === 1) {
              const target = with_extras[0]!;
              const tgt = target.cell;

              // We can eliminate S_mask from tgt
              const elims: { cell: number; digit: number }[] = [];
              for (const d of S) {
                if (grid.hasCandidate(tgt, d)) {
                  elims.push({ cell: tgt, digit: d });
                }
              }

              if (elims.length > 0) {
                const sLabel = S.join(',');
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: config,
                    candidates: [
                      ...config.flatMap((c) =>
                        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                      ),
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `扩展唯一矩形：六个格 {${config.map((c) => cellLabel(c)).join(', ')}} 包含三数 {${sLabel}} 组成可避免的多解结构；消去格 ${cellLabel(tgt)} 中的这些候选数。`,
                    en: `Extended Unique Rectangle: six cells {${config.map((c) => cellLabel(c)).join(', ')}} contain three digits {${sLabel}} forming a deadly pattern; eliminate candidates {${sLabel}} from the odd cell ${cellLabel(tgt)}.`,
                  },
                };
              }
            }
          }
        }
      }
    }

    return null;
  },
};
