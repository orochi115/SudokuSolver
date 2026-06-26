/**
 * XYZ-Wing (T3) — XYZ翼
 *
 * A pivot cell with exactly 3 candidates {X, Y, Z} sees two pincers:
 *   - Pincer 1 has exactly 2 candidates {X, Z}
 *   - Pincer 2 has exactly 2 candidates {Y, Z}
 *
 * At least one of the three cells (pivot, p1, p2) must contain Z.
 * Eliminate Z from cells that see ALL THREE (pivot, p1, p2).
 *
 * Key difference from XY-Wing: pivot has 3 candidates, not 2;
 * and eliminations must see the PIVOT as well (since pivot itself has Z).
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, ROWS, COLS, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 470,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Pivot must have exactly 3 candidates
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;

      const pivotDigits = digitsOf(pivotMask);
      const pivotPeers = new Set(PEERS_OF[pivot]!);

      // Collect bivalue peers (potential pincers)
      const bivaluePeers: number[] = [];
      for (const c of PEERS_OF[pivot]!) {
        if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
          bivaluePeers.push(c);
        }
      }

      // Try all pairs of bivalue peers as pincers
      for (let i = 0; i < bivaluePeers.length; i++) {
        for (let j = i + 1; j < bivaluePeers.length; j++) {
          const p1 = bivaluePeers[i]!;
          const p2 = bivaluePeers[j]!;
          const p1Mask = grid.candidatesOf(p1);
          const p2Mask = grid.candidatesOf(p2);

          // p1 and p2 together with pivot must cover exactly the pivot's 3 digits
          // p1 ⊂ pivot, p2 ⊂ pivot
          if ((p1Mask & pivotMask) !== p1Mask) continue;
          if ((p2Mask & pivotMask) !== p2Mask) continue;

          // p1 and p2 must share exactly one digit (which is Z)
          const shared = p1Mask & p2Mask;
          if (popcount(shared) !== 1) continue;
          const z = digitsOf(shared)[0]!;
          const zBit = 1 << (z - 1);

          // Each pincer must have one digit that the other doesn't
          // (so together they cover the pivot)
          const union = p1Mask | p2Mask;
          if (union !== pivotMask) continue;

          // Eliminations: cells seeing pivot, p1, AND p2 that have Z
          const peersP1 = new Set(PEERS_OF[p1]!);
          const peersP2 = new Set(PEERS_OF[p2]!);
          const elims: { cell: number; digit: number }[] = [];

          for (const c of PEERS_OF[pivot]!) {
            if (c === p1 || c === p2) continue;
            if (!peersP1.has(c)) continue;
            if (!peersP2.has(c)) continue;
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            elims.push({ cell: c, digit: z });
          }

          if (elims.length === 0) continue;

          const pr = ROW_OF[pivot]! + 1;
          const pc = COL_OF[pivot]! + 1;
          const p1r = ROW_OF[p1]! + 1;
          const p1c = COL_OF[p1]! + 1;
          const p2r = ROW_OF[p2]! + 1;
          const p2c = COL_OF[p2]! + 1;
          const [dx, dy] = digitsOf(p1Mask ^ p2Mask) as [number, number];

          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [pivot, p1, p2, ...elims.map((e) => e.cell)],
              candidates: [
                ...pivotDigits.map((d) => ({ cell: pivot, digit: d })),
                ...digitsOf(p1Mask).map((d) => ({ cell: p1, digit: d })),
                ...digitsOf(p2Mask).map((d) => ({ cell: p2, digit: d })),
                ...elims,
              ],
              links: [
                { from: { cell: pivot, digit: dx }, to: { cell: p1, digit: dx }, type: 'weak' },
                { from: { cell: pivot, digit: dy }, to: { cell: p2, digit: dy }, type: 'weak' },
              ],
            },
            explanation: {
              zh: `XYZ翼：枢纽格 R${pr}C${pc}（{${pivotDigits.join(',')}}}）看到翼格 R${p1r}C${p1c}（{${digitsOf(p1Mask).join(',')}}）和 R${p2r}C${p2c}（{${digitsOf(p2Mask).join(',')}}）；可从同时看到枢纽和两个翼格的格子中消去 ${z}（XYZ翼）。`,
              en: `XYZ-Wing: pivot R${pr}C${pc} ({${pivotDigits.join(',')}}) sees pincers R${p1r}C${p1c} ({${digitsOf(p1Mask).join(',')}}) and R${p2r}C${p2c} ({${digitsOf(p2Mask).join(',')}}); eliminate ${z} from cells seeing all three (XYZ-Wing).`,
            },
          };
        }
      }
    }
    return null;
  },
};

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let b = 0; b < 9; b++) {
      const boxCells = BOXES[b]!;

      const r0 = Math.floor(b / 3) * 3;
      const c0 = (b % 3) * 3;
      const intersectingLines = [
        { lineCells: ROWS[r0]!, lineIdx: r0 },
        { lineCells: ROWS[r0 + 1]!, lineIdx: r0 + 1 },
        { lineCells: ROWS[r0 + 2]!, lineIdx: r0 + 2 },
        { lineCells: COLS[c0]!, lineIdx: 9 + c0 },
        { lineCells: COLS[c0 + 1]!, lineIdx: 9 + c0 + 1 },
        { lineCells: COLS[c0 + 2]!, lineIdx: 9 + c0 + 2 },
      ];

      for (const { lineCells, lineIdx } of intersectingLines) {
        const B_U_L_set = new Set([...boxCells, ...lineCells]);
        const empty_B_U_L = [...B_U_L_set].filter(c => grid.get(c) === 0);
        if (empty_B_U_L.length < 4) continue;

        for (const combo of combinations(empty_B_U_L, 4)) {
          if (combo.every(c => BOX_OF[c] === b)) continue;
          if (combo.every(c => lineCells.includes(c))) continue;

          let unionMask = 0;
          for (const c of combo) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== 4) continue;

          const digits = digitsOf(unionMask);
          let unrestrictedDigit = -1;
          const digitCellsMap = new Map<number, number[]>();

          for (const d of digits) {
            const dBit = maskOf(d);
            const cellsWithD = combo.filter(c => (grid.candidatesOf(c) & dBit) !== 0);
            digitCellsMap.set(d, cellsWithD);

            let isRestricted = true;
            for (let i = 0; i < cellsWithD.length; i++) {
              for (let j = i + 1; j < cellsWithD.length; j++) {
                if (!PEERS_OF[cellsWithD[i]!]!.includes(cellsWithD[j]!)) {
                  isRestricted = false;
                  break;
                }
              }
              if (!isRestricted) break;
            }

            if (!isRestricted) {
              if (unrestrictedDigit !== -1) {
                unrestrictedDigit = -2;
                break;
              }
              unrestrictedDigit = d;
            }
          }

          if (unrestrictedDigit < 1) continue;

          const z = unrestrictedDigit;
          const zBit = maskOf(z);
          const cellsWithZ = digitCellsMap.get(z)!;

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (combo.includes(c)) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;

            const peers = new Set(PEERS_OF[c]!);
            if (cellsWithZ.every(cz => peers.has(cz))) {
              elims.push({ cell: c, digit: z });
            }
          }

          if (elims.length > 0) {
            const lineLabel = lineIdx < 9 ? `Row ${lineIdx + 1}` : `Col ${lineIdx - 9 + 1}`;
            return {
              strategyId: 'wxyz-wing',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...combo, ...elims.map(e => e.cell)],
                candidates: [
                  ...combo.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ翼：四个格 ${combo.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')} 局限于宫 B${b+1} 和 ${lineLabel}，候选数共 ${digits.join(',')}，只有 ${z} 是非受限数字；消去所有能同时看到所有含 ${z} 格子的 ${z}。`,
                en: `WXYZ-Wing: four cells ${combo.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')} confined to box B${b+1} and ${lineLabel}, candidates are {${digits.join(',')}} with Z=${z} being the only non-restricted digit; eliminate ${z} from cells seeing all cells containing ${z} in the pattern.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集 (ALP/ALT)', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let lIdx = 0; lIdx < 18; lIdx++) {
      const line = lIdx < 9 ? ROWS[lIdx]! : COLS[lIdx - 9]!;
      const lineLabel = lIdx < 9 ? `Row ${lIdx + 1}` : `Col ${lIdx - 9 + 1}`;

      for (let b = 0; b < 9; b++) {
        const box = BOXES[b]!;
        const intersect = line.filter(c => box.includes(c));
        if (intersect.length === 0) continue;

        const L_cells = line.filter(c => !intersect.includes(c));
        const B_cells = box.filter(c => !intersect.includes(c));

        for (const size of [2, 3]) {
          const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          for (const S_combo of combinations(digits, size)) {
            const S_mask = S_combo.reduce((acc, d) => acc | maskOf(d), 0);

            // CRITICAL: None of the digits of S should already be solved in the line or box
            if (S_combo.some(d => line.some(c => grid.get(c) === d) || box.some(c => grid.get(c) === d))) continue;

            const L_als = L_cells.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & ~S_mask) === 0);
            if (L_als.length !== size - 1) continue;

            const B_als = B_cells.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & ~S_mask) === 0);
            if (B_als.length !== size - 1) continue;

            // CRITICAL: The union of candidates of L_als must be exactly S
            let L_union = 0;
            for (const c of L_als) L_union |= grid.candidatesOf(c);
            if (L_union !== S_mask) continue;

            // CRITICAL: The union of candidates of B_als must be exactly S
            let B_union = 0;
            for (const c of B_als) B_union |= grid.candidatesOf(c);
            if (B_union !== S_mask) continue;

            const otherL = L_cells.filter(c => !L_als.includes(c));
            const boxSideFree = otherL.every(c => grid.get(c) !== 0 || (grid.candidatesOf(c) & S_mask) === 0);

            if (boxSideFree) {
              const elims: { cell: number; digit: number }[] = [];
              const otherB = B_cells.filter(c => !B_als.includes(c));
              for (const c of otherB) {
                if (grid.get(c) === 0) {
                  const mask = grid.candidatesOf(c) & S_mask;
                  for (const d of digitsOf(mask)) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }

              if (elims.length > 0) {
                const allCells = [...intersect, ...L_als, ...B_als, ...elims.map(e => e.cell)];
                const nameZh = size === 2 ? '几乎锁定对 (ALP)' : '几乎锁定三 (ALT)';
                const nameEn = size === 2 ? 'Almost Locked Pair' : 'Almost Locked Triple';
                return {
                  strategyId: 'bent-sets',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set(allCells)],
                    candidates: [
                      ...L_als.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...B_als.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `弯曲集 — ${nameZh}：格集合在 ${lineLabel} 与宫 B${b + 1} 交界处弯曲；消去相应格中的候选数。`,
                    en: `Bent Sets — ${nameEn}: cells bend across the intersection of ${lineLabel} and box B${b + 1}; eliminate candidates.`,
                  },
                };
              }
            }

            const otherB = B_cells.filter(c => !B_als.includes(c));
            const lineSideFree = otherB.every(c => grid.get(c) !== 0 || (grid.candidatesOf(c) & S_mask) === 0);

            if (lineSideFree) {
              const elims: { cell: number; digit: number }[] = [];
              const otherL = L_cells.filter(c => !L_als.includes(c));
              for (const c of otherL) {
                if (grid.get(c) === 0) {
                  const mask = grid.candidatesOf(c) & S_mask;
                  for (const d of digitsOf(mask)) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }

              if (elims.length > 0) {
                const allCells = [...intersect, ...L_als, ...B_als, ...elims.map(e => e.cell)];
                const nameZh = size === 2 ? '几乎锁定对 (ALP)' : '几乎锁定三 (ALT)';
                const nameEn = size === 2 ? 'Almost Locked Pair' : 'Almost Locked Triple';
                return {
                  strategyId: 'bent-sets',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set(allCells)],
                    candidates: [
                      ...L_als.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...B_als.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...elims,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `弯曲集 — ${nameZh}：格集合在 ${lineLabel} 与宫 B${b + 1} 交界处弯曲；消去相应格中的候选数。`,
                    en: `Bent Sets — ${nameEn}: cells bend across the intersection of ${lineLabel} and box B${b + 1}; eliminate candidates.`,
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
