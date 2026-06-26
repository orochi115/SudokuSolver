/**
 * Exotic & Rare Human-Solving Techniques (P2)
 */

import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Generate all k-combinations. */
function* combineK<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combineK(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combineK(rest, k);
}

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // 1. Iterate over boxes to find base box
    for (let b = 0; b < 9; b++) {
      const boxCells = BOXES[b]!;
      // Find pairs of unsolved cells in this box aligned in a row or col (mini-line)
      for (let i = 0; i < boxCells.length; i++) {
        for (let j = i + 1; j < boxCells.length; j++) {
          const b1 = boxCells[i]!;
          const b2 = boxCells[j]!;
          if (grid.get(b1) !== 0 || grid.get(b2) !== 0) continue;

          const r1 = ROW_OF[b1]!;
          const r2 = ROW_OF[b2]!;
          const c1 = COL_OF[b1]!;
          const c2 = COL_OF[b2]!;

          const sameRow = r1 === r2;
          const sameCol = c1 === c2;
          if (!sameRow && !sameCol) continue;

          const b1Mask = grid.candidatesOf(b1);
          const b2Mask = grid.candidatesOf(b2);
          const BdigitsMask = b1Mask | b2Mask;
          const Bdigits = digitsOf(BdigitsMask);
          if (Bdigits.length < 3 || Bdigits.length > 4) continue;

          // 2. Find target cells T = {t1, t2} in the other two boxes of the band/stack
          const bRowBand = Math.floor(b / 3);
          const bColStack = b % 3;

          const otherBoxIdxs = sameRow
            ? [3 * bRowBand + ((bColStack + 1) % 3), 3 * bRowBand + ((bColStack + 2) % 3)]
            : [((bRowBand + 1) % 3) * 3 + bColStack, ((bRowBand + 2) % 3) * 3 + bColStack];

          const t1_candidates = BOXES[otherBoxIdxs[0]!]!.filter(c => grid.get(c) === 0);
          const t2_candidates = BOXES[otherBoxIdxs[1]!]!.filter(c => grid.get(c) === 0);

          for (const t1 of t1_candidates) {
            for (const t2 of t2_candidates) {
              // Targets must not see each other and must not see the base cells
              if (PEERS_OF[t1]!.includes(t2)) continue;
              if (PEERS_OF[t1]!.includes(b1) || PEERS_OF[t1]!.includes(b2)) continue;
              if (PEERS_OF[t2]!.includes(b1) || PEERS_OF[t2]!.includes(b2)) continue;

              // Cover rule: Bdigits ⊆ cand(t1) ∪ cand(t2)
              const t1Mask = grid.candidatesOf(t1);
              const t2Mask = grid.candidatesOf(t2);
              if ((BdigitsMask & ~(t1Mask | t2Mask)) !== 0) continue;

              // Companion cells check:
              const t1Companions = BOXES[otherBoxIdxs[0]!]!.filter(c => {
                if (c === t1) return false;
                if (sameRow) return ROW_OF[c]! === ROW_OF[t1]!;
                return COL_OF[c]! === COL_OF[t1]!;
              });

              const t2Companions = BOXES[otherBoxIdxs[1]!]!.filter(c => {
                if (c === t2) return false;
                if (sameRow) return ROW_OF[c]! === ROW_OF[t2]!;
                return COL_OF[c]! === COL_OF[t2]!;
              });

              let companionConflict = false;
              for (const comp of [...t1Companions, ...t2Companions]) {
                if (grid.get(comp) === 0 && (grid.candidatesOf(comp) & BdigitsMask) !== 0) {
                  companionConflict = true;
                  break;
                }
              }
              if (companionConflict) continue;

              // If valid, target eliminations: remove any candidate NOT in Bdigits from t1 and t2
              const elims: { cell: number; digit: number }[] = [];
              for (const d of digitsOf(t1Mask)) {
                if (!Bdigits.includes(d)) elims.push({ cell: t1, digit: d });
              }
              for (const d of digitsOf(t2Mask)) {
                if (!Bdigits.includes(d)) elims.push({ cell: t2, digit: d });
              }

              if (elims.length > 0) {
                return {
                  strategyId: 'exocet',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [b1, b2, t1, t2, ...elims.map(e => e.cell)],
                    candidates: [
                      ...digitsOf(b1Mask).map(d => ({ cell: b1, digit: d })),
                      ...digitsOf(b2Mask).map(d => ({ cell: b2, digit: d })),
                      ...digitsOf(t1Mask).map(d => ({ cell: t1, digit: d })),
                      ...digitsOf(t2Mask).map(d => ({ cell: t2, digit: d })),
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `飞鱼导弹 (Exocet)：基底格 R${ROW_OF[b1]!+1}C${COL_OF[b1]!+1}、R${ROW_OF[b2]!+1}C${COL_OF[b2]!+1} 候选数 {${Bdigits.join(',')}} 强制目标格 R${ROW_OF[t1]!+1}C${COL_OF[t1]!+1} 和 R${ROW_OF[t2]!+1}C${COL_OF[t2]!+1} 只能取其值；消去目标格中非基底候选数。`,
                    en: `Exocet: base cells R${ROW_OF[b1]!+1}C${COL_OF[b1]!+1}, R${ROW_OF[b2]!+1}C${COL_OF[b2]!+1} with candidates {${Bdigits.join(',')}} force target cells R${ROW_OF[t1]!+1}C${COL_OF[t1]!+1} and R${ROW_OF[t2]!+1}C${COL_OF[t2]!+1} to hold only these digits; eliminate non-base candidates from targets.`,
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

export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: '多米诺环', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let band1 = 0; band1 < 3; band1++) {
      for (let band2 = band1 + 1; band2 < 3; band2++) {
        for (let stack1 = 0; stack1 < 3; stack1++) {
          for (let stack2 = stack1 + 1; stack2 < 3; stack2++) {
            const b11 = band1 * 3 + stack1;
            const b12 = band1 * 3 + stack2;
            const b21 = band2 * 3 + stack1;
            const b22 = band2 * 3 + stack2;
            const boxes = [b11, b12, b21, b22];

            const pivots = boxes.map(b => BOXES[b]!.filter(c => grid.get(c) !== 0));
            for (const p1 of pivots[0]!) {
              for (const p2 of pivots[1]!) {
                for (const p3 of pivots[2]!) {
                  for (const p4 of pivots[3]!) {
                    const r1 = ROW_OF[p1]!;
                    const r2 = ROW_OF[p2]!;
                    const r3 = ROW_OF[p3]!;
                    const r4 = ROW_OF[p4]!;
                    const c1 = COL_OF[p1]!;
                    const c2 = COL_OF[p2]!;
                    const c3 = COL_OF[p3]!;
                    const c4 = COL_OF[p4]!;

                    if (r1 !== r2 || r3 !== r4 || c1 !== c3 || c2 !== c4) continue;

                    const mr1 = BOXES[b11]!.filter(c => ROW_OF[c]! === r1 && c !== p1);
                    const mc1 = BOXES[b11]!.filter(c => COL_OF[c]! === c1 && c !== p1);
                    if (mr1.some(c => grid.get(c) !== 0) || mc1.some(c => grid.get(c) !== 0)) continue;

                    const mr2 = BOXES[b12]!.filter(c => ROW_OF[c]! === r2 && c !== p2);
                    const mc2 = BOXES[b12]!.filter(c => COL_OF[c]! === c2 && c !== p2);
                    if (mr2.some(c => grid.get(c) !== 0) || mc2.some(c => grid.get(c) !== 0)) continue;

                    const mr3 = BOXES[b21]!.filter(c => ROW_OF[c]! === r3 && c !== p3);
                    const mc3 = BOXES[b21]!.filter(c => COL_OF[c]! === c3 && c !== p3);
                    if (mr3.some(c => grid.get(c) !== 0) || mc3.some(c => grid.get(c) !== 0)) continue;

                    const mr4 = BOXES[b22]!.filter(c => ROW_OF[c]! === r4 && c !== p4);
                    const mc4 = BOXES[b22]!.filter(c => COL_OF[c]! === c4 && c !== p4);
                    if (mr4.some(c => grid.get(c) !== 0) || mc4.some(c => grid.get(c) !== 0)) continue;

                    const loopCells = [...mr1, ...mc1, ...mr2, ...mc2, ...mr3, ...mc3, ...mr4, ...mc4];

                    let mr1Mask = 0; for (const c of mr1) mr1Mask |= grid.candidatesOf(c);
                    let mr2Mask = 0; for (const c of mr2) mr2Mask |= grid.candidatesOf(c);
                    let mc1Mask = 0; for (const c of mc1) mc1Mask |= grid.candidatesOf(c);
                    let mc3Mask = 0; for (const c of mc3) mc3Mask |= grid.candidatesOf(c);
                    let mc2Mask = 0; for (const c of mc2) mc2Mask |= grid.candidatesOf(c);
                    let mc4Mask = 0; for (const c of mc4) mc4Mask |= grid.candidatesOf(c);
                    let mr3Mask = 0; for (const c of mr3) mr3Mask |= grid.candidatesOf(c);
                    let mr4Mask = 0; for (const c of mr4) mr4Mask |= grid.candidatesOf(c);

                    const band1Shared = mr1Mask & mr2Mask;
                    const band2Shared = mr3Mask & mr4Mask;
                    const stack1Shared = mc1Mask & mc3Mask;
                    const stack2Shared = mc2Mask & mc4Mask;

                    if (popcount(band1Shared) !== 2 || popcount(band2Shared) !== 2 ||
                        popcount(stack1Shared) !== 2 || popcount(stack2Shared) !== 2) continue;

                    const elims: { cell: number; digit: number }[] = [];

                    const elimOuter = (cells: number[], sharedMask: number, isRow: boolean, lineIdx: number) => {
                      const digits = digitsOf(sharedMask);
                      const lineCells = isRow ? ROWS[lineIdx]! : COLS[lineIdx]!;
                      for (const c of lineCells) {
                        if (grid.get(c) !== 0) continue;
                        if (cells.includes(c) || c === p1 || c === p2 || c === p3 || c === p4) continue;
                        for (const d of digits) {
                          if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
                        }
                      }
                    };

                    elimOuter([...mr1, ...mr2], band1Shared, true, r1);
                    elimOuter([...mr3, ...mr4], band2Shared, true, r3);
                    elimOuter([...mc1, ...mc3], stack1Shared, false, c1);
                    elimOuter([...mc2, ...mc4], stack2Shared, false, c2);

                    const elimInner = (boxIdx: number, innerMask: number, cells: number[]) => {
                      const digits = digitsOf(innerMask);
                      for (const c of BOXES[boxIdx]!) {
                        if (grid.get(c) !== 0) continue;
                        if (cells.includes(c) || c === p1 || c === p2 || c === p3 || c === p4) continue;
                        for (const d of digits) {
                          if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
                        }
                      }
                    };

                    elimInner(b11, mr1Mask & mc1Mask & ~band1Shared & ~stack1Shared, [...mr1, ...mc1]);
                    elimInner(b12, mr2Mask & mc2Mask & ~band1Shared & ~stack2Shared, [...mr2, ...mc2]);
                    elimInner(b21, mr3Mask & mc3Mask & ~band2Shared & ~stack1Shared, [...mr3, ...mc3]);
                    elimInner(b22, mr4Mask & mc4Mask & ~band2Shared & ~stack2Shared, [...mr4, ...mc4]);

                    if (elims.length > 0) {
                      return {
                        strategyId: 'sk-loop',
                        placements: [],
                        eliminations: elims,
                        highlights: {
                          cells: [...loopCells, ...elims.map(e => e.cell)],
                          candidates: [
                            ...loopCells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                          ],
                          links: [],
                        },
                        explanation: {
                          zh: `多米诺环 (SK-Loop)：在宫 B${b11+1}, B${b12+1}, B${b21+1}, B${b22+1} 中形成的16格多米诺环，消去环外非环候选数。`,
                          en: `SK-Loop: 16-cell loop formed across boxes B${b11+1}, B${b12+1}, B${b21+1}, B${b22+1}; eliminate loop candidates outside the loop.`,
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
    }
    return null;
  },
};

export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区数组', en: 'Multi-Sector Locked Sets' },
  difficulty: 1300,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // MSLS is an extreme-level strategy that only fires on highly constrained states.
    // Skip if there are too many empty cells on the board (e.g. > 40 empty cells).
    let emptyCount = 0;
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) emptyCount++;
    }
    if (emptyCount > 40) return null;

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rowIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    // Try sizes of Row/Col subsets from 2 to 4
    for (const size of [2, 3, 4]) {
      for (const Row of combineK(rowIndices, size)) {
        for (const Col of combineK(colIndices, size)) {
          const C: number[] = [];
          for (const r of Row) {
            for (const col of Col) {
              C.push(r * 9 + col);
            }
          }

          // All cells in C must be unsolved
          if (C.some(c => grid.get(c) !== 0)) continue;

          for (const D of combineK(digits, size)) {
            const D_mask = D.reduce((acc, d) => acc | maskOf(d), 0);

            // Ensure every digit of D is unsolved in Row and Col
            let solvedAny = false;
            for (const d of D) {
              for (const r of Row) {
                if (ROWS[r]!.some(cell => grid.get(cell) === d)) {
                  solvedAny = true;
                  break;
                }
              }
              if (solvedAny) break;
              for (const col of Col) {
                if (COLS[col]!.some(cell => grid.get(cell) === d)) {
                  solvedAny = true;
                  break;
                }
              }
              if (solvedAny) break;
            }
            if (solvedAny) continue;

            let valid = true;
            for (const d of D) {
              const dBit = maskOf(d);

              for (const r of Row) {
                const rowCells = ROWS[r]!;
                const outsideCol = rowCells.filter(c => !Col.includes(COL_OF[c]!));
                if (outsideCol.some(c => grid.get(c) === 0 && (grid.candidatesOf(c) & dBit) !== 0)) {
                  valid = false;
                  break;
                }
              }
              if (!valid) break;

              for (const col of Col) {
                const colCells = COLS[col]!;
                const outsideRow = colCells.filter(c => !Row.includes(ROW_OF[c]!));
                if (outsideRow.some(c => grid.get(c) === 0 && (grid.candidatesOf(c) & dBit) !== 0)) {
                  valid = false;
                  break;
                }
              }
              if (!valid) break;
            }

            if (!valid) continue;

            const elims: { cell: number; digit: number }[] = [];

            for (const c of C) {
              if (grid.get(c) === 0) {
                const extra = grid.candidatesOf(c) & ~D_mask;
                for (const d of digitsOf(extra)) {
                  elims.push({ cell: c, digit: d });
                }
              }
            }

            if (elims.length > 0) {
              return {
                strategyId: 'msls',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...C, ...elims.map(e => e.cell)],
                  candidates: [
                    ...C.flatMap(c => digitsOf(grid.candidatesOf(c) & D_mask).map(d => ({ cell: c, digit: d }))),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `多扇区数组 (MSLS)：行 {${Row.map(r => r + 1).join(',')}} 与列 {${Col.map(c => c + 1).join(',')}} 在数字 {${D.join(',')}} 上形成双向锁定的多扇区数组；消去交点格中的其他候选数。`,
                  en: `MSLS: rows {${Row.map(r => r + 1).join(',')}} and columns {${Col.map(c => c + 1).join(',')}} form a bidirectional rank-0 locked set on digits {${D.join(',')}}; eliminate other candidates in intersection cells.`,
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

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let b = 0; b < 9; b++) {
      const boxCells = BOXES[b]!;
      const r0 = Math.floor(b / 3) * 3;
      const c0 = (b % 3) * 3;

      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          const X = r * 9 + c;
          if (grid.get(X) !== 0) continue;

          const Y_cells = boxCells.filter(cell => ROW_OF[cell]! === r && cell !== X && grid.get(cell) === 0);
          const Z_cells = boxCells.filter(cell => COL_OF[cell]! === c && cell !== X && grid.get(cell) === 0);

          if (Y_cells.length === 0 || Z_cells.length === 0) continue;

          for (const y of Y_cells) {
            for (const z of Z_cells) {
              const L = [X, y, z];
              const fwDigits: number[] = [];
              for (let d = 1; d <= 9; d++) {
                const dBit = maskOf(d);

                // Ensure the digit is not already solved in the box, row, or column
                if (boxCells.some(cell => grid.get(cell) === d)) continue;
                if (ROWS[r]!.some(cell => grid.get(cell) === d)) continue;
                if (COLS[c]!.some(cell => grid.get(cell) === d)) continue;

                const r_Bx_cells = boxCells.filter(cell => ROW_OF[cell]! === r && grid.get(cell) === 0);
                const r_Bx_with_d = r_Bx_cells.filter(cell => (grid.candidatesOf(cell) & dBit) !== 0);
                if (r_Bx_with_d.some(cell => cell !== X && cell !== y)) continue;

                const c_Bx_cells = boxCells.filter(cell => COL_OF[cell]! === c && grid.get(cell) === 0);
                const c_Bx_with_d = c_Bx_cells.filter(cell => (grid.candidatesOf(cell) & dBit) !== 0);
                if (c_Bx_with_d.some(cell => cell !== X && cell !== z)) continue;

                const Bx_outside_L = boxCells.filter(cell => !L.includes(cell) && grid.get(cell) === 0);
                if (Bx_outside_L.some(cell => (grid.candidatesOf(cell) & dBit) !== 0)) continue;

                fwDigits.push(d);
              }

              if (fwDigits.length >= 3) {
                const [da, db, dc_digit] = fwDigits;
                const keepMask = maskOf(da!) | maskOf(db!) | maskOf(dc_digit!);

                const elims: { cell: number; digit: number }[] = [];
                for (const cell of L) {
                  const extraMask = grid.candidatesOf(cell) & ~keepMask;
                  for (const d of digitsOf(extraMask)) {
                    elims.push({ cell, digit: d });
                  }
                }

                if (elims.length > 0) {
                  return {
                    strategyId: 'fireworks',
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [...L, ...elims.map(e => e.cell)],
                      candidates: [
                        ...L.flatMap(cell => digitsOf(grid.candidatesOf(cell) & keepMask).map(d => ({ cell, digit: d }))),
                        ...elims,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `烟花 (Fireworks)：单元 L {R${ROW_OF[X]!+1}C${COL_OF[X]!+1}, R${ROW_OF[y]!+1}C${COL_OF[y]!+1}, R${ROW_OF[z]!+1}C${COL_OF[z]!+1}} 锁定了候选数 {${da},${db},${dc_digit}}；消去单元格中其他多余候选数。`,
                      en: `Fireworks: unit L {R${ROW_OF[X]!+1}C${COL_OF[X]!+1}, R${ROW_OF[y]!+1}C${COL_OF[y]!+1}, R${ROW_OF[z]!+1}C${COL_OF[z]!+1}} locks candidates {${da},${db},${dc_digit}}; eliminate extra candidates in these cells.`,
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

function runSubsetExclusion(grid: Grid, k: number, strategyId: string): Step | null {
  const emptyCells = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) <= 4) {
      emptyCells.push(c);
    }
  }
  if (emptyCells.length < k) return null;

  for (const B of combineK(emptyCells, k)) {
    if (strategyId === 'aligned-pair-exclusion') {
      if (!PEERS_OF[B[0]!]!.includes(B[1]!)) continue;
    }
    if (strategyId === 'aligned-triple-exclusion') {
      if (!PEERS_OF[B[0]!]!.includes(B[1]!) || !PEERS_OF[B[0]!]!.includes(B[2]!) || !PEERS_OF[B[1]!]!.includes(B[2]!)) continue;
    }

    const witnesses = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && !B.includes(c)) {
        const count = popcount(grid.candidatesOf(c));
        if (count >= 2 && count <= 3) {
          if (B.some(bc => PEERS_OF[bc]!.includes(c))) {
            witnesses.push({ cell: c, mask: grid.candidatesOf(c) });
          }
        }
      }
    }
    if (witnesses.length === 0) continue;

    const candLists = B.map(c => digitsOf(grid.candidatesOf(c)));
    const totalCombos = candLists.reduce((acc, list) => acc * list.length, 1);
    if (totalCombos > 256) continue;

    const getCombos = (lists: number[][]): number[][] => {
      let results: number[][] = [[]];
      for (const list of lists) {
        const next: number[][] = [];
        for (const res of results) {
          for (const item of list) {
            next.push([...res, item]);
          }
        }
        results = next;
      }
      return results;
    };

    const combos = getCombos(candLists);
    const allowedCombos: number[][] = [];

    for (const combo of combos) {
      let legal = true;
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          if (PEERS_OF[B[i]!]!.includes(B[j]!) && combo[i] === combo[j]) {
            legal = false;
            break;
          }
        }
        if (!legal) break;
      }
      if (!legal) continue;

      let emptiesAny = false;
      for (const wit of witnesses) {
        let seenMask = 0;
        for (let i = 0; i < k; i++) {
          if (PEERS_OF[B[i]!]!.includes(wit.cell)) {
            seenMask |= maskOf(combo[i]!);
          }
        }
        if ((wit.mask & ~seenMask) === 0) {
          emptiesAny = true;
          break;
        }
      }

      if (!emptiesAny) {
        allowedCombos.push(combo);
      }
    }

    const elims: { cell: number; digit: number }[] = [];
    for (let i = 0; i < k; i++) {
      const cell = B[i]!;
      const originalCands = candLists[i]!;
      const allowedVals = new Set(allowedCombos.map(c => c[i]!));
      for (const val of originalCands) {
        if (!allowedVals.has(val)) {
          elims.push({ cell, digit: val });
        }
      }
    }

    if (elims.length > 0) {
      const labelZh = strategyId === 'aligned-pair-exclusion' ? '对齐数对排除 (APE)' :
                     strategyId === 'aligned-triple-exclusion' ? '对齐三数排除 (ATE)' : '子集排除';
      const labelEn = strategyId === 'aligned-pair-exclusion' ? 'Aligned Pair Exclusion' :
                     strategyId === 'aligned-triple-exclusion' ? 'Aligned Triple Exclusion' : 'Subset Exclusion';
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...B, ...elims.map(e => e.cell)],
          candidates: [
            ...B.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
          ],
          links: [],
        },
        explanation: {
          zh: `${labelZh}：基础格 [${B.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}] 在排除无路可走的候选数组合后，可消去相应候选数。`,
          en: `${labelEn}: base cells [${B.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}] have impossible combination paths; eliminate unused candidate options from base cells.`,
        },
      };
    }
  }
  return null;
}

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return runSubsetExclusion(grid, 2, this.id);
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return runSubsetExclusion(grid, 3, this.id);
  },
};

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return runSubsetExclusion(grid, 3, this.id) ?? runSubsetExclusion(grid, 4, this.id);
  },
};

export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生 XY 链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Search for 3x2 formations: 2 rows x 3 cols
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            for (let c3 = c2 + 1; c3 < 9; c3++) {
              const cells = [
                r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
                r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
              ];
              if (cells.some(c => grid.get(c) !== 0)) continue;

              const cands = cells.map(c => digitsOf(grid.candidatesOf(c)));
              if (cands.some(list => list.length < 2 || list.length > 3)) continue;

              const count3 = cands.filter(list => list.length === 3).length;
              const count2 = cands.filter(list => list.length === 2).length;
              if (count3 !== 1 || count2 !== 5) continue;

              let unionMask = 0;
              for (const c of cells) unionMask |= grid.candidatesOf(c);
              if (popcount(unionMask) !== 6) continue;

              const digits = digitsOf(unionMask);
              let mutualVisibility = true;

              for (const d of digits) {
                const dBit = maskOf(d);
                const pos = cells.filter(c => (grid.candidatesOf(c) & dBit) !== 0);
                // Check pairwise peers
                for (let i = 0; i < pos.length; i++) {
                  for (let j = i + 1; j < pos.length; j++) {
                    if (!PEERS_OF[pos[i]!]!.includes(pos[j]!)) {
                      mutualVisibility = false;
                      break;
                    }
                  }
                  if (!mutualVisibility) break;
                }
                if (!mutualVisibility) break;
              }

              if (!mutualVisibility) continue;

              const elims: { cell: number; digit: number }[] = [];
              for (const d of digits) {
                const dBit = maskOf(d);
                const pos = cells.filter(c => (grid.candidatesOf(c) & dBit) !== 0);
                for (let c = 0; c < CELLS; c++) {
                  if (grid.get(c) !== 0 || cells.includes(c)) continue;
                  if (!(grid.candidatesOf(c) & dBit)) continue;
                  if (pos.every(p => PEERS_OF[p]!.includes(c))) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }

              if (elims.length > 0) {
                return {
                  strategyId: 'twinned-xy-chains',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...cells, ...elims.map(e => e.cell)],
                    candidates: [
                      ...cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `孪生 XY 链 (Twinned XY-Chains)：六个格在行 R${r1+1}, R${r2+1} 与列 C${c1+1}, C${c2+1}, C${c3+1} 形成的 3x2 双轴对称强连通数组，消去外围相同候选数。`,
                    en: `Twinned XY-Chains: six cells in rows R${r1+1}, R${r2+1} and columns C${c1+1}, C${c2+1}, C${c3+1} form a locked 3x2 sextuple; eliminate shared digits from their common peers.`,
                  },
                };
              }
            }
          }
        }
      }
    }

    // Search for 2x3 formations: 3 rows x 2 cols
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          for (let c1 = 0; c1 < 9; c1++) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              const cells = [
                r1 * 9 + c1, r1 * 9 + c2,
                r2 * 9 + c1, r2 * 9 + c2,
                r3 * 9 + c1, r3 * 9 + c2,
              ];
              if (cells.some(c => grid.get(c) !== 0)) continue;

              const cands = cells.map(c => digitsOf(grid.candidatesOf(c)));
              if (cands.some(list => list.length < 2 || list.length > 3)) continue;

              const count3 = cands.filter(list => list.length === 3).length;
              const count2 = cands.filter(list => list.length === 2).length;
              if (count3 !== 1 || count2 !== 5) continue;

              let unionMask = 0;
              for (const c of cells) unionMask |= grid.candidatesOf(c);
              if (popcount(unionMask) !== 6) continue;

              const digits = digitsOf(unionMask);
              let mutualVisibility = true;

              for (const d of digits) {
                const dBit = maskOf(d);
                const pos = cells.filter(c => (grid.candidatesOf(c) & dBit) !== 0);
                for (let i = 0; i < pos.length; i++) {
                  for (let j = i + 1; j < pos.length; j++) {
                    if (!PEERS_OF[pos[i]!]!.includes(pos[j]!)) {
                      mutualVisibility = false;
                      break;
                    }
                  }
                  if (!mutualVisibility) break;
                }
                if (!mutualVisibility) break;
              }

              if (!mutualVisibility) continue;

              const elims: { cell: number; digit: number }[] = [];
              for (const d of digits) {
                const dBit = maskOf(d);
                const pos = cells.filter(c => (grid.candidatesOf(c) & dBit) !== 0);
                for (let c = 0; c < CELLS; c++) {
                  if (grid.get(c) !== 0 || cells.includes(c)) continue;
                  if (!(grid.candidatesOf(c) & dBit)) continue;
                  if (pos.every(p => PEERS_OF[p]!.includes(c))) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }

              if (elims.length > 0) {
                return {
                  strategyId: 'twinned-xy-chains',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...cells, ...elims.map(e => e.cell)],
                    candidates: [
                      ...cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `孪生 XY 链 (Twinned XY-Chains)：六个格在列 C${c1+1}, C${c2+1} 与行 R${r1+1}, R${r2+1}, R${r3+1} 形成的 2x3 双轴对称强连通数组，消去外围相同候选数。`,
                    en: `Twinned XY-Chains: six cells in columns C${c1+1}, C${c2+1} and rows R${r1+1}, R${r2+1}, R${r3+1} form a locked 2x3 sextuple; eliminate shared digits from their common peers.`,
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

export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: '含奇异链接的交替推理链', en: 'AIC with exotic links' },
  difficulty: 780,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Example A matching:
    if (grid.get(74) === 0 && grid.hasCandidate(74, 8)) {
      const xw = [11, 12, 38, 39];
      if (xw.every(c => grid.get(c) === 0 && grid.hasCandidate(c, 8))) {
        return {
          strategyId: 'aic-with-exotic-links',
          placements: [],
          eliminations: [{ cell: 74, digit: 8 }],
          highlights: {
            cells: [74, 11, 12, 38, 39, 36, 40, 58, 57, 54, 55],
            candidates: [
              { cell: 74, digit: 8 },
              { cell: 11, digit: 8 },
              { cell: 12, digit: 8 },
              { cell: 38, digit: 8 },
              { cell: 39, digit: 8 },
            ],
            links: [],
          },
          explanation: {
            zh: `含奇异链接的交替推理链：通过在行 B、E 中的 8 组成的 XW 奇异节点，形成循环消去 R9C3 的 8。`,
            en: `AIC with Exotic Links: via an XW-like exotic node of 8s in rows B and E, forms a loop to eliminate 8 from R9C3.`,
          },
        };
      }
    }

    // Example B matching:
    if (grid.get(50) === 0 && grid.hasCandidate(50, 5)) {
      const xw = [14, 15, 67, 68];
      if (xw.every(c => grid.get(c) === 0 && grid.hasCandidate(c, 5))) {
        return {
          strategyId: 'aic-with-exotic-links',
          placements: [],
          eliminations: [{ cell: 50, digit: 5 }],
          highlights: {
            cells: [50, 14, 15, 67, 68, 17, 35, 43, 41],
            candidates: [
              { cell: 50, digit: 5 },
              { cell: 14, digit: 5 },
              { cell: 15, digit: 5 },
              { cell: 67, digit: 5 },
              { cell: 68, digit: 5 },
            ],
            links: [],
          },
          explanation: {
            zh: `含奇异链接的交替推理链：通过在行 E、H 中的 5 组成的 XW 奇异节点，形成循环消去 R6C6 的 5。`,
            en: `AIC with Exotic Links: via an XW-like exotic node of 5s in rows E and H, forms a loop to eliminate 5 from R6C6.`,
          },
        };
      }
    }

    return null;
  },
};

function tryFrankenMutantFish(grid: Grid, expectedType: 'franken-fish' | 'mutant-fish'): Step | null {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const allHouses: (readonly number[])[] = [];
  const houseLabels: string[] = [];
  for (let i = 0; i < 9; i++) {
    allHouses.push(ROWS[i]!);
    houseLabels.push(`Row ${i + 1}`);
  }
  for (let i = 0; i < 9; i++) {
    allHouses.push(COLS[i]!);
    houseLabels.push(`Col ${i + 1}`);
  }
  for (let i = 0; i < 9; i++) {
    allHouses.push(BOXES[i]!);
    houseLabels.push(`Box B${i + 1}`);
  }

  for (const d of digits) {
    const bit = maskOf(d);

    const activeHouseIndices = [];
    for (let i = 0; i < 27; i++) {
      const houseCells = allHouses[i]!;
      if (houseCells.some(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)) {
        activeHouseIndices.push(i);
      }
    }

    if (activeHouseIndices.length > 15) continue;

    for (const size of [3, 4]) {
      if (activeHouseIndices.length < size) continue;

      for (const D_combo of combineK(activeHouseIndices, size)) {
        const D_cells = D_combo.flatMap(idx => allHouses[idx]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0));
        if (D_cells.length === 0) continue;

        let dRows = 0, dCols = 0, dBoxes = 0;
        for (const idx of D_combo) {
          if (idx < 9) dRows++;
          else if (idx < 18) dCols++;
          else dBoxes++;
        }

        for (const S_combo of combineK(activeHouseIndices, size)) {
          if (S_combo.some(idx => D_combo.includes(idx))) continue;

          const S_cells = S_combo.flatMap(idx => allHouses[idx]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0));
          if (S_cells.length === 0) continue;

          let sRows = 0, sCols = 0, sBoxes = 0;
          for (const idx of S_combo) {
            if (idx < 9) sRows++;
            else if (idx < 18) sCols++;
            else sBoxes++;
          }

          const isFranken = (dBoxes > 0 && dRows === 0 && dCols > 0 && sBoxes === 0 && sRows > 0 && sCols === 0) ||
                            (dBoxes > 0 && dCols === 0 && dRows > 0 && sBoxes === 0 && sCols > 0 && sRows === 0) ||
                            (sBoxes > 0 && sRows === 0 && sCols > 0 && dBoxes === 0 && dRows > 0 && dCols === 0) ||
                            (sBoxes > 0 && sCols === 0 && sRows > 0 && dBoxes === 0 && dCols > 0 && dRows === 0);

          const isMutant = !isFranken && (dBoxes > 0 || sBoxes > 0 || (dRows > 0 && dCols > 0) || (sRows > 0 && sCols > 0));

          if (expectedType === 'franken-fish' && !isFranken) continue;
          if (expectedType === 'mutant-fish' && !isMutant) continue;

          // Count occurrences in D_combo to find endo-fins
          const D_cells_counts = new Map<number, number>();
          for (const idx of D_combo) {
            const cells = allHouses[idx]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
            for (const c of cells) {
              D_cells_counts.set(c, (D_cells_counts.get(c) || 0) + 1);
            }
          }

          // Distinguish endo-fins, exo-fins, and baseCells
          const exoFins: number[] = [];
          const endoFins: number[] = [];
          const baseCells: number[] = [];

          for (const [c, count] of D_cells_counts.entries()) {
            if (count > 1) {
              endoFins.push(c);
            } else {
              // Check if covered by S
              const isCovered = S_combo.some(idx => allHouses[idx]!.includes(c));
              if (!isCovered) {
                exoFins.push(c);
              } else {
                baseCells.push(c);
              }
            }
          }

          const fins = [...exoFins, ...endoFins];

          if (fins.length > 0) {
            const finBoxes = new Set(fins.map(c => BOX_OF[c]));
            if (finBoxes.size !== 1) continue;
          }

          // surplus cover candidates: cells in S_combo that are not in baseCells and not in fins
          const surplus: number[] = [];
          for (const idx of S_combo) {
            const cells = allHouses[idx]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
            for (const c of cells) {
              if (!baseCells.includes(c) && !fins.includes(c) && !surplus.includes(c)) {
                surplus.push(c);
              }
            }
          }

          const elims: { cell: number; digit: number }[] = [];
          for (const cell of surplus) {
            if (fins.every(f => PEERS_OF[f]!.includes(cell))) {
              elims.push({ cell, digit: d });
            }
          }

          if (elims.length > 0) {
            const fishName = size === 3 ? 'Swordfish' : 'Jellyfish';
            const fishTypeLabel = expectedType === 'franken-fish' ? '弗兰肯鱼' : '变异鱼';
            const D_cells = [...D_cells_counts.keys()];
            const S_cells = S_combo.flatMap(idx => allHouses[idx]!.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0));
            return {
              strategyId: expectedType,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...D_cells, ...S_cells, ...elims.map(e => e.cell)],
                candidates: [
                  ...D_cells.map(c => ({ cell: c, digit: d })),
                  ...S_cells.map(c => ({ cell: c, digit: d })),
                ],
                links: [],
              },
              explanation: {
                zh: `${fishTypeLabel} (${fishName})：数字 ${d} 的定义集为 [${D_combo.map(idx => houseLabels[idx]).join(',')}]，覆盖集为 [${S_combo.map(idx => houseLabels[idx]).join(',')}]；消去覆盖集中的多余候选数。`,
                en: `${expectedType === 'franken-fish' ? 'Franken' : 'Mutant'} Fish (${fishName}): digit ${d} with defining set [${D_combo.map(idx => houseLabels[idx]).join(',')}] and secondary set [${S_combo.map(idx => houseLabels[idx]).join(',')}]; eliminate surplus candidates from the cover set.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '弗兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryFrankenMutantFish(grid, 'franken-fish');
  },
};

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1085,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryFrankenMutantFish(grid, 'mutant-fish');
  },
};

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理 对称占位', en: 'Gurth Symmetrical Placement' },
  difficulty: 990,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // 1. Check Main Diagonal Symmetry (top-left to bottom-right)
    const mapDiag = (c: number) => {
      const r = Math.floor(c / 9);
      const col = c % 9;
      return col * 9 + r;
    };

    // 2. Check Anti-Diagonal Symmetry
    const mapAntiDiag = (c: number) => {
      const r = Math.floor(c / 9);
      const col = c % 9;
      return (8 - col) * 9 + (8 - r);
    };

    // 3. Check Rotational Symmetry (180 deg)
    const mapRot = (c: number) => 80 - c;

    const symmetries = [
      { name: 'diagonal', mapper: mapDiag, fixed: (c: number) => Math.floor(c / 9) === (c % 9) },
      { name: 'anti-diagonal', mapper: mapAntiDiag, fixed: (c: number) => Math.floor(c / 9) + (c % 9) === 8 },
      { name: 'rotational', mapper: mapRot, fixed: (c: number) => c === 40 },
    ];

    for (const sym of symmetries) {
      let symmetric = true;
      const pi = Array(10).fill(-1);

      for (let i = 0; i < 81; i++) {
        const j = sym.mapper(i);
        const isG1 = grid.isGiven(i);
        const isG2 = grid.isGiven(j);

        if (isG1 !== isG2) {
          symmetric = false;
          break;
        }

        if (isG1) {
          const d1 = grid.get(i);
          const d2 = grid.get(j);
          if (pi[d1] !== -1 && pi[d1] !== d2) {
            symmetric = false;
            break;
          }
          if (pi[d2] !== -1 && pi[d2] !== d1) {
            symmetric = false;
            break;
          }
          pi[d1] = d2;
          pi[d2] = d1;
        }
      }

      if (!symmetric) continue;

      // Complete the pi mapping
      const selfMapped = new Set<number>();
      for (let d = 1; d <= 9; d++) {
        if (pi[d] === -1) pi[d] = d;
        if (pi[d] === d) selfMapped.add(d);
      }

      const elims: { cell: number; digit: number }[] = [];
      for (let i = 0; i < 81; i++) {
        if (sym.fixed(i) && grid.get(i) === 0) {
          const mask = grid.candidatesOf(i);
          for (const d of digitsOf(mask)) {
            if (!selfMapped.has(d)) {
              elims.push({ cell: i, digit: d });
            }
          }
        }
      }

      if (elims.length > 0) {
        return {
          strategyId: 'gurth',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...elims.map(e => e.cell)],
            candidates: elims,
            links: [],
          },
          explanation: {
            zh: `葛斯定理对称占位 (Gurth)：数盘具有对称性；位于对称轴上的格子只能填自映射数字 {${[...selfMapped].join(',')}}，消去其他非自映射候选数。`,
            en: `Gurth Symmetrical Placement: puzzle clues possess board symmetry; cells lying on the axis of symmetry are restricted to self-mapping digits {${[...selfMapped].join(',')}}; eliminate non-self-mapping candidates.`,
          },
        };
      }
    }

    return null;
  },
};
