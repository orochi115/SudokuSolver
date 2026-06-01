import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { findTurbotLike, turbotStep } from './turbot-common.js';

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 45,

  apply(grid: Grid) {
    const hit = findTurbotLike(
      grid,
      (l1, l2) =>
        (l1.houseType === 'row' && l2.houseType === 'col') ||
        (l1.houseType === 'col' && l2.houseType === 'row'),
    );
    return hit ? turbotStep(this.id, hit, '双线风筝', '2-String Kite') : null;
  },
};
