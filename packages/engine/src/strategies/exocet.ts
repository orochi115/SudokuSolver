import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Search horizontal bands first, then vertical stacks
    // 1. Horizontal Bands (0, 1, 2)
    for (let band = 0; band < 3; band++) {
      const boxes = [band * 3, band * 3 + 1, band * 3 + 2];
      for (let bi = 0; bi < 3; bi++) {
        const base_box = boxes[bi]!;
        const t_box1 = boxes[(bi + 1) % 3]!;
        const t_box2 = boxes[(bi + 2) % 3]!;

        // Find empty cell pairs in base_box aligned in a mini-line
        const base_cells = getEmptyCellsInBox(grid, base_box);
        for (let i = 0; i < base_cells.length; i++) {
          for (let j = i + 1; j < base_cells.length; j++) {
            const b1 = base_cells[i]!;
            const b2 = base_cells[j]!;

            const r1 = ROW_OF[b1]!;
            const c1 = COL_OF[b1]!;
            const r2 = ROW_OF[b2]!;
            const c2 = COL_OF[b2]!;

            const aligned_row = r1 === r2;
            const aligned_col = c1 === c2;

            if (!aligned_row && !aligned_col) continue;

            const b1_mask = grid.candidatesOf(b1);
            const b2_mask = grid.candidatesOf(b2);
            const Bdigits_mask = b1_mask | b2_mask;
            const Bdigits = digitsOf(Bdigits_mask);

            if (Bdigits.length < 3 || Bdigits.length > 4) continue;

            // Targets t1 and t2 in target boxes
            const target_cells1 = getEmptyCellsInBox(grid, t_box1);
            const target_cells2 = getEmptyCellsInBox(grid, t_box2);

            for (const t1 of target_cells1) {
              for (const t2 of target_cells2) {
                if (PEERS_OF[t1]!.includes(t2)) continue;

                // Neither target sees any base cells
                if (PEERS_OF[t1]!.includes(b1) || PEERS_OF[t1]!.includes(b2)) continue;
                if (PEERS_OF[t2]!.includes(b1) || PEERS_OF[t2]!.includes(b2)) continue;

                // Target candidates must cover base digits
                const t1_mask = grid.candidatesOf(t1);
                const t2_mask = grid.candidatesOf(t2);
                const T_mask = t1_mask | t2_mask;

                if ((Bdigits_mask & T_mask) !== Bdigits_mask) continue;

                // Companion cells: other cells in the same mini-line (row/col) inside target box
                const checkCompanion = (t: number, box: number) => {
                  const t_r = ROW_OF[t]!;
                  const t_c = COL_OF[t]!;
                  for (let c = 0; c < 81; c++) {
                    if (BOX_OF[c] === box && c !== t) {
                      if ((aligned_row && ROW_OF[c] === t_r) || (aligned_col && COL_OF[c] === t_c)) {
                        const mask = grid.get(c) === 0 ? grid.candidatesOf(c) : (1 << (grid.get(c) - 1));
                        if (mask & Bdigits_mask) {
                          return false; // contains a base digit candidate
                        }
                      }
                    }
                  }
                  return true;
                };

                if (!checkCompanion(t1, t_box1) || !checkCompanion(t2, t_box2)) continue;

                // Find unoccupied base position b3
                let b3 = -1;
                for (let c = 0; c < 81; c++) {
                  if (BOX_OF[c] === base_box && c !== b1 && c !== b2) {
                    if (aligned_row && ROW_OF[c] === r1) {
                      b3 = c;
                      break;
                    }
                    if (aligned_col && COL_OF[c] === c1) {
                      b3 = c;
                      break;
                    }
                  }
                }
                if (b3 === -1) continue;

                // Collect S-cells (outside tier)
                const s_cells: number[] = [];
                if (aligned_row) {
                  const r_start = Math.floor(r1 / 3) * 3;
                  for (let c = 0; c < 81; c++) {
                    const r_c = ROW_OF[c]!;
                    if (r_c < r_start || r_c >= r_start + 3) {
                      const col_c = COL_OF[c]!;
                      if (col_c === COL_OF[b3] || col_c === COL_OF[t1] || col_c === COL_OF[t2]) {
                        s_cells.push(c);
                      }
                    }
                  }
                } else {
                  const c_start = Math.floor(c1 / 3) * 3;
                  for (let c = 0; c < 81; c++) {
                    const col_c = COL_OF[c]!;
                    if (col_c < c_start || col_c >= c_start + 3) {
                      const r_c = ROW_OF[c]!;
                      if (r_c === ROW_OF[b3] || r_c === ROW_OF[t1] || r_c === ROW_OF[t2]) {
                        s_cells.push(c);
                      }
                    }
                  }
                }

                // Cover rule check
                let cover_ok = true;
                for (const d of Bdigits) {
                  let count = 0;
                  for (const s of s_cells) {
                    if (grid.get(s) === d || (grid.get(s) === 0 && grid.hasCandidate(s, d))) {
                      count++;
                    }
                  }
                  if (count > 2) {
                    cover_ok = false;
                    break;
                  }
                }
                if (!cover_ok) continue;

                // Rule 1: target purge (remove candidates not in Bdigits)
                const elims: { cell: number; digit: number }[] = [];

                const addTargetElims = (t: number, t_mask: number) => {
                  for (const d of digitsOf(t_mask)) {
                    if (!Bdigits.includes(d)) {
                      elims.push({ cell: t, digit: d });
                    }
                  }
                };

                addTargetElims(t1, t1_mask);
                addTargetElims(t2, t2_mask);

                if (elims.length > 0) {
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [b1, b2, t1, t2, ...elims.map((e) => e.cell)],
                      candidates: [
                        { cell: b1, digit: Bdigits[0]! },
                        { cell: b2, digit: Bdigits[1]! },
                        ...elims,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `飞鱼导弹：基础格 {${cellLabel(b1)}, ${cellLabel(b2)}} 在候选数 {${Bdigits.join(',')}} 上与目标格 {${cellLabel(t1)}, ${cellLabel(t2)}} 对齐，消去目标格中非基础候选数。`,
                      en: `Exocet: base cells {${cellLabel(b1)}, ${cellLabel(b2)}} align with targets {${cellLabel(t1)}, ${cellLabel(t2)}} on digits {${Bdigits.join(',')}}, purifying non-base candidates from target cells.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }

    // 2. Vertical Stacks (0, 1, 2)
    for (let stack = 0; stack < 3; stack++) {
      const boxes = [stack, stack + 3, stack + 6];
      for (let bi = 0; bi < 3; bi++) {
        const base_box = boxes[bi]!;
        const t_box1 = boxes[(bi + 1) % 3]!;
        const t_box2 = boxes[(bi + 2) % 3]!;

        const base_cells = getEmptyCellsInBox(grid, base_box);
        for (let i = 0; i < base_cells.length; i++) {
          for (let j = i + 1; j < base_cells.length; j++) {
            const b1 = base_cells[i]!;
            const b2 = base_cells[j]!;

            const r1 = ROW_OF[b1]!;
            const c1 = COL_OF[b1]!;
            const r2 = ROW_OF[b2]!;
            const c2 = COL_OF[b2]!;

            const aligned_row = r1 === r2;
            const aligned_col = c1 === c2;

            if (!aligned_row && !aligned_col) continue;

            const b1_mask = grid.candidatesOf(b1);
            const b2_mask = grid.candidatesOf(b2);
            const Bdigits_mask = b1_mask | b2_mask;
            const Bdigits = digitsOf(Bdigits_mask);

            if (Bdigits.length < 3 || Bdigits.length > 4) continue;

            const target_cells1 = getEmptyCellsInBox(grid, t_box1);
            const target_cells2 = getEmptyCellsInBox(grid, t_box2);

            for (const t1 of target_cells1) {
              for (const t2 of target_cells2) {
                if (PEERS_OF[t1]!.includes(t2)) continue;

                if (PEERS_OF[t1]!.includes(b1) || PEERS_OF[t1]!.includes(b2)) continue;
                if (PEERS_OF[t2]!.includes(b1) || PEERS_OF[t2]!.includes(b2)) continue;

                const t1_mask = grid.candidatesOf(t1);
                const t2_mask = grid.candidatesOf(t2);
                const T_mask = t1_mask | t2_mask;

                if ((Bdigits_mask & T_mask) !== Bdigits_mask) continue;

                const checkCompanion = (t: number, box: number) => {
                  const t_r = ROW_OF[t]!;
                  const t_c = COL_OF[t]!;
                  for (let c = 0; c < 81; c++) {
                    if (BOX_OF[c] === box && c !== t) {
                      if ((aligned_row && ROW_OF[c] === t_r) || (aligned_col && COL_OF[c] === t_c)) {
                        const mask = grid.get(c) === 0 ? grid.candidatesOf(c) : (1 << (grid.get(c) - 1));
                        if (mask & Bdigits_mask) {
                          return false;
                        }
                      }
                    }
                  }
                  return true;
                };

                if (!checkCompanion(t1, t_box1) || !checkCompanion(t2, t_box2)) continue;

                // Find unoccupied base position b3
                let b3 = -1;
                for (let c = 0; c < 81; c++) {
                  if (BOX_OF[c] === base_box && c !== b1 && c !== b2) {
                    if (aligned_row && ROW_OF[c] === r1) {
                      b3 = c;
                      break;
                    }
                    if (aligned_col && COL_OF[c] === c1) {
                      b3 = c;
                      break;
                    }
                  }
                }
                if (b3 === -1) continue;

                // Collect S-cells (outside tier)
                const s_cells: number[] = [];
                if (aligned_row) {
                  const r_start = Math.floor(r1 / 3) * 3;
                  for (let c = 0; c < 81; c++) {
                    const r_c = ROW_OF[c]!;
                    if (r_c < r_start || r_c >= r_start + 3) {
                      const col_c = COL_OF[c]!;
                      if (col_c === COL_OF[b3] || col_c === COL_OF[t1] || col_c === COL_OF[t2]) {
                        s_cells.push(c);
                      }
                    }
                  }
                } else {
                  const c_start = Math.floor(c1 / 3) * 3;
                  for (let c = 0; c < 81; c++) {
                    const col_c = COL_OF[c]!;
                    if (col_c < c_start || col_c >= c_start + 3) {
                      const r_c = ROW_OF[c]!;
                      if (r_c === ROW_OF[b3] || r_c === ROW_OF[t1] || r_c === ROW_OF[t2]) {
                        s_cells.push(c);
                      }
                    }
                  }
                }

                // Cover rule check
                let cover_ok = true;
                for (const d of Bdigits) {
                  let count = 0;
                  for (const s of s_cells) {
                    if (grid.get(s) === d || (grid.get(s) === 0 && grid.hasCandidate(s, d))) {
                      count++;
                    }
                  }
                  if (count > 2) {
                    cover_ok = false;
                    break;
                  }
                }
                if (!cover_ok) continue;

                const elims: { cell: number; digit: number }[] = [];

                const addTargetElims = (t: number, t_mask: number) => {
                  for (const d of digitsOf(t_mask)) {
                    if (!Bdigits.includes(d)) {
                      elims.push({ cell: t, digit: d });
                    }
                  }
                };

                addTargetElims(t1, t1_mask);
                addTargetElims(t2, t2_mask);

                if (elims.length > 0) {
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [b1, b2, t1, t2, ...elims.map((e) => e.cell)],
                      candidates: [
                        { cell: b1, digit: Bdigits[0]! },
                        { cell: b2, digit: Bdigits[1]! },
                        ...elims,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `飞鱼导弹：基础格 {${cellLabel(b1)}, ${cellLabel(b2)}} 在候选数 {${Bdigits.join(',')}} 上与目标格 {${cellLabel(t1)}, ${cellLabel(t2)}} 对齐，消去目标格中非基础候选数。`,
                      en: `Exocet: base cells {${cellLabel(b1)}, ${cellLabel(b2)}} align with targets {${cellLabel(t1)}, ${cellLabel(t2)}} on digits {${Bdigits.join(',')}}, purifying non-base candidates from target cells.`,
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

function getEmptyCellsInBox(grid: Grid, box: number): number[] {
  const res: number[] = [];
  for (let c = 0; c < 81; c++) {
    if (BOX_OF[c] === box && grid.get(c) === 0) {
      res.push(c);
    }
  }
  return res;
}
