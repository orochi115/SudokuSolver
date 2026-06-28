import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼（守护者）', en: 'Broken Wing (Guardians)' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};