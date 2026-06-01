import { digitsOf } from '../grid.js';
import type { CellDigit } from '../trace.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { bivalueCells, cellName, commonPeers, hasDigit, sees } from './common.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid): Step | null {
    const bivalue = bivalueCells(grid);
    for (const pivot of bivalue) {
      const [x, y] = digitsOf(grid.candidatesOf(pivot));
      if (x === undefined || y === undefined) continue;
      const xzPincers = bivalue.filter((cell) => cell !== pivot && sees(pivot, cell) && hasDigit(grid.candidatesOf(cell), x) && !hasDigit(grid.candidatesOf(cell), y));
      const yzPincers = bivalue.filter((cell) => cell !== pivot && sees(pivot, cell) && hasDigit(grid.candidatesOf(cell), y) && !hasDigit(grid.candidatesOf(cell), x));
      for (const pincerA of xzPincers) {
        const z = digitsOf(grid.candidatesOf(pincerA)).find((digit) => digit !== x);
        if (z === undefined) continue;
        for (const pincerB of yzPincers) {
          if (!hasDigit(grid.candidatesOf(pincerB), z)) continue;
          const patternCells = [pivot, pincerA, pincerB];
          const eliminations = commonPeers([pincerA, pincerB])
            .filter((cell) => !patternCells.includes(cell) && grid.hasCandidate(cell, z))
            .map((cell) => ({ cell, digit: z }));
          if (eliminations.length === 0) continue;
          return wingStep(this.id, patternCells, eliminations, [
            { cell: pivot, digit: x },
            { cell: pivot, digit: y },
            { cell: pincerA, digit: x },
            { cell: pincerA, digit: z },
            { cell: pincerB, digit: y },
            { cell: pincerB, digit: z },
          ], z);
        }
      }
    }
    return null;
  },
};

function wingStep(strategyId: string, patternCells: number[], eliminations: Array<{ cell: number; digit: number }>, candidates: CellDigit[], digit: number): Step {
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: { cells: patternCells, candidates, links: [] },
    explanation: {
      zh: `${patternCells.map(cellName).join('、')} 形成XY翼，两个翼格至少一个会放入 ${digit}，因此可从同时看见两个翼格的格删除 ${digit}。`,
      en: `${patternCells.map(cellName).join(', ')} form an XY-Wing; one pincer must contain ${digit}, so remove ${digit} from cells seeing both pincers.`,
    },
  };
}
