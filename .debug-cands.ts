import { Grid, ROW_OF, COL_OF } from './packages/engine/src/grid.js';
import { solveBruteforce } from './packages/engine/src/bruteforce.js';

const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
const g = Grid.fromString(puzzle);
const sol = solveBruteforce(puzzle)!;

console.log('Solution R4C2 =', sol[(4-1)*9+(2-1)]);
console.log('R4C2 cands:', [1,2,3,4,5,6,7,8,9].filter(d => g.hasCandidate((4-1)*9+(2-1), d)));

for (const [r,c] of [[4,2],[4,4],[4,5],[4,9],[8,6],[5,6],[6,6]]) {
  const cell = (r-1)*9+(c-1);
  const cands = [1,2,3,4,5,6,7,8,9].filter(d => g.hasCandidate(cell, d));
  console.log(`R${r}C${c} sol=${sol[cell]} cands=${cands.join(',')}`);
}