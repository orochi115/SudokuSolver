import { describe, it } from 'vitest';
import { countSolutions } from '../src/bruteforce.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('check uniqueness of 727 puzzles', () => {
  it('counts multi-solution puzzles in first 100', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const file = resolve(here, '../../../data/failing-diabolical/puzzles.txt');
    const puzzles = readFileSync(file, 'utf8').trim().split('\n').slice(0, 100);
    
    let multi = 0;
    let unique = 0;
    for (const p of puzzles) {
      const c = countSolutions(p.trim(), 2);
      if (c > 1) {
        multi++;
        console.log('MULTI:', p.trim());
      } else {
        unique++;
      }
    }
    
    console.log(`Checked: ${puzzles.length}, Unique: ${unique}, Multi: ${multi}`);
  });
});
