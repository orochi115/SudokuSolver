import { digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidatesFor, cellsSeeingBoth, createEliminationStep, sees } from './utils.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 55,
  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      const pivotMask = grid.candidatesOf(pivot);
      if (grid.get(pivot) !== 0 || popcount(pivotMask) !== 2) continue;
      const pivotDigits = digitsOf(pivotMask);
      for (let a = 0; a < 81; a++) {
        if (a === pivot || !sees(pivot, a) || popcount(grid.candidatesOf(a)) !== 2) continue;
        for (let b = a + 1; b < 81; b++) {
          if (b === pivot || !sees(pivot, b) || popcount(grid.candidatesOf(b)) !== 2) continue;
          const aDigits = digitsOf(grid.candidatesOf(a));
          const bDigits = digitsOf(grid.candidatesOf(b));
          for (const x of pivotDigits) {
            const y = pivotDigits.find((digit) => digit !== x)!;
            const z = aDigits.find((digit) => digit !== x);
            if (z === undefined || !aDigits.includes(x) || !bDigits.includes(y) || !bDigits.includes(z) || z === y) continue;
            const eliminations: CellDigit[] = cellsSeeingBoth(a, b).filter((cell) => ![pivot, a, b].includes(cell) && grid.hasCandidate(cell, z)).map((cell) => ({ cell, digit: z }));
            if (eliminations.length === 0) continue;
            return createEliminationStep({ strategy: this, cells: [pivot, a, b], candidates: [...candidatesFor([pivot], x), ...candidatesFor([pivot], y), ...candidatesFor([a, b], z)], eliminations, zh: `${pivotDigits.join('/')} 双值格作为枢纽形成 XY翼，可从同时看见两个钳子的格中删除 ${z}。`, en: `The bivalue pivot forms an XY-Wing, so ${z} can be removed from cells seeing both pincers.` });
          }
        }
      }
    }
    return null;
  },
};
