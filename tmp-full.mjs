import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
const p = process.argv[2];
const t0 = Date.now();
const trace = solve(Grid.fromString(p), STRATEGIES);
console.log(trace.steps.length, trace.outcome, Date.now() - t0, 'ms');
console.log(trace.final);
