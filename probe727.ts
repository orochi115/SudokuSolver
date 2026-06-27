import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { strategiesForProfile } from './packages/engine/src/strategies/profiles.js';

const file = resolve(process.cwd(), 'data/failing-diabolical/puzzles.txt');
const pz = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim().length === 81);
const strats = strategiesForProfile('human-default');
function valid(init: string, fin: string): boolean {
  if (!/^\d{81}$/.test(fin) || fin.includes('0')) return false;
  for (let i = 0; i < 81; i++) if (init[i] !== '0' && init[i] !== fin[i]) return false;
  return true;
}
let solved = 0, stuck = 0, invalid = 0, n = 0;
const slow: Array<[number, number]> = [];
for (const p of pz) {
  n++;
  const t0 = Date.now();
  let trace;
  try { trace = solve(Grid.fromString(p), strats); } catch (e) { console.log('ERR', n, String(e).slice(0, 80)); continue; }
  const dt = Date.now() - t0;
  if (dt > 300) slow.push([n, dt]);
  if (trace.outcome === 'solved') {
    solved++;
    if (!valid(p, trace.final)) { invalid++; console.log('INVALID', n, p); }
  } else stuck++;
  if (n % 100 === 0) console.log('n', n, 'solved', solved, 'stuck', stuck, 'dt_last', dt);
}
console.log('DONE solved', solved, 'stuck', stuck, 'invalid', invalid, 'n', n);
console.log('slow(>300ms):', JSON.stringify(slow.slice(0, 30)));
