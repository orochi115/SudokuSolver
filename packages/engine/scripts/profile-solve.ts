import { readFileSync } from 'node:fs';
import { Grid } from '../src/grid.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';

const puzzles = readFileSync('data/failing-diabolical/puzzles.txt', 'utf8').split('\n').filter(l => l.trim().length === 81);
const ordered = [...HUMAN_DEFAULT_STRATEGIES].sort((a, b) => a.difficulty - b.difficulty);

const strategyTimes = new Map<string, number>();
const strategyCalls = new Map<string, number>();

for (let pi = 0; pi < 10; pi++) {
  const grid = Grid.fromString(puzzles[pi]!);
  const work = grid.clone();
  const { solve } = await import('../src/solver.js');
  const trace = solve(grid, HUMAN_DEFAULT_STRATEGIES);
  
  for (const step of trace.steps) {
    for (const p of step.placements) work.place(p.cell, p.digit);
    for (const e of step.eliminations) work.eliminate(e.cell, e.digit);
  }
  
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const strat of ordered) {
      const t0 = performance.now();
      const step = strat.apply(work);
      const dt = performance.now() - t0;
      strategyTimes.set(strat.id, (strategyTimes.get(strat.id) ?? 0) + dt);
      strategyCalls.set(strat.id, (strategyCalls.get(strat.id) ?? 0) + 1);
      if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
        for (const p of step.placements) work.place(p.cell, p.digit);
        for (const e of step.eliminations) work.eliminate(e.cell, e.digit);
        progressed = true;
        break;
      }
    }
  }
}

const sorted = [...strategyTimes.entries()].sort((a, b) => b[1] - a[1]);
console.log('Top 15 slowest strategies (10 puzzles, stuck iteration):');
for (const [id, time] of sorted.slice(0, 15)) {
  const calls = strategyCalls.get(id)!;
  console.log(`  ${id.padEnd(30)} ${time.toFixed(0).padStart(6)}ms (${calls} calls, ${(time/calls).toFixed(1)}ms/call)`);
}
