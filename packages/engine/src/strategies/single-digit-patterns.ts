import { PEERS_OF, ROW_OF, COL_OF, BOX_OF, BOXES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 46,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      // --- Row-based Skyscraper ---
      const rowsWithTwo: { r: number; cells: number[] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cells: number[] = [];
        for (let c = 0; c < 9; c++) {
          const cell = r * 9 + c;
          if (grid.hasCandidate(cell, digit)) {
            cells.push(cell);
          }
        }
        if (cells.length === 2) {
          rowsWithTwo.push({ r, cells });
        }
      }

      for (let i = 0; i < rowsWithTwo.length; i++) {
        for (let j = i + 1; j < rowsWithTwo.length; j++) {
          const r1 = rowsWithTwo[i]!;
          const r2 = rowsWithTwo[j]!;
          
          const [c1a, c1b] = r1.cells;
          const [c2a, c2b] = r2.cells;

          const col1a = COL_OF[c1a!]!;
          const col1b = COL_OF[c1b!]!;
          const col2a = COL_OF[c2a!]!;
          const col2b = COL_OF[c2b!]!;

          let base1 = -1, base2 = -1, roof1 = -1, roof2 = -1;
          if (col1a === col2a) {
            base1 = c1a!; base2 = c2a!; roof1 = c1b!; roof2 = c2b!;
          } else if (col1b === col2b) {
            base1 = c1b!; base2 = c2b!; roof1 = c1a!; roof2 = c2a!;
          } else if (col1a === col2b) {
            base1 = c1a!; base2 = c2b!; roof1 = c1b!; roof2 = c2a!;
          } else if (col1b === col2a) {
            base1 = c1b!; base2 = c2a!; roof1 = c1a!; roof2 = c2b!;
          }

          if (base1 !== -1) {
            const eliminations: CellDigit[] = [];
            const peers1 = PEERS_OF[roof1!]!;
            const peers2 = PEERS_OF[roof2!]!;
            const commonPeers = peers1.filter(p => peers2.includes(p));

            for (const p of commonPeers) {
              if (grid.hasCandidate(p, digit)) {
                eliminations.push({ cell: p, digit });
              }
            }

            if (eliminations.length > 0) {
              const roofStr = `R${ROW_OF[roof1!]! + 1}C${COL_OF[roof1!]! + 1}, R${ROW_OF[roof2!]! + 1}C${COL_OF[roof2!]! + 1}`;
              const baseStr = `第 ${r1.r + 1} 行和第 ${r2.r + 1} 行`;
              const baseStrEn = `Row ${r1.r + 1} and Row ${r2.r + 1}`;
              
              const links: Link[] = [
                { from: { cell: roof1, digit }, to: { cell: base1, digit }, type: 'strong' },
                { from: { cell: base1, digit }, to: { cell: base2, digit }, type: 'weak' },
                { from: { cell: base2, digit }, to: { cell: roof2, digit }, type: 'strong' }
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [base1, base2, roof1, roof2],
                  candidates: [
                    { cell: base1, digit },
                    { cell: base2, digit },
                    { cell: roof1, digit },
                    { cell: roof2, digit }
                  ],
                  links
                },
                explanation: {
                  zh: `找到数字 ${digit} 的摩天楼（基准行在 ${baseStr}，顶端为 ${roofStr}），排除能同时看到这两个顶端的格子中的候选数 ${digit}。`,
                  en: `Found Skyscraper for digit ${digit} (Base rows: ${baseStrEn}, roof cells: ${roofStr}), so ${digit} can be eliminated from cells seeing both roof cells.`,
                }
              };
            }
          }
        }
      }

      // --- Column-based Skyscraper ---
      const colsWithTwo: { c: number; cells: number[] }[] = [];
      for (let c = 0; c < 9; c++) {
        const cells: number[] = [];
        for (let r = 0; r < 9; r++) {
          const cell = r * 9 + c;
          if (grid.hasCandidate(cell, digit)) {
            cells.push(cell);
          }
        }
        if (cells.length === 2) {
          colsWithTwo.push({ c, cells });
        }
      }

      for (let i = 0; i < colsWithTwo.length; i++) {
        for (let j = i + 1; j < colsWithTwo.length; j++) {
          const c1 = colsWithTwo[i]!;
          const c2 = colsWithTwo[j]!;

          const [r1a, r1b] = c1.cells;
          const [r2a, r2b] = c2.cells;

          const row1a = ROW_OF[r1a!]!;
          const row1b = ROW_OF[r1b!]!;
          const row2a = ROW_OF[r2a!]!;
          const row2b = ROW_OF[r2b!]!;

          let base1 = -1, base2 = -1, roof1 = -1, roof2 = -1;
          if (row1a === row2a) {
            base1 = r1a!; base2 = r2a!; roof1 = r1b!; roof2 = r2b!;
          } else if (row1b === row2b) {
            base1 = r1b!; base2 = r2b!; roof1 = r1a!; roof2 = r2a!;
          } else if (row1a === row2b) {
            base1 = r1a!; base2 = r2b!; roof1 = r1b!; roof2 = r2a!;
          } else if (row1b === row2a) {
            base1 = r1b!; base2 = r2a!; roof1 = r1a!; roof2 = r2b!;
          }

          if (base1 !== -1) {
            const eliminations: CellDigit[] = [];
            const peers1 = PEERS_OF[roof1!]!;
            const peers2 = PEERS_OF[roof2!]!;
            const commonPeers = peers1.filter(p => peers2.includes(p));

            for (const p of commonPeers) {
              if (grid.hasCandidate(p, digit)) {
                eliminations.push({ cell: p, digit });
              }
            }

            if (eliminations.length > 0) {
              const roofStr = `R${ROW_OF[roof1!]! + 1}C${COL_OF[roof1!]! + 1}, R${ROW_OF[roof2!]! + 1}C${COL_OF[roof2!]! + 1}`;
              const baseStr = `第 ${c1.c + 1} 列和第 ${c2.c + 1} 列`;
              const baseStrEn = `Column ${c1.c + 1} and Column ${c2.c + 1}`;

              const links: Link[] = [
                { from: { cell: roof1, digit }, to: { cell: base1, digit }, type: 'strong' },
                { from: { cell: base1, digit }, to: { cell: base2, digit }, type: 'weak' },
                { from: { cell: base2, digit }, to: { cell: roof2, digit }, type: 'strong' }
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [base1, base2, roof1, roof2],
                  candidates: [
                    { cell: base1, digit },
                    { cell: base2, digit },
                    { cell: roof1, digit },
                    { cell: roof2, digit }
                  ],
                  links
                },
                explanation: {
                  zh: `找到数字 ${digit} 的摩天楼（基准列在 ${baseStr}，顶端为 ${roofStr}），排除能同时看到这两个顶端的格子中的候选数 ${digit}。`,
                  en: `Found Skyscraper for digit ${digit} (Base columns: ${baseStrEn}, roof cells: ${roofStr}), so ${digit} can be eliminated from cells seeing both roof cells.`,
                }
              };
            }
          }
        }
      }
    }
    return null;
  }
};

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 47,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (let b = 0; b < 9; b++) {
        const boxRowStart = Math.floor(b / 3) * 3;
        const boxColStart = (b % 3) * 3;

        for (let rOffset = 0; rOffset < 3; rOffset++) {
          const r = boxRowStart + rOffset;
          const rowCells: number[] = [];
          for (let col = 0; col < 9; col++) {
            const cell = r * 9 + col;
            if (grid.hasCandidate(cell, digit)) {
              rowCells.push(cell);
            }
          }

          if (rowCells.length === 2) {
            const cellRowBox = rowCells.find(c => BOX_OF[c] === b);
            const roofRow = rowCells.find(c => BOX_OF[c] !== b);

            if (cellRowBox !== undefined && roofRow !== undefined) {
              for (let cOffset = 0; cOffset < 3; cOffset++) {
                const c = boxColStart + cOffset;
                const colCells: number[] = [];
                for (let row = 0; row < 9; row++) {
                  const cell = row * 9 + c;
                  if (grid.hasCandidate(cell, digit)) {
                    colCells.push(cell);
                  }
                }

                if (colCells.length === 2) {
                  const cellColBox = colCells.find(cIdx => BOX_OF[cIdx] === b);
                  const roofCol = colCells.find(cIdx => BOX_OF[cIdx] !== b);

                  if (cellColBox !== undefined && roofCol !== undefined && cellRowBox !== cellColBox) {
                    const elimCell = ROW_OF[roofCol]! * 9 + COL_OF[roofRow]!;
                    if (grid.hasCandidate(elimCell, digit)) {
                      const links: Link[] = [
                        { from: { cell: roofRow, digit }, to: { cell: cellRowBox, digit }, type: 'strong' },
                        { from: { cell: cellRowBox, digit }, to: { cell: cellColBox, digit }, type: 'weak' },
                        { from: { cell: cellColBox, digit }, to: { cell: roofCol, digit }, type: 'strong' }
                      ];

                      const roofRowStr = `R${ROW_OF[roofRow]! + 1}C${COL_OF[roofRow]! + 1}`;
                      const roofColStr = `R${ROW_OF[roofCol]! + 1}C${COL_OF[roofCol]! + 1}`;

                      return {
                        strategyId: this.id,
                        placements: [],
                        eliminations: [{ cell: elimCell, digit }],
                        highlights: {
                          cells: [roofRow, cellRowBox, cellColBox, roofCol],
                          candidates: [
                            { cell: roofRow, digit },
                            { cell: cellRowBox, digit },
                            { cell: cellColBox, digit },
                            { cell: roofCol, digit }
                          ],
                          links
                        },
                        explanation: {
                          zh: `找到数字 ${digit} 的双线风筝（位于行 ${r + 1} 和列 ${c + 1}，相交于宫 ${b + 1}，端点为 ${roofRowStr} 和 ${roofColStr}），排除其交点格子中的候选数 ${digit}。`,
                          en: `Found 2-String Kite for digit ${digit} (Row ${r + 1} and Column ${c + 1} intersecting in Box ${b + 1}, endpoints ${roofRowStr} and ${roofColStr}), so ${digit} can be eliminated from their intersection cell.`,
                        }
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
};

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 48,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (let b = 0; b < 9; b++) {
        const box = BOXES[b]!;
        const boxCandidates = box.filter(c => grid.hasCandidate(c, digit));
        if (boxCandidates.length < 2) continue;

        for (const intCell of box) {
          const r_int = ROW_OF[intCell]!;
          const c_int = COL_OF[intCell]!;

          const isIntersection = boxCandidates.every(
            c => ROW_OF[c] === r_int || COL_OF[c] === c_int
          );

          if (isIntersection) {
            // 1. Column-based strong links
            for (let c_strong = 0; c_strong < 9; c_strong++) {
              if (Math.floor(c_strong / 3) === b % 3 && Math.floor(r_int / 3) === Math.floor(b / 3)) {
                // Inside the same box column, skip
                continue;
              }

              const colCells: number[] = [];
              for (let row = 0; row < 9; row++) {
                const cell = row * 9 + c_strong;
                if (grid.hasCandidate(cell, digit)) {
                  colCells.push(cell);
                }
              }

              if (colCells.length === 2) {
                const cell_on_row = colCells.find(c => ROW_OF[c] === r_int);
                const cell_other = colCells.find(c => ROW_OF[c] !== r_int);

                if (cell_on_row !== undefined && cell_other !== undefined) {
                  const r_other = ROW_OF[cell_other]!;
                  const elimCell = r_other * 9 + c_int;

                  if (BOX_OF[elimCell] !== b && grid.hasCandidate(elimCell, digit)) {
                    const links: Link[] = [
                      { from: { cell: cell_other, digit }, to: { cell: cell_on_row, digit }, type: 'strong' }
                    ];

                    const pivotStr = `R${r_int + 1}C${c_int + 1}`;
                    const strongStr = `R${r_other + 1}C${c_strong + 1}`;

                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [{ cell: elimCell, digit }],
                      highlights: {
                        cells: [...boxCandidates, cell_other],
                        candidates: [
                          ...boxCandidates.map(c => ({ cell: c, digit })),
                          { cell: cell_other, digit }
                        ],
                        links
                      },
                      explanation: {
                        zh: `找到数字 ${digit} 的空矩形（位于宫 ${b + 1}，以 ${pivotStr} 为交点，强链在列 ${c_strong + 1}，端点为 ${strongStr}），排除能同时看清两端的格子的候选数 ${digit}。`,
                        en: `Found Empty Rectangle for digit ${digit} in Box ${b + 1} (pivot ${pivotStr}, strong link in Column ${c_strong + 1}, endpoint ${strongStr}), so ${digit} can be eliminated from R${r_other + 1}C${c_int + 1}.`,
                      }
                    };
                  }
                }
              }
            }

            // 2. Row-based strong links
            for (let r_strong = 0; r_strong < 9; r_strong++) {
              if (Math.floor(r_strong / 3) === Math.floor(b / 3) && Math.floor(c_int / 3) === b % 3) {
                // Inside the same box row, skip
                continue;
              }

              const rowCells: number[] = [];
              for (let col = 0; col < 9; col++) {
                const cell = r_strong * 9 + col;
                if (grid.hasCandidate(cell, digit)) {
                  rowCells.push(cell);
                }
              }

              if (rowCells.length === 2) {
                const cell_on_col = rowCells.find(c => COL_OF[c] === c_int);
                const cell_other = rowCells.find(c => COL_OF[c] !== c_int);

                if (cell_on_col !== undefined && cell_other !== undefined) {
                  const c_other = COL_OF[cell_other]!;
                  const elimCell = r_int * 9 + c_other;

                  if (BOX_OF[elimCell] !== b && grid.hasCandidate(elimCell, digit)) {
                    const links: Link[] = [
                      { from: { cell: cell_other, digit }, to: { cell: cell_on_col, digit }, type: 'strong' }
                    ];

                    const pivotStr = `R${r_int + 1}C${c_int + 1}`;
                    const strongStr = `R${r_strong + 1}C${c_other + 1}`;

                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [{ cell: elimCell, digit }],
                      highlights: {
                        cells: [...boxCandidates, cell_other],
                        candidates: [
                          ...boxCandidates.map(c => ({ cell: c, digit })),
                          { cell: cell_other, digit }
                        ],
                        links
                      },
                      explanation: {
                        zh: `找到数字 ${digit} 的空矩形（位于宫 ${b + 1}，以 ${pivotStr} 为交点，强链在行 ${r_strong + 1}，端点为 ${strongStr}），排除能同时看清两端的格子的候选数 ${digit}。`,
                        en: `Found Empty Rectangle for digit ${digit} in Box ${b + 1} (pivot ${pivotStr}, strong link in Row ${r_strong + 1}, endpoint ${strongStr}), so ${digit} can be eliminated from R${r_int + 1}C${c_other + 1}.`,
                      }
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
  }
};
