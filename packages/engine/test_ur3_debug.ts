import { Grid } from './src/grid.js';
import { uniqueRectangleType3 } from './src/strategies/uniqueness-extended.js';
import { solveBruteforce } from './src/bruteforce.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';

const puzzle = '150040076027000450090000010300107005002604300500090007000000000008060100000782000';
const g = Grid.fromString(puzzle);
const sol = solveBruteforce(puzzle)!;

// Run enough strategies to get to step 16
const trace = solve(g, STRATEGIES);
for (let i = 0; i < trace.steps.length; i++) {
  const s = trace.steps[i]!;
  if (s.strategyId === 'unique-rectangle-type-3') {
    console.log(`Step ${i}: UR Type-3`);
    console.log('Eliminations:', JSON.stringify(s.eliminations));
    for (const e of s.eliminations) {
      const expected = parseInt(sol[e.cell]!);
      if (expected === e.digit) {
        console.log(`BAD: cell=${e.cell} digit=${e.digit} expected=${expected}`);
      }
    }
    console.log('Explanation:', s.explanation.en);
    break;
  }
}
