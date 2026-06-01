import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,
  apply(_grid: Grid): Step | null { return null; }
};
