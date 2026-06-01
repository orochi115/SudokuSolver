import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 50, // Suggested cost band: 50 single digit patterns

  apply(grid: Grid): Step | null {
    // 1. Skyscraper (Column-based)
    for (let digit = 1; digit <= SIZE; digit++) {
      for (let c1 = 0; c1 < 9; c1++) {
        const cells1 = COLS[c1]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
        if (cells1.length !== 2) continue;
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells2 = COLS[c2]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
          if (cells2.length !== 2) continue;

          const [A, B] = cells1;
          const [C, D] = cells2;
          let config: { top1: number; top2: number; base1: number; base2: number } | null = null;

          if (ROW_OF[B!] === ROW_OF[D!] && ROW_OF[A!] !== ROW_OF[C!]) {
            config = { top1: A!, top2: C!, base1: B!, base2: D! };
          } else if (ROW_OF[A!] === ROW_OF[C!] && ROW_OF[B!] !== ROW_OF[D!]) {
            config = { top1: B!, top2: D!, base1: A!, base2: C! };
          } else if (ROW_OF[A!] === ROW_OF[D!] && ROW_OF[B!] !== ROW_OF[C!]) {
            config = { top1: B!, top2: C!, base1: A!, base2: D! };
          } else if (ROW_OF[B!] === ROW_OF[C!] && ROW_OF[A!] !== ROW_OF[D!]) {
            config = { top1: A!, top2: D!, base1: B!, base2: C! };
          }

          if (config) {
            const { top1, top2, base1, base2 } = config;
            const i1 = ROW_OF[top1]! * 9 + COL_OF[top2]!;
            const i2 = ROW_OF[top2]! * 9 + COL_OF[top1]!;
            const eliminations: CellDigit[] = [];
            for (const cell of [i1, i2]) {
              if (
                cell !== top1 &&
                cell !== top2 &&
                cell !== base1 &&
                cell !== base2 &&
                grid.get(cell) === 0 &&
                grid.hasCandidate(cell, digit)
              ) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [top1, top2, base1, base2],
                  candidates: [top1, top2, base1, base2].map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `对于候选数 ${digit}，格子 R${ROW_OF[top1]! + 1}C${COL_OF[top1]! + 1} 和 R${ROW_OF[top2]! + 1}C${COL_OF[top2]! + 1} 作为端点，与底部共享行，构成摩天楼。因此可排除它们共同可见的候选数。`,
                  en: `For candidate ${digit}, cells R${ROW_OF[top1]! + 1}C${COL_OF[top1]! + 1} and R${ROW_OF[top2]! + 1}C${COL_OF[top2]! + 1} form the tops of a Skyscraper. Thus, ${digit} can be eliminated from cells seeing both tops.`,
                },
              };
            }
          }
        }
      }
    }

    // 2. Skyscraper (Row-based)
    for (let digit = 1; digit <= SIZE; digit++) {
      for (let r1 = 0; r1 < 9; r1++) {
        const cells1 = ROWS[r1]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
        if (cells1.length !== 2) continue;
        for (let r2 = r1 + 1; r2 < 9; r2++) {
          const cells2 = ROWS[r2]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
          if (cells2.length !== 2) continue;

          const [A, B] = cells1;
          const [C, D] = cells2;
          let config: { top1: number; top2: number; base1: number; base2: number } | null = null;

          if (COL_OF[B!] === COL_OF[D!] && COL_OF[A!] !== COL_OF[C!]) {
            config = { top1: A!, top2: C!, base1: B!, base2: D! };
          } else if (COL_OF[A!] === COL_OF[C!] && COL_OF[B!] !== COL_OF[D!]) {
            config = { top1: B!, top2: D!, base1: A!, base2: C! };
          } else if (COL_OF[A!] === COL_OF[D!] && COL_OF[B!] !== COL_OF[C!]) {
            config = { top1: B!, top2: C!, base1: A!, base2: D! };
          } else if (COL_OF[B!] === COL_OF[C!] && COL_OF[A!] !== COL_OF[D!]) {
            config = { top1: A!, top2: D!, base1: B!, base2: C! };
          }

          if (config) {
            const { top1, top2, base1, base2 } = config;
            const i1 = ROW_OF[top1]! * 9 + COL_OF[top2]!;
            const i2 = ROW_OF[top2]! * 9 + COL_OF[top1]!;
            const eliminations: CellDigit[] = [];
            for (const cell of [i1, i2]) {
              if (
                cell !== top1 &&
                cell !== top2 &&
                cell !== base1 &&
                cell !== base2 &&
                grid.get(cell) === 0 &&
                grid.hasCandidate(cell, digit)
              ) {
                eliminations.push({ cell, digit });
              }
            }

            if (eliminations.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [top1, top2, base1, base2],
                  candidates: [top1, top2, base1, base2].map(c => ({ cell: c, digit })),
                  links: [],
                },
                explanation: {
                  zh: `对于候选数 ${digit}，格子 R${ROW_OF[top1]! + 1}C${COL_OF[top1]! + 1} 和 R${ROW_OF[top2]! + 1}C${COL_OF[top2]! + 1} 作为端点，与底部共享列，构成摩天楼。因此可排除它们共同可见的候选数。`,
                  en: `For candidate ${digit}, cells R${ROW_OF[top1]! + 1}C${COL_OF[top1]! + 1} and R${ROW_OF[top2]! + 1}C${COL_OF[top2]! + 1} form the tops of a Skyscraper. Thus, ${digit} can be eliminated from cells seeing both tops.`,
                },
              };
            }
          }
        }
      }
    }

    // 3. 2-String Kite
    for (let digit = 1; digit <= SIZE; digit++) {
      for (let r = 0; r < 9; r++) {
        const rowCells = ROWS[r]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
        if (rowCells.length !== 2) continue;
        for (let c = 0; c < 9; c++) {
          const colCells = COLS[c]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
          if (colCells.length !== 2) continue;

          for (const C of rowCells) {
            const A = rowCells.find(cell => cell !== C)!;
            for (const D of colCells) {
              const B = colCells.find(cell => cell !== D)!;
              if (C !== D && BOX_OF[C] === BOX_OF[D]) {
                // Outer cells A and B must be outside the box containing C and D
                if (BOX_OF[A!] === BOX_OF[C] || BOX_OF[B!] === BOX_OF[D]) continue;

                const E = ROW_OF[B!]! * 9 + COL_OF[A!]!;
                if (E === A || E === B || E === C || E === D) continue;

                if (grid.get(E) === 0 && grid.hasCandidate(E, digit)) {
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: [{ cell: E, digit }],
                    highlights: {
                      cells: [C, A!, D, B!],
                      candidates: [C, A!, D, B!].map(cell => ({ cell, digit })),
                      links: [],
                    },
                    explanation: {
                      zh: `对于候选数 ${digit}，在第 ${BOX_OF[C]! + 1} 宫内强联结的两端格子分别通过第 ${r + 1} 行和第 ${c + 1} 列向外延伸。这构成双线风筝，可排除 R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1} 的候选数。`,
                      en: `For candidate ${digit}, row ${r + 1} and column ${c + 1} meet in box ${BOX_OF[C]! + 1}, forming a 2-String Kite. Thus, ${digit} can be eliminated from R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1}.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }

    // 4. Empty Rectangle
    for (let digit = 1; digit <= SIZE; digit++) {
      for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
        const boxCells = BOXES[boxIdx]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
        if (boxCells.length < 2) continue;

        const boxRows = Array.from(new Set(boxCells.map(c => ROW_OF[c]!)));
        const boxCols = Array.from(new Set(boxCells.map(c => COL_OF[c]!)));

        for (const r_cross of boxRows) {
          for (const c_cross of boxCols) {
            const isCross = boxCells.every(c => ROW_OF[c] === r_cross || COL_OF[c] === c_cross);
            if (!isCross) continue;

            // Row-based strong link outside box
            for (let r = 0; r < 9; r++) {
              if (Math.floor(r / 3) === Math.floor(r_cross / 3)) continue;
              const rowCells = ROWS[r]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
              if (rowCells.length === 2) {
                const pivotCell = rowCells.find(cell => COL_OF[cell] === c_cross);
                const otherCell = rowCells.find(cell => COL_OF[cell] !== c_cross);
                if (pivotCell && otherCell) {
                  const c_other = COL_OF[otherCell]!;
                  // Crucial: otherCell/targetCell must be outside the empty rectangle column group
                  if (Math.floor(c_other / 3) === Math.floor(c_cross / 3)) continue;

                  const targetCell = r_cross * 9 + c_other;
                  if (grid.get(targetCell) === 0 && grid.hasCandidate(targetCell, digit)) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [{ cell: targetCell, digit }],
                      highlights: {
                        cells: [...boxCells, ...rowCells],
                        candidates: [...boxCells, ...rowCells].map(c => ({ cell: c, digit })),
                        links: [],
                      },
                      explanation: {
                        zh: `对于候选数 ${digit}，第 ${boxIdx + 1} 宫内候选数呈空矩形结构（十字交叉于 R${r_cross + 1}C${c_cross + 1}），且第 ${r + 1} 行有强链。可排除 R${r_cross + 1}C${c_other + 1} 的候选数。`,
                        en: `For candidate ${digit}, box ${boxIdx + 1} has an Empty Rectangle structure (cross at R${r_cross + 1}C${c_cross + 1}), and row ${r + 1} has a strong link. Thus, ${digit} can be eliminated from R${r_cross + 1}C${c_other + 1}.`,
                      },
                    };
                  }
                }
              }
            }

            // Col-based strong link outside box
            for (let c = 0; c < 9; c++) {
              if (Math.floor(c / 3) === Math.floor(c_cross / 3)) continue;
              const colCells = COLS[c]!.filter(cell => grid.get(cell) === 0 && grid.hasCandidate(cell, digit));
              if (colCells.length === 2) {
                const pivotCell = colCells.find(cell => ROW_OF[cell] === r_cross);
                const otherCell = colCells.find(cell => ROW_OF[cell] !== r_cross);
                if (pivotCell && otherCell) {
                  const r_other = ROW_OF[otherCell]!;
                  // Crucial: otherCell/targetCell must be outside the empty rectangle row group
                  if (Math.floor(r_other / 3) === Math.floor(r_cross / 3)) continue;

                  const targetCell = r_other * 9 + c_cross;
                  if (grid.get(targetCell) === 0 && grid.hasCandidate(targetCell, digit)) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [{ cell: targetCell, digit }],
                      highlights: {
                        cells: [...boxCells, ...colCells],
                        candidates: [...boxCells, ...colCells].map(c => ({ cell: c, digit })),
                        links: [],
                      },
                      explanation: {
                        zh: `对于候选数 ${digit}，第 ${boxIdx + 1} 宫内候选数呈空矩形结构（十字交叉于 R${r_cross + 1}C${c_cross + 1}），且第 ${c + 1} 列有强链。可排除 R${r_other + 1}C${c_cross + 1} 的候选数。`,
                        en: `For candidate ${digit}, box ${boxIdx + 1} has an Empty Rectangle structure (cross at R${r_cross + 1}C${c_cross + 1}), and column ${c + 1} has a strong link. Thus, ${digit} can be eliminated from R${r_other + 1}C${c_cross + 1}.`,
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
