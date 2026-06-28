import { parse } from './src/parser.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';

const puzzles = [
  '003060080900208500060054003019000070307000208080000390700540030005603007030020100',
  '006324800850090000000700000004007680300000007067400300000003000000040021008259700',
];

for (const puzzle of puzzles) {
  const grid = parse(puzzle);
  const start = Date.now();
  const result = solve(grid, STRATEGIES, { maxSteps: 50 });
  console.log('time:', Date.now() - start, 'ms, steps:', result.trace.length, 'status:', result.status);
}
