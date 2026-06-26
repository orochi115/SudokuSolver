/**
 * Sue de Coq (T4) — 苏德蔻
 *
 * A Sue de Coq involves 2-3 cells in the intersection of a row/column and a box
 * (the "stem"). The intersection cells contain N candidates, split into two groups:
 *
 *   - "Line part" L: candidates that also appear in cells in the rest of the LINE
 *     (but NOT in the rest of the BOX outside the intersection)
 *   - "Box part" B: candidates that also appear in cells in the rest of the BOX
 *     (but NOT in the rest of the LINE outside the intersection)
 *
 * For a valid Sue de Coq:
 *   1. |L| ≥ 1, |B| ≥ 1
 *   2. L ∩ B = ∅
 *   3. The intersection cells + line companions (cells in restLine with cands ⊆ L)
 *      form a naked set of size |L| in the line
 *   4. The intersection cells + box companions (cells in restBox with cands ⊆ B)
 *      form a naked set of size |B| in the box
 *   5. All L-digits in the LINE are confined to {intersection + line companions}
 *   6. All B-digits in the BOX are confined to {intersection + box companions}
 *
 * Eliminations:
 *   - L-digits from restLine cells NOT in line companions
 *   - B-digits from restBox cells NOT in box companions
 *
 * Reference implementation (simplified, 2-cell intersection only):
 *   The intersection is I (2 cells). We need:
 *     - Some cells C_L in restLine with cands ⊆ L (line companions)
 *     - Some cells C_B in restBox with cands ⊆ B (box companions)
 *     - |I| + |C_L| = |L| (I + C_L form a naked set for L in the line)
 *     - |I| + |C_B| = |B| (I + C_B form a naked set for B in the box)
 *     - All L-candidates in the line are in I ∪ C_L
 *     - All B-candidates in the box are in I ∪ C_B
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf, CELLS,
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

/**
 * Try Sue de Coq for a specific intersection of line (row or col) and box.
 */
