import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { basicFishStep } from './fish-common.js';

export const jellyfish: Strategy = {
  id: 'jellyfish',
  name: { zh: '水母', en: 'Jellyfish' },
  difficulty: 50,

  apply(grid: Grid) {
    return basicFishStep(grid, this.id, 4, 'Jellyfish', '水母');
  },
};
