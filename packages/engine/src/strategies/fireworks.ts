import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Search for Triple Fireworks
    for (let bx = 0; bx < 9; bx++) {
      // Find all empty cells in box bx as X
      const box_cells = [];
      for (let c = 0; c < 81; c++) {
        if (BOX_OF[c] === bx) box_cells.push(c);
      }

      for (const x of box_cells) {
        if (grid.get(x) !== 0) continue;
        const r = ROW_OF[x]!;
        const col = COL_OF[x]!;

        // Define houses/sectors
        const row_outside = [];
        const col_outside = [];
        const box_outside = [];

        for (let c = 0; c < 81; c++) {
          if (ROW_OF[c] === r && BOX_OF[c] !== bx) {
            row_outside.push(c);
          }
          if (COL_OF[c] === col && BOX_OF[c] !== bx) {
            col_outside.push(c);
          }
          if (BOX_OF[c] === bx && ROW_OF[c] !== r && COL_OF[c] !== col) {
            box_outside.push(c);
          }
        }

        // Try every pair of Y (in row_outside) and Z (in col_outside)
        for (const y of row_outside) {
          if (grid.get(y) !== 0) continue;
          for (const z of col_outside) {
            if (grid.get(z) !== 0) continue;

            const FW_digits: number[] = [];

            for (let d = 1; d <= 9; d++) {
              const bit = 1 << (d - 1);

              // Condition 1: d cannot appear in box_outside
              let ok = true;
              for (const c of box_outside) {
                if (grid.get(c) === d || (grid.get(c) === 0 && (grid.candidatesOf(c) & bit))) {
                  ok = false;
                  break;
                }
              }
              if (!ok) continue;

              // Condition 2: d can only appear in row_outside at cell Y
              for (const c of row_outside) {
                if (c !== y) {
                  if (grid.get(c) === d || (grid.get(c) === 0 && (grid.candidatesOf(c) & bit))) {
                    ok = false;
                    break;
                  }
                }
              }
              if (!ok) continue;

              // Condition 3: d can only appear in col_outside at cell Z
              for (const c of col_outside) {
                if (c !== z) {
                  if (grid.get(c) === d || (grid.get(c) === 0 && (grid.candidatesOf(c) & bit))) {
                    ok = false;
                    break;
                  }
                }
              }
              if (!ok) continue;

              // Must be a candidate in at least one of X, Y, Z
              const has_cand = (grid.get(x) === 0 && (grid.candidatesOf(x) & bit)) ||
                               (grid.get(y) === 0 && (grid.candidatesOf(y) & bit)) ||
                               (grid.get(z) === 0 && (grid.candidatesOf(z) & bit));

              if (has_cand) {
                FW_digits.push(d);
              }
            }

            if (FW_digits.length >= 3) {
              // Found Triple Firework!
              const digit_set = FW_digits.slice(0, 3);
              const cells = [x, y, z];
              const elims: { cell: number; digit: number }[] = [];

              for (const cell of cells) {
                if (grid.get(cell) !== 0) continue;
                const mask = grid.candidatesOf(cell);
                for (const d of digitsOf(mask)) {
                  if (!digit_set.includes(d)) {
                    elims.push({ cell, digit: d });
                  }
                }
              }

              if (elims.length > 0) {
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [x, y, z, ...elims.map((e) => e.cell)],
                    candidates: [
                      ...[x, y, z].flatMap((cell) =>
                        digitsOf(grid.candidatesOf(cell)).map((d) => ({ cell, digit: d })),
                      ),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `三元烟花：格 ${cellLabel(x)} 及其翼格 ${cellLabel(y)} 和 ${cellLabel(z)} 在数字 {${digit_set.join(',')}} 上形成分布隐性三数组，消去这些格中其他的候选数。`,
                    en: `Triple Fireworks: cell ${cellLabel(x)} and its wing cells ${cellLabel(y)} and ${cellLabel(z)} form a distributed hidden triple on digits {${digit_set.join(',')}}, eliminating other candidates from these cells.`,
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
