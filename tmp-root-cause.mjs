import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const GT = resolve(here, 'data/ground-truth');
const rootCause = new Map();

for (const diff of ['easy', 'medium', 'hard', 'diabolical']) {
  const file = resolve(GT, `${diff}.json`);
  if (!existsSync(file)) continue;
  const records = JSON.parse(readFileSync(file, 'utf8'));
  for (const rec of records) {
    if (!rec.solution) continue;
    const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
    const result = checkTraceSoundness(trace, rec.solution);
    if (!result.sound) {
      const first = result.violations.reduce((a, b) => (a.stepIndex <= b.stepIndex ? a : b));
      const key = `${first.strategyId} (${diff})`;
      rootCause.set(key, (rootCause.get(key) ?? 0) + 1);
    }
  }
}
console.log([...rootCause.entries()].sort((a, b) => b[1] - a[1]));