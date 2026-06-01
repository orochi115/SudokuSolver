/**
 * Naked Subsets (T2) — 显性数对/三数组/四数组.
 *
 * In a house, if N empty cells together contain exactly N candidate digits
 * (their union has size N), those N digits are locked to those N cells, so they
 * can be eliminated from every other cell of the house.
 *
 * Covers naked pair (N=2), triple (N=3), and quad (N=4) in one pass.
 */

import { HOUSES, popcount, digitsOf, combinations, cellLabel, houseLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SIZE_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: '显性数对', en: 'Naked Pair' },
  3: { zh: '显性三数组', en: 'Naked Triple' },
  4: { zh: '显性四数组', en: 'Naked Quad' },
};

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      const empties = house.filter((c) => grid.get(c) === 0);

      for (let n = 2; n <= 4; n++) {
        // Only cells with 2..n candidates can be part of a naked n-subset.
        const candCells = empties.filter((c) => {
          const pc = popcount(grid.candidatesOf(c));
          return pc >= 2 && pc <= n;
        });
        if (candCells.length < n) continue;

        for (const combo of combinations(candCells, n)) {
          let union = 0;
          for (const c of combo) union |= grid.candidatesOf(c);
          if (popcount(union) !== n) continue;

          const digits = digitsOf(union);
          const comboSet = new Set(combo);
          const elims: CellDigit[] = [];
          for (const c of empties) {
            if (comboSet.has(c)) continue;
            for (const d of digits) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;

          const nm = SIZE_NAMES[n]!;
          const hl = houseLabel(h);
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: combo,
              candidates: combo.flatMap((c) => digits.filter((d) => grid.hasCandidate(c, d)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `${nm.zh}：${hl.zh}中 ${combo.map(cellLabel).join('、')} 恰好只含候选 {${digits.join(',')}}，这些数字被锁定在这些格内，可从${hl.zh}其余格中排除。`,
              en: `${nm.en}: in ${hl.en}, cells ${combo.map(cellLabel).join(', ')} contain only candidates {${digits.join(',')}}; these digits are locked there and removed from the rest of ${hl.en}.`,
            },
          };
        }
      }
    }
    return null;
  },
};
