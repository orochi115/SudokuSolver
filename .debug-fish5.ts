import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('300002500000080060080700041700001300000070000008200005510008020030090000004500009');
const d = 4; const bit = maskOf(4);
const T1 = rc(5,6), T2 = rc(6,6);

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`; }

// Sashimi-specific: fins = outside-cover candidates IN FIN BOX only (not all outside-cover)
for (const [baseHouses, coverHouses, baseAxis] of [[ROWS, COLS, 'row'], [COLS, ROWS, 'col']] as const) {
  const size = 2;
  const byBase = new Map<number, { cell: number; coverIdx: number }[]>();
  for (let bi = 0; bi < 9; bi++) {
    const entries = baseHouses[bi]!.filter(c => grid.get(c)===0 && (grid.candidatesOf(c)&bit))
      .map(cell => ({ cell, coverIdx: baseAxis==='row' ? COL_OF[cell]! : ROW_OF[cell]! }));
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
      // Try each box as fin box
      for (let fb = 0; fb < 9; fb++) {
        const fins = outside.filter(c => BOX_OF[c.cell]===fb);
        if (!fins.length) continue;
        const finCells = fins.map(f => f.cell);
        const baseSet = new Set(baseIndices);
        const elims: number[] = [];
        for (const ci of coverSet) {
          for (const cell of coverHouses[ci]!) {
            if (grid.get(cell)!==0 || !(grid.candidatesOf(cell)&bit)) continue;
            const bi = baseAxis==='row' ? ROW_OF[cell]! : COL_OF[cell]!;
            if (baseSet.has(bi)) continue;
            if (BOX_OF[cell] !== fb) continue;
            if (finCells.every(f => f===cell || PEERS_OF[cell]!.includes(f))) elims.push(cell);
          }
        }
        if (elims.includes(T1) && elims.includes(T2)) {
          console.log(`SASHIMI ${baseAxis} base${baseIndices.map(i=>i+1)} cover${[...coverSet].map(i=>i+1)} finBox${fb+1} fins${finCells.map(label)} elims${elims.map(label)}`);
        }
      }
    }
  }
}