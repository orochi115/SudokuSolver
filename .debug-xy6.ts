import { Grid, popcount } from './packages/engine/src/grid.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');
for (let c = 0; c < 81; c++) {
  if (grid.get(c)===0 && popcount(grid.candidatesOf(c))===2) {
    const r = Math.floor(c/9)+1, col = c%9+1;
    const cands = [1,2,3,4,5,6,7,8,9].filter(d => grid.hasCandidate(c,d));
    console.log(`R${r}C${col}: ${cands.join(',')}`);
  }
}