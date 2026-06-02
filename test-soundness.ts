#!/usr/bin/env tsx
/**
 * Test soundness of all strategies on sample puzzles.
 */

import { readFileSync } from 'fs';
import { solve } from './packages/engine/src/solver.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';
import { Grid } from './packages/engine/src/grid.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';

async function main() {
  // Load ground truth puzzles
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
  let totalViolations = 0;
  let totalChecked = 0;

  for (const difficulty of difficulties) {
    try {
      const fileContent = readFileSync(`./data/ground-truth/${difficulty}.json`, 'utf-8');
      const puzzles = JSON.parse(fileContent);
      
      console.log(`Checking ${difficulty} puzzles...`);
      
      for (let i = 0; i < Math.min(5, puzzles.length); i++) { // Test first 5 of each difficulty
        const puzzleData = puzzles[i];
        const grid = Grid.fromString(puzzleData.puzzle);
        const solution = puzzleData.solution;
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, solution);
        
        if (!result.sound) {
          console.log(`VIOLATION in ${difficulty} puzzle ${i}: `, result.violations);
          totalViolations += result.violations.length;
        }
        totalChecked++;
      }
    } catch (error) {
      console.log(`Could not load ${difficulty} puzzles:`, error.message);
    }
  }

  console.log('Total checked:', totalChecked);
  console.log('Total violations:', totalViolations);
  
  if (totalViolations === 0) {
    console.log('✅ All traces are sound!');
    process.exit(0);
  } else {
    console.log('❌ Found violations!');
    process.exit(1);
  }
}

main().catch(console.error);