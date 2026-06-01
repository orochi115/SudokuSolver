import { PEERS_OF, BOX_OF, ROW_OF, COL_OF, SIZE, popcount, digitsOf, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const uniquenessConfig = {
  enabled: true, // Toggle control for uniqueness assumption
};

export const uniqueness: Strategy = {
  id: 'uniqueness',
  name: { zh: '唯一性策略', en: 'Uniqueness' },
  difficulty: 90, // Suggested difficulty: 90 uniqueness

  apply(grid: Grid): Step | null {
    if (!uniquenessConfig.enabled) {
      return null;
    }

    // 1. Unique Rectangle (Type 1)
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const A = r1 * 9 + c1;
            const B = r1 * 9 + c2;
            const C = r2 * 9 + c1;
            const D = r2 * 9 + c2;

            // Spans exactly 2 boxes
            const boxes = new Set([BOX_OF[A]!, BOX_OF[B]!, BOX_OF[C]!, BOX_OF[D]!]);
            if (boxes.size !== 2) continue;

            // All 4 cells must be empty
            if (grid.get(A) !== 0 || grid.get(B) !== 0 || grid.get(C) !== 0 || grid.get(D) !== 0) continue;

            // Try all candidate pairs {x, y}
            for (let x = 1; x <= 9; x++) {
              for (let y = x + 1; y <= 9; y++) {
                const maskA = grid.candidatesOf(A);
                const maskB = grid.candidatesOf(B);
                const maskC = grid.candidatesOf(C);
                const maskD = grid.candidatesOf(D);

                // All cells must contain x and y
                const hasXY = (m: number) => (m & (1 << (x - 1))) && (m & (1 << (y - 1)));
                if (!hasXY(maskA) || !hasXY(maskB) || !hasXY(maskC) || !hasXY(maskD)) continue;

                const countCandidates = (m: number) => popcount(m);

                // Check for Type 1: 3 cells contain exactly {x, y}, and 1 cell has extra candidates
                const cells = [A, B, C, D];
                const masks = [maskA, maskB, maskC, maskD];

                let extraCellIdx = -1;
                let isType1 = true;

                for (let i = 0; i < 4; i++) {
                  if (countCandidates(masks[i]!) === 2) {
                    // Exactly {x, y}
                  } else {
                    if (extraCellIdx === -1) {
                      extraCellIdx = i;
                    } else {
                      // More than 1 cell has extra candidates, not Type 1
                      isType1 = false;
                      break;
                    }
                  }
                }

                if (isType1 && extraCellIdx !== -1) {
                  const targetCell = cells[extraCellIdx]!;
                  const eliminations: CellDigit[] = [
                    { cell: targetCell, digit: x },
                    { cell: targetCell, digit: y },
                  ];

                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations,
                    highlights: {
                      cells: [A, B, C, D],
                      candidates: [A, B, C, D].flatMap(c => [
                        { cell: c, digit: x },
                        { cell: c, digit: y },
                      ]),
                      links: [],
                    },
                    explanation: {
                      zh: `格子 R${ROW_OF[A]! + 1}C${COL_OF[A]! + 1}, R${ROW_OF[B]! + 1}C${COL_OF[B]! + 1}, R${ROW_OF[C]! + 1}C${COL_OF[C]! + 1}, R${ROW_OF[D]! + 1}C${COL_OF[D]! + 1} 构成唯一矩形（Unique Rectangle）。为避免出现非唯一解，可以从 R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1} 排除候选数 ${x} 和 ${y}。`,
                      en: `Cells R${ROW_OF[A]! + 1}C${COL_OF[A]! + 1}, R${ROW_OF[B]! + 1}C${COL_OF[B]! + 1}, R${ROW_OF[C]! + 1}C${COL_OF[C]! + 1}, and R${ROW_OF[D]! + 1}C${COL_OF[D]! + 1} form a Unique Rectangle for candidates {${x}, ${y}}. To preserve unique solution, eliminate ${x} and ${y} from R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1}.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }

    // 2. BUG + 1 (Bivalue Universal Grave + 1)
    // Check if BUG pattern applies: every empty cell has 2 candidates except exactly one which has 3 candidates
    let buggyCell = -1;
    let isBUG = true;
    let emptyCount = 0;

    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0) {
        emptyCount++;
        const cands = popcount(grid.candidatesOf(i));
        if (cands === 2) {
          // OK
        } else if (cands === 3) {
          if (buggyCell === -1) {
            buggyCell = i;
          } else {
            isBUG = false;
            break;
          }
        } else {
          isBUG = false;
          break;
        }
      }
    }

    if (isBUG && buggyCell !== -1 && emptyCount > 0) {
      // Find the candidates in the buggy cell
      const digits = digitsOf(grid.candidatesOf(buggyCell));
      // For each digit, count its occurrences in the buggyCell's row, column, and box.
      // The true digit will appear 3 times in all of its houses.
      for (const d of digits) {
        let rowCount = 0;
        let colCount = 0;
        let boxCount = 0;

        const r = ROW_OF[buggyCell]!;
        const c = COL_OF[buggyCell]!;
        const b = BOX_OF[buggyCell]!;

        for (let i = 0; i < 9; i++) {
          const rCell = r * 9 + i;
          if (grid.get(rCell) === 0 && grid.hasCandidate(rCell, d)) rowCount++;

          const cCell = i * 9 + c;
          if (grid.get(cCell) === 0 && grid.hasCandidate(cCell, d)) colCount++;
        }

        const boxCells = HOUSES[18 + b]!;
        for (const cell of boxCells) {
          if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) boxCount++;
        }

        if (rowCount === 3 && colCount === 3 && boxCount === 3) {
          // This must be the placed digit!
          return {
            strategyId: this.id,
            placements: [{ cell: buggyCell, digit: d }],
            eliminations: [],
            highlights: {
              cells: [buggyCell],
              candidates: [{ cell: buggyCell, digit: d }],
              links: [],
            },
            explanation: {
              zh: `格子 R${ROW_OF[buggyCell]! + 1}C${COL_OF[buggyCell]! + 1} 在双值普遍墓穴（BUG+1）格局下，候选数 ${d} 在相关区域内出现 3 次。因此该格必为 ${d}。`,
              en: `Cell R${ROW_OF[buggyCell]! + 1}C${COL_OF[buggyCell]! + 1} forms a BUG+1 pattern. Candidate ${d} appears three times in its row, column, and box. Thus, this cell must be ${d}.`,
            },
          };
        }
      }
    }

    return null;
  },
};
