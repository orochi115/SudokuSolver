/**
 * E7 evidence: count states where a cheaper chain/ALS strategy also fires
 * when the solver trace chose a uniqueness (9xx) step.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve, applyStep } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';
import { STRATEGIES } from '../src/strategies/index.js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const file = resolve(REPO, 'data/failing-diabolical/puzzles.txt');
const puzzles = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length === 81);

const chainAls = [...HUMAN_DEFAULT_STRATEGIES]
  .filter((s) => s.difficulty >= 700 && s.difficulty < 900)
  .sort((a, b) => a.difficulty - b.difficulty);
const uniqIds = new Set(
  STRATEGIES.filter((s) => s.difficulty >= 900 && s.difficulty < 1000).map((s) => s.id),
);

let uniqSteps = 0;
let chainSteps = 0;
let coFireAtUniqStep = 0;

for (const p of puzzles) {
  const trace = solve(Grid.fromString(p), HUMAN_DEFAULT_STRATEGIES);
  for (const step of trace.steps) {
    if (uniqIds.has(step.strategyId)) uniqSteps++;
    if (step.strategyId && chainAls.some((s) => s.id === step.strategyId)) chainSteps++;
  }

  const work = Grid.fromString(p);
  for (const step of trace.steps) {
    if (uniqIds.has(step.strategyId)) {
      let cheaperFires = false;
      for (const s of chainAls) {
        const st = s.apply(work);
        if (st && (st.placements.length > 0 || st.eliminations.length > 0)) {
          cheaperFires = true;
          break;
        }
      }
      if (cheaperFires) coFireAtUniqStep++;
    }
    applyStep(work, step);
  }
}

console.log(
  JSON.stringify(
    {
      puzzles: puzzles.length,
      uniqSteps,
      chainAlsSteps: chainSteps,
      coFireAtUniqStep,
      note: 'coFireAtUniqStep = uniqueness trace steps where a 7xx/8xx strategy also fired on same grid',
    },
    null,
    2,
  ),
);