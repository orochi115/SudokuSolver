import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from './packages/engine/src/grid.js';

const grid = Grid.fromString('300002500000080060080700041700001300000070000008200005510008020030090000004500009');
const bit = maskOf(4);

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}b${BOX_OF[c]!+1}`; }

console.log('by column:');
for (let ci = 0; ci < 9; ci++) {
  const cells = COLS[ci]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit));
  if (cells.length) console.log(` col ${ci+1}:`, cells.map(label).join(', '));
}

// Check R5C6 and R6C6
for (const [r,c] of [[5,6],[6,6],[4,4],[4,5],[8,6]]) {
  const cell = (r-1)*9+(c-1);
  console.log(`R${r}C${c}: val=${grid.get(cell)} cand4=${grid.hasCandidate(cell,4)}`);
}