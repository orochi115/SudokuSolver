import type { Strategy } from '../strategy.js';
import { HOUSES, combinations, digitsOf, eliminationsFromMask, houseName, popcount } from './helpers.js';

const subsetNames: Record<number, { zh: string; en: string }> = {
  2: { zh: '数对', en: 'Pair' },
  3: { zh: '三数组', en: 'Triple' },
  4: { zh: '四数组', en: 'Quad' },
};

export function createNakedSubsetStrategy(size: 2 | 3 | 4): Strategy {
  const names = subsetNames[size]!;
  return {
    id: `naked-${size === 2 ? 'pair' : size === 3 ? 'triple' : 'quad'}`,
    name: { zh: `显性${names.zh}`, en: `Naked ${names.en}` },
    difficulty: 30,

    apply(grid) {
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        const house = HOUSES[houseIndex]!;
        const cells = house.filter((cell) => {
          const count = popcount(grid.candidatesOf(cell));
          return grid.get(cell) === 0 && count >= 2 && count <= size;
        });
        for (const selected of combinations(cells, size)) {
          const union = selected.reduce((mask, cell) => mask | grid.candidatesOf(cell), 0);
          if (popcount(union) !== size) continue;
          const others = house.filter((cell) => !selected.includes(cell));
          const eliminations = eliminationsFromMask(grid, others, union);
          if (eliminations.length === 0) continue;
          const houseLabel = houseName(houseIndex);
          const digits = digitsOf(union).join('/');
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: selected,
              candidates: selected.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `${houseLabel.zh} 中 ${selected.length} 个格只包含 ${digits}，形成显性${names.zh}，可从同一区域其他格删除这些候选。`,
              en: `In ${houseLabel.en}, ${selected.length} cells contain only ${digits}, forming a Naked ${names.en}; remove those candidates from the other cells in the house.`,
            },
          };
        }
      }
      return null;
    },
  };
}

export function createHiddenSubsetStrategy(size: 2 | 3 | 4): Strategy {
  const names = subsetNames[size]!;
  return {
    id: `hidden-${size === 2 ? 'pair' : size === 3 ? 'triple' : 'quad'}`,
    name: { zh: `隐性${names.zh}`, en: `Hidden ${names.en}` },
    difficulty: 30,

    apply(grid) {
      const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        const house = HOUSES[houseIndex]!;
        for (const digits of combinations(allDigits, size)) {
          const digitMask = digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
          const cells = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & digitMask) !== 0);
          if (cells.length !== size) continue;
          if (!digits.every((digit) => cells.some((cell) => grid.hasCandidate(cell, digit)))) continue;
          const eliminations = cells.flatMap((cell) => digitsOf(grid.candidatesOf(cell) & ~digitMask).map((digit) => ({ cell, digit })));
          if (eliminations.length === 0) continue;
          const houseLabel = houseName(houseIndex);
          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells,
              candidates: cells.flatMap((cell) => digits.filter((digit) => grid.hasCandidate(cell, digit)).map((digit) => ({ cell, digit }))),
              links: [],
            },
            explanation: {
              zh: `${houseLabel.zh} 中 ${digits.join('/')} 只能出现在这 ${size} 个格，形成隐性${names.zh}，可删除这些格内其他候选。`,
              en: `In ${houseLabel.en}, ${digits.join('/')} can appear only in these ${size} cells, forming a Hidden ${names.en}; remove the other candidates from those cells.`,
            },
          };
        }
      }
      return null;
    },
  };
}
