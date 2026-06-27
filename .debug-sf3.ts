import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('420000095000000000001903400060802010042010980090406030007604800000000000680000041');
const d = 7; const bit = maskOf(7);

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}b${BOX_OF[c]!+1}`; }

// fins R1C4 R1C5, elim R1C6
const size = 3;
const byBase = new Map<number, { cell: number; coverIdx: number }[]>();
for (let bi = 0; bi < 9; bi++) {
  const entries = ROWS[bi]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit))
    .map(cell => ({ cell, coverIdx: COL_OF[cell]! }));
  if (entries.length) byBase.set(bi, entries);
}
const eligible = [...byBase.keys()];
for (const baseCombo of combineIndices(eligible.length, size)) {
  const baseIndices = baseCombo.map(i => eligible[i]!);
  const allCands = baseIndices.flatMap(bi => byBase.get(bi)!.map(e => ({...e, baseIdx: bi})));
  for (const coverCombo of combineIndices(9, size)) {
    const coverSet = new Set(coverCombo);
    const outside = allCands.filter(c => !coverSet.has(c.coverIdx));
    for (let fb = 0; fb < 9; fb++) {
      const fins = outside.filter(c => BOX_OF[c.cell]===fb);
      if (!fins.some(f => f.cell===rc(1,4)) || !fins.some(f => f.cell===rc(1,5))) continue;
      const finCells = fins.map(f => f.cell);
      const baseSet = new Set(baseIndices);
      const elims: number[] = [];
      for (const ci of coverSet) {
        for (const cell of COLS[ci]!) {
          if (grid.get(cell)!==0 || !(grid.candidatesOf(cell)&bit)) continue;
          if (baseSet.has(ROW_OF[cell]!)) continue;
          if (BOX_OF[cell] !== fb) continue;
          if (finCells.every(f => f===cell || PEERS_OF[cell]!.includes(f))) elims.push(cell);
        }
      }
      if (elims.includes(rc(1,6))) {
        console.log(`base${baseIndices.map(i=>i+1)} cover${[...coverSet].map(i=>i+1)} finBox${fb+1} fins${finCells.map(label)} elims${elims.map(label)}`);
      }
    }
  }
}
console.log('R1C4', label(rc(1,4)), 'R1C5', label(rc(1,5)), 'R1C6', label(rc(1,6)));