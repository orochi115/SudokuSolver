import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { basicFishStep } from './fish-common.js';

export const swordfish: Strategy = {
  id: 'swordfish',
  name: { zh: '剑鱼', en: 'Swordfish' },
  difficulty: 45,

  apply(grid: Grid) {
    return basicFishStep(grid, this.id, 3, 'Swordfish', '剑鱼');
  },
};
