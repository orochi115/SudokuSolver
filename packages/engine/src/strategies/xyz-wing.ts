import { digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidatesFor, createEliminationStep, sees } from './utils.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 56,
  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      const pivotMask = grid.candidatesOf(pivot);
      if (grid.get(pivot) !== 0 || popcount(pivotMask) !== 3) continue;
      const pivotDigits = digitsOf(pivotMask);
      for (let a = 0; a < 81; a++) {
        if (a === pivot || !sees(pivot, a) || popcount(grid.candidatesOf(a)) !== 2 || (grid.candidatesOf(a) | pivotMask) !== pivotMask) continue;
        for (let b = a + 1; b < 81; b++) {
          if (b === pivot || !sees(pivot, b) || popcount(grid.candidatesOf(b)) !== 2 || (grid.candidatesOf(b) | pivotMask) !== pivotMask) continue;
          if ((grid.candidatesOf(a) | grid.candidatesOf(b)) !== pivotMask) continue;
          const common = digitsOf(grid.candidatesOf(a) & grid.candidatesOf(b));
          if (common.length !== 1) continue;
          const z = common[0]!;
          const eliminations: CellDigit[] = [];
          for (let cell = 0; cell < 81; cell++) {
            if ([pivot, a, b].includes(cell)) continue;
            if (grid.hasCandidate(cell, z) && sees(cell, pivot) && sees(cell, a) && sees(cell, b)) eliminations.push({ cell, digit: z });
          }
          if (eliminations.length === 0) continue;
          return createEliminationStep({ strategy: this, cells: [pivot, a, b], candidates: [...candidatesFor([pivot], pivotDigits[0]!), ...candidatesFor([pivot], pivotDigits[1]!), ...candidatesFor([pivot], pivotDigits[2]!), ...candidatesFor([a, b], z)], eliminations, zh: `三值枢纽 ${pivotDigits.join('/')} 与两个双值钳子形成 XYZ翼，可从同时看见三者的格中删除 ${z}。`, en: `The trivalue pivot ${pivotDigits.join('/')} and two bivalue pincers form an XYZ-Wing, so ${z} is removed from cells seeing all three.` });
        }
      }
    }
    return null;
  },
};
