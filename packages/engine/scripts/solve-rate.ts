#!/usr/bin/env tsx
/**
 * Solve rate statistics script (AC-4).
 * 
 * Runs the solver on all ground truth puzzles and reports the percentage
 * solved by human strategies (without resorting to brute force).
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    // Define the difficulty levels and their puzzle paths
    const difficulties = ['easy', 'medium', 'hard', 'diabolical'];
    const results: Record<string, { total: number; solved: number; rate: number }> = {};
    
    for (const difficulty of difficulties) {
      console.log(`Processing ${difficulty} puzzles...`);
      
      // Path to the ground truth files
      const groundTruthPath = join(__dirname, '../../../data/ground-truth');
      const puzzleFile = join(groundTruthPath, `${difficulty}.json`);
      
      try {
        // Read the JSON file
        const content = await fs.readFile(puzzleFile, 'utf-8');
        const jsonData = JSON.parse(content);
        
        // The JSON structure is an array of objects with puzzle and solution
        const puzzles = Array.isArray(jsonData) ? jsonData : [];
        
        let solvedCount = 0;
        let totalProcessed = 0;
        
        for (const puzzleData of puzzles) {
          let puzzleStr;
          
          // Handle the JSON structure: array of objects with puzzle field
          if (typeof puzzleData === 'object' && puzzleData.puzzle && typeof puzzleData.puzzle === 'string') {
            puzzleStr = puzzleData.puzzle;
          } else {
            // Skip if we can't find puzzle string
            continue;
          }
          
          if (puzzleStr && puzzleStr.length === 81) {
            try {
              const grid = Grid.fromString(puzzleStr);
              const trace = solve(grid, STRATEGIES);
              
              if (trace.outcome === 'solved') {
                solvedCount++;
              }
              
              totalProcessed++;
              
              // Progress indicator
              if (totalProcessed % 100 === 0) {
                console.log(`  Processed ${totalProcessed}/${puzzles.length} puzzles (${Math.round((totalProcessed/puzzles.length)*100)}%)`);
              }
            } catch (error) {
              console.error(`Error processing puzzle: ${puzzleStr.substring(0, 20)}...`, error);
            }
          }
        }
        
        const rate = totalProcessed > 0 ? solvedCount / totalProcessed : 0;
        results[difficulty] = {
          total: totalProcessed,
          solved: solvedCount,
          rate: rate
        };
        
        console.log(`  ${difficulty}: ${solvedCount}/${totalProcessed} solved (${(rate * 100).toFixed(2)}%)`);
      } catch (error) {
        console.error(`Error reading ${puzzleFile}:`, error);
        results[difficulty] = { total: 0, solved: 0, rate: 0 };
      }
    }
    
    // Create output directory if it doesn't exist
    const outputPath = join(__dirname, '../../data/reports');
    await fs.mkdir(outputPath, { recursive: true });
    
    // Write results to JSON file
    const outputFile = join(outputPath, 'solve-rate.json');
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));
    
    console.log('\nSolve rate report:');
    console.log(JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);
  } catch (error) {
    console.error('Error running solve rate script:', error);
    process.exit(1);
  }
}

main();