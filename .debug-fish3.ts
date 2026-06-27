import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';
import { verifyDeductions } from './packages/engine/src/worked-example-verify.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
const grid = Grid.fromString(puzzle);
const d = 4;
const bit = maskOf(d);

console.log('verify:', verifyDeductions(puzzle, {
  eliminations: [{ cell: rc(5,6), digit: 4 }, { cell: rc(6,6), digit: 4 }],
}));

function label(c: number) { return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}b${BOX_OF[c]!+1}`; }

// Full finned algorithm: |U| > n, try n-subsets of U
for (const [baseHouses, coverHouses, baseAxis] of [[ROWS, COLS, 'row'], [COLS, ROWS, 'col']] as const) {
  const size = 2;
  const byBase = new Map<number, { cell: number; coverIdx: number }[]>();
  for (let bi = 0; bi < 9; bi++) {
    const entries: { cell: number; coverIdx: number }[] = [];
    for (const cell of baseHouses[bi]!) {
      if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
      const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
      entries.push({ cell, coverIdx });
    }
    if (entries.length >= 1) byBase.set(bi, entries);
  }

  const eligible = [...byBase.keys()];
  for (const baseCombo of combineIndices(eligible.length, size)) {
    const baseIndices = baseCombo.map(i => eligible[i]!);
    const allCands = baseIndices.flatMap(bi => byBase.get(bi)!.map(e => ({ ...e, baseIdx: bi })));
    const coverUnion = new Set(allCands.map(c => c.coverIdx));
    if (coverUnion.size <= size) continue;

    for (const coverCombo of combineIndices([...coverUnion].length, size)) {
      const coverIndices = coverCombo.map(i => [...coverUnion][i]!);
      const coverSet = new Set(coverIndices);
      const fins = allCands.filter(c => !coverSet.has(c.coverIdx));
      if (fins.length === 0) continue;
      const finBoxes = new Set(fins.map(f => BOX_OF[f.cell]!));
      if (finBoxes.size !== 1) continue;

      const finBox = [...finBoxes][0]!;
      const baseSet = new Set(baseIndices);
      const elims: number[] = [];
      for (const ci of coverSet) {
        for (const cell of coverHouses[ci]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(bi)) continue;
          if (BOX_OF[cell] !== finBox) continue;
          elims.push(cell);
        }
      }
      if (elims.some(c => c === rc(5,6)) && elims.some(c => c === rc(6,6))) {
        console.log(`MATCH ${baseAxis} base ${baseIndices.map(i=>i+1)} cover ${coverIndices.map(i=>i+1)} fins ${fins.map(f=>label(f.cell))} elims ${elims.map(label)}`);
      }
    }
  }
}