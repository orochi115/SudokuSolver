import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from './packages/engine/src/strategies/profiles.js';
console.log('start');
const trace = solve(Grid.fromString('530070000600195000098000060800060003400803001700020006060000280000419005000080079'), HUMAN_DEFAULT_STRATEGIES);
console.log(trace.steps.length, trace.outcome);
