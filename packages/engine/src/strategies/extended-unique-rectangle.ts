/**
 * Extended Unique Rectangle (T4) — 扩展唯一矩形 (2×3 / 三数致死).
 *
 * Six cells in exactly 3 rows × 3 columns × 3 boxes whose union of
 * candidates is exactly 3 digits {a,b,c} form a deadly pattern (multiple
 * solutions by permuting the three digits). Under uniqueness, eliminate
 * the candidate(s) that would complete the deadly pattern.
 *
 * Implemented types (per SudokuWiki):
 *   Type 1: one "odd cell out" carrying extras → eliminate {a,b,c} from it.
 *   Type 2: 4-cell floor + 2-cell roof sharing extra `d` → eliminate d from
 *     cells seeing both roof cells (in shared row/column + box).
 *   Type 4: double Locked Pairs + conjugate digit → eliminate the conjugate
 *     UR digit from the roof cells.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface EURContext {
  cells: number[]; // 6 cells
  D: number[]; // 3 digits
  Dbit: number;
  rowSets: number[];
  colSets: number[];
}

/** Yield all 6-cell, 3-row × 3-col × 3-box deadly pattern candidates. */
function* findEURPatterns(): Generator<{ cells: number[]; rows: number[]; cols: number[]; boxes: number[] }> {
  for (let r1 = 0; r1 < 7; r1++) {
    for (let r2 = r1 + 1; r2 < 8; r2++) {
      for (let r3 = r2 + 1; r3 < 9; r3++) {
        const rows = [r1, r2, r3];
        for (let c1 = 0; c1 < 7; c1++) {
          for (let c2 = c1 + 1; c2 < 8; c2++) {
            for (let c3 = c2 + 1; c3 < 9; c3++) {
              const cols = [c1, c2, c3];
              // The 9 cells in the 3x3 sub-grid. We need to choose 6 cells
              // spanning exactly 3 boxes. The 3x3 sub-grid spans 1 or 3 boxes
              // (since columns can span up to 3 boxes). To get 3 boxes, the
              // 3 columns must come from 3 different stacks.
              const boxSet = new Set<number>();
              for (const r of rows) for (const c of cols) boxSet.add(BOX_OF[r * 9 + c]!);
              if (boxSet.size !== 3) continue;
              const boxes = [...boxSet];
              // For a 2x3 sub-pattern, we pick 6 cells. Use the canonical
              // approach: for each pair of adjacent rows from {rows}, pair
              // them with all three cols, taking one cell from each of the
              // 3 rows of the remaining row? Actually simpler: 2 rows × 3 cols.
              // We try every 2-rows × 3-cols subset.
              for (let ri1 = 0; ri1 < 3; ri1++) {
                for (let ri2 = ri1 + 1; ri2 < 3; ri2++) {
                  const chosenRows = [rows[ri1]!, rows[ri2]!];
                  const cells = chosenRows.flatMap((r) => cols.map((c) => r * 9 + c));
                  yield { cells, rows: chosenRows, cols, boxes };
                }
              }
            }
          }
        }
      }
    }
  }
}

function tryExtendedURType1(grid: Grid): Step | null {
  for (const pat of findEURPatterns()) {
    const { cells } = pat;
    let combined = 0;
    let valid = true;
    for (const c of cells) {
      if (grid.get(c) !== 0) { valid = false; break; }
      combined |= grid.candidatesOf(c);
    }
    if (!valid) continue;
    if (popcount(combined) !== 3) continue;
    const D = digitsOf(combined);
    const Dbit = maskOf(D[0]!) | maskOf(D[1]!) | maskOf(D[2]!);
    // Type 1: exactly one cell carries extras.
    const targets: number[] = [];
    for (const c of cells) {
      const m = grid.candidatesOf(c);
      if ((m & ~Dbit) !== 0) targets.push(c);
    }
    if (targets.length !== 1) continue;
    const t = targets[0]!;
    const tm = grid.candidatesOf(t);
    const elims: { cell: number; digit: number }[] = [];
    for (const d of D) {
      if (tm & maskOf(d)) elims.push({ cell: t, digit: d });
    }
    if (elims.length === 0) continue;
    return {
      strategyId: 'extended-unique-rectangle',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...elims.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `扩展唯一矩形 Type 1：6 格候选数恰为 {${D.join(',')}}；唯一额外候选格 ${cellLabel(t)} 必取非 {${D.join(',')}} 的值，故消去其 ${D.join(',')}。`,
        en: `Extended Unique Rectangle Type 1: 6 cells carry candidates exactly {${D.join(',')}}; the lone extra-candidate cell ${cellLabel(t)} must take a digit outside {${D.join(',')}} → eliminate ${D.join(',')} from it.`,
      },
    };
  }
  return null;
}

