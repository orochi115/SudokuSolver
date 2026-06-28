import { describe, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';

describe('speed check', () => {
  it('puzzle 2 profile deeper', () => {
    const puzzle = '000000085000210090080000000500800000000040000000001004000000050090026000840000000';
    const work = Grid.fromString(puzzle);
    const ordered = [...HUMAN_DEFAULT_STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
    
    for (let loop = 0; loop < 100 && !work.isSolved(); loop++) {
      let progressed = false;
      for (const s of ordered) {
        const start = Date.now();
        const step = s.apply(work);
        const elapsed = Date.now() - start;
        if (elapsed > 100) {
          console.log('TIMEOUT after', loop, 'loops on', s.id, elapsed + 'ms');
          return;
        }
        if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
          if (loop < 10 || step.eliminations.length > 0) {
            console.log('loop', loop, s.id, 'elims:', step.eliminations.length, 'placements:', step.placements.length);
          }
          for (const p of step.placements) work.place(p.cell, p.digit);
          for (const e of step.eliminations) work.eliminate(e.cell, e.digit);
          progressed = true;
          break;
        }
      }
      if (!progressed) { console.log('stuck at loop', loop); break; }
    }
    console.log('solved:', work.isSolved());
  });
});
