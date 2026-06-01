import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';

export const aic: Strategy = {
  id: 'aic',
  name: { zh: 'AIC链', en: 'AIC' },
  difficulty: 70,
  apply(_grid: Grid): Step | null { return null; }
};
