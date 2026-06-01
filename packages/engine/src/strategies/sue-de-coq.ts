import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: 'Sue de Coq', en: 'Sue de Coq' },
  difficulty: 95,
  apply(_grid: Grid): Step | null {
    return null;
  },
};