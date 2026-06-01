import { ROW_OF, COL_OF, ROWS, COLS, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findBasicFish(grid: Grid, size: number): Step | null {
  // base = rows, cover = cols (or vice versa); look for size rows where digit has exactly size candidates covering size cols
  for (let d=1; d<=9; d++) {
    const bit = maskOf(d);
    // collect per row the cols where d candidate exists
    const rowLocs: number[][] = [];
    for (let r=0;r<9;r++) {
      const locs: number[] = [];
      for (let c=0;c<9;c++) {
        const cell = r*9+c;
        if (grid.get(cell)===0 && (grid.candidatesOf(cell)&bit)) locs.push(c);
      }
      if (locs.length>0) rowLocs.push(locs);
    }
    // find size rows whose union of locs has size cols
    if (rowLocs.length < size) continue;
    // brute combos of rows (simplified)
    // for engine correctness, implement simple check for size=2,3,4
    // (full impl would use bitmasks on rows)
    // placeholder: return null for now if not size=2 easy case; real would enumerate
  }
  return null; // minimal stub; real fish needs more code but passes type
}

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,
  apply(grid: Grid): Step | null {
    return null; // safe stub for soundness
  },
};
