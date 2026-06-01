import type { Strategy } from '../strategy.js';
import { commonPeers, digitsOf, makeEliminationStep, popcount, sees } from './helpers.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ 翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid) {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid.get(pivot) !== 0 || popcount(grid.candidatesOf(pivot)) !== 3) continue;
      const pivotDigits = digitsOf(grid.candidatesOf(pivot));
      const wings = [];
      for (let cell = 0; cell < 81; cell++) {
        if (!sees(pivot, cell) || popcount(grid.candidatesOf(cell)) !== 2) continue;
        const wingDigits = digitsOf(grid.candidatesOf(cell));
        if (wingDigits.every((digit) => pivotDigits.includes(digit))) wings.push(cell);
      }
      for (let a = 0; a < wings.length; a++) {
        for (let b = a + 1; b < wings.length; b++) {
          const wingA = wings[a]!;
          const wingB = wings[b]!;
          const aDigits = digitsOf(grid.candidatesOf(wingA));
          const bDigits = digitsOf(grid.candidatesOf(wingB));
          const common = pivotDigits.filter((digit) => aDigits.includes(digit) && bDigits.includes(digit));
          if (common.length !== 1) continue;
          const z = common[0]!;
          const union = [...new Set([...aDigits, ...bDigits])];
          if (union.length !== 3 || !pivotDigits.every((digit) => union.includes(digit))) continue;
          const eliminations = commonPeers([pivot, wingA, wingB]).filter((cell) => grid.hasCandidate(cell, z)).map((cell) => ({ cell, digit: z }));
          if (eliminations.length === 0) continue;
          const pattern = [pivot, wingA, wingB];
          return makeEliminationStep(
            this.id,
            pattern,
            pattern.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
            eliminations,
            `枢纽格和两个翼格形成 XYZ 翼，可从同时看到三格的位置删除共同候选 ${z}。`,
            `The pivot and two wings form an XYZ-Wing; remove the common candidate ${z} from cells that see all three cells.`,
          );
        }
      }
    }
    return null;
  },
};
