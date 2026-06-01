import type { Strategy } from '../strategy.js';
import { bivalueCells, commonPeers, digitsOf, makeEliminationStep, sees } from './helpers.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY 翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid) {
    const bivalue = bivalueCells(grid);
    for (const hinge of bivalue) {
      const [x, y] = digitsOf(grid.candidatesOf(hinge));
      if (x === undefined || y === undefined) continue;
      const peers = bivalue.filter((cell) => sees(hinge, cell));
      for (const wingA of peers) {
        const aDigits = digitsOf(grid.candidatesOf(wingA));
        for (const wingB of peers) {
          if (wingA >= wingB) continue;
          const bDigits = digitsOf(grid.candidatesOf(wingB));
          for (const z of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
            if (z === x || z === y) continue;
            const ok = aDigits.includes(x) && aDigits.includes(z) && bDigits.includes(y) && bDigits.includes(z)
              || aDigits.includes(y) && aDigits.includes(z) && bDigits.includes(x) && bDigits.includes(z);
            if (!ok) continue;
            const eliminations = commonPeers([wingA, wingB]).filter((cell) => grid.hasCandidate(cell, z)).map((cell) => ({ cell, digit: z }));
            if (eliminations.length === 0) continue;
            const pattern = [hinge, wingA, wingB];
            return makeEliminationStep(
              this.id,
              pattern,
              pattern.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
              eliminations,
              `枢纽格与两个翼格形成 XY 翼，可从同时看到两个翼格的位置删除共同候选 ${z}。`,
              `The pivot and two wings form an XY-Wing; remove the shared candidate ${z} from cells that see both wings.`,
            );
          }
        }
      }
    }
    return null;
  },
};
