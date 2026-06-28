import { solve } from './src/solver.js';
import { Grid } from './src/grid.js';
import { STRATEGIES } from './src/strategies/index.js';

const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
const g = Grid.fromString(puzzle);
const trace = solve(g, STRATEGIES);
console.log('TRACE STEPS:');
for (const step of trace.steps) {
  console.log(`- ${step.strategyId}: elims: ${step.eliminations.length}`);
}
