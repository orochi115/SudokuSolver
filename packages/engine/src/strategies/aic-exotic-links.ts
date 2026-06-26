import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: 'AIC 含异域链接', en: 'AIC with Exotic Links' },
  difficulty: 780,
  tieBreak: ['chain-length', 'cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};