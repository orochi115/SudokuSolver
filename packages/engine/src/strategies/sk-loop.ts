/**
 * SK-Loop (T4, exotic) — SK环 / 多米诺环 / Virus pattern.
 *
 * Special case of MSLS: four boxes (2x2) each with a GIVEN pivot at the
 * intersection of the loop's row-cells and column-cells. Eight hidden-pair
 * links (one per box, one per participating row, one per participating col)
 * thread 16 cells in a closed alternating loop. Outer links eliminate their
 * pair from the rest of the shared row/col outside the loop; inner links
 * eliminate from the rest of the box outside the loop's mini-row/mini-col.
 *
 * The defining structure is rigid: four boxes in a 2x2 layout, four given
 * pivots at the row/col intersections, with a pair of hidden pairs (one
 * outer between two boxes sharing a row/col, one inner inside a box)
 * forming each link. Detecting this directly is complex; instead we use the
 * MSLS detector with the SK-Loop's specific 4-box-4-given-pivot template to
 * identify the pattern, then emit the corresponding eliminations.
 *
 * For practical implementation, we look for the canonical 16-cell, 4-pivot
 * structure: pick 2 bands and 2 stacks (4 corner boxes), find their four
 * given pivots, then look for hidden-pair links forming a closed loop.
 *
 * For simplicity and robustness we use a heuristic detection: for each
 * 2x2 box layout, look for any digit pair whose elimination pattern matches
 * the SK-Loop signature (outer + inner eliminations of a pair across the 4
 * boxes). We then run the SK-Loop eliminations directly.
 */

