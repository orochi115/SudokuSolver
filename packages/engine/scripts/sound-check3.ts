import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { nakedSingle } from '../src/strategies/naked-single.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { simpleColoring } from '../src/strategies/simple-coloring.js';
import { aic } from '../src/strategies/aic.js';
import { als } from '../src/strategies/als.js';
import { uniqueness } from '../src/strategies/uniqueness.js';
import { sueDeCoq } from '../src/strategies/sue-de-coq.js';

const BASE = [fullHouse,nakedSingle,hiddenSingle,lockedCandidates,nakedSubset,hiddenSubset,basicFish,singleDigitPatterns,wWing,xyWing,xyzWing,simpleColoring];
const here = dirname(fileURLToPath(import.meta.url));
const GT = resolve(here, '../../..', 'data/ground-truth');
function run(name:string, strats:any[]) {
  const byStrat: Record<string, number> = {}; let total=0; let firstEx='';
  for (const diff of ['easy','medium','hard','diabolical']) {
    const recs = JSON.parse(readFileSync(resolve(GT, diff+'.json'),'utf8'));
    for (const rec of recs) {
      const trace = solve(Grid.fromString(rec.puzzle), strats);
      const r = checkTraceSoundness(trace, rec.solution);
      for (const v of r.violations) { byStrat[v.strategyId]=(byStrat[v.strategyId]??0)+1; total++;
        if(!firstEx && v.strategyId===name) firstEx=rec.puzzle+' step'+v.stepIndex+' '+v.kind+' cell'+v.cell+' d'+v.digit; }
    }
  }
  console.log(name, 'total', total, JSON.stringify(byStrat), firstEx);
}
run('aic', [...BASE, aic]);
run('als', [...BASE, als]);
run('uniqueness', [...BASE, uniqueness]);
run('sue-de-coq', [...BASE, sueDeCoq]);
