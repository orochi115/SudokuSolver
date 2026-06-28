import {
  CELLS, HOUSES, BOXES, ROWS, COLS,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '反三宫（雷神之锤）', en: 'Anti-Tridagon (Thor\'s Hammer)' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let d1 = 1; d1 <= 7; d1++) {
      for (let d2 = d1 + 1; d2 <= 8; d2++) {
        for (let d3 = d2 + 1; d3 <= 9; d3++) {
          const result = tryTridagon(grid, d1, d2, d3, this.id);
          if (result) return result;
        }
      }
    }
    return null;
  },
};

function tryTridagon(grid: Grid, d1: number, d2: number, d3: number, strategyId: string): Step | null {
  const dMask = maskOf(d1) | maskOf(d2) | maskOf(d3);
  const bands = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
  const stacks = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];

  for (const bandRows of bands) {
    for (const stackCols of stacks) {
      const fourBoxes: number[][] = [];
      for (const br of bandRows) {
        for (const sc of stackCols) {
          const boxIdx = Math.floor(br / 3) * 3 + Math.floor(sc / 3);
          fourBoxes.push(BOXES[boxIdx]!.slice() as number[]);
        }
      }
      const uniqueBoxes = [...new Set(fourBoxes.map((b) => b.join(',')))].map((s) => s.split(',').map(Number));
      if (uniqueBoxes.length !== 4) continue;

      const boxCells: number[][][] = [];
      for (const box of uniqueBoxes) {
        const transversals = getTransversals(box, grid, dMask);
        if (transversals.length === 0) break;
        boxCells.push(transversals);
      }
      if (boxCells.length !== 4) continue;

      for (const t0 of boxCells[0]!) {
        for (const t1 of boxCells[1]!) {
          for (const t2 of boxCells[2]!) {
            for (const t3 of boxCells[3]!) {
              const allCells = [...t0, ...t1, ...t2, ...t3];
              const guardians: { cell: number; digit: number }[] = [];

              let valid = true;
              for (const c of allCells) {
                const mask = grid.candidatesOf(c);
                const extraMask = mask & ~dMask;
                if (extraMask !== 0) {
                  for (const d of digitsOf(extraMask)) {
                    guardians.push({ cell: c, digit: d });
                  }
                }
              }

              if (guardians.length === 0) continue;

              const guardianCells = [...new Set(guardians.map((g) => g.cell))];
              if (guardianCells.length > 3) continue;

              if (guardianCells.length === 1) {
                const gc = guardianCells[0]!;
                const elims: { cell: number; digit: number }[] = [];
                for (const d of [d1, d2, d3]) {
                  if (grid.hasCandidate(gc, d)) elims.push({ cell: gc, digit: d });
                }
                if (elims.length > 0) {
                  return {
                    strategyId,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [...allCells],
                      candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                      links: [],
                    },
                    explanation: {
                      zh: `反三宫：12个格跨4宫形成{${d1},${d2},${d3}}的不可能配置；守护者格${cellLabel(gc)}必须取非{${d1},${d2},${d3}}值。`,
                      en: `Anti-Tridagon: 12 cells across 4 boxes form impossible {${d1},${d2},${d3}} config; guardian ${cellLabel(gc)} must take non-{${d1},${d2},${d3}} value.`,
                    },
                  };
                }
              }

              if (guardians.length >= 2) {
                const gDigit = guardians[0]!.digit;
                if (guardians.every((g) => g.digit === gDigit)) {
                  const elims: { cell: number; digit: number }[] = [];
                  for (let c = 0; c < CELLS; c++) {
                    if (grid.get(c) !== 0 || !grid.hasCandidate(c, gDigit)) continue;
                    if (allCells.includes(c) || guardianCells.includes(c)) continue;
                    const peers = new Set(PEERS_OF[c]!);
                    if (guardianCells.every((gc) => peers.has(gc))) {
                      elims.push({ cell: c, digit: gDigit });
                    }
                  }
                  if (elims.length > 0) {
                    return {
                      strategyId,
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: [...allCells, ...guardianCells],
                        candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                        links: [],
                      },
                      explanation: {
                        zh: `反三宫：守护者均为${gDigit}；消去同时看到所有守护者的格中的${gDigit}。`,
                        en: `Anti-Tridagon: all guardians are ${gDigit}; eliminate ${gDigit} from cells seeing all guardians.`,
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
}

function getTransversals(box: number[], grid: Grid, dMask: number): number[][] {
  const emptyCells = box.filter((c) => grid.get(c) === 0);
  const result: number[][] = [];

  const byRow = new Map<number, number[]>();
  const byCol = new Map<number, number[]>();
  for (const c of emptyCells) {
    const r = ROW_OF[c]!;
    const col = COL_OF[c]!;
    if (!byRow.has(r)) byRow.set(r, []);
    if (!byCol.has(col)) byCol.set(col, []);
    byRow.get(r)!.push(c);
    byCol.get(col)!.push(c);
  }

  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const cols = [...byCol.keys()].sort((a, b) => a - b);
  if (rows.length < 3 || cols.length < 3) return result;

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows.length; j++) {
      if (j === i) continue;
      for (let k = 0; k < rows.length; k++) {
        if (k === i || k === j) continue;
        for (const c1 of byRow.get(rows[i]!)!) {
          for (const c2 of byRow.get(rows[j]!)!) {
            if (COL_OF[c2] === COL_OF[c1]) continue;
            for (const c3 of byRow.get(rows[k]!)!) {
              if (COL_OF[c3] === COL_OF[c1] || COL_OF[c3] === COL_OF[c2]) continue;
              const trio = [c1, c2, c3];
              let unionMask = 0;
              for (const c of trio) unionMask |= grid.candidatesOf(c);
              if ((unionMask & dMask) === dMask && popcount(unionMask & dMask) === 3) {
                result.push(trio);
              }
            }
          }
        }
      }
    }
  }
  return result;
}
