import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '导弹（Exocet）', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};
