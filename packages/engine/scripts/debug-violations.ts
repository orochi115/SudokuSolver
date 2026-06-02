/**
 * Debug script to find which step produces the first violation.
 */
import { readFileSync } from 'node:fs';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

const puzzles = JSON.parse(readFileSync('/Users/sakura/LLM_Work/sudoku-wt/minimax-m27/data/ground-truth/hard.json', 'utf8'));

for (let pi = 0; pi < puzzles.length; pi++) {
  const { puzzle, solution } = puzzles[pi];
  const trace = solve(Grid.fromString(puzzle), STRATEGIES);
  const result = checkTraceSoundness(trace, solution);
  if (!result.sound) {
    console.log(`\n=== Hard puzzle ${pi} has ${result.violations.length} violations ===`);
    for (const v of result.violations.slice(0, 3)) {
      console.log(`  First violation at step ${v.stepIndex} strategy=${v.strategyId} kind=${v.kind} cell=${v.cell} digit=${v.digit} expected=${v.expected}`);
      const step = trace.steps[v.stepIndex];
      if (step) {
        console.log(`    step.eliminations:`, JSON.stringify(step.eliminations));
      }
    }
    if (pi >= 5) break;
  }
}