function tryExtendedURType2(grid: Grid): Step | null {
  for (const pat of findEURPatterns()) {
    const { cells } = pat;
    let combined = 0;
    for (const c of cells) {
      if (grid.get(c) !== 0) { combined = 0; break; }
      combined |= grid.candidatesOf(c);
    }
    if (popcount(combined) !== 3) continue;
    const D = digitsOf(combined);
    const Dbit = maskOf(D[0]!) | maskOf(D[1]!) | maskOf(D[2]!);
    // Type 2: 4 cells carry ONLY D (floor), 2 cells carry D + 1 extra (roof),
    // both roof share the same single extra digit d.
    const floor: number[] = [];
    const roof: number[] = [];
    for (const c of cells) {
      const m = grid.candidatesOf(c);
      if ((m & ~Dbit) === 0) floor.push(c);
      else roof.push(c);
    }
    if (floor.length !== 4 || roof.length !== 2) continue;
    const extras = roof.map((c) => grid.candidatesOf(c) & ~Dbit);
    if (extras.some((m) => popcount(m) !== 1)) continue;
    if (extras[0] !== extras[1]) continue;
    const d = digitsOf(extras[0]!)[0]!;
    const r1 = roof[0]!;
    const r2 = roof[1]!;
    const sameRow = ROW_OF[r1] === ROW_OF[r2];
    const sameCol = COL_OF[r1] === COL_OF[r2];
    if (!sameRow && !sameCol) continue;
    const dBit = maskOf(d);
    const peersR1 = new Set(PEERS_OF[r1]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const cc of PEERS_OF[r2]!) {
      if (!peersR1.has(cc)) continue;
      if (cc === r1 || cc === r2) continue;
      if (grid.get(cc) !== 0) continue;
      if (grid.hasCandidate(cc, d)) elims.push({ cell: cc, digit: d });
    }
    if (elims.length === 0) continue;
    return {
      strategyId: 'extended-unique-rectangle',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...elims.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `扩展唯一矩形 Type 2：4 格（floor）候选 {${D.join(',')}}，2 格（roof）${roof.map(cellLabel).join('、')} 共享额外候选 ${d}；必有一 roof 为 ${d}，消去可见两 roof 的格的 ${d}。`,
        en: `Extended Unique Rectangle Type 2: 4 floor cells have {${D.join(',')}}, 2 roof cells ${roof.map(cellLabel).join(', ')} share extra ${d}; one roof must be ${d} → eliminate ${d} from cells seeing both roofs.`,
      },
    };
  }
  return null;
}

function tryExtendedURType4(grid: Grid): Step | null {
  for (const pat of findEURPatterns()) {
    const { cells } = pat;
    let combined = 0;
    for (const c of cells) {
      if (grid.get(c) !== 0) { combined = 0; break; }
      combined |= grid.candidatesOf(c);
    }
    if (popcount(combined) !== 3) continue;
    const D = digitsOf(combined);
    const Dbit = maskOf(D[0]!) | maskOf(D[1]!) | maskOf(D[2]!);
    // Type 4: 4-cell floor (extra digits → some digit c locked), roof cells
    // share a conjugate pair on one UR digit (say `b`).
    const floor: number[] = [];
    const roof: number[] = [];
    for (const c of cells) {
      const m = grid.candidatesOf(c);
      if ((m & ~Dbit) === 0) floor.push(c);
      else roof.push(c);
    }
    if (floor.length !== 4 || roof.length !== 2) continue;
    const r1 = roof[0]!;
    const r2 = roof[1]!;
    if (!PEERS_OF[r1]!.includes(r2)) continue; // same house
    for (const [locked, other] of [[D[0], D[1]], [D[1], D[0]], [D[0], D[2]], [D[2], D[0]], [D[1], D[2]], [D[2], D[1]]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      const sharedHouses = HOUSES.filter((h) => h.includes(r1) && h.includes(r2));
      let conjugate = false;
      for (const h of sharedHouses) {
        const inHouse = h.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        if (inHouse.length === 2 && inHouse.every((c) => c === r1 || c === r2)) { conjugate = true; break; }
      }
      if (!conjugate) continue;
      const otherBit = maskOf(other);
      const elims: { cell: number; digit: number }[] = [];
      for (const c of roof) {
        if (grid.hasCandidate(c, other)) elims.push({ cell: c, digit: other });
      }
      if (elims.length === 0) continue;
      return {
        strategyId: 'extended-unique-rectangle',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...cells],
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `扩展唯一矩形 Type 4：UR 对 {${D.join(',')}} 中，${locked} 在 roof 共享房屋内只出现于 roof（强链），roof 必为 ${locked}；消去 roof 的 ${other}。`,
          en: `Extended Unique Rectangle Type 4: among UR digits {${D.join(',')}}, ${locked} is conjugate-paired in the roof's shared house → roof cells must be ${locked}; eliminate ${other} from roof.`,
        },
      };
    }
  }
  return null;
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryExtendedURType1(grid) ?? tryExtendedURType2(grid) ?? tryExtendedURType4(grid);
  },
};