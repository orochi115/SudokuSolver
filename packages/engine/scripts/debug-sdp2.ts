import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid, ROW_OF, COL_OF, BOX_OF } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const puzzle = '002904100001030400080000060504209601008000700290000045100080007000701000000503000';
let g = Grid.fromString(puzzle);

// Replay up to step 21
const trace = solve(g, STRATEGIES);
let testG = Grid.fromString(puzzle);
for (let i = 0; i < 22; i++) {
  applyStep(testG, trace.steps[i]!);
}

// Now test single-digit-patterns at this state
const step = singleDigitPatterns.apply(testG);
console.log('Step:', step);

// Check the candidates for digit 2 in the grid
console.log('\nCandidates for digit 2:');
for (let r = 0; r < 9; r++) {
  const row: string[] = [];
  for (let c = 0; c < 9; c++) {
    const cell = r * 9 + c;
    if (testG.get(cell) === 0 && testG.hasCandidate(cell, 2)) {
      row.push(`(${r},${c})`);
    }
  }
  if (row.length > 0) console.log(`  Row ${r}: ${row.join(', ')}`);
}

for (let c = 0; c < 9; c++) {
  const col: string[] = [];
  for (let r = 0; r < 9; r++) {
    const cell = r * 9 + c;
    if (testG.get(cell) === 0 && testG.hasCandidate(cell, 2)) {
      col.push(`(${r},${c})`);
    }
  }
  if (col.length > 0) console.log(`  Col ${c}: ${col.join(', ')}`);
}

// Print the grid state
console.log('\nGrid state after step 21:');
for (let r = 0; r < 9; r++) {
  const row: string[] = [];
  for (let c = 0; c < 9; c++) {
    const cell = r * 9 + c;
    if (testG.get(cell) !== 0) {
      row.push(String(testG.get(cell)));
    } else {
      row.push('.');
    }
  }
  console.log('  ' + row.join(''));
}
