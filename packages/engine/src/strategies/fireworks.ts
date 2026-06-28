import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟火', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};
