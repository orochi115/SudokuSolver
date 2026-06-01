import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { findTurbotLike, turbotStep } from './turbot-common.js';

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 50,

  apply(grid: Grid) {
    const hit = findTurbotLike(
      grid,
      (l1, l2) => {
        const oneIsBox = l1.houseType === 'box' || l2.houseType === 'box';
        const oneIsLine = l1.houseType !== 'box' || l2.houseType !== 'box';
        return oneIsBox && oneIsLine;
      },
    );
    return hit ? turbotStep(this.id, hit, '空矩形', 'Empty Rectangle') : null;
  },
};
