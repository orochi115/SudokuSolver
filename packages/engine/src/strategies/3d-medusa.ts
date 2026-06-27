import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '3D美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};