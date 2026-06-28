import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区锁定集', en: 'Multi-Sector Locked Set (MSLS)' },
  difficulty: 1300,
  tieBreak: ['size', 'cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};
