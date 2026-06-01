import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { basicFish } from '../src/strategies/basic-fish.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

function loadGroundTruth(diff: string) {
  const path = resolve(REPO_ROOT, 'data/ground-truth', `${diff}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const diff = 'hard';
const puzzles = loadGroundTruth(diff);

for (const entry of puzzles) {
  const grid = Grid.fromString(entry.puzzle);
  const trace = solve(grid, [basicFish]);
  // Check if basic fish alone causes any issue
}

// Let's just trace a specific puzzle step by step
const puzzle = '002904100001030400080000060504209601008000700290000045100080007000701000000503000';
const g = Grid.fromString(puzzle);
console.log('Testing basic-fish on puzzle:', puzzle);

// Let's see what basic-fish finds
const step = basicFish.apply(g);
console.log('First basic-fish step:', step);

// Let's also trace the actual solve with all strategies
const trace = solve(Grid.fromString(puzzle), STRATEGIES);
console.log('Trace steps:', trace.steps.length);
console.log('Outcome:', trace.outcome);
for (let i = 0; i < Math.min(trace.steps.length, 30); i++) {
  const s = trace.steps[i]!;
  console.log(`Step ${i}: ${s.strategyId}, placements: ${s.placements.length}, eliminations: ${s.eliminations.length}`);
  if (s.strategyId === 'basic-fish') {
    console.log('  Eliminations:', s.eliminations);
  }
}
