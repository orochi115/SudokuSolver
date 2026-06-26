import { Grid } from './src/grid.js';
import { xyChain } from './src/strategies/xy-chain.js';
import { solveBruteforce } from './src/bruteforce.js';

const puzzles = [
  '000089021009250000004107000500070008020000090800090004000306500000015400750940000',
  '003004050260080340040000001400090000090608010000070009100000070089010026050200100',
  '308100000240009000700230500004002000020010090000500700007026003000400062000001807',
  '000003106500000000030100780002009807070020030805600400059008070000000005703200000',
  '004006070500070000003290508300000400059060720002000005405039200000040007020100300',
];
for (const puzzle of puzzles) {
  const g = Grid.fromString(puzzle);
  const step = xyChain.apply(g);
  if (step) {
    const solStr = solveBruteforce(puzzle)!;
    for (const e of step.eliminations) {
      const solDigit = parseInt(solStr[e.cell]!);
      if (solDigit === e.digit) {
        console.log(`PUZZLE: ${puzzle.slice(0,20)}`);
        console.log(`BAD ELIMINATION: cell ${e.cell} digit ${e.digit} solution=${solDigit}`);
        console.log('Explanation:', step.explanation.en);
      }
    }
  }
}
console.log('Done');
