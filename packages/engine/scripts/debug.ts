import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { Grid } from '../src/grid.js';
import { nakedSingle, fullHouse, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, xyWing, xyzWing, wWing } from '../src/strategies/index.js';

const ROOT = process.cwd();
const DATA_DIR = resolve(ROOT, 'data/ground-truth');

const STRATEGIES_NO_SDP = [nakedSingle, fullHouse, hiddenSingle, lockedCandidates, nakedSubset, hiddenSubset, basicFish, xyWing, xyzWing, wWing];

const tiers = ['easy', 'medium', 'hard', 'diabolical'] as const;

for (const tier of tiers) {
  const content = readFileSync(resolve(DATA_DIR, tier + '.json'), 'utf-8');
  const entries = JSON.parse(content);

  let solved1 = 0, violations1 = 0;
  let solved2 = 0, violations2 = 0;

  for (const entry of entries) {
    let grid = Grid.fromString(entry.puzzle);
    let trace = solve(grid, STRATEGIES_NO_SDP);
    let result = checkTraceSoundness(trace, entry.solution);
    if (trace.outcome === 'solved') solved1++;
    if (!result.sound) violations1 += result.violations.length;

    grid = Grid.fromString(entry.puzzle);
    trace = solve(grid, STRATEGIES);
    result = checkTraceSoundness(trace, entry.solution);
    if (trace.outcome === 'solved') solved2++;
    if (!result.sound) violations2 += result.violations.length;
  }

  console.log(`${tier}: without SDP solved=${solved1} violations=${violations1}; with SDP solved=${solved2} violations=${violations2}`);
}