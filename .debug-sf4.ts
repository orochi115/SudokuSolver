import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from './packages/engine/src/grid.js';

const grid = Grid.fromString('420000095000000000001903400060802010042010980090406030007604800000000000680000041');
const d = 7; const bit = maskOf(7);
const label = (c:number) => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`;

for (const bi of [0,1,2]) {
  const entries = ROWS[bi]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit))
    .map(cell => ({ cell, col: COL_OF[cell]!+1 }));
  console.log(`row${bi+1}:`, entries.map(e => `${label(e.cell)}(c${e.col})`).join(', '));
}

// manual: base rows 1,2,3 cover cols 4,5,6
const baseRows = [0,1,2];
const coverCols = [3,4,5];
const baseSet = new Set(baseRows);
const coverSet = new Set(coverCols);
const allCands = baseRows.flatMap(bi => ROWS[bi]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit))
  .map(cell => ({ cell, baseIdx: bi, coverIdx: COL_OF[cell]! })));
const outside = allCands.filter(c => !coverSet.has(c.coverIdx));
console.log('outside:', outside.map(c => label(c.cell)));
for (let fb = 0; fb < 9; fb++) {
  const fins = outside.filter(c => BOX_OF[c.cell]===fb);
  if (!fins.length) continue;
  const finCells = fins.map(f => f.cell);
  const elims: string[] = [];
  for (const ci of coverSet) {
    for (const cell of COLS[ci]!) {
      if (grid.get(cell)!==0 || !(grid.candidatesOf(cell)&bit)) continue;
      if (baseSet.has(ROW_OF[cell]!)) continue;
      if (BOX_OF[cell] !== fb) continue;
      if (finCells.every(f => f===cell || PEERS_OF[cell]!.includes(f))) elims.push(label(cell));
    }
  }
  if (elims.length) console.log(`finBox${fb+1} fins${finCells.map(label)} elims${elims}`);
}