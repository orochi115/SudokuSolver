import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('420000095000000000001903400060802010042010980090406030007604800000000000680000041');
const d = 7; const bit = maskOf(7);
const TARGET = rc(1, 6);

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`; }

for (const size of [3]) {
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
      if (!outside.length) continue;
      for (let fb = 0; fb < 9; fb++) {
        const fins = outside.filter(c => BOX_OF[c.cell]===fb);
        if (!fins.length) continue;
        const finCells = fins.map(f => f.cell);
        const baseSet = new Set(baseIndices);
        for (const ci of coverSet) {
          for (const cell of COLS[ci]!) {
            if (grid.get(cell)!==0 || !(grid.candidatesOf(cell)&bit)) continue;
            if (baseSet.has(ROW_OF[cell]!)) continue;
            if (BOX_OF[cell] !== fb) continue;
            if (finCells.every(f => f===cell || PEERS_OF[cell]!.includes(f)) && cell===TARGET) {
              console.log(`MATCH base${baseIndices.map(i=>i+1)} cover${[...coverSet].map(i=>i+1)} finBox${fb+1} fins${finCells.map(label)}`);
            }
          }
        }
      }
    }
  }
}

console.log('R1C6 has 7:', grid.hasCandidate(TARGET, 7));
for (let r=0;r<9;r++) {
  const cells = ROWS[r]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit));
  if (cells.length) console.log(`row${r+1}:`, cells.map(c=>label(c)).join(','));
}