#!/usr/bin/env tsx
/**
 * Solve rate statistics script (FR-4, AC-4).
 * 
 * Runs the solver on all ground-truth puzzles and reports non-brute-force solve rates
 * by difficulty tier. Outputs to data/reports/solve-rate.json.
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface GroundTruthPuzzle {
  puzzle: string;
  solution: string;
  unique: boolean;
}

interface SolveRateReport {
  timestamp: string;
  summary: {
    total: number;
    solved: number;
    rate: number;
  };
  byDifficulty: {
    easy: { total: number; solved: number; rate: number };
    medium: { total: number; solved: number; rate: number };
    hard: { total: number; solved: number; rate: number };
    diabolical: { total: number; solved: number; rate: number };
  };
  details: {
    easy: { index: number; solved: boolean; steps: number; sound: boolean }[];
    medium: { index: number; solved: boolean; steps: number; sound: boolean }[];
    hard: { index: number; solved: boolean; steps: number; sound: boolean }[];
    diabolical: { index: number; solved: boolean; steps: number; sound: boolean }[];
  };
}

async function runSolveRate(): Promise<void> {
  console.log('Running solve rate statistics...');
  
  const report: SolveRateReport = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, solved: 0, rate: 0 },
    byDifficulty: {
      easy: { total: 0, solved: 0, rate: 0 },
      medium: { total: 0, solved: 0, rate: 0 },
      hard: { total: 0, solved: 0, rate: 0 },
      diabolical: { total: 0, solved: 0, rate: 0 },
    },
    details: {
      easy: [],
      medium: [],
      hard: [],
      diabolical: [],
    },
  };
  
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;
  for (const difficulty of difficulties) {
    console.log(`Processing ${difficulty}...`);
    const dataPath = join(__dirname, `../../../data/ground-truth/${difficulty}.json`);
    const jsonData = await fs.readFile(dataPath, 'utf8');
    const puzzles: GroundTruthPuzzle[] = JSON.parse(jsonData);
    
    report.byDifficulty[difficulty].total = puzzles.length;
    
    for (let i = 0; i < puzzles.length; i++) {
      const puzzleData = puzzles[i]!;
      const grid = Grid.fromString(puzzleData.puzzle);
      const solution = puzzleData.solution;
      
      try {
        const trace = solve(grid, STRATEGIES);
        const soundness = checkTraceSoundness(trace, solution);
        
        const solved = trace.outcome === 'solved' && soundness.sound;
        const record = {
          index: i,
          solved,
          steps: trace.steps.length,
          sound: soundness.sound,
        };
        
        report.details[difficulty].push(record);
        
        if (solved) {
          report.byDifficulty[difficulty].solved++;
          report.summary.solved++;
        }
        
        // Log progress occasionally
        if (i % 50 === 0) {
          console.log(`  ${difficulty}: ${i}/${puzzles.length} processed`);
        }
      } catch (error) {
        console.error(`Error processing ${difficulty}[${i}]:`, error);
        report.details[difficulty].push({
          index: i,
          solved: false,
          steps: 0,
          sound: false,
        });
      }
    }
    
    report.byDifficulty[difficulty].rate = 
      puzzles.length > 0 
        ? parseFloat((report.byDifficulty[difficulty].solved / puzzles.length).toFixed(4))
        : 0;
    
    report.summary.total += puzzles.length;
  }
  
  report.summary.rate = 
    report.summary.total > 0 
      ? parseFloat((report.summary.solved / report.summary.total).toFixed(4))
      : 0;
  
  // Create reports directory if it doesn't exist
  const reportsDir = join(__dirname, '../../../data/reports');
  await fs.mkdir(reportsDir, { recursive: true });
  
  // Write the report
  const outputPath = join(reportsDir, 'solve-rate.json');
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  
  console.log('\nSolve Rate Report:');
  console.log('==================');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall: ${report.summary.solved}/${report.summary.total} = ${(report.summary.rate * 100).toFixed(2)}%`);
  console.log('');
  
  for (const difficulty of difficulties) {
    const stats = report.byDifficulty[difficulty];
    console.log(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${stats.solved}/${stats.total} = ${(stats.rate * 100).toFixed(2)}%`);
  }
  
  console.log(`\nDetailed report saved to: ${outputPath}`);
}

// Check if this module is the main module being run
const currentFile = fileURLToPath(import.meta.url);
const mainModule = process.argv[1];

if (mainModule === currentFile) {
  runSolveRate().catch(console.error);
}

export { runSolveRate };