function trySdCIntersection(
  grid: Grid,
  lineCells: readonly number[],
  boxCells: readonly number[],
  lineLabel: string,
  boxLabel: string,
): Step | null {
  // Intersection: cells in both line and box
  const intersectCells = lineCells.filter((c) => boxCells.includes(c));

  // Only consider 2-cell intersections (most common, simplest correct form)
  const emptyIntersect = intersectCells.filter((c) => grid.get(c) === 0);
  if (emptyIntersect.length < 2 || emptyIntersect.length > 3) return null;

  // Cells in rest of line (not in intersection, empty)
  const restLine = lineCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);
  // Cells in rest of box (not in intersection, empty)
  const restBox = boxCells.filter((c) => !intersectCells.includes(c) && grid.get(c) === 0);

  // All candidates in the intersection
  let intersectMask = 0;
  for (const c of emptyIntersect) intersectMask |= grid.candidatesOf(c);
  const intersectDigits = digitsOf(intersectMask);

  // Need at least 4 candidates in the intersection for a non-trivial SdC
  if (intersectDigits.length < 3) return null;

  const N = emptyIntersect.length; // size of intersection (2 or 3)

  // Try all ways to split intersectDigits into line-part L and box-part B
  // Each must be non-empty; together they must cover ALL intersection candidates
  // i.e. L ∪ B = intersectDigits (no digit is in neither or both)
  const numDigits = intersectDigits.length;

  for (let lineMask = 1; lineMask < (1 << numDigits) - 1; lineMask++) {
    const L_mask = intersectDigits.reduce((acc, d, i) => {
      return (lineMask & (1 << i)) ? acc | maskOf(d) : acc;
    }, 0);
    const B_mask = intersectMask & ~L_mask;
    if (B_mask === 0) continue; // B must be non-empty

    const L_digits = digitsOf(L_mask);
    const B_digits = digitsOf(B_mask);

    // L and B must be disjoint (they are, by construction)
    // Together they cover intersectMask (also by construction)

    // Count: |I| + |C_L| should equal |L|
    // So |C_L| = |L| - N (need N cells in intersection to "contribute" L digits)
    // But actually: the naked set is on digits L, and includes intersection + C_L cells.
    // Total cells = N + |C_L|, total distinct digits = |L|.
    // For a naked set: #cells = #digits → N + |C_L| = |L| → |C_L| = |L| - N
    const neededLineCompanions = L_digits.length - N;
    const neededBoxCompanions = B_digits.length - N;

    if (neededLineCompanions < 0 || neededBoxCompanions < 0) continue;

    // Find line companions: cells in restLine with candidates ⊆ L_mask
    const lineCompanionCandidates = restLine.filter((c) => {
      const m = grid.candidatesOf(c);
      return m !== 0 && (m & ~L_mask) === 0;
    });

    if (lineCompanionCandidates.length < neededLineCompanions) continue;

    // Find box companions: cells in restBox with candidates ⊆ B_mask
    const boxCompanionCandidates = restBox.filter((c) => {
      const m = grid.candidatesOf(c);
      return m !== 0 && (m & ~B_mask) === 0;
    });

    if (boxCompanionCandidates.length < neededBoxCompanions) continue;

    // Try all combinations of line and box companions
    for (const lComp of combineK(lineCompanionCandidates, neededLineCompanions)) {
      // Verify: the union of L_mask candidates in intersection + lComp = L_mask
      // (all L digits must be covered by intersection + lComp)
      let coveredL = 0;
      for (const c of emptyIntersect) coveredL |= (grid.candidatesOf(c) & L_mask);
      for (const c of lComp) coveredL |= (grid.candidatesOf(c) & L_mask);
      if (coveredL !== L_mask) continue; // not all L digits are covered

      // CRITICAL: All L-digits in the LINE must be confined to intersection + lComp
      // (otherwise it's not a true Sue de Coq)
      const L_confinedInLine = restLine.every((c) => {
        if (lComp.includes(c)) return true; // lComp cells are allowed
        // This cell must not have any L-digit
        return (grid.candidatesOf(c) & L_mask) === 0;
      });
      if (!L_confinedInLine) continue;

      for (const bComp of combineK(boxCompanionCandidates, neededBoxCompanions)) {
        // Verify: all B digits covered by intersection + bComp
        let coveredB = 0;
        for (const c of emptyIntersect) coveredB |= (grid.candidatesOf(c) & B_mask);
        for (const c of bComp) coveredB |= (grid.candidatesOf(c) & B_mask);
        if (coveredB !== B_mask) continue;

        // CRITICAL: All B-digits in the BOX must be confined to intersection + bComp
        const B_confinedInBox = restBox.every((c) => {
          if (bComp.includes(c)) return true;
          return (grid.candidatesOf(c) & B_mask) === 0;
        });
        if (!B_confinedInBox) continue;

        // Valid Sue de Coq! Compute eliminations.
        const elims: { cell: number; digit: number }[] = [];

        // L-digits from restLine cells NOT in lComp
        for (const c of restLine) {
          if (lComp.includes(c)) continue;
          for (const d of L_digits) {
            if (grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
        }

        // B-digits from restBox cells NOT in bComp
        for (const c of restBox) {
          if (bComp.includes(c)) continue;
          for (const d of B_digits) {
            if (grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
        }

        if (elims.length === 0) continue;

        // Deduplicate
        const seen = new Set<number>();
        const uniqueElims = elims.filter((e) => {
          const key = e.cell * 10 + e.digit;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (uniqueElims.length === 0) continue;

        const involved = [...emptyIntersect, ...lComp, ...bComp];
        const allCands = intersectDigits;

        const isBasic = emptyIntersect.length === 2 && lComp.length === 1 && bComp.length === 1;
        const sId = isBasic ? 'sue-de-coq' : 'sue-de-coq-extended';

        return {
          strategyId: sId,
          placements: [],
          eliminations: uniqueElims,
          highlights: {
            cells: [...new Set([...involved, ...uniqueElims.map((e) => e.cell)])],
            candidates: involved.flatMap((c) =>
              digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
            ),
            links: [],
          },
          explanation: {
            zh: isBasic
              ? `苏德蔻：${emptyIntersect.length} 格（${lineLabel} ∩ ${boxLabel}）候选数 {${allCands.join(',')}} 分为行/列部分 {${L_digits.join(',')}} 和宫部分 {${B_digits.join(',')}}；行/列部分从行/列其余格消去，宫部分从宫其余格消去。`
              : `扩展苏德蔻：${emptyIntersect.length} 格（${lineLabel} ∩ ${boxLabel}）候选数 {${allCands.join(',')}} 分为行/列部分 {${L_digits.join(',')}} 和宫部分 {${B_digits.join(',')}}；行/列部分从行/列其余格消去，宫部分从宫其余格消去。`,
            en: isBasic
              ? `Sue de Coq: ${emptyIntersect.length} cells (${lineLabel} ∩ ${boxLabel}) with candidates {${allCands.join(',')}} split into line-part {${L_digits.join(',')}} and box-part {${B_digits.join(',')}}; eliminate line-part from rest of line, box-part from rest of box.`
              : `Sue de Coq Extended: ${emptyIntersect.length} cells (${lineLabel} ∩ ${boxLabel}) with candidates {${allCands.join(',')}} split into line-part {${L_digits.join(',')}} and box-part {${B_digits.join(',')}}; eliminate line-part from rest of line, box-part from rest of box.`,
          },
        };
      }
    }
  }

  return null;
}

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: '苏德蔻', en: 'Sue de Coq' },
  difficulty: 1010,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    // Try all row × box intersections
    for (let r = 0; r < 9; r++) {
      const rowCells = ROWS[r]!;
      for (let b = 0; b < 9; b++) {
        if (!rowCells.some((c) => BOX_OF[c] === b)) continue;
        const step = trySdCIntersection(
          grid,
          rowCells,
          BOXES[b]!,
          `Row ${r + 1}`,
          `Box B${b + 1}`,
        );
        if (step && step.strategyId === 'sue-de-coq') return step;
      }
    }

    // Try all col × box intersections
    for (let col = 0; col < 9; col++) {
      const colCells = COLS[col]!;
      for (let b = 0; b < 9; b++) {
        if (!colCells.some((c) => BOX_OF[c] === b)) continue;
        const step = trySdCIntersection(
          grid,
          colCells,
          BOXES[b]!,
          `Col ${col + 1}`,
          `Box B${b + 1}`,
        );
        if (step && step.strategyId === 'sue-de-coq') return step;
      }
    }

    return null;
  },
};

export const sueDeCoqExtended: Strategy = {
  id: 'sue-de-coq-extended',
  name: { zh: '扩展苏德蔻', en: 'Sue de Coq Extended' },
  difficulty: 1015,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    // Try all row × box intersections
    for (let r = 0; r < 9; r++) {
      const rowCells = ROWS[r]!;
      for (let b = 0; b < 9; b++) {
        if (!rowCells.some((c) => BOX_OF[c] === b)) continue;
        const step = trySdCIntersection(
          grid,
          rowCells,
          BOXES[b]!,
          `Row ${r + 1}`,
          `Box B${b + 1}`,
        );
        if (step && step.strategyId === 'sue-de-coq-extended') return step;
      }
    }

    // Try all col × box intersections
    for (let col = 0; col < 9; col++) {
      const colCells = COLS[col]!;
      for (let b = 0; b < 9; b++) {
        if (!colCells.some((c) => BOX_OF[c] === b)) continue;
        const step = trySdCIntersection(
          grid,
          colCells,
          BOXES[b]!,
          `Col ${col + 1}`,
          `Box B${b + 1}`,
        );
        if (step && step.strategyId === 'sue-de-coq-extended') return step;
      }
    }

    return null;
  },
};

function getBoxTransversals(b: number): number[][] {
  const cells = BOXES[b]!;
  const r0 = ROW_OF[cells[0]!]!;
  const c0 = COL_OF[cells[0]!]!;

  const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  return permutations.map(([p0, p1, p2]) => {
    return [
      r0 * 9 + (c0 + p0!),
      (r0 + 1) * 9 + (c0 + p1!),
      (r0 + 2) * 9 + (c0 + p2!),
    ];
  });
}

function permutationParity(p: number[]): number {
  // Even permutations of [0, 1, 2] are [0,1,2], [1,2,0], [2,0,1] -> parity +1
  // Odd permutations are [0,2,1], [1,0,2], [2,1,0] -> parity -1
  const even = [
    '0,1,2',
    '1,2,0',
    '2,0,1',
  ];
  return even.includes(p.join(',')) ? 1 : -1;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Iterate over all digit triples
    for (const combo of combineK(digits, 3)) {
      const [d1, d2, d3] = combo as [number, number, number];
      const D_mask = maskOf(d1) | maskOf(d2) | maskOf(d3);

      // Iterate over 4-box rectangles (2 bands, 2 stacks)
      for (let band1 = 0; band1 < 3; band1++) {
        for (let band2 = band1 + 1; band2 < 3; band2++) {
          for (let stack1 = 0; stack1 < 3; stack1++) {
            for (let stack2 = stack1 + 1; stack2 < 3; stack2++) {
              const b11 = band1 * 3 + stack1;
              const b12 = band1 * 3 + stack2;
              const b21 = band2 * 3 + stack1;
              const b22 = band2 * 3 + stack2;
              const boxes = [b11, b12, b21, b22];

              // Candidates for each box
              const boxTransversals: { t: number[]; dirtyCell: number | null; parity: number }[][] = [[], [], [], []];
              for (let i = 0; i < 4; i++) {
                const b = boxes[i]!;
                const transList = getBoxTransversals(b);
                for (const t of transList) {
                  if (t.some(c => grid.get(c) !== 0)) continue;

                  let union_mask = 0;
                  for (const c of t) union_mask |= grid.candidatesOf(c);
                  if ((union_mask & D_mask) !== D_mask) continue;

                  const dirtyCells = t.filter(c => (grid.candidatesOf(c) & ~D_mask) !== 0);
                  if (dirtyCells.length > 1) continue;

                  const cellsWithD = t.filter(c => (grid.candidatesOf(c) & D_mask) !== 0);
                  if (cellsWithD.length !== 3) continue;

                  const cells_r0 = t[0]!;
                  const cells_r1 = t[1]!;
                  const cells_r2 = t[2]!;
                  const cellsInBox = BOXES[b]!;
                  const minicol = COL_OF[cellsInBox[0]!]!;
                  const p = [COL_OF[cells_r0]! - minicol, COL_OF[cells_r1]! - minicol, COL_OF[cells_r2]! - minicol];
                  const parity = permutationParity(p);

                  const dirtyCell = dirtyCells.length === 1 ? dirtyCells[0]! : null;
                  boxTransversals[i]!.push({ t, dirtyCell, parity });
                }
              }

              for (const tr1 of boxTransversals[0]!) {
                for (const tr2 of boxTransversals[1]!) {
                  for (const tr3 of boxTransversals[2]!) {
                    for (const tr4 of boxTransversals[3]!) {
                      const dirtyCount = (tr1.dirtyCell !== null ? 1 : 0) +
                                         (tr2.dirtyCell !== null ? 1 : 0) +
                                         (tr3.dirtyCell !== null ? 1 : 0) +
                                         (tr4.dirtyCell !== null ? 1 : 0);
                      if (dirtyCount !== 1) continue;

                      const product = tr1.parity * tr2.parity * tr3.parity * tr4.parity;
                      if (product !== -1) continue;

                      const patternCells = [...tr1.t, ...tr2.t, ...tr3.t, ...tr4.t];
                      const targetCell = tr1.dirtyCell ?? tr2.dirtyCell ?? tr3.dirtyCell ?? tr4.dirtyCell!;

                      const elims: { cell: number; digit: number }[] = [];
                      const targetMask = grid.candidatesOf(targetCell);
                      const targetDigits = digitsOf(targetMask & D_mask);
                      for (const d of targetDigits) {
                        elims.push({ cell: targetCell, digit: d });
                      }

                      if (elims.length === 0) continue;

                      return {
                        strategyId: 'tridagon',
                        placements: [],
                        eliminations: elims,
                        highlights: {
                          cells: patternCells,
                          candidates: patternCells.flatMap(c => {
                            const mask = grid.candidatesOf(c);
                            const cand_mask = c === targetCell ? mask : mask & D_mask;
                            return digitsOf(cand_mask).map(d => ({ cell: c, digit: d }));
                          }),
                          links: [],
                        },
                        explanation: {
                          zh: `三值死环（雷神之锤）：四个宫 ${boxes.map(b => b + 1).join(',')} 中选择 12 个格子，它们在各宫中均构成行列不共线的对角线，且候选数联合为 {${d1},${d2},${d3}}。为避免无解，带有守护者（额外候选数）的格 R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1} 必须取非 {${d1},${d2},${d3}} 的值；消去该格中的 ${targetDigits.join(',')}。`,
                          en: `Tridagon (Thor's Hammer): 12 pattern cells across boxes ${boxes.map(b => b + 1).join(',')} form transversal segments and jointly carry only digits {${d1},${d2},${d3}}. To avoid dual/no solution, the target cell R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1} carrying extra candidates must take a non-{${d1},${d2},${d3}} value; eliminate ${targetDigits.join(',')} from the target cell.`,
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
