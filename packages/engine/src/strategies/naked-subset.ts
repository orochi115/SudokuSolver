import { popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { ALL_HOUSES, combinations, digitMask, houseName, maskDigits } from './_common.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const house of ALL_HOUSES) {
      const unsolved = house.cells.filter((cell) => grid.get(cell) === 0);
      for (const size of [2, 3, 4] as const) {
        if (unsolved.length < size) continue;
        const interesting = unsolved.filter((cell) => {
          const count = popcount(grid.candidatesOf(cell));
          return count >= 2 && count <= size;
        });
        if (interesting.length < size) continue;

        for (const combo of combinations(interesting, size)) {
          let union = 0;
          for (const cell of combo) union |= grid.candidatesOf(cell);
          if (popcount(union) !== size) continue;
          const everyInside = combo.every((cell) => (grid.candidatesOf(cell) & ~union) === 0);
          if (!everyInside) continue;

          const eliminations = house.cells
            .filter((cell) => !combo.includes(cell) && grid.get(cell) === 0)
            .flatMap((cell) =>
              maskDigits(union)
                .filter((digit) => grid.hasCandidate(cell, digit))
                .map((digit) => ({ cell, digit })),
            );

          if (eliminations.length === 0) continue;
          const subsetName = size === 2 ? 'pair' : size === 3 ? 'triple' : 'quad';
          const digits = maskDigits(union).join(',');
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: combo,
              candidates: combo.flatMap((cell) => maskDigits(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `${houseName(house)} 中出现显性${size === 2 ? '数对' : size === 3 ? '三数组' : '四数组'}（${digits}），因此可在该 house 其它格删除这些候选数（Naked ${subsetName}）。`,
              en: `${houseName(house)} contains a naked ${subsetName} (${digits}), so those digits can be removed from the other cells in the same house (Naked Subset).`,
            },
          };
        }
      }
    }
    return null;
  },
};

void digitMask;
