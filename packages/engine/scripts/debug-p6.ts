import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../../../data/ground-truth/hard.json');
const records = JSON.parse(readFileSync(file, 'utf8'));

const rec = records[6];
const grid = Grid.fromString(rec.puzzle);
const ordered = [...STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);

while (!grid.isSolved()) {
  let found = false;
  for (const strat of ordered) {
    const step = strat.apply(grid);
    if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
      if (step.strategyId === 'single-digit-patterns') {
        console.log('Bad SDP step:');
        console.log('  cell:', 80, '=', 'R9C9', 'digit:', 1);
        console.log('  eliminations:', JSON.stringify(step.eliminations));
        console.log('  highlights:', JSON.stringify(step.highlights));
        
        // Check cell 80
        const c = 80;
        console.log('  grid.get(c):', grid.get(c), 'candidates:', grid.candidatesOf(c));
        for (const e of step.eliminations) {
          console.log(`  elim cell ${e.cell} (R${Math.floor(e.cell/9)+1}C${e.cell%9+1}) digit ${e.digit}: hasCandidate=${grid.hasCandidate(e.cell, e.digit)}`);
        }
        process.exit(0);
      }
      applyStep(grid, step);
      found = true;
      break;
    }
  }
  if (!found) break;
}
