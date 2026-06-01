import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid, SIZE, ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, PEERS_OF, maskOf } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../../../data/ground-truth/hard.json');
const records = JSON.parse(readFileSync(file, 'utf8'));

// Debug puzzle 6 - reconstruct grid up to step 15
const rec = records[6];
const grid = Grid.fromString(rec.puzzle);
const ordered = [...STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
let steps = 0;

while (steps < 15) {
  let found = false;
  for (const strat of ordered) {
    if (strat.id === 'single-digit-patterns') continue;
    const step = strat.apply(grid);
    if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
      applyStep(grid, step);
      steps++;
      found = true;
      break;
    }
  }
  if (!found) break;
}

console.log(`After ${steps} non-SDP steps`);

// Now check what SDP finds
const checkRowPattern = () => {
  for (let d = 1; d <= 9; d++) {
    const rowsWithTwo: number[] = [];
    const rowCols: number[][] = Array.from({ length: 9 }, () => []);
    for (let r = 0; r < 9; r++) {
      for (const c of ROWS[r]!) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(d))) {
          rowCols[r]!.push(COL_OF[c]!);
        }
      }
      if (rowCols[r]!.length === 2) rowsWithTwo.push(r);
    }
    const colsWithTwo: number[] = [];
    const colRows: number[][] = Array.from({ length: 9 }, () => []);
    for (let c = 0; c < 9; c++) {
      for (const cell of COLS[c]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & maskOf(d))) {
          colRows[c]!.push(ROW_OF[cell]!);
        }
      }
      if (colRows[c]!.length === 2) colsWithTwo.push(c);
    }
    if (rowsWithTwo.length > 0 || colsWithTwo.length > 0) {
      console.log(`  Digit ${d}: rowsWithTwo=[${rowsWithTwo.map(r=>r+1)}], colsWithTwo=[${colsWithTwo.map(c=>c+1)}]`);
      for (const r of rowsWithTwo) console.log(`    Row ${r+1}: cols [${rowCols[r]!.map(c=>c+1)}]`);
      for (const c of colsWithTwo) console.log(`    Col ${c+1}: rows [${colRows[c]!.map(r=>r+1)}]`);
    }
  }
};
console.log("\nConjugate pairs:");
checkRowPattern();

// Check if cell 80 has candidate 1
console.log(`\nCell 80 (R9C9): value=${grid.get(80)}, candidates=${grid.candidatesOf(80)}, hasCandidate1=${grid.hasCandidate(80, 1)}`);
console.log(`Cell 79 (R9C8): value=${grid.get(79)}, candidates=${grid.candidatesOf(79)}`);
console.log(`Cell 71 (R8C8): value=${grid.get(71)}, candidates=${grid.candidatesOf(71)}`);
console.log(`Cell 72 (R9C1): value=${grid.get(72)}, candidates=${grid.candidatesOf(72)}`);

// Now run the actual SDP
const sdpStep = singleDigitPatterns.apply(grid);
if (sdpStep) {
  console.log(`\nSDP found: elims=${JSON.stringify(sdpStep.eliminations)}`);
}
