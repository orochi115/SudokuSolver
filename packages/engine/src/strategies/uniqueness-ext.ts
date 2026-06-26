/**
 * Uniqueness extensions (P1):
 *   - Extended Unique Rectangle (2×3 / 6-cell deadly pattern)
 *   - Unique Loop
 *   - BUG-Lite
 *   - BUG+n
 */

import { CELLS, ROWS, COLS, BOXES, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* combinations<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) { yield []; return; }
  if (arr.length < size) return;
  if (size === 1) { for (const x of arr) yield [x]; return; }
  const [first, ...rest] = arr;
  for (const tail of combinations(rest, size - 1)) yield [first!, ...tail];
  for (const tail of combinations(rest, size)) yield tail;
}

/** Extended Unique Rectangle: 2 rows × 3 columns spanning 2 boxes, 6 cells, 2 UR digits plus extras. */
export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (const cols of combinations([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)) {
          const cells = cols.flatMap((c) => [r1 * 9 + c, r2 * 9 + c]);
          const boxes = new Set(cells.map((c) => BOX_OF[c]!));
          if (boxes.size !== 2) continue;

          const masks = cells.map((c) => grid.candidatesOf(c));
          const intersect = masks.reduce((m, x) => m & x, 0x1ff);
          if (popcount(intersect) !== 2) continue;

          const urDigits = digitsOf(intersect);
          const nonUR = cells.filter((c) => (grid.candidatesOf(c) & ~intersect) !== 0);
          if (nonUR.length !== 1) continue;

          // The sole guardian cell: must contain exactly the two UR digits plus one extra.
          const c = nonUR[0]!;
          const extra = grid.candidatesOf(c) & ~intersect;
          if (popcount(extra) !== 1) continue;
          const g = digitsOf(extra)[0]!;
          // Place g in c to avoid the 6-cell deadly swap.
          return {
            strategyId: this.id,
            placements: [{ cell: c, digit: g }],
            eliminations: [],
            highlights: {
              cells,
              candidates: cells.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((d) => ({ cell: cc, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `扩展唯一矩形：${cells.map(cellLabel).join(',')} 构成 2×3 致死模式 {${urDigits.join(',')}}；唯一守护格 ${cellLabel(c)} 必须填入 ${g}。`,
              en: `Extended Unique Rectangle: cells ${cells.map(cellLabel).join(',')} form a 2×3 deadly pattern {${urDigits.join(',')}}; the sole guardian ${cellLabel(c)} must be ${g}.`,
            },
          };
        }
      }
    }
    return null;
  },
};

/** Unique Loop: a loop of bivalue cells with one trivalue guardian. */
export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const biv = new Set<number>();
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) biv.add(c);
    }

    for (const start of [...biv].sort((a, b) => a - b)) {
      const [d1, d2] = digitsOf(grid.candidatesOf(start)) as [number, number];
      const seen = new Set<number>([start]);
      const path: number[] = [start];

      function dfs(current: number, expect: number): Step | null {
        if (path.length >= 4 && current === start) {
          // Found a loop. Look for a trivalue cell that sees two loop cells.
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 3) {
              const peers = new Set(PEERS_OF[c]!);
              const seenLoop = path.filter((x) => peers.has(x));
              if (seenLoop.length >= 2) {
                const loopDigits = new Set([d1, d2]);
                const extra = digitsOf(grid.candidatesOf(c)).filter((d) => !loopDigits.has(d));
                if (extra.length === 1) {
                  return {
                    strategyId: 'unique-loop',
                    placements: [{ cell: c, digit: extra[0]! }],
                    eliminations: [],
                    highlights: {
                      cells: [...path, c],
                      candidates: [
                        ...path.flatMap((x) => [{ cell: x, digit: d1 }, { cell: x, digit: d2 }]),
                        { cell: c, digit: extra[0]! },
                      ],
                      links: path.map((x, i) => ({
                        from: { cell: x, digit: d1 },
                        to: { cell: path[(i + 1) % path.length]!, digit: d1 },
                        type: 'strong' as const,
                      })),
                    },
                    explanation: {
                      zh: `唯一环：双值环 ${path.map(cellLabel).join('→')} 加上守护格 ${cellLabel(c)}，必须填入 ${extra[0]} 以避免双解。`,
                      en: `Unique Loop: bivalue loop ${path.map(cellLabel).join('→')} plus guardian ${cellLabel(c)} must be ${extra[0]} to avoid dual solution.`,
                    },
                  };
                }
              }
            }
          }
          return null;
        }
        if (path.length > 12) return null;
        const nextDigit = expect === d1 ? d2 : d1;
        for (const nb of PEERS_OF[current]!) {
          if (!biv.has(nb)) continue;
          const nbDigits = digitsOf(grid.candidatesOf(nb));
          if (nbDigits.length !== 2) continue;
          if (!nbDigits.includes(nextDigit)) continue;
          if (path.includes(nb)) continue;
          seen.add(nb);
          path.push(nb);
          const res = dfs(nb, nextDigit);
          path.pop();
          seen.delete(nb);
          if (res) return res;
        }
        return null;
      }

      const res = dfs(start, d2);
      if (res) return res;
    }
    return null;
  },
};

