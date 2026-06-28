import { Grid } from './src/grid.js';
import { STRATEGIES } from './src/strategies/index.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = resolve(HERE, '../../data/failing-diabolical/puzzles.txt');

const puzzles = readFileSync(DEFAULT_FILE, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l.length === 81 && !l.startsWith('#'))
  .slice(0, 727);

const ordered = [...STRATEGIES]
  .filter(s => s.id !== 'forcing-chain')
  .sort((a, b) => a.difficulty - b.difficulty);

console.log(`Loaded ${puzzles.length} puzzles.`);

const overallStart = performance.now();
let solvedCount = 0;

for (let pIdx = 0; pIdx < puzzles.length; pIdx++) {
  const puzzle = puzzles[pIdx]!;
  const grid = Grid.fromString(puzzle);
  const work = grid.clone();
  
  let stepsCount = 0;
  while (!work.isSolved() && stepsCount < 1000) {
    let progressed = false;
    for (const strat of ordered) {
      const start = performance.now();
      const step = strat.apply(work);
      const duration = performance.now() - start;
      if (duration > 300) {
        console.log(`[SLOW] Puzzle #${pIdx} step ${stepsCount} strategy ${strat.id} took ${duration.toFixed(2)}ms`);
      }
      if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
        for (const p of step.placements) work.place(p.cell, p.digit);
        for (const e of step.eliminations) work.eliminate(e.cell, e.digit);
        stepsCount++;
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
  }
  if (work.isSolved()) solvedCount++;
  if ((pIdx + 1) % 50 === 0) {
    console.log(`Progress: ${pIdx + 1}/${puzzles.length} puzzles checked. Solved: ${solvedCount}. Time elapsed: ${((performance.now() - overallStart)/1000).toFixed(2)}s`);
  }
}
console.log(`Completed. Solved: ${solvedCount}/${puzzles.length} puzzles. Total time: ${((performance.now() - overallStart)/1000).toFixed(2)}s`);

