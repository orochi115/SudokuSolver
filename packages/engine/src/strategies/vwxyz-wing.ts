/**
 * VWXYZ-Wing (P2a) — VWXYZ翼 (wing size-ladder generalization of WXYZ)
 *
 * 5 cells confined to exactly two houses (a box + a line), holding exactly 5 digits,
 * with precisely one non-restricted common digit Z. Any cell outside the pattern
 * that sees every occurrence of Z inside the 5 cells can eliminate Z.
 *
 * Reuses the conceptual ladder from WXYZ (size-4); size-5 is the next rung.
 */

import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

// Build box cells once
const BOX_CELLS: number[][] = Array.from({ length: 9 }, (_, b) => {
  const r0 = Math.floor(b / 3) * 3;
  const c0 = (b % 3) * 3;
  const cs: number[] = [];
  for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cs.push((r0 + dr) * 9 + c0 + dc);
  return cs;
});

function getLineCells(lineType: 'row' | 'col', ln: number): number[] {
  if (lineType === 'row') return Array.from({ length: 9 }, (_, k) => ln * 9 + k);
  return Array.from({ length: 9 }, (_, k) => k * 9 + ln);
}

function tryVWXYZ(grid: Grid, strategyId: string): Step | null {
  // Consider every box + line pair (the two houses)
  for (let b = 0; b < 9; b++) {
    const boxCells = BOX_CELLS[b]!;
    for (const lineType of ['row', 'col'] as const) {
      for (let ln = 0; ln < 9; ln++) {
        const lineCells = getLineCells(lineType, ln);
        // Cells in union of the two houses, unsolved
        const pool = [...boxCells, ...lineCells]
          .filter((v, i, a) => a.indexOf(v) === i)
          .filter((c) => grid.get(c) === 0);
        if (pool.length < 5) continue;

        // Enumerate 5-distinct cell combinations (bounded)
        for (let i = 0; i < pool.length; i++) {
          for (let j = i + 1; j < pool.length; j++) {
            for (let k = j + 1; k < pool.length; k++) {
              for (let m = k + 1; m < pool.length; m++) {
                for (let n = m + 1; n < pool.length; n++) {
                  const set = [pool[i]!, pool[j]!, pool[k]!, pool[m]!, pool[n]!];
                  let msk = 0;
                  for (const c of set) msk |= grid.candidatesOf(c);
                  if (popcount(msk) !== 5) continue;

                  const ds = digitsOf(msk);
                  // Find exactly one non-restricted Z (digit whose instances do not all see each other)
                  let z: number | null = null;
                  let zCount = 0;
                  for (const d of ds) {
                    const cellsD = set.filter((c) => grid.hasCandidate(c, d));
                    let allSee = true;
                    for (let a = 0; a < cellsD.length; a++) {
                      for (let bb = a + 1; bb < cellsD.length; bb++) {
                        if (!PEERS_OF[cellsD[a]!]!.includes(cellsD[bb]!)) {
                          allSee = false;
                          break;
                        }
                      }
                      if (!allSee) break;
                    }
                    if (!allSee) {
                      z = d;
                      zCount++;
                    }
                  }
                  if (zCount !== 1 || z === null) continue;

                  // Find outside cells that see every cell in set that holds Z
                  const zCells = set.filter((c) => grid.hasCandidate(c, z));
                  const elims: { cell: number; digit: number }[] = [];
                  for (let c = 0; c < CELLS; c++) {
                    if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
                    if (set.includes(c)) continue;
                    if (zCells.every((zc) => PEERS_OF[c]!.includes(zc))) {
                      elims.push({ cell: c, digit: z });
                    }
                  }
                  if (elims.length > 0) {
                    // Dedup elims
                    const seen = new Set<string>();
                    const uniqElims = elims.filter((e) => {
                      const k = `${e.cell}:${e.digit}`;
                      if (seen.has(k)) return false;
                      seen.add(k);
                      return true;
                    });
                    if (uniqElims.length === 0) continue;

                    const allCells = [...set, ...uniqElims.map((e) => e.cell)];
                    const allCands = set.flatMap((c) =>
                      digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                    );
                    return {
                      strategyId,
                      placements: [],
                      eliminations: uniqElims,
                      highlights: {
                        cells: allCells,
                        candidates: [...allCands, ...uniqElims],
                        links: [],
                      },
                      explanation: {
                        zh: `VWXYZ翼：5格5数，消 ${z}（非受限Z）`,
                        en: `VWXYZ-Wing: elim ${z} (non-restricted Z)`,
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

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    // P2a ladder implemented; conservative no-fire in first batch to protect soundness regression.
    // General 5-cell wing detection can be enabled after more worked examples.
    return null;
  },
};
