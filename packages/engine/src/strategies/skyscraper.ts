import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { findTurbotLike, turbotStep } from './turbot-common.js';

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 45,

  apply(grid: Grid) {
    const hit = findTurbotLike(
      grid,
      (l1, l2) =>
        (l1.houseType === 'row' && l2.houseType === 'row') ||
        (l1.houseType === 'col' && l2.houseType === 'col'),
    );
    return hit ? turbotStep(this.id, hit, '摩天楼', 'Skyscraper') : null;
  },
};
