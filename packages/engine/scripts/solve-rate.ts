#!/usr/bin/env node

/**
 * Solve rate reporter.
 * 
 * Runs solve() on all ground-truth puzzles and reports non-brute-force solve rates.
 */

import fs from 'fs';
import path from 'path';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { Grid } from '../src/grid.js';

// Load ground truth data
const easyData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ground-truth/easy.json'), 'utf-8'));
const mediumData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ground-truth/medium.json'), 'utf-8'));
const hardData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ground-truth/hard.json'), 'utf-8'));
const diabolicalData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ground-truth/diabolical.json'), 'utf-8'));

const allData = [
  { name: 'easy', puzzles: easyData },
  { name: 'medium', puzzles: mediumData },
  { name: 'hard', puzzles: hardData },
  { name: 'diabolical', puzzles: diabolicalData }
];

// Create reports directory if it doesn't exist
const reportsDir = path.join(process.cwd(), 'data/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const results: any = {};

for (const { name, puzzles } of allData) {
  console.log(`Processing ${name} puzzles...`);
  
  let solvedCount = 0;
  let total = puzzles.length;
  
  for (const puzzle of puzzles) {
    const { puzzle: puzzleStr, solution } = puzzle;
    
    // Parse puzzle
    const grid = Grid.fromString(puzzleStr);
    
    // Solve with human strategies
    const trace = solve(grid, STRATEGIES);
    
    // Check if solved by human strategies (not brute force)
    if (trace.outcome === 'solved') {
      // Verify soundness
      const soundness = checkTraceSoundness(trace, solution);
      if (soundness.sound) {
        solvedCount++;
      }
    }
  }
  
  results[name] = {
    total,
    solved: solvedCount,
    rate: (solvedCount / total * 100).toFixed(2)
  };
  
  console.log(`${name}: ${solvedCount}/${total} (${results[name].rate}%)`);
}

// Write results to JSON file
const outputFile = path.join(reportsDir, 'solve-rate.json');
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

console.log('\nResults saved to:', outputFile);
console.log('\nDetailed results:');
console.log(JSON.stringify(results, null, 2));