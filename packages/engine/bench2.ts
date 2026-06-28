import { Grid } from './src/grid.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';

const puzzles = [
  '003060080900208500060054003019000070307000208080000390700540030005603007030020100',
  '006324800850090000000700000004007680300000007067400300000003000000040021008259700',
];

for (const puzzle of puzzles) {
  const grid = Grid.fromString(puzzle);
  const start = Date.now();
  const result = solve(grid, STRATEGIES);
  const t = Date.now() - start;
  console.log('time:', t, 'ms, steps:', result.steps.length, 'outcome:', result.outcome);
  if (t > 1000) {
    console.log('SLOW - last step:', result.steps[result.steps.length - 1]?.strategyId);
  }
}
