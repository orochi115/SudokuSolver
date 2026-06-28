/**
 * Tridagon (T4, exotic) — 三值死环 / 反三值死环（雷神之锤）.
 *
 * Twelve cells in four rectangle-formations of boxes (two bands × two stacks)
 * holding a fixed digit set D = {d1, d2, d3}, with three cells per box each
 * lying in three different rows and three different columns (a transversal).
 * The all-D filling is impossible (parity / Berthier's case analysis), so
 * at least one "guardian" — an extra candidate outside D in a pattern cell —
 * must be true. The standard directly-usable Type-1 elimination fires when
 * exactly one pattern cell carries guardians: eliminate d1, d2, d3 from that
 * target cell.
 *
 * Two cases handled here:
 *   (a) Type-1: exactly one pattern cell carries non-D candidates → eliminate
 *       all of D from that target cell.
 *   (b) Same-digit guardians: multiple guardians carry the same extra digit
 *       g, and some cell z (outside the pattern) peers every g-guardian →
 *       eliminate g from z.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Yield the four (b11,b12,b21,b22) box-rectangles: two bands × two stacks.
 *  Each rectangle is represented by 4 box indices that form a 2x2 layout. */
function* boxRectangles(): Generator<[number, number, number, number]> {
  for (let b1 = 0; b1 < 3; b1++) {
    for (let b2 = b1 + 1; b2 < 3; b2++) {
      for (let s1 = 0; s1 < 3; s1++) {
        for (let s2 = s1 + 1; s2 < 3; s2++) {
          const b11 = b1 * 3 + s1;
          const b12 = b1 * 3 + s2;
          const b21 = b2 * 3 + s1;
          const b22 = b2 * 3 + s2;
          yield [b11, b12, b21, b22];
        }
      }
    }
  }
}

/** All 6 transversals of a 3x3 box: choose 3 cells, one per row, one per col.
 *  Returns array of 3-cell sets (each is one transversal). */
function transversalsOfBox(box: number): number[][] {
  const cells = BOXES[box]!;
  const result: number[][] = [];
  // Pick cell from row 0 of the box (3 cells)
  // For each such choice, the other two cells are determined (the unique
  // choice per row,col that hits each column exactly once).
  for (let i = 0; i < 3; i++) {
    const c0 = cells[i]!;
    const r0 = ROW_OF[c0]!;
    const col0 = COL_OF[c0]!;
    // Pick from row 1 of box (cells 3,4,5), a column that is not col0.
    for (let j = 3; j < 6; j++) {
      const c1 = cells[j]!;
      if (COL_OF[c1] === col0) continue;
      const r1 = ROW_OF[c1]!;
      const col1 = COL_OF[c1]!;
      // The third cell is at row 2 of box (cells 6,7,8) with column != col0, col1.
      const forbidden = new Set([col0, col1]);
      for (let k = 6; k < 9; k++) {
        const c2 = cells[k]!;
        if (forbidden.has(COL_OF[c2]!)) continue;
        const r2 = ROW_OF[c2]!;
        const col2 = COL_OF[c2]!;
        // All rows must be distinct
        if (r0 === r1 || r0 === r2 || r1 === r2) continue;
        // Distinct cols already enforced
        void col2;
        result.push([c0, c1, c2]);
      }
      void r1;
    }
    void r0;
  }
  // Deduplicate (we may have generated the same transversal twice by picking
  // the same cells in different orders): sort each set, dedupe via string key.
  const seen = new Set<string>();
  const unique: number[][] = [];
  for (const t of result) {
    const sorted = [...t].sort((a, b) => a - b);
    const key = sorted.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(sorted);
  }
  return unique;
}

/** Try to find a Type-1 tridagon (single target cell with extras) or
 *  same-digit-guardian tridagon. */
function tryTridagon(grid: Grid): Step | null {
  for (const boxes of boxRectangles()) {
    const trans: number[][][] = boxes.map(transversalsOfBox);
    const boxTrans = boxes.map((b, i) => trans[i]!);
    if (boxTrans.some((t) => t.length !== 6)) continue; // sanity
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 6; k++) {
          for (let l = 0; l < 6; l++) {
            const cells = [
              ...boxTrans[0]![i]!,
              ...boxTrans[1]![j]!,
              ...boxTrans[2]![k]!,
              ...boxTrans[3]![l]!,
            ];
            // Verify distinct rows / cols of cells within each box (transversals
            // already ensure that). Compute the union of candidates across the
            // 12 cells and check it's exactly 3 digits D = {d1, d2, d3}.
            let combinedMask = 0;
            for (const c of cells) {
              if (grid.get(c) !== 0) continue; // solved cell breaks the pattern
              combinedMask |= grid.candidatesOf(c);
            }
            if (popcount(combinedMask) !== 3) continue;
            const D = digitsOf(combinedMask);
            const Dbits = maskOf(D[0]!) | maskOf(D[1]!) | maskOf(D[2]!);

            // Classify each pattern cell:
            //   - 123-cell: candidates ⊆ D (no extra)
            //   - guardian cell: has at least one candidate outside D
            const targets: number[] = [];
            const guardiansByDigit = new Map<number, number[]>();
            let okShape = true;
            for (const c of cells) {
              const m = grid.candidatesOf(c);
              const extra = m & ~Dbits;
              if (extra === 0) continue; // 123-cell
              targets.push(c);
              // Each non-D candidate is a guardian
              for (const g of digitsOf(extra)) {
                if (!guardiansByDigit.has(g)) guardiansByDigit.set(g, []);
                guardiansByDigit.get(g)!.push(c);
              }
            }
            if (targets.length === 0) continue; // no guardians, no deduction
            // We require at least 11 of the 12 cells to be 123-cells (the
            // 12th may be a guardian). For more than one target cell, only
            // the same-digit-guardian case applies.
            if (targets.length === 1) {
              // Type-1: eliminate D from the target cell.
              const target = targets[0]!;
              const targetMask = grid.candidatesOf(target);
              const Dintersect = targetMask & Dbits;
              if (popcount(Dintersect) === 0) continue;
              const elims = digitsOf(Dintersect).map((d) => ({ cell: target, digit: d }));
              const allCells = [...cells];
              return {
                strategyId: 'tridagon',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                  candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  links: [],
                },
                explanation: {
                  zh: `三值死环（Tridagon / 反三值死环 / 雷神之锤）：在 ${boxes.map((b) => `宫${b + 1}`).join('、')} 中各取 3 格（共 12 格），候选数恰为 {${D.join(',')}}；唯一非纯候选格 ${cellLabel(target)} 必为非 {${D.join(',')}}，故消去其 ${D.join(',')}。`,
                  en: `Tridagon (anti-Tridagon / Thor's Hammer): in boxes ${boxes.map((b) => `b${b + 1}`).join(', ')} take 3 cells each (12 in total) restricted to digit set {${D.join(',')}}; the single target cell ${cellLabel(target)} must take a digit outside {${D.join(',')}}; eliminate ${D.join(',')} from it.`,
                },
              };
            }
            // Same-digit-guardian: multiple target cells, all sharing one extra digit g.
            for (const [g, gs] of guardiansByDigit) {
              if (gs.length < 2) continue;
              // At least one cell z outside the pattern that peers every g-guardian.
              const elims: { cell: number; digit: number }[] = [];
              const pattern = new Set(cells);
              const gBit = maskOf(g);
              for (let z = 0; z < CELLS; z++) {
                if (pattern.has(z)) continue;
                if (grid.get(z) !== 0) continue;
                if ((grid.candidatesOf(z) & gBit) === 0) continue;
                const peers = new Set(((): number[] => {
                  // Use PEERS_OF for direct sight relation
                  const arr: number[] = [];
                  for (const p of [z]) void p;
                  // Inline peers:
                  const set = new Set<number>();
                  for (const r of [ROW_OF[z]!]) for (const c of ROWS[r]!) if (c !== z) set.add(c);
                  for (const c of [COL_OF[z]!]) for (const cc of COLS[c]!) if (cc !== z) set.add(cc);
                  for (const b of [BOX_OF[z]!]) for (const cc of BOXES[b]!) if (cc !== z) set.add(cc);
                  return [...set];
                })());
                if (gs.every((gc) => peers.has(gc))) elims.push({ cell: z, digit: g });
              }
              if (elims.length === 0) continue;
              okShape = true;
              const allCells = [...cells];
              return {
                strategyId: 'tridagon',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                  candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  links: [],
                },
                explanation: {
                  zh: `三值死环（同数守护者）：四宫（${boxes.map((b) => `宫${b + 1}`).join('、')}）12 格限制为 {${D.join(',')}}；其中数字 ${g} 的守护者 ${gs.map(cellLabel).join('、')} 至少一个为真，故可见所有守护者的格消去 ${g}。`,
                  en: `Tridagon (same-digit guardians): boxes ${boxes.map((b) => `b${b + 1}`).join(', ')} restrict 12 cells to {${D.join(',')}}; the ${g}-guardians ${gs.map(cellLabel).join(', ')} all hold ${g}, so at least one is true → eliminate ${g} from cells seeing all of them.`,
                },
              };
            }
            void okShape;
          }
        }
      }
    }
  }
  return null;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环 / 雷神之锤', en: 'Tridagon / Anti-Tridagon (Thor\'s Hammer)' },
  difficulty: 1100,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryTridagon(grid);
  },
};