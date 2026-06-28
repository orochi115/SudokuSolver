import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from './packages/engine/src/strategies/profiles.js';
const p = process.argv[2];
const t0 = Date.now();
const trace = solve(Grid.fromString(p), HUMAN_DEFAULT_STRATEGIES);
console.log(trace.steps.length, trace.outcome, Date.now() - t0, 'ms');