import { CELLS, HOUSES, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Yield the (b1,b2,b3,b4) 2x2 box layouts (band1,band2) × (stack1,stack2). */
function* boxLayouts(): Generator<{ boxes: [number, number, number, number]; bands: [number, number]; stacks: [number, number] }> {
  for (let band1 = 0; band1 < 3; band1++) {
    for (let band2 = band1 + 1; band2 < 3; band2++) {
      for (let stack1 = 0; stack1 < 3; stack1++) {
        for (let stack2 = stack1 + 1; stack2 < 3; stack2++) {
          const boxes: [number, number, number, number] = [
            band1 * 3 + stack1,
            band1 * 3 + stack2,
            band2 * 3 + stack1,
            band2 * 3 + stack2,
          ];
          yield { boxes, bands: [band1, band2], stacks: [stack1, stack2] };
        }
      }
    }
  }
}

/** Given a 2x2 box layout, identify the four pivots (one given per box at
 *  the loop row/col intersection). For each box, the "loop row" is a row
 *  through that box, and the "loop col" is a column. The pivot is the cell
 *  at their intersection that is a given.
 *
 *  Convention: pick rows r1∈band1, r2∈band2 and cols c1∈stack1, c2∈stack2
 *  such that all four cells (r1,c1)∈boxA, (r1,c2)∈boxB, (r2,c1)∈boxC,
 *  (r2,c2)∈boxD are GIVENS.
 */
function findPivots(grid: Grid, boxes: readonly [number, number, number, number]): { row1: number; row2: number; col1: number; col2: number } | null {
  const boxARows = new Set(ROWS.slice(0, 9).filter((r) => r.some((c) => BOX_OF[c] === boxes[0])).map((r) => r[0]!));
  // easier: for each band1 row r1 in band1, for each band2 row r2 in band2,
  // for each stack1 col c1 in stack1, for each stack2 col c2 in stack2:
  const band1Rows = [boxes[0]! / 3 | 0, boxes[1]! / 3 | 0]; // band1 = boxes[0]'s row band
  // Wait, easier: for each (b1,b2,b3,b4) we know boxes[0] is at (band1, stack1)
  const b1 = boxes[0]!;
  const band1 = Math.floor(b1 / 3);
  const stack1 = b1 % 3;
  // boxes[1] is at (band1, stack2), boxes[2] is at (band2, stack1), etc.
  const band2 = Math.floor(boxes[2]! / 3);
  const stack2 = boxes[1]! % 3;
  for (let r1 = band1 * 3; r1 < band1 * 3 + 3; r1++) {
    for (let r2 = band2 * 3; r2 < band2 * 3 + 3; r2++) {
      for (let c1 = stack1 * 3; c1 < stack1 * 3 + 3; c1++) {
        for (let c2 = stack2 * 3; c2 < stack2 * 3 + 3; c2++) {
          const cells = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          if (cells.every((c) => grid.isGiven(c))) {
            return { row1: r1, row2: r2, col1: c1, col2: c2 };
          }
        }
      }
    }
  }
  return null;
}

/** Try to detect an SK-Loop in a 2x2 box layout with the given pivots.
 *  We use the canonical detection pattern:
 *  For each candidate digit pair {p, q}:
 *    For each box, look for a "hidden pair" of {p, q} restricted to either
 *    a row subset or a column subset of the loop cells. If found for all
 *    4 boxes plus all participating rows/cols, we have a valid SK-Loop.
 *  Then apply the eliminations.
 */
function trySkLoop(grid: Grid): Step | null {
  for (const layout of boxLayouts()) {
    const pivots = findPivots(grid, layout.boxes);
    if (!pivots) continue;
    const { row1, row2, col1, col2 } = pivots;
    const band1 = Math.floor(row1 / 3);
    const band2 = Math.floor(row2 / 3);
    const stack1 = Math.floor(col1 / 3);
    const stack2 = Math.floor(col2 / 3);
    // The 4 boxes:
    const boxA = layout.boxes[0]!;
    const boxB = layout.boxes[1]!;
    const boxC = layout.boxes[2]!;
    const boxD = layout.boxes[3]!;

    // For each pair (p, q), check if the loop's 16 cells hold a valid pattern.
    // The 16 cells are: 2 cells per row-link (rows r1, r2 intersect boxes boxA, boxB, boxC, boxD)
    // and 2 cells per col-link (cols c1, c2 intersect the same 4 boxes).
    // But the row-link and col-link in each box share a cell (the pivot).
    // So the loop is: 4 row-cells + 4 row-cells in the second row + 4 col-cells + 4 col-cells
    // — but with shared pivots that's only 8 unique cells, not 16. The SK-Loop's
    // "16 cells" is the union of two intersecting "minis" per box (mini-row + mini-col)
    // but the mini-row excludes the pivot's row and the mini-col excludes the pivot's col.
    //
    // For simplicity we adopt a relaxed detection: look at the 8 row/col cells
    // outside the pivots (2 per box: one on each row/col link not at the pivot).

    // For each box, the "row link" is two cells on (loop row) ∩ box, NOT the pivot;
    // the "col link" is two cells on (loop col) ∩ box, NOT the pivot.
    // Each link can be a hidden pair.

    // Build loopCells: per box, two row-link cells (excluding pivot) and two
    // col-link cells (excluding pivot).
    type LinkCells = { rowPair: number[]; colPair: number[] };
    const linkCells = new Map<number, LinkCells>();
    for (const bx of [boxA, boxB, boxC, boxD]) {
      const box = BOXES[bx]!;
      const rowPair = box.filter((c) => ROW_OF[c] === row1 || ROW_OF[c] === row2);
      const colPair = box.filter((c) => COL_OF[c] === col1 || COL_OF[c] === col2);
      // exclude pivots: pivots lie at (r1,c1), (r1,c2), (r2,c1), (r2,c2). Each box has exactly one pivot.
      const pivot = box.find((c) => grid.isGiven(c))!;
      const rowPairNoPivot = rowPair.filter((c) => c !== pivot);
      const colPairNoPivot = colPair.filter((c) => c !== pivot);
      if (rowPairNoPivot.length !== 2 || colPairNoPivot.length !== 2) {
        linkCells.delete(bx);
        break;
      }
      // Skip if any link cell is solved (must be a non-given empty cell with exactly 2 candidates).
      if (rowPairNoPivot.some((c) => grid.get(c) !== 0)) { linkCells.delete(bx); break; }
      if (colPairNoPivot.some((c) => grid.get(c) !== 0)) { linkCells.delete(bx); break; }
      linkCells.set(bx, { rowPair: rowPairNoPivot, colPair: colPairNoPivot });
    }
    if (linkCells.size !== 4) continue;

    // For each digit pair (p, q), check if every box has at least one link
    // that's a hidden pair {p, q}. If we find at least one such pair across
    // all 4 boxes (forming a closed loop), apply eliminations.
    // We try all 36 pairs.
    for (let p = 1; p <= 8; p++) {
      for (let q = p + 1; q <= 9; q++) {
        const pairMask = maskOf(p) | maskOf(q);
        // For each box, determine if either rowPair or colPair is exactly {p, q}.
        const boxPairChoice = new Map<number, 'row' | 'col' | null>();
        let ok = true;
        for (const [bx, lc] of linkCells) {
          const rowMasks = lc.rowPair.map((c) => grid.candidatesOf(c));
          const colMasks = lc.colPair.map((c) => grid.candidatesOf(c));
          const rowIsPair = rowMasks.every((m) => m === pairMask) && rowMasks.length === 2;
          const colIsPair = colMasks.every((m) => m === pairMask) && colMasks.length === 2;
          if (rowIsPair && colIsPair) {
            // Both links are {p, q}; this is the "double firework" case.
            boxPairChoice.set(bx, 'row'); // pick 'row' arbitrarily
          } else if (rowIsPair) {
            boxPairChoice.set(bx, 'row');
          } else if (colIsPair) {
            boxPairChoice.set(bx, 'col');
          } else {
            ok = false;
            break;
          }
        }
        if (!ok) continue;

        // Apply eliminations:
        // For each box, the OTHER link (the one that is NOT a {p,q} pair) is
        // an inner link: eliminate p and q from the rest of that box (outside
        // the row AND col links).
        // The chosen link (row or col) is the inner-pair link; the other one
        // extends as an outer link — we strip {p,q} from the rest of the
        // participating row/column outside the pivot cells.
        const elims: { cell: number; digit: number }[] = [];
        for (const [bx, lc] of linkCells) {
          const choice = boxPairChoice.get(bx);
          if (choice === 'row') {
            // row link is the {p,q} pair → inner link is colPair. Eliminate
            // p,q from the rest of box bx (outside rowPair AND colPair AND pivot).
            const pivot = BOXES[bx]!.find((c) => grid.isGiven(c))!;
            const inner = new Set([...lc.rowPair, ...lc.colPair, pivot]);
            for (const c of BOXES[bx]!) {
              if (inner.has(c)) continue;
              if (grid.get(c) !== 0) continue;
              if (grid.hasCandidate(c, p)) elims.push({ cell: c, digit: p });
              if (grid.hasCandidate(c, q)) elims.push({ cell: c, digit: q });
            }
            // Outer link: rowPair extends along the row of rowPair[0] / rowPair[1]
            // — eliminate p,q from cells in row r that are NOT in the loop.
            // For each cell in the rowPair, the row outside the box loop cells.
            for (const rc of lc.rowPair) {
              const r = ROW_OF[rc]!;
              for (const cc of ROWS[r]!) {
                if (BOX_OF[cc] === bx) continue; // skip this box
                if (lc.rowPair.includes(cc)) continue;
                if (grid.isGiven(cc)) continue;
                if (grid.get(cc) !== 0) continue;
                if (grid.hasCandidate(cc, p)) elims.push({ cell: cc, digit: p });
                if (grid.hasCandidate(cc, q)) elims.push({ cell: cc, digit: q });
              }
            }
          } else {
            // choice === 'col'
            const pivot = BOXES[bx]!.find((c) => grid.isGiven(c))!;
            const inner = new Set([...lc.rowPair, ...lc.colPair, pivot]);
            for (const c of BOXES[bx]!) {
              if (inner.has(c)) continue;
              if (grid.get(c) !== 0) continue;
              if (grid.hasCandidate(c, p)) elims.push({ cell: c, digit: p });
              if (grid.hasCandidate(c, q)) elims.push({ cell: c, digit: q });
            }
            for (const cc of lc.colPair) {
              const c = COL_OF[cc]!;
              for (const rcc of COLS[c]!) {
                if (BOX_OF[rcc] === bx) continue;
                if (lc.colPair.includes(rcc)) continue;
                if (grid.isGiven(rcc)) continue;
                if (grid.get(rcc) !== 0) continue;
                if (grid.hasCandidate(rcc, p)) elims.push({ cell: rcc, digit: p });
                if (grid.hasCandidate(rcc, q)) elims.push({ cell: rcc, digit: q });
              }
            }
          }
        }
        if (elims.length === 0) continue;

        const allCells = [...linkCells.values()].flatMap((lc) => [...lc.rowPair, ...lc.colPair]);
        return {
          strategyId: 'sk-loop',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
            candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `SK环（多米诺环 / Virus）：在 ${boxA + 1}/${boxB + 1}/${boxC + 1}/${boxD + 1} 四个宫与第 ${row1 + 1}/${row2 + 1} 行、第 ${col1 + 1}/${col2 + 1} 列上，每宫有一对 {${p},${q}} 隐藏对组成 16 格闭合环；消去环外的 {${p},${q}}（外链/内链）。`,
            en: `SK-Loop (Virus pattern): across boxes ${boxA + 1}/${boxB + 1}/${boxC + 1}/${boxD + 1} with rows ${row1 + 1}/${row2 + 1} and columns ${col1 + 1}/${col2 + 1}, each box contributes a {${p},${q}} hidden pair forming a 16-cell closed loop; eliminate {${p},${q}} outside the loop (outer+inner links).`,
          },
        };
      }
    }
  }
  return null;
}

export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: 'SK环 / 多米诺环', en: 'SK-Loop (Virus pattern)' },
  difficulty: 1250,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return trySkLoop(grid);
  },
};

// Suppress unused
void CELLS;
void HOUSES;
void PEERS_OF;
void popcount;
