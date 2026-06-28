import { describe, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';

describe('speed check solve', () => {
  it('one puzzle with logging', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const work = Grid.fromString(puzzle);
    const ordered = [...HUMAN_DEFAULT_STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
    const steps = [];
    const MAX_STEPS = 100;
    
    let loopCount = 0;
    while (!work.isSolved() && steps.length < MAX_STEPS) {
      let progressed = false;
      for (const strat of ordered) {
        const step = strat.apply(work);
        if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
          steps.push(step);
          for (const p of step.placements) work.place(p.cell, p.digit);
          for (const e of step.eliminations) work.eliminate(e.cell, e.digit);
          progressed = true;
          if (steps.length <= 5 || steps.length % 10 === 0) {
            console.log('Step', steps.length, strat.id, step.eliminations.length, step.placements.length);
          }
          break;
        }
      }
      if (!progressed) break;
      loopCount++;
      if (loopCount > 200) { console.log('too many loops'); break; }
    }
    console.log(steps.length + ' steps, outcome:', work.isSolved() ? 'solved' : 'stuck');
  });
});
