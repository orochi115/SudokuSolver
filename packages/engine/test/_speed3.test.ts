import { describe, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

describe('speed check solve', () => {
  it('one puzzle', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    let count = 0;
    let loopCount = 0;
    while (loopCount < 300 && !grid.isSolved()) {
      let any = false;
      for (const s of STRATEGIES) {
        const step = s.apply(grid);
        if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
          if (step.placements.length > 0) {
            for (const p of step.placements) grid.place(p.cell, p.digit);
          }
          if (step.eliminations.length > 0) {
            for (const e of step.eliminations) grid.eliminate(e.cell, e.digit);
          }
          any = true;
          count++;
        }
      }
      if (!any) break;
      loopCount++;
    }
    console.log(count + ' steps, solved:', grid.isSolved());
  });
});
