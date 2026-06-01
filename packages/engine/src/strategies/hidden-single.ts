import { HOUSES, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, cellName, createPlacementStep, houseName } from './utils.js';

export const hiddenSingle: Strategy = {
  id: 'hidden-single',
  name: { zh: '隐性唯一', en: 'Hidden Single' },
  difficulty: 10,
  apply(grid: Grid): Step | null {
    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      for (let digit = 1; digit <= SIZE; digit++) {
        const positions = candidateCells(grid, house, digit);
        if (positions.length !== 1) continue;
        const target = positions[0]!;
        const label = houseName(houseIndex);
        const highlighted = house.filter((cell) => grid.candidatesOf(cell) !== 0);
        return createPlacementStep({
          strategy: this,
          cell: target,
          digit,
          cells: highlighted,
          zh: `${label.zh} 中只有 ${cellName(target)} 可以放 ${digit}，因此填入 ${digit}（隐性唯一）。`,
          en: `In ${label.en}, only ${cellName(target)} can contain ${digit}, so it must be ${digit} (Hidden Single).`,
        });
      }
    }
    return null;
  },
};
