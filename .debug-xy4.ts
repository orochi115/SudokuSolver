import { Grid, ROW_OF, COL_OF, popcount } from './packages/engine/src/grid.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');

function show(r: number, c: number) {
  const cell = rc(r,c);
  const cands = [1,2,3,4,5,6,7,8,9].filter(d => grid.hasCandidate(cell,d));
  console.log(`R${r}C${c} (${cands.length} vals): ${cands.join(',')}`);
}

// SudokuWiki A7=colA row7=R7C1, C2=colC row2=R2C3
// Alternative A7=R1C7
for (const [r,c] of [[7,1],[1,7],[2,3],[3,2],[1,3],[3,7],[3,9],[3,1],[7,3],[9,3]]) show(r,c);