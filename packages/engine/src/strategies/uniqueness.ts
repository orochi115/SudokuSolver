import { PEERS_OF, HOUSES, ROW_OF, COL_OF, BOX_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const uniqueRectangleType1: Strategy = {
  id: 'unique-rectangle-type1',
  name: { zh: '唯一矩形一类', en: 'Unique Rectangle Type 1' },
  difficulty: 90,

  apply(grid: Grid): Step | null {
    // 1. Unique Rectangle Type 1
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const p11 = r1 * 9 + c1;
            const p12 = r1 * 9 + c2;
            const p21 = r2 * 9 + c1;
            const p22 = r2 * 9 + c2;

            // Must span exactly 2 boxes
            const boxes = new Set([BOX_OF[p11]!, BOX_OF[p12]!, BOX_OF[p21]!, BOX_OF[p22]!]);
            if (boxes.size !== 2) continue;

            // All 4 cells must be empty
            if (grid.get(p11) !== 0 || grid.get(p12) !== 0 || grid.get(p21) !== 0 || grid.get(p22) !== 0) {
              continue;
            }

            const cells = [p11, p12, p21, p22];

            // Try all candidate pairs {X, Y}
            for (let X = 1; X <= 9; X++) {
              for (let Y = X + 1; Y <= 9; Y++) {
                const targetMask = maskOf(X) | maskOf(Y);

                // Check how many of the 4 cells have exactly candidates {X, Y}
                const bivalueCells = cells.filter(c => grid.candidatesOf(c) === targetMask);
                if (bivalueCells.length !== 3) continue;

                // Find the fourth cell which contains {X, Y} plus others
                const extraCell = cells.find(c => !bivalueCells.includes(c))!;
                const extraMask = grid.candidatesOf(extraCell);

                if ((extraMask & targetMask) === targetMask) {
                  // We can eliminate X and Y from the extra cell!
                  const eliminations: CellDigit[] = [];
                  if (grid.hasCandidate(extraCell, X)) eliminations.push({ cell: extraCell, digit: X });
                  if (grid.hasCandidate(extraCell, Y)) eliminations.push({ cell: extraCell, digit: Y });

                  if (eliminations.length > 0) {
                    const rExtra = ROW_OF[extraCell]! + 1;
                    const cExtra = COL_OF[extraCell]! + 1;

                    return {
                      strategyId: 'unique-rectangle-type1',
                      placements: [],
                      eliminations,
                      highlights: {
                        cells: [p11, p12, p21, p22],
                        candidates: [
                          { cell: p11, digit: X }, { cell: p11, digit: Y },
                          { cell: p12, digit: X }, { cell: p12, digit: Y },
                          { cell: p21, digit: X }, { cell: p21, digit: Y },
                          { cell: p22, digit: X }, { cell: p22, digit: Y },
                        ].filter(cd => grid.hasCandidate(cd.cell, cd.digit)),
                        links: [],
                      },
                      explanation: {
                        zh: `由于唯一性原则（防止出现多解），在由格子 R${r1+1}C${c1+1}, R${r1+1}C${c2+1}, R${r2+1}C${c1+1}, R${r2+1}C${c2+1} 组成的唯一矩形中，由于前三个格子候选数均恰为 {${X}, ${Y}}，因此在 R${rExtra}C${cExtra} 中安全消除候选数 ${X} 和 ${Y}。`,
                        en: `Due to uniqueness principle, in the rectangle formed by R${r1+1}C${c1+1}, R${r1+1}C${c2+1}, R${r2+1}C${c1+1}, R${r2+1}C${c2+1}, since three corners have candidates exactly {${X}, ${Y}}, we can eliminate ${X} and ${Y} from the fourth corner R${rExtra}C${cExtra}.`,
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

export const bugPlusOne: Strategy = {
  id: 'bug-plus-one',
  name: { zh: 'BUG+1 全双值格致死', en: 'BUG+1' },
  difficulty: 91,

  apply(grid: Grid): Step | null {
    // BUG+1: all empty cells are bivalue except exactly one, which is trivalue
    const emptyCells: number[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0) {
        emptyCells.push(c);
      }
    }

    const bivalues = emptyCells.filter(c => popcount(grid.candidatesOf(c)) === 2);
    const trivalues = emptyCells.filter(c => popcount(grid.candidatesOf(c)) === 3);

    if (trivalues.length !== 1 || bivalues.length + trivalues.length !== emptyCells.length) {
      return null;
    }

    const bugCell = trivalues[0]!;
    const candidates = digitsOf(grid.candidatesOf(bugCell));

    // Look for a candidate in bugCell that occurs 3 times in its row, column, and box candidates
    const r = ROW_OF[bugCell]!;
    const c = COL_OF[bugCell]!;
    const b = BOX_OF[bugCell]!;

    const rowCells = emptyCells.filter(cell => ROW_OF[cell] === r);
    const colCells = emptyCells.filter(cell => COL_OF[cell] === c);
    const boxCells = emptyCells.filter(cell => BOX_OF[cell] === b);

    for (const d of candidates) {
      const rowCount = rowCells.filter(cell => grid.hasCandidate(cell, d)).length;
      const colCount = colCells.filter(cell => grid.hasCandidate(cell, d)).length;
      const boxCount = boxCells.filter(cell => grid.hasCandidate(cell, d)).length;

      if (rowCount === 3 && colCount === 3 && boxCount === 3) {
        // Digit d must be placed in bugCell!
        const rStr = r + 1;
        const cStr = c + 1;

        return {
          strategyId: 'bug-plus-one',
          placements: [{ cell: bugCell, digit: d }],
          eliminations: [],
          highlights: {
            cells: [bugCell],
            candidates: candidates.map(cand => ({ cell: bugCell, digit: cand })),
            links: [],
          },
          explanation: {
            zh: `找到 BUG+1：盘面除 R${rStr}C${cStr} 有三个候选数外均只剩两个候选数。在 R${rStr}C${cStr} 中，数字 ${d} 在所属行、列、宫中各出现 3 次，因此为了保证唯一解，该格必须填入 ${d}。`,
            en: `Found BUG+1: All empty cells have exactly two candidates except R${rStr}C${cStr} which has three. Digit ${d} appears three times in its row, column, and box, so to ensure a unique solution, R${rStr}C${cStr} must be ${d}.`,
          },
        };
      }
    }

    return null;
  },
};
