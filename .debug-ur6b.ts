import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
import { ROW_OF, COL_OF, digitsOf } from './packages/engine/src/grid.js';

const puzzles = [
  '308100000240009000700230500004002000020010090000500700007026003000400062000001807',
  '000089021009250000004107000500070008020000090800090004000306500000015400750940000',
];

for (const puzzle of puzzles) {
  const trace = solve(Grid.fromString(puzzle), STRATEGIES);
  const ur6steps = trace.steps.filter(s => s.strategyId === 'unique-rectangle-type-6');
  if (ur6steps.length === 0) { console.log('No UR6 in', puzzle.slice(0,20)); continue; }
  console.log('\nPuzzle', puzzle.slice(0,20));
  for (const s of ur6steps) {
    console.log('  elim', s.eliminations, s.explanation.en);
  }
}