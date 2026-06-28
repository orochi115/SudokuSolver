import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const records = JSON.parse(readFileSync(resolve(here, 'data/ground-truth/diabolical.json'), 'utf8'));
const firstByStrategy = new Map();

for (const rec of records) {
  if (!rec.solution) continue;
  const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
  const result = checkTraceSoundness(trace, rec.solution);
  if (!result.sound && result.violations[0]) {
    const v = result.violations[0];
    firstByStrategy.set(v.strategyId, (firstByStrategy.get(v.strategyId) ?? 0) + 1);
  }
}
console.log([...firstByStrategy.entries()].sort((a, b) => b[1] - a[1]));