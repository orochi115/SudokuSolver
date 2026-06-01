import { ROW_OF, COL_OF, ROWS, COLS, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // 1. Column-based Skyscrapers (Conjugate pairs in columns)
      const colPairs: { c: number; cells: number[] }[] = [];
      for (let c = 0; c < 9; c++) {
        const cells = COLS[c]!.filter((cell) => grid.hasCandidate(cell, digit));
        if (cells.length === 2) {
          colPairs.push({ c, cells: cells.sort((a, b) => ROW_OF[a]! - ROW_OF[b]!) });
        }
      }

      for (let i = 0; i < colPairs.length; i++) {
        for (let j = i + 1; j < colPairs.length; j++) {
          const pair1 = colPairs[i]!;
          const pair2 = colPairs[j]!;

          const cell1a = pair1.cells[0]!;
          const cell1b = pair1.cells[1]!;
          const cell2a = pair2.cells[0]!;
          const cell2b = pair2.cells[1]!;

          const r1a = ROW_OF[cell1a]!;
          const r1b = ROW_OF[cell1b]!;
          const r2a = ROW_OF[cell2a]!;
          const r2b = ROW_OF[cell2b]!;

          let base_1 = -1, base_2 = -1, top_1 = -1, top_2 = -1;

          if (r1a === r2a && r1b !== r2b) {
            base_1 = cell1a;
            base_2 = cell2a;
            top_1 = cell1b;
            top_2 = cell2b;
          } else if (r1b === r2b && r1a !== r2a) {
            base_1 = cell1b;
            base_2 = cell2b;
            top_1 = cell1a;
            top_2 = cell2a;
          }

          if (base_1 !== -1) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (let p = 0; p < 81; p++) {
              if (
                grid.hasCandidate(p, digit) &&
                p !== top_1 &&
                p !== top_2 &&
                p !== base_1 &&
                p !== base_2
              ) {
                if (PEERS_OF[top_1]!.includes(p) && PEERS_OF[top_2]!.includes(p)) {
                  eliminations.push({ cell: p, digit });
                }
              }
            }

            if (eliminations.length > 0) {
              const r1 = ROW_OF[top_1]! + 1;
              const c1 = COL_OF[top_1]! + 1;
              const r2 = ROW_OF[top_2]! + 1;
              const c2 = COL_OF[top_2]! + 1;

              const links: Link[] = [
                { from: { cell: top_1, digit }, to: { cell: base_1, digit }, type: 'strong' },
                { from: { cell: base_1, digit }, to: { cell: base_2, digit }, type: 'weak' },
                { from: { cell: base_2, digit }, to: { cell: top_2, digit }, type: 'strong' },
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [cell1a, cell1b, cell2a, cell2b],
                  candidates: [
                    { cell: cell1a, digit },
                    { cell: cell1b, digit },
                    { cell: cell2a, digit },
                    { cell: cell2b, digit },
                    ...eliminations,
                  ],
                  links,
                },
                explanation: {
                  zh: `对于数字 ${digit}，在列 ${pair1.c + 1} 和列 ${pair2.c + 1} 中构成强链接（摩天楼）。其底端在同一行，两顶端分别在 R${r1}C${c1} 和 R${r2}C${c2}，因此可以从同时看见两顶端的单元格中排除候选数 ${digit}。`,
                  en: `For digit ${digit}, columns ${pair1.c + 1} and ${pair2.c + 1} contain conjugate pairs forming a Skyscraper with tops at R${r1}C${c1} and R${r2}C${c2}. We can eliminate ${digit} from cells seeing both tops.`,
                },
              };
            }
          }
        }
      }

      // 2. Row-based Skyscrapers (Conjugate pairs in rows)
      const rowPairs: { r: number; cells: number[] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cells = ROWS[r]!.filter((cell) => grid.hasCandidate(cell, digit));
        if (cells.length === 2) {
          rowPairs.push({ r, cells: cells.sort((a, b) => COL_OF[a]! - COL_OF[b]!) });
        }
      }

      for (let i = 0; i < rowPairs.length; i++) {
        for (let j = i + 1; j < rowPairs.length; j++) {
          const pair1 = rowPairs[i]!;
          const pair2 = rowPairs[j]!;

          const cell1a = pair1.cells[0]!;
          const cell1b = pair1.cells[1]!;
          const cell2a = pair2.cells[0]!;
          const cell2b = pair2.cells[1]!;

          const c1a = COL_OF[cell1a]!;
          const c1b = COL_OF[cell1b]!;
          const c2a = COL_OF[cell2a]!;
          const c2b = COL_OF[cell2b]!;

          let base_1 = -1, base_2 = -1, top_1 = -1, top_2 = -1;

          if (c1a === c2a && c1b !== c2b) {
            base_1 = cell1a;
            base_2 = cell2a;
            top_1 = cell1b;
            top_2 = cell2b;
          } else if (c1b === c2b && c1a !== c2a) {
            base_1 = cell1b;
            base_2 = cell2b;
            top_1 = cell1a;
            top_2 = cell2a;
          }

          if (base_1 !== -1) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (let p = 0; p < 81; p++) {
              if (
                grid.hasCandidate(p, digit) &&
                p !== top_1 &&
                p !== top_2 &&
                p !== base_1 &&
                p !== base_2
              ) {
                if (PEERS_OF[top_1]!.includes(p) && PEERS_OF[top_2]!.includes(p)) {
                  eliminations.push({ cell: p, digit });
                }
              }
            }

            if (eliminations.length > 0) {
              const r1 = ROW_OF[top_1]! + 1;
              const c1 = COL_OF[top_1]! + 1;
              const r2 = ROW_OF[top_2]! + 1;
              const c2 = COL_OF[top_2]! + 1;

              const links: Link[] = [
                { from: { cell: top_1, digit }, to: { cell: base_1, digit }, type: 'strong' },
                { from: { cell: base_1, digit }, to: { cell: base_2, digit }, type: 'weak' },
                { from: { cell: base_2, digit }, to: { cell: top_2, digit }, type: 'strong' },
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [cell1a, cell1b, cell2a, cell2b],
                  candidates: [
                    { cell: cell1a, digit },
                    { cell: cell1b, digit },
                    { cell: cell2a, digit },
                    { cell: cell2b, digit },
                    ...eliminations,
                  ],
                  links,
                },
                explanation: {
                  zh: `对于数字 ${digit}，在行 ${pair1.r + 1} 和行 ${pair2.r + 1} 中构成强链接（摩天楼）。其底端在同一列，两顶端分别在 R${r1}C${c1} 和 R${r2}C${c2}，因此可以从同时看见两顶端的单元格中排除候选数 ${digit}。`,
                  en: `For digit ${digit}, rows ${pair1.r + 1} and ${pair2.r + 1} contain conjugate pairs forming a Skyscraper with tops at R${r1}C${c1} and R${r2}C${c2}. We can eliminate ${digit} from cells seeing both tops.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