/** BUG-Lite: all but a small pattern of cells are bivalue; place/remove to restore uniqueness. */
export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 986,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) emptyCells.push(c);
    const nonBiv = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
    if (nonBiv.length < 2 || nonBiv.length > 4) return null;

    // BUG-Lite: all non-bivalue cells share a common house and one candidate.
    const common = new Set(PEERS_OF[nonBiv[0]!]!);
    for (let i = 1; i < nonBiv.length; i++) {
      const next = new Set(PEERS_OF[nonBiv[i]!]!);
      for (const c of common) if (!next.has(c) && c !== nonBiv[i]!) common.delete(c);
    }
    for (const c of nonBiv) common.add(c);

    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const bit = maskOf(d);
      const holders = nonBiv.filter((c) => grid.candidatesOf(c) & bit);
      if (holders.length !== 1) continue;
      const c = holders[0]!;
      // BUG digit: appears an odd number of times in every house of the holder.
      let oddEverywhere = true;
      for (const hi of [ROW_OF[c]!, 9 + COL_OF[c]!, 18 + BOX_OF[c]!]) {
        const count = HOUSES[hi]!.filter((x) => grid.get(x) === 0 && (grid.candidatesOf(x) & bit)).length;
        if (count % 2 === 0) { oddEverywhere = false; break; }
      }
      if (oddEverywhere) {
        return {
          strategyId: this.id,
          placements: [{ cell: c, digit: d }],
          eliminations: [],
          highlights: { cells: nonBiv, candidates: nonBiv.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((dd) => ({ cell: cc, digit: dd }))), links: [] },
          explanation: {
            zh: `BUG-Lite：非双值格 ${nonBiv.map(cellLabel).join(',')} 中，${d} 在其所在宫/行/列均出现奇数次；必须填入 ${cellLabel(c)}。`,
            en: `BUG-Lite: among non-bivalue cells ${nonBiv.map(cellLabel).join(',')}, digit ${d} appears an odd number of times in every house; ${cellLabel(c)} must be ${d}.`,
          },
        };
      }
    }
    return null;
  },
};

/** BUG+n: generalisation of BUG+1 allowing multiple non-bivalue cells. */
export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+n', en: 'BUG+n' },
  difficulty: 987,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) if (grid.get(c) === 0) emptyCells.push(c);
    const nonBiv = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
    if (nonBiv.length < 2) return null;

    // Sound check: tentatively place each candidate of each non-bivalue cell;
    // if the remaining empty cells form a valid BUG pattern (all bivalue,
    // every digit appears an even number of times in every house), that digit
    // is forced — otherwise the puzzle would have multiple solutions.
    for (const c of nonBiv.sort((a, b) => a - b)) {
      for (const d of digitsOf(grid.candidatesOf(c)).sort((a, b) => a - b)) {
        const probe = grid.clone();
        probe.place(c, d);
        probe.recomputeCandidates();
        if (probe.hasContradiction()) continue;
        if (isBUGPattern(probe)) {
          return {
            strategyId: this.id,
            placements: [{ cell: c, digit: d }],
            eliminations: [],
            highlights: { cells: nonBiv, candidates: nonBiv.flatMap((cc) => digitsOf(grid.candidatesOf(cc)).map((dd) => ({ cell: cc, digit: dd }))), links: [] },
            explanation: {
              zh: `BUG+n：非双值格 ${nonBiv.map(cellLabel).join(',')} 中，唯有 ${cellLabel(c)} 填入 ${d} 后剩余格构成双值均匀模式，故 ${d} 为真解。`,
              en: `BUG+n: among non-bivalue cells ${nonBiv.map(cellLabel).join(',')}, only placing ${d} in ${cellLabel(c)} leaves a uniform bivalue pattern, so ${d} is the solution.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function isBUGPattern(grid: Grid): boolean {
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) !== 2) return false;
  }
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)).length;
      if (count % 2 !== 0) return false;
    }
  }
  return true;
}
