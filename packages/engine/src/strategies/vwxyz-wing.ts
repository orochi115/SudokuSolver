import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function pairwiseSees(cells: number[]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (!PEERS_OF[cells[i]!]!.includes(cells[j]!)) {
        return false;
      }
    }
  }
  return true;
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const seen_combos = new Set<string>();

    const checkPool = (C_pool: number[]): Step | null => {
      // Choose 5 cells from C_pool
      const n = C_pool.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          for (let k = j + 1; k < n; k++) {
            for (let l = k + 1; l < n; l++) {
              for (let m = l + 1; m < n; m++) {
                const combo = [C_pool[i]!, C_pool[j]!, C_pool[k]!, C_pool[l]!, C_pool[m]!].sort((a, b) => a - b) as [number, number, number, number, number];
                const key = combo.join(',');
                if (seen_combos.has(key)) continue;
                seen_combos.add(key);

                // Step 1: candidates union
                let union_mask = 0;
                for (const c of combo) {
                  union_mask |= grid.candidatesOf(c);
                }
                if (popcount(union_mask) !== 5) continue;

                const digits = digitsOf(union_mask);

                // Step 2: identify restricted vs non-restricted digits
                let non_restricted_digit = -1;
                let non_restricted_count = 0;

                for (const d of digits) {
                  const bit = maskOf(d);
                  const cells_with_d = combo.filter((c) => grid.candidatesOf(c) & bit);
                  if (cells_with_d.length === 0) continue;

                  if (!pairwiseSees(cells_with_d)) {
                    non_restricted_digit = d;
                    non_restricted_count++;
                  }
                }

                if (non_restricted_count === 1) {
                  // Found a valid VWXYZ-Wing!
                  const z = non_restricted_digit;
                  const zBit = maskOf(z);
                  const cells_with_z = combo.filter((c) => grid.candidatesOf(c) & zBit);

                  // Find cells T outside combo that see all cells in cells_with_z
                  const elims: { cell: number; digit: number }[] = [];
                  for (let t = 0; t < CELLS; t++) {
                    if (grid.get(t) !== 0) continue;
                    if (combo.includes(t)) continue;
                    if (!(grid.candidatesOf(t) & zBit)) continue;

                    const seesAll = cells_with_z.every((c) => PEERS_OF[t]!.includes(c));
                    if (seesAll) {
                      elims.push({ cell: t, digit: z });
                    }
                  }

                  if (elims.length > 0) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: [...combo, ...elims.map((e) => e.cell)],
                        candidates: [
                          ...combo.flatMap((c) =>
                            digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                          ),
                          ...elims,
                        ],
                        links: [],
                      },
                      explanation: {
                        zh: `VWXYZ翼：五个格 {${combo.map((c) => cellLabel(c)).join(', ')}} 包含五个数字 {${digits.join(',')}}；其中只有数字 ${z} 为非受限公共候选数，消去所有能同时看到这五个格中所有 ${z} 的格子的候选数 ${z}。`,
                        en: `VWXYZ-Wing: five cells {${combo.map((c) => cellLabel(c)).join(', ')}} contain five digits {${digits.join(',')}}; only ${z} is non-restricted, so eliminate ${z} from cells seeing all ${z} in the pattern.`,
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
    };

    // 1. Row + overlapping box pools
    for (let r = 0; r < 9; r++) {
      const row_boxes = [
        Math.floor(r / 3) * 3,
        Math.floor(r / 3) * 3 + 1,
        Math.floor(r / 3) * 3 + 2,
      ];
      for (const b of row_boxes) {
        const C_pool: number[] = [];
        for (let c = 0; c < 81; c++) {
          if (grid.get(c) === 0 && (ROW_OF[c] === r || BOX_OF[c] === b)) {
            C_pool.push(c);
          }
        }
        if (C_pool.length < 5) continue;
        const res = checkPool(C_pool);
        if (res) return res;
      }
    }

    // 2. Column + overlapping box pools
    for (let col = 0; col < 9; col++) {
      const col_boxes = [
        0 * 3 + Math.floor(col / 3),
        1 * 3 + Math.floor(col / 3),
        2 * 3 + Math.floor(col / 3),
      ];
      for (const b of col_boxes) {
        const C_pool: number[] = [];
        for (let c = 0; c < 81; c++) {
          if (grid.get(c) === 0 && (COL_OF[c] === col || BOX_OF[c] === b)) {
            C_pool.push(c);
          }
        }
        if (C_pool.length < 5) continue;
        const res = checkPool(C_pool);
        if (res) return res;
      }
    }

    return null;
  },
};
