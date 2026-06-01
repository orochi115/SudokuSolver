import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import type { Grid } from '../grid.js';

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: 'forcing链', en: 'Forcing Chain' },
  difficulty: 100,
  apply(_grid: Grid): Step | null { return null; }
};
