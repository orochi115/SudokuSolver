import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { ALL_HOUSES, combinations, digitMask, houseName, maskDigits } from './_common.js';

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
    for (const house of ALL_HOUSES) {
      for (const size of [2, 3, 4] as const) {
        for (const subsetDigits of combinations(digits, size)) {
          const subsetMask = subsetDigits.reduce((acc, d) => acc | digitMask(d), 0);
          const touched = house.cells.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & subsetMask) !== 0);
          if (touched.length !== size) continue;

          const allPresent = subsetDigits.every((digit) => touched.some((cell) => grid.hasCandidate(cell, digit)));
          if (!allPresent) continue;

          const eliminations = touched.flatMap((cell) => {
            const extra = grid.candidatesOf(cell) & ~subsetMask;
            return maskDigits(extra).map((digit) => ({ cell, digit }));
          });

          if (eliminations.length === 0) continue;
          const subsetName = size === 2 ? 'pair' : size === 3 ? 'triple' : 'quad';
          const digitsText = subsetDigits.join(',');
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: touched,
              candidates: touched.flatMap((cell) => subsetDigits.filter((d) => grid.hasCandidate(cell, d)).map((digit) => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `在 ${houseName(house)} 中，数字 ${digitsText} 只出现在 ${size} 个格，形成隐性${size === 2 ? '数对' : size === 3 ? '三数组' : '四数组'}，可删除这些格中的其它候选（Hidden ${subsetName}）。`,
              en: `In ${houseName(house)}, digits ${digitsText} are confined to ${size} cells, forming a hidden ${subsetName}; remove other candidates from those cells (Hidden Subset).`,
            },
          };
        }
      }
    }

    return null;
  },
};
