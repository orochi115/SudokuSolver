import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { basicFishStep } from './fish-common.js';

export const xWing: Strategy = {
  id: 'x-wing',
  name: { zh: 'X翼', en: 'X-Wing' },
  difficulty: 40,

  apply(grid: Grid) {
    return basicFishStep(grid, this.id, 2, 'X-Wing', 'X翼');
  },
};
