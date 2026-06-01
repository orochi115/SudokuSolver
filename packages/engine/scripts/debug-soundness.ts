import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

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
  const trace = solve(grid, STRATEGIES);
  const result = checkTraceSoundness(trace, entry.solution);
  if (!result.sound) {
    console.log('Puzzle:', entry.puzzle);
    console.log('Violations:', result.violations.slice(0, 5));
    break;
  }
}
