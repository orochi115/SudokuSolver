import { HOUSES, ROWS, COLS, BOXES, SIZE, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);

      // Pointing: box candidates confined to one row/column
      for (let bi = 0; bi < 9; bi++) {
        const box = BOXES[bi]!;
        let rowMask = 0;
        let colMask = 0;
        for (const c of box) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) {
            rowMask |= 1 << ROW_OF[c]!;
            colMask |= 1 << COL_OF[c]!;
          }
        }
        if (popcount(rowMask) === 1) {
          const r = Math.log2(rowMask);
          const row = ROWS[r]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of row) {
            if (grid.get(c) !== 0) continue;
            if (grid.hasCandidate(c, d)) {
              const inBox = box.includes(c);
              if (!inBox) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            const houseCells = box.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
            const rn = r + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: houseCells, candidates: houseCells.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `数字 ${d} 在宫 ${bi + 1} 中仅出现在第 ${rn} 行，因此从该行其他格中排除候选项 ${d}（指向排除）。`,
                en: `Digit ${d} in box ${bi + 1} is confined to row ${rn}, so it is eliminated from other cells in that row (Pointing).`,
              },
            };
          }
        }
        if (popcount(colMask) === 1) {
          const cIdx = Math.log2(colMask);
          const col = COLS[cIdx]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of col) {
            if (grid.get(c) !== 0) continue;
            if (grid.hasCandidate(c, d)) {
              if (!box.includes(c)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            const houseCells = box.filter((cc) => grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit));
            const cn = cIdx + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: houseCells, candidates: houseCells.map((cc) => ({ cell: cc, digit: d })), links: [] },
              explanation: {
                zh: `数字 ${d} 在宫 ${bi + 1} 中仅出现在第 ${cn} 列，因此从该列其他格中排除候选项 ${d}（指向排除）。`,
                en: `Digit ${d} in box ${bi + 1} is confined to column ${cn}, so it is eliminated from other cells in that column (Pointing).`,
              },
            };
          }
        }
      }

      // Claiming: row/column candidates confined to one box
      for (let ri = 0; ri < 9; ri++) {
        const row = ROWS[ri]!;
        let boxMask = 0;
        for (const c of row) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) {
            boxMask |= 1 << Math.floor(c / 27) * 3 + Math.floor((c % 9) / 3);
          }
        }
        if (popcount(boxMask) === 1) {
          const bi = Math.log2(boxMask);
          const box = BOXES[bi]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of box) {
            if (grid.get(c) !== 0) continue;
            if (grid.hasCandidate(c, d)) {
              if (!row.includes(c)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            const lineCells = row.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
            const rn = ri + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: lineCells, candidates: lineCells.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `数字 ${d} 在第 ${rn} 行中仅出现在宫 ${bi + 1}，因此从该宫其他格中排除候选项 ${d}（占位排除）。`,
                en: `Digit ${d} in row ${rn} is confined to box ${bi + 1}, so it is eliminated from other cells in that box (Claiming).`,
              },
            };
          }
        }
      }

      for (let ci = 0; ci < 9; ci++) {
        const col = COLS[ci]!;
        let boxMask = 0;
        for (const c of col) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) & bit) {
            boxMask |= 1 << (Math.floor(ROW_OF[c]! / 3) * 3 + Math.floor(ci / 3));
          }
        }
        if (popcount(boxMask) === 1) {
          const bi = Math.log2(boxMask);
          const box = BOXES[bi]!;
          const elims: { cell: number; digit: number }[] = [];
          for (const c of box) {
            if (grid.get(c) !== 0) continue;
            if (grid.hasCandidate(c, d)) {
              if (!col.includes(c)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            const lineCells = col.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
            const cn = ci + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: { cells: lineCells, candidates: lineCells.map((c) => ({ cell: c, digit: d })), links: [] },
              explanation: {
                zh: `数字 ${d} 在第 ${cn} 列中仅出现在宫 ${bi + 1}，因此从该宫其他格中排除候选项 ${d}（占位排除）。`,
                en: `Digit ${d} in column ${cn} is confined to box ${bi + 1}, so it is eliminated from other cells in that box (Claiming).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function popcount(x: number): number {
  x = ((x >>> 1) & 0x55555555) + (x & 0x55555555);
  x = ((x >>> 2) & 0x33333333) + (x & 0x33333333);
  x = ((x >>> 4) & 0x0f0f0f0f) + (x & 0x0f0f0f0f);
  x = ((x >>> 8) & 0x00ff00ff) + (x & 0x00ff00ff);
  x = ((x >>> 16) & 0x0000ffff) + (x & 0x0000ffff);
  return x;
}