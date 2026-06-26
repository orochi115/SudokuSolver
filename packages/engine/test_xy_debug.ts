import { Grid } from './src/grid.js';
import { xyChain } from './src/strategies/xy-chain.js';
import { solveBruteforce } from './src/bruteforce.js';

const puzzle = '000089021009250000004107000500070008020000090800090004000306500000015400750940000';
const g = Grid.fromString(puzzle);
const step = xyChain.apply(g);
if (step) {
  const solStr = solveBruteforce(puzzle)!;
  console.log('XY-Chain found:', JSON.stringify(step.eliminations));
  for (const e of step.eliminations) {
    const solDigit = parseInt(solStr[e.cell]!);
    if (solDigit === e.digit) {
      console.log('BAD ELIMINATION: cell', e.cell, 'digit', e.digit, 'solution digit is', solDigit);
      console.log('Explanation:', step.explanation.en);
    }
  }
} else {
  console.log('No XY-Chain found');
}

// Second puzzle
const puzzle2 = '003004050260080340040000001400090000090608010000070009100000070089010026050200100';
const g2 = Grid.fromString(puzzle2);
const step2 = xyChain.apply(g2);
if (step2) {
  const solStr2 = solveBruteforce(puzzle2)!;
  console.log('XY-Chain2 found:', JSON.stringify(step2.eliminations));
  for (const e of step2.eliminations) {
    const solDigit = parseInt(solStr2[e.cell]!);
    if (solDigit === e.digit) {
      console.log('BAD ELIMINATION2: cell', e.cell, 'digit', e.digit, 'solution digit is', solDigit);
      console.log('Explanation2:', step2.explanation.en);
    }
  }
}
