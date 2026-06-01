import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  allHouses,
  combinations,
  digitsInMask,
  maskSize,
  maskUnion,
  uniqueCells,
  uniqueEliminations,
} from './common.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (const size of [2, 3, 4]) {
      for (const house of allHouses()) {
        const targets = house.filter((cell) => grid.get(cell) === 0 && maskSize(grid.candidatesOf(cell)) >= 2 && maskSize(grid.candidatesOf(cell)) <= size);
        if (targets.length < size) continue;

        for (const combo of combinations(targets, size)) {
          const union = maskUnion(grid, combo);
          if (maskSize(union) !== size) continue;

          const eliminations = uniqueEliminations(
            house
              .filter((cell) => !combo.includes(cell) && grid.get(cell) === 0)
              .flatMap((cell) => digitsInMask(union).filter((digit) => grid.hasCandidate(cell, digit)).map((digit) => ({ cell, digit }))),
          );

          if (eliminations.length === 0) continue;
          const subsetDigits = digitsInMask(union);
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([...combo, ...eliminations.map((e) => e.cell)]),
              candidates: [
                ...combo.flatMap((cell) => subsetDigits.map((digit) => ({ cell, digit })).filter((it) => grid.hasCandidate(it.cell, it.digit))),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `同一单元中出现显性${size === 2 ? '数对' : size === 3 ? '三数组' : '四数组'}：这 ${size} 个格子只包含 ${subsetDigits.join(',')}，因此可在该单元其余格子删除这些候选。`,
              en: `A Naked ${size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad'} is found in one house: these ${size} cells contain only ${subsetDigits.join(',')}, so remove those digits from other cells in the house.`,
            },
          };
        }
      }
    }
    return null;
  },
};
