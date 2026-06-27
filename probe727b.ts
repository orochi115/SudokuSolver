import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Grid } from './packages/engine/src/grid.js';
import { strategiesForProfile } from './packages/engine/src/strategies/profiles.js';

const pz = readFileSync(resolve(process.cwd(), 'data/failing-diabolical/puzzles.txt'), 'utf8').split('\n').filter((l) => l.trim().length === 81);
const strats = [...strategiesForProfile('human-default')].sort((a, b) => a.difficulty - b.difficulty);
let worst = { p: '', dt: 0 };
for (const p of pz) {
  const g = Grid.fromString(p);
  const t0 = Date.now();
  // one full pass of all strategies (no solve loop) to time a single pass
  for (const s of strats) { try { s.apply(g); } catch { /*ignore*/ } }
  const dt = Date.now() - t0;
  if (dt > worst.dt) worst = { p, dt };
}
console.log('worst single-pass dt', worst.dt, 'puzzle', worst.p);

// profile per-strategy on the worst puzzle
const g = Grid.fromString(worst.p);
const times: Array<[string, number]> = [];
for (const s of strats) {
  const t0 = Date.now();
  try { s.apply(g); } catch { /* */ }
  times.push([s.id, Date.now() - t0]);
}
times.sort((a, b) => b[1] - a[1]);
console.log('per-strategy (top 10):');
for (const [id, t] of times.slice(0, 10)) console.log(`  ${t}ms  ${id}`);
// also check on a near-solved stuck state: run solve up to stuck then profile
import { solve } from './packages/engine/src/solver.js';
const t = solve(Grid.fromString(worst.p), strats);
console.log('outcome', t.outcome, 'steps', t.steps.length);
const g2 = Grid.fromString(worst.p);
for (const st of t.steps) for (const pl of st.placements) g2.place(pl.cell, pl.digit);
for (const st of t.steps) for (const e of st.eliminations) g2.eliminate(e.cell, e.digit);
const times2: Array<[string, number]> = [];
for (const s of strats) { const t0 = Date.now(); try { s.apply(g2); } catch { /* */ } times2.push([s.id, Date.now() - t0]); }
times2.sort((a, b) => b[1] - a[1]);
console.log('per-strategy on STUCK state (top 10):');
for (const [id, tm] of times2.slice(0, 10)) console.log(`  ${tm}ms  ${id}`);
