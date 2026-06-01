import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';
import { solveBruteforce } from './packages/engine/src/bruteforce.js';

// Load a single hard puzzle to debug
const fs = await import('fs');

try {
  const hardData = JSON.parse(fs.readFileSync('./data/ground-truth/hard.json', 'utf8'));
  
  // Test first 5 puzzles to find one with violations
  for (let i = 0; i < Math.min(5, hardData.length); i++) {
    const puzzleData = hardData[i];
    const puzzle = puzzleData.puzzle;
    const solution = puzzleData.solution;
    const grid = Grid.fromString(puzzle);

    console.log(`\nTesting puzzle #${i}:`, puzzle.substring(0, 20) + '...');
    // console.log('Solution:', solution.substring(0, 20) + '...');

    const trace = solve(grid, STRATEGIES);
    console.log('Steps taken:', trace.steps.length);
    console.log('Outcome:', trace.outcome);

    const soundness = checkTraceSoundness(trace, solution);
    console.log(`Puzzle #${i} soundness violations:`, soundness.violations.length);
    
    if (soundness.violations.length > 0) {
      console.log(`Puzzle #${i} has violations!`);
      console.log('First few violations:');
      for (let j = 0; j < Math.min(3, soundness.violations.length); j++) {
        const v = soundness.violations[j];
        console.log(`  ${j+1}. Step ${v.stepIndex} (${v.strategyId}): ${v.kind} cell ${v.cell}, digit ${v.digit}, expected ${v.expected}`);
        if (trace.steps[v.stepIndex]) {
          console.log(`      Strategy: ${trace.steps[v.stepIndex].strategyId}`);
          console.log(`      Action: ${v.kind === 'bad-placement' ? 'placement' : 'elimination'}`);
        }
      }
      break; // Stop at first puzzle with violations
    } else {
      console.log(`Puzzle #${i} ✅ No soundness violations!`);
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}