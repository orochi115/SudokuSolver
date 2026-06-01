import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  allHouses,
  combinations,
  uniqueCells,
  uniqueEliminations,
} from './common.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const size of [2, 3, 4]) {
      for (const house of allHouses()) {
        for (const subsetDigits of combinations(digits, size)) {
          const support = house.filter((cell) => grid.get(cell) === 0 && subsetDigits.some((digit) => grid.hasCandidate(cell, digit)));
          if (support.length !== size) continue;
          const everyDigitAppears = subsetDigits.every((digit) => support.some((cell) => grid.hasCandidate(cell, digit)));
          if (!everyDigitAppears) continue;

          const eliminations = uniqueEliminations(
            support.flatMap((cell) => {
              const mask = grid.candidatesOf(cell);
              const ds: number[] = [];
              for (let digit = 1; digit <= 9; digit++) {
                if ((mask & (1 << (digit - 1))) === 0) continue;
                if (!subsetDigits.includes(digit)) ds.push(digit);
              }
              return ds.map((digit) => ({ cell, digit }));
            }),
          );

          if (eliminations.length === 0) continue;
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([...support, ...eliminations.map((e) => e.cell)]),
              candidates: [
                ...support.flatMap((cell) => subsetDigits.map((digit) => ({ cell, digit })).filter((it) => grid.hasCandidate(it.cell, it.digit))),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `同一单元中数字 ${subsetDigits.join(',')} 只出现在 ${size} 个格子里，形成隐性${size === 2 ? '数对' : size === 3 ? '三数组' : '四数组'}，因此这些格子的其他候选可删除。`,
              en: `Digits ${subsetDigits.join(',')} are confined to ${size} cells in one house (Hidden ${size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad'}), so other candidates are removed from those cells.`,
            },
          };
        }
      }
    }
    return null;
  },
};
