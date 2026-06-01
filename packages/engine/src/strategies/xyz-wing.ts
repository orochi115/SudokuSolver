import { digitsOf } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, commonPeers, hasDigit, sees, trivalueCells, bivalueCells } from './common.js';

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid): Step | null {
    const bivalue = bivalueCells(grid);
    for (const pivot of trivalueCells(grid)) {
      const pivotDigits = digitsOf(grid.candidatesOf(pivot));
      for (const z of pivotDigits) {
        const others = pivotDigits.filter((digit) => digit !== z);
        const [x, y] = others;
        if (x === undefined || y === undefined) continue;
        const xz = bivalue.filter((cell) => cell !== pivot && sees(pivot, cell) && grid.candidatesOf(cell) === (hasDigit(grid.candidatesOf(cell), x) && hasDigit(grid.candidatesOf(cell), z) ? grid.candidatesOf(cell) : -1));
        const yz = bivalue.filter((cell) => cell !== pivot && sees(pivot, cell) && hasDigit(grid.candidatesOf(cell), y) && hasDigit(grid.candidatesOf(cell), z));
        for (const pincerA of xz) {
          for (const pincerB of yz) {
            if (pincerA === pincerB) continue;
            const patternCells = [pivot, pincerA, pincerB];
            const eliminations = commonPeers(patternCells)
              .filter((cell) => !patternCells.includes(cell) && grid.hasCandidate(cell, z))
              .map((cell) => ({ cell, digit: z }));
            if (eliminations.length === 0) continue;
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: { cells: patternCells, candidates: candidateHighlights(patternCells, [z]), links: [] },
              explanation: {
                zh: `${patternCells.map(cellName).join('、')} 形成XYZ翼，候选数 ${z} 可从同时看见枢纽格和两个翼格的格中删除。`,
                en: `${patternCells.map(cellName).join(', ')} form an XYZ-Wing, so candidate ${z} can be removed from cells seeing the pivot and both pincers.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
