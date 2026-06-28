import { describe, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

describe('speed check', () => {
  it('run all', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    for (const s of STRATEGIES) {
      const start = Date.now();
      try {
        const result = s.apply(grid);
        const elapsed = Date.now() - start;
        if (elapsed > 50) console.log('SLOW:', s.id, elapsed + 'ms', result ? 'hit' : 'null');
      } catch(e) {
        console.log('ERROR:', s.id);
      }
    }
  });
});
