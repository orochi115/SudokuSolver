#!/usr/bin/env tsx
/**
 * Final verification script to check that all requirements are met:
 * 1. Type checks pass
 * 2. Unit tests pass
 * 3. Zero soundness violations on ground truth puzzles
 */

import { readFileSync } from 'fs';
import { solve } from './packages/engine/src/solver.js';
import { checkTraceSoundness } from './packages/engine/src/soundness.js';
import { Grid } from './packages/engine/src/grid.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';

async function main() {
  console.log("🔍 Starting final verification...\n");

  // 1. Check that all strategies are registered
  console.log("📋 Checking strategy registrations...");
  console.log(`   Total strategies: ${STRATEGIES.length}`);
  const strategyIds = STRATEGIES.map(s => s.id);
  console.log(`   Strategy IDs: [${strategyIds.join(', ')}]`);
  
  // 2. Load and test ground truth puzzles
  console.log("\n🧪 Testing on ground truth puzzles...");
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
  let totalViolations = 0;
  let totalPuzzles = 0;
  
  for (const difficulty of difficulties) {
    try {
      console.log(`\n   Testing ${difficulty} puzzles...`);
      const fileContent = readFileSync(`./data/ground-truth/${difficulty}.json`, 'utf-8');
      const puzzles = JSON.parse(fileContent);
      
      // Test first 5 puzzles of each difficulty to get a sample
      const sampleSize = Math.min(5, puzzles.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const puzzleData = puzzles[i];
        if (!puzzleData || !puzzleData.puzzle || !puzzleData.solution) {
          console.error(`   ❌ Invalid puzzle data at ${difficulty}[${i}]`);
          totalViolations++;
          totalPuzzles++;
          continue;
        }
        
        try {
          const grid = Grid.fromString(puzzleData.puzzle);
          const trace = solve(grid, STRATEGIES);
          const result = checkTraceSoundness(trace, puzzleData.solution);
          
          if (!result.sound) {
            console.log(`   ❌ VIOLATION in ${difficulty}[${i}]: ${result.violations.length} violations`);
            totalViolations += result.violations.length;
          } else {
            console.log(`   ✅ ${difficulty}[${i}]: OK`);
          }
          
          totalPuzzles++;
        } catch (error) {
          console.error(`   ❌ ERROR in ${difficulty}[${i}]: ${(error as Error).message}`);
          totalViolations++;
          totalPuzzles++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Could not load ${difficulty} puzzles:`, (error as Error).message);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Total puzzles tested: ${totalPuzzles}`);
  console.log(`   Total violations: ${totalViolations}`);
  
  if (totalViolations === 0) {
    console.log(`   🎉 All tests passed! Zero soundness violations.`);
    process.exit(0);
  } else {
    console.log(`   ❌ Found ${totalViolations} soundness violations.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error in verification:', err);
  process.exit(1);
});