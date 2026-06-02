#!/usr/bin/env tsx
/**
 * Focused soundness test for critical strategies
 */

import { readFileSync } from 'fs';
import { solve } from './packages/engine/src/solver.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';
import { Grid } from './packages/engine/src/grid.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';

async function main() {
  console.log("Running focused soundness tests...");
  
  // Load a few sample puzzles from each difficulty
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
  let totalViolations = 0;
  let totalChecked = 0;
  
  for (const difficulty of difficulties) {
    console.log(`\nTesting ${difficulty} puzzles...`);
    
    try {
      const fileContent = readFileSync(`./data/ground-truth/${difficulty}.json`, 'utf-8');
      const puzzles = JSON.parse(fileContent);
      
      // Test first 5 puzzles of each difficulty
      for (let i = 0; i < Math.min(5, puzzles.length); i++) {
        const puzzleData = puzzles[i];
        if (!puzzleData || !puzzleData.puzzle || !puzzleData.solution) {
          console.error(`Invalid puzzle data at ${difficulty}[${i}]`);
          continue;
        }
        
        try {
          const grid = Grid.fromString(puzzleData.puzzle);
          const trace = solve(grid, STRATEGIES);
          const result = checkTraceSoundness(trace, puzzleData.solution);
          
          if (!result.sound) {
            console.log(`VIOLATION in ${difficulty} puzzle ${i}:`, result.violations);
            totalViolations += result.violations.length;
          }
          
          totalChecked++;
          process.stdout.write(`  ${difficulty}[${i}]: ${result.sound ? '✓' : '✗'} `);
        } catch (error) {
          console.error(`  ${difficulty}[${i}]: ERROR - ${(error as Error).message}`);
          totalViolations++;
          totalChecked++;
        }
      }
    } catch (error) {
      console.error(`Could not load ${difficulty} puzzles:`, (error as Error).message);
    }
  }
  
  console.log(`\n\nTotal checked: ${totalChecked}`);
  console.log(`Total violations: ${totalViolations}`);
  
  if (totalViolations === 0) {
    console.log('✅ All tested traces are sound!');
    process.exit(0);
  } else {
    console.log('❌ Found violations!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error in soundness test:', err);
  process.exit(1);
});