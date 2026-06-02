import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';

// Run a simple test with just a few strategies to isolate the issue
const testPuzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
const grid = Grid.fromString(testPuzzle);
console.log("Testing strategy application...");

try {
  // Run with all strategies to see which one causes the issue
  const trace = solve(grid, STRATEGIES);
  console.log("Solution completed successfully");
  console.log("Steps:", trace.steps.length);
  console.log("Outcome:", trace.outcome);
} catch (error) {
  console.error("Error during solving:", error.message);
}