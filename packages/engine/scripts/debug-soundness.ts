import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../../../data/ground-truth/hard.json');
const records = JSON.parse(readFileSync(file, 'utf8'));

for (let i = 0; i < Math.min(records.length, 10); i++) {
  const rec = records[i];
  const grid = Grid.fromString(rec.puzzle);
  const trace = solve(grid, STRATEGIES);
  const result = checkTraceSoundness(trace, rec.solution);
  if (!result.sound) {
    console.log(`\nPuzzle ${i}: ${result.violations.length} violations`);
    const byStrategy = new Map<string, number>();
    for (const v of result.violations) {
      byStrategy.set(v.strategyId, (byStrategy.get(v.strategyId) || 0) + 1);
    }
    console.log('  By strategy:', Object.fromEntries(byStrategy));
    console.log('  First violation:', JSON.stringify(result.violations[0], null, 2));
  } else {
    console.log(`Puzzle ${i}: sound, ${trace.steps.length} steps`);
  }
}
