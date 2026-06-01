import { Grid } from '../src/grid.js';
import { applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const recs = JSON.parse(readFileSync(resolve(here,'../../..','data/ground-truth/diabolical.json'),'utf8'));
const rec = recs.find((r:any)=>r.puzzle.startsWith('00400500000816000000'));
const ordered=[...STRATEGIES].sort((a,b)=>a.difficulty-b.difficulty);
const g=Grid.fromString(rec.puzzle);
const acc:Record<string,number>={};
let steps=0;
while(!g.isSolved() && steps<1000){
  let prog=false;
  for(const s of ordered){
    const t=Date.now();
    const step=s.apply(g);
    acc[s.id]=(acc[s.id]??0)+(Date.now()-t);
    if(step && (step.placements.length||step.eliminations.length)){ applyStep(g,step); prog=true; steps++; break; }
  }
  if(!prog) break;
}
console.log('solved',g.isSolved(),'steps',steps);
console.log('time per strategy (ms):', Object.entries(acc).sort((a,b)=>b[1]-a[1]).slice(0,8));
