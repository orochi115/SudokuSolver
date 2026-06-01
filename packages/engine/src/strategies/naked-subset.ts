import { HOUSES, digitsOf, popcount } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, combinations, eliminationsForMask, houseName, maskUnion } from './common.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid): Step | null {
    for (let size = 2; size <= 4; size++) {
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        const cells = HOUSES[houseIndex]!.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) >= 2 && popcount(grid.candidatesOf(cell)) <= size);
        for (const subsetCells of combinations(cells, size)) {
          const subsetMask = maskUnion(grid, subsetCells);
          if (popcount(subsetMask) !== size) continue;
          const others = HOUSES[houseIndex]!.filter((cell) => !subsetCells.includes(cell));
          const eliminations = eliminationsForMask(grid, others, subsetMask);
          if (eliminations.length === 0) continue;
          const digits = digitsOf(subsetMask);
          const label = houseName(houseIndex);
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: { cells: subsetCells, candidates: candidateHighlights(subsetCells, digits), links: [] },
            explanation: {
              zh: `${label.zh} 中 ${subsetCells.map(cellName).join('、')} 只包含 ${digits.join('/')}，形成显性${subsetNameZh(size)}，可从同单元其它格删除这些候选数。`,
              en: `In ${label.en}, ${subsetCells.map(cellName).join(', ')} contain only ${digits.join('/')} as a Naked ${subsetNameEn(size)}, so remove those candidates from the other cells in the house.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function subsetNameZh(size: number): string {
  return size === 2 ? '数对' : size === 3 ? '三数组' : '四数组';
}

function subsetNameEn(size: number): string {
  return size === 2 ? 'Pair' : size === 3 ? 'Triple' : 'Quad';
}
