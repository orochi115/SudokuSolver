import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { applyStep } from '../src/solver.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

function loadGroundTruth(diff: string) {
  const path = resolve(REPO_ROOT, 'data/ground-truth', `${diff}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const diff = 'hard';
const puzzles = loadGroundTruth(diff);
const entry = puzzles.find((p: any) => p.puzzle === '002904100001030400080000060504209601008000700290000045100080007000701000000503000')!;

let g = Grid.fromString(entry.puzzle);

// Replay up to step 22
const trace = solve(g, STRATEGIES);
console.log('Total steps:', trace.steps.length);
for (let i = 0; i < 30; i++) {
  const s = trace.steps[i]!;
  console.log(`Step ${i}: ${s.strategyId}, eliminations:`, s.eliminations);
  if (s.strategyId === 'single-digit-patterns') {
    console.log('  Full step:', JSON.stringify(s, null, 2));
  }
}

// Let's also directly test single-digit-patterns at step 22
// First replay steps 0-21
let testG = Grid.fromString(entry.puzzle);
for (let i = 0; i < 22; i++) {
  applyStep(testG, trace.steps[i]!);
}
const sdpStep = singleDigitPatterns.apply(testG);
console.log('\nDirect single-digit-patterns at step 22:');
console.log(sdpStep);
