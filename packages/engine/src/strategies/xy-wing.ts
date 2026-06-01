import { digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,
  apply(grid: Grid): Step | null {
    // find bivalue pivot + two bivalue pincers with common z, eliminate z from peers of both
    for (let p=0; p<81; p++) {
      if (grid.get(p)!==0) continue;
      const pm = grid.candidatesOf(p);
      if (popcount(pm)!==2) continue;
      const [x,y] = digitsOf(pm);
      // find two other bivalue cells seeing p, with {x,z} and {y,z}
      // simplified stub returns null (correct but low coverage)
    }
    return null;
  },
};
