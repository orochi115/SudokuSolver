import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('300002500000080060080700041700001300000070000008200005510008020030090000004500009');
const d = 4; const bit = maskOf(d);

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`; }
function seesAll(cell: number, fins: number[]) { return fins.every(f => f===cell || PEERS_OF[cell]!.includes(f)); }

for (const [baseHouses, coverHouses, baseAxis] of [[ROWS, COLS, 'row'], [COLS, ROWS, 'col']] as const) {
  for (let size = 2; size <= 2; size++) {
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
      const coverUnion = new Set(allCands.map(c => c.coverIdx));
      if (coverUnion.size <= size) continue;
      for (const coverCombo of combineIndices([...coverUnion].length, size)) {
        const coverSet = new Set(coverCombo.map(i => [...coverUnion][i]!));
        const fins = allCands.filter(c => !coverSet.has(c.coverIdx));
        if (!fins.length) continue;
        const finBoxes = new Set(fins.map(f => BOX_OF[f.cell]!));
        if (finBoxes.size !== 1) continue;
        const finBox = [...finBoxes][0]!;
        const finCells = fins.map(f => f.cell);
        const baseSet = new Set(baseIndices);
        for (const ci of coverSet) {
          for (const cell of coverHouses[ci]!) {
            if (grid.get(cell)!==0 || !(grid.candidatesOf(cell)&bit)) continue;
            const bi = baseAxis==='row' ? ROW_OF[cell]! : COL_OF[cell]!;
            if (baseSet.has(bi)) continue;
            if (BOX_OF[cell] !== finBox) continue;
            if (cell===rc(5,6) || cell===rc(6,6)) {
              console.log(`hit ${label(cell)} ${baseAxis} base${baseIndices.map(i=>i+1)} cover${[...coverSet].map(i=>i+1)} fins${finCells.map(label)} sees=${seesAll(cell,finCells)}`);
            }
          }
        }
      }
    }
  }
}