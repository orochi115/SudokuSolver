import { Grid } from './src/grid.js';
import { solveBruteforce } from './src/bruteforce.js';
import { finnedXWing, finnedSwordfish } from './src/strategies/finned-fish.js';

// Sashimi X-Wing from research card
const p1 = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
const g1 = Grid.fromString(p1);
const step1 = finnedXWing.apply(g1);
console.log('Finned X-Wing on initial:', step1 ? `found digit=${step1.eliminations[0]?.digit}` : 'null');

// Finned Swordfish from research card
const p2 = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
const g2 = Grid.fromString(p2);
const step2 = finnedSwordfish.apply(g2);
console.log('Finned Swordfish on initial:', step2 ? `found eliminations=${JSON.stringify(step2.eliminations)}` : 'null');
const sol2 = solveBruteforce(p2);
if (step2 && sol2) {
  for (const e of step2.eliminations) {
    console.log(`  elim cell=${e.cell} digit=${e.digit} expected=${sol2[e.cell]}`);
  }
}
