import { Grid } from './src/grid.js';
import { solveBruteforce } from './src/bruteforce.js';
import { finnedSwordfish } from './src/strategies/finned-fish.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';
import { checkTraceSoundness } from './src/soundness.js';

const p2 = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
const g2 = Grid.fromString(p2);
const sol = solveBruteforce(p2)!;

// Check if it fires immediately (probably wrong since cells aren't fully reduced)
const step = finnedSwordfish.apply(g2);
if (step) {
  console.log('Fires immediately:', JSON.stringify(step.eliminations));
  for (const e of step.eliminations) {
    console.log(`  cell=${e.cell} digit=${e.digit} expected=${sol[e.cell]}`);
  }
}

// Full solve trace soundness
const trace = solve(g2, STRATEGIES);
const result = checkTraceSoundness(trace, sol);
console.log('Full trace sound:', result.sound);
if (!result.sound) {
  console.log('Violations:', result.violations.slice(0, 3));
}
