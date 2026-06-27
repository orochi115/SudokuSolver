import { describe, it, expect } from 'vitest';
import { Grid, ROW_OF, COL_OF, digitsOf } from '../src/grid.js';
import { solveBruteforce, countSolutions } from '../src/bruteforce.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solve } from '../src/solver.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';

describe('debug first-step violations', () => {
  it('puzzle 001608900 - check hidden-single on original', () => {
    const puzzle = '001608900080040020009102800000020000800000009070389060300000005000403000052000430';
    const grid = Grid.fromString(puzzle);
    
    // How many solutions does this puzzle have?
    const count = countSolutions(puzzle, 2);
    console.log(`Solution count (up to 2): ${count}`);
    
    const solution = solveBruteforce(puzzle);
    console.log('Solution:', solution);
    
    // What does hidden-single do on the original grid?
    const step = hiddenSingle.apply(grid);
    if (step) {
      const solGrid = Grid.fromString(solution ?? '');
      for (const p of step.placements) {
        const solVal = solution ? solGrid.get(p.cell) : -1;
        console.log(`Hidden single: place R${ROW_OF[p.cell]!+1}C${COL_OF[p.cell]!+1}=${p.digit} sol=${solVal} ${solVal === p.digit ? 'ok' : 'WRONG'}`);
      }
      console.log('Explanation:', step.explanation.en);
    } else {
      console.log('Hidden single finds nothing on original puzzle');
    }
  });
  
  it('puzzle 050049000 - check UR3 at step 11 in fresh grid', () => {
    // Re-trace: what does UR3 do at step 11 on the grid state AFTER 10 steps?
    const puzzle = '050049000003005007000200030390000700700010008001000052080002000500400200000650080';
    const solution = solveBruteforce(puzzle);
    if (!solution) { console.log('No solution!'); return; }
    
    // Count solutions
    const count = countSolutions(puzzle, 2);
    console.log(`Solution count (up to 2): ${count}`);
    
    // Build grid state from scratch, using ONLY EXISTING (non-new) strategies for first 10 steps
    // to avoid cascaded corruption
    const OLD_STRATEGIES = STRATEGIES.filter(s => !new Set([
      'finned-x-wing', 'finned-swordfish', 'finned-jellyfish',
      'turbot-fish', 'xy-chain', 'nice-loop',
      'hidden-unique-rectangle', 'unique-rectangle-type-3',
      'unique-rectangle-type-5', 'unique-rectangle-type-6',
    ]).has(s.id));
    
    const grid = Grid.fromString(puzzle);
    const oldTrace = solve(grid, OLD_STRATEGIES);
    const oldResult = checkTraceSoundness(oldTrace, solution);
    console.log(`Old strategies sound: ${oldResult.sound}`);
    console.log(`Old trace solved: ${oldTrace.outcome}`);
    
    // Now with new strategies
    const grid2 = Grid.fromString(puzzle);
    const newTrace = solve(grid2, STRATEGIES);
    const newResult = checkTraceSoundness(newTrace, solution);
    console.log(`New strategies sound: ${newResult.sound}`);
    if (!newResult.sound) {
      const v = newResult.violations[0]!;
      console.log(`First violation: step=${v.stepIndex} strategy=${v.strategyId}`);
    }
    
    // Manually step through new trace, finding the first new-strategy step
    const grid3 = Grid.fromString(puzzle);
    const solGrid = Grid.fromString(solution);
    for (let i = 0; i < newTrace.steps.length; i++) {
      const step = newTrace.steps[i]!;
      const isNew = new Set([
        'finned-x-wing', 'finned-swordfish', 'finned-jellyfish',
        'turbot-fish', 'xy-chain', 'nice-loop',
        'hidden-unique-rectangle', 'unique-rectangle-type-3',
        'unique-rectangle-type-5', 'unique-rectangle-type-6',
      ]).has(step.strategyId);
      
      if (isNew) {
        console.log(`\nFirst new strategy step ${i+1}: ${step.strategyId}`);
        console.log('Explanation:', step.explanation.en);
        
        // Check each elimination against solution
        for (const e of step.eliminations) {
          const solVal = solGrid.get(e.cell);
          const cands = digitsOf(grid3.candidatesOf(e.cell));
          console.log(`  Elim R${ROW_OF[e.cell]!+1}C${COL_OF[e.cell]!+1} d=${e.digit} sol=${solVal} cands={${cands.join(',')}} ${solVal === e.digit ? 'VIOLATION' : 'ok'}`);
        }
        
        // Show UR cells state
        console.log('Highlight cells:');
        for (const c of step.highlights.cells.slice(0, 6)) {
          const val = grid3.get(c);
          const cands = val === 0 ? `{${digitsOf(grid3.candidatesOf(c)).join(',')}}` : `=${val}`;
          console.log(`  R${ROW_OF[c]!+1}C${COL_OF[c]!+1}: ${cands} sol=${solGrid.get(c)} given=${Grid.fromString(puzzle).get(c)||'empty'}`);
        }
        break;
      }
      
      for (const p of step.placements) grid3.place(p.cell, p.digit);
      for (const e of step.eliminations) grid3.eliminate(e.cell, e.digit);
    }
  });
});
