import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid, SIZE, ROWS, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../../../data/ground-truth/hard.json');
const records = JSON.parse(readFileSync(file, 'utf8'));

const rec = records[6];
const grid = Grid.fromString(rec.puzzle);
const ordered = [...STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);
let stepCount = 0;

while (!grid.isSolved()) {
  let found = false;
  for (const strat of ordered) {
    const step = strat.apply(grid);
    if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
      if (step.strategyId === 'single-digit-patterns' && stepCount >= 16) {
        const d = 1;
        console.log(`Step ${stepCount}: single-digit-patterns, elims:`, JSON.stringify(step.eliminations));
        console.log('  highlights:', JSON.stringify(step.highlights));
        
        // Check row candidates for digit 1
        console.log('\n  Row candidates for digit 1:');
        for (let r = 0; r < 9; r++) {
          const cols: number[] = [];
          for (const c of ROWS[r]!) {
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(1))) {
              cols.push(COL_OF[c]!);
            }
          }
          if (cols.length >= 2) console.log(`    Row ${r+1}: cols [${cols.join(',')}]`);
        }
        
        console.log('\n  Column candidates for digit 1:');
        for (let c = 0; c < 9; c++) {
          const rows: number[] = [];
          for (let r = 0; r < 9; r++) {
            const cell = r * 9 + c;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & maskOf(1))) {
              rows.push(r);
            }
          }
          if (rows.length >= 2) console.log(`    Col ${c+1}: rows [${rows.map(r=>r+1).join(',')}]`);
        }
        
        process.exit(0);
      }
      applyStep(grid, step);
      stepCount++;
      found = true;
      break;
    }
  }
  if (!found) break;
  if (stepCount > 30) break;
}
