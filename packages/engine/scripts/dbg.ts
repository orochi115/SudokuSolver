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
import { uniqueness } from '../src/strategies/uniqueness.js';

const BASE = [fullHouse,nakedSingle,hiddenSingle,lockedCandidates,nakedSubset,hiddenSubset,basicFish,singleDigitPatterns,wWing,xyWing,xyzWing,simpleColoring,uniqueness];
const here = dirname(fileURLToPath(import.meta.url));
const GT = resolve(here, '../../..', 'data/ground-truth');
let kinds:Record<string,number>={};
let firstUniq:any=null;
for (const diff of ['easy','medium','hard','diabolical']) {
  const recs = JSON.parse(readFileSync(resolve(GT, diff+'.json'),'utf8'));
  for (const rec of recs) {
    const trace = solve(Grid.fromString(rec.puzzle), BASE);
    const r = checkTraceSoundness(trace, rec.solution);
    const first = r.violations.find((v:any)=>v.strategyId==='uniqueness');
    if (first) {
      const step:any = trace.steps[first.stepIndex];
      const tag = step.explanation.en.split(':')[0];
      kinds[tag]=(kinds[tag]??0)+1;
      if(!firstUniq){ firstUniq={puzzle:rec.puzzle, exp:step.explanation.en, elim:step.eliminations, place:step.placements, v:first}; }
    }
  }
}
console.log('uniqueness bad-step subtypes:', kinds);
console.log('first:', JSON.stringify(firstUniq,null,1));
