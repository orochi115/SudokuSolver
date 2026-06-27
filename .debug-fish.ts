import { Grid, ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from './packages/engine/src/grid.js';
import { combineIndices } from './packages/engine/src/strategies/fish-utils.js';

const puzzle = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
const grid = Grid.fromString(puzzle);
const d = 4;
const bit = maskOf(d);
const size = 2;

function label(c: number) {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

interface CandEntry { cell: number; baseIdx: number; coverIdx: number; }

const byBase = new Map<number, CandEntry[]>();
for (let bi = 0; bi < 9; bi++) {
  const entries: CandEntry[] = [];
  for (const cell of ROWS[bi]!) {
    if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
    entries.push({ cell, baseIdx: bi, coverIdx: COL_OF[cell]! });
  }
  if (entries.length > 0) byBase.set(bi, entries);
}

console.log('by row:');
for (const [bi, entries] of byBase) {
  console.log(` row ${bi + 1}:`, entries.map(e => `${label(e.cell)}(c${e.coverIdx + 1})`).join(', '));
}

const eligibleBases = [...byBase.keys()];
for (const baseCombo of combineIndices(eligibleBases.length, size)) {
  const baseIndices = baseCombo.map(i => eligibleBases[i]!);
  const allCands: CandEntry[] = [];
  for (const bi of baseIndices) allCands.push(...byBase.get(bi)!);

  for (const coverCombo of combineIndices(9, size)) {
    const coverSet = new Set(coverCombo);
    const fins = allCands.filter(c => !coverSet.has(c.coverIdx));
    if (fins.length === 0) continue;
    const finBoxes = new Set(fins.map(f => BOX_OF[f.cell]!));
    if (finBoxes.size !== 1) continue;

    let reducedValid = true;
    for (const bi of baseIndices) {
      const inCover = allCands.filter(c => c.baseIdx === bi && coverSet.has(c.coverIdx));
      if (inCover.length === 0) { reducedValid = false; break; }
    }
    if (!reducedValid) continue;

    const finCells = fins.map(f => f.cell);
    const finBox = [...finBoxes][0]!;
    const baseSet = new Set(baseIndices);
    const elims: string[] = [];
    for (const ci of coverSet) {
      for (const cell of COLS[ci]!) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = ROW_OF[cell]!;
        if (baseSet.has(bi)) continue;
        if (BOX_OF[cell] !== finBox) continue;
        elims.push(label(cell));
      }
    }
    if (elims.length > 0) {
      console.log(`FOUND base rows ${baseIndices.map(i=>i+1)} cover cols ${[...coverSet].map(i=>i+1)} fins ${finCells.map(label)} elims ${elims}`);
    }
  }
}

// Also try sashimi-relaxed
console.log('\n--- sashimi relaxed ---');
for (const baseCombo of combineIndices(eligibleBases.length, size)) {
  const baseIndices = baseCombo.map(i => eligibleBases[i]!);
  const allCands: CandEntry[] = [];
  for (const bi of baseIndices) allCands.push(...byBase.get(bi)!);

  for (const coverCombo of combineIndices(9, size)) {
    const coverSet = new Set(coverCombo);
    const fins = allCands.filter(c => !coverSet.has(c.coverIdx));
    if (fins.length === 0) continue;
    const finBoxes = new Set(fins.map(f => BOX_OF[f.cell]!));
    if (finBoxes.size !== 1) continue;

    const finBox = [...finBoxes][0]!;
    const baseSet = new Set(baseIndices);
    const elims: string[] = [];
    for (const ci of coverSet) {
      for (const cell of COLS[ci]!) {
        if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
        const bi = ROW_OF[cell]!;
        if (baseSet.has(bi)) continue;
        if (BOX_OF[cell] !== finBox) continue;
        elims.push(label(cell));
      }
    }
    if (elims.includes('R5C6') && elims.includes('R6C6')) {
      console.log(`MATCH base rows ${baseIndices.map(i=>i+1)} cover cols ${[...coverSet].map(i=>i+1)} fins ${fins.map(f=>label(f.cell))}`);
    }
  }
}