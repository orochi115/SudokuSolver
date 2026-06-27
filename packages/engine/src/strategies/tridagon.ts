import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三链数环（Thor锤）', en: 'Tridagon (Thor\'s Hammer)' },
  difficulty: 1100,
  tieBreak: ['cell-index'] as const,

  apply(grid: Grid): Step | null {
    // Find 3 rows and 3 columns that form a valid tridagon box pattern
    for (let r1 = 0; r1 < 6; r1++) {
      for (let r2 = r1 + 1; r2 < 7; r2++) {
        for (let r3 = r2 + 1; r3 < 8; r3++) {
          for (let c1 = 0; c1 < 6; c1++) {
            for (let c2 = c1 + 1; c2 < 7; c2++) {
              for (let c3 = c2 + 1; c3 < 8; c3++) {
                const rows = [r1, r2, r3];
                const cols = [c1, c2, c3];

                // Build the 9 cells and check box distribution
                const cells: number[] = [];
                const boxes = new Set<number>();
                for (const r of rows) {
                  for (const c of cols) {
                    const cell = r * 9 + c;
                    cells.push(cell);
                    boxes.add(BOX_OF[cell]!);
                  }
                }

                // Must span exactly 3 boxes (one per box-row)
                if (boxes.size !== 3) continue;

                // Each box should contain exactly 3 cells
                const boxCount = new Map<number, number>();
                for (const cell of cells) {
                  boxCount.set(BOX_OF[cell]!, (boxCount.get(BOX_OF[cell]!) ?? 0) + 1);
                }
                if ([...boxCount.values()].some(c => c !== 3)) continue;

                // Check that no box has two cells in the same row or same column
                // This is a tridagon pattern requirement
                let validBoxConfig = true;
                for (const b of boxes) {
                  const cellsInBox = cells.filter(c => BOX_OF[c] === b);
                  const rowsInBox = new Set(cellsInBox.map(c => ROW_OF[c]));
                  const colsInBox = new Set(cellsInBox.map(c => COL_OF[c]));
                  if (rowsInBox.size !== 3 || colsInBox.size !== 3) {
                    validBoxConfig = false;
                    break;
                  }
                }
                if (!validBoxConfig) continue;

                // Check candidate masks
                const masks = cells.map(c => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
                // All cells must be empty
                if (masks.some(m => m === 0)) continue;

                // Find the common 3-digit mask (the tridagon digits)
                let commonMask = masks[0]!;
                for (let i = 1; i < masks.length; i++) {
                  commonMask &= masks[i]!;
                }

                const commonDigits = digitsOf(commonMask);
                if (commonDigits.length !== 3) continue;

                // Check that each cell has ONLY these 3 digits (possibly with extras)
                // Count cells that are "pure" (only the 3 digits)
                const pureCells = cells.filter((_, i) => (masks[i]! & ~commonMask) === 0);
                const impureCells = cells.filter((_, i) => (masks[i]! & ~commonMask) !== 0);

                // Tridagon: exactly 8 pure cells and 1 impure cell
                if (pureCells.length !== 8 || impureCells.length !== 1) continue;

                const guardCell = impureCells[0]!;
                const extraMask = masks[cells.indexOf(guardCell)]! & ~commonMask;
                const extraDigits = digitsOf(extraMask);

                if (extraDigits.length === 0) continue;

                // Eliminate the extra digits from the guardian cell
                const eliminations: { cell: number; digit: number }[] = [];
                for (const d of extraDigits) {
                  if (grid.hasCandidate(guardCell, d)) {
                    eliminations.push({ cell: guardCell, digit: d });
                  }
                }

                if (eliminations.length === 0) continue;

                const [d1, d2, d3] = commonDigits as [number, number, number];

                return {
                  strategyId: 'tridagon',
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...cells, ...eliminations.map(e => e.cell)],
                    candidates: [
                      ...cells.map(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))).flat(),
                      ...eliminations,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `三链数环（Thor锤）：9 格构成三链数环模式，候选 {${d1},${d2},${d3}}；${cellLabel(guardCell)} 含额外候选 ${extraDigits.join(',')}，消除以破环。`,
                    en: `Tridagon (Thor's Hammer): 9 cells form a tridagon pattern with digits {${d1},${d2},${d3}}; ${cellLabel(guardCell)} has extra candidates ${extraDigits.join(',')}, eliminated to break the deadly pattern.`,
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