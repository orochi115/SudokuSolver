import { HOUSES, digitsOf, maskOf } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, candidateHighlights, cellName, combinations, eliminationsForMask, houseName } from './common.js';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid): Step | null {
    for (let size = 2; size <= 4; size++) {
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        for (const subsetDigits of combinations(DIGITS, size)) {
          const cells = new Set<number>();
          let allDigitsPresent = true;
          for (const digit of subsetDigits) {
            const positions = candidateCells(grid, HOUSES[houseIndex]!, digit);
            if (positions.length === 0 || positions.length > size) {
              allDigitsPresent = false;
              break;
            }
            for (const cell of positions) cells.add(cell);
          }
          if (!allDigitsPresent || cells.size !== size) continue;
          let keepMask = 0;
          for (const digit of subsetDigits) keepMask |= maskOf(digit);
          const subsetCells = [...cells].sort((a, b) => a - b);
          const removeMask = 0x1ff & ~keepMask;
          const eliminations = eliminationsForMask(grid, subsetCells, removeMask);
          if (eliminations.length === 0) continue;
          const label = houseName(houseIndex);
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: { cells: subsetCells, candidates: candidateHighlights(subsetCells, digitsOf(keepMask)), links: [] },
            explanation: {
              zh: `${label.zh} 中数字 ${subsetDigits.join('/')} 只出现在 ${subsetCells.map(cellName).join('、')}，形成隐性${subsetNameZh(size)}，这些格可删除其它候选数。`,
              en: `In ${label.en}, digits ${subsetDigits.join('/')} appear only in ${subsetCells.map(cellName).join(', ')}, a Hidden ${subsetNameEn(size)}, so remove other candidates from those cells.`,
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
