import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐式集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};