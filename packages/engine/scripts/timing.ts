import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const here = dirname(fileURLToPath(import.meta.url));
const GT = resolve(here, '../../..', 'data/ground-truth');
const recs = JSON.parse(readFileSync(resolve(GT, 'diabolical.json'),'utf8'));
let solved=0, viol=0; const t0=Date.now();
let slow:[string,number][]=[];
for (let i=0;i<recs.length;i++){
  const rec=recs[i];
  const s=Date.now();
  const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
  const dt=Date.now()-s;
  if (dt>2000) slow.push([rec.puzzle.slice(0,20), dt]);
  if (trace.outcome==='solved') solved++;
  const r=checkTraceSoundness(trace, rec.solution);
  viol+=r.violations.length;
}
console.log('diabolical solved', solved, '/', recs.length, 'viol', viol, 'time', ((Date.now()-t0)/1000).toFixed(1)+'s');
console.log('slow puzzles (>2s):', slow.length, slow.slice(0,5));
