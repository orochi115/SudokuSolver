/**
 * Hidden Subsets (T2) — 隐性数对/三数组/四数组.
 *
 * In a house, if N digits can be placed only within the same N cells (those
 * digits appear in no other cell of the house), then those cells hold exactly
 * those digits — so every OTHER candidate can be eliminated from those N cells.
 *
 * Covers hidden pair (N=2), triple (N=3), quad (N=4) in one pass.
 */

import { HOUSES, SIZE, maskOf, digitsOf, combinations, cellLabel, houseLabel, cellsWithCandidate } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SIZE_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '隐性数对', en: 'Hidden Pair' },
  3: { zh: '隐性三数组', en: 'Hidden Triple' },
  4: { zh: '隐性四数组', en: 'Hidden Quad' },
};

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 35,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;

      // Map each digit (1..9) to the cells of this house where it's a candidate.
      const digitCells: Map<number, number[]> = new Map();
      for (let d = 1; d <= SIZE; d++) {
        const spots = cellsWithCandidate(grid, house, d);
        if (spots.length >= 1) digitCells.set(d, spots);
      }

      for (let n = 2; n <= 4; n++) {
        // Digits that occupy between 2..n cells are eligible for a hidden n-set.
        const eligible = [...digitCells.entries()].filter(([, cells]) => cells.length >= 2 && cells.length <= n).map(([d]) => d);
        if (eligible.length < n) continue;

        for (const digitCombo of combinations(eligible, n)) {
          const cellUnion = new Set<number>();
          for (const d of digitCombo) for (const c of digitCells.get(d)!) cellUnion.add(c);
          if (cellUnion.size !== n) continue;

          // Found a hidden subset: digitCombo confined to exactly `cellUnion`.
          const comboMask = digitCombo.reduce((m, d) => m | maskOf(d), 0);
          const elims: CellDigit[] = [];
          for (const c of cellUnion) {
            const extra = grid.candidatesOf(c) & ~comboMask;
            if (extra) for (const d of digitsOf(extra)) elims.push({ cell: c, digit: d });
          }
          if (elims.length === 0) continue;

          const cells = [...cellUnion];
          const nm = SIZE_NAMES[n]!;
          const hl = houseLabel(h);
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells,
              candidates: cells.flatMap((c) => digitCombo.filter((d) => grid.hasCandidate(c, d)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `${nm.zh}：${hl.zh}中数字 {${digitCombo.join(',')}} 只能落在 ${cells.map(cellLabel).join('、')}，因此这些格内的其它候选数可被排除。`,
              en: `${nm.en}: in ${hl.en}, digits {${digitCombo.join(',')}} are confined to ${cells.map(cellLabel).join(', ')}, so the other candidates in those cells can be eliminated.`,
            },
          };
        }
      }
    }
    return null;
  },
};
