import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, sees } from './common.js';
import { cellsWithDigit, findAlmostLockedSets } from './advanced-common.js';

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Sets' },
  difficulty: 80,

  apply(grid): Step | null {
    const sets = findAlmostLockedSets(grid);
    for (let i = 0; i < sets.length; i++) {
      const a = sets[i]!;
      for (let j = i + 1; j < sets.length; j++) {
        const b = sets[j]!;
        if (a.cells.some((cell) => b.cells.includes(cell))) continue;
        const common = a.digits.filter((digit) => b.digits.includes(digit));
        for (const rcc of common) {
          const aRcc = cellsWithDigit(grid, a.cells, rcc);
          const bRcc = cellsWithDigit(grid, b.cells, rcc);
          if (aRcc.length !== 1 || bRcc.length !== 1 || !sees(aRcc[0]!, bRcc[0]!)) continue;
          for (const z of common.filter((digit) => digit !== rcc)) {
            const zCells = [...cellsWithDigit(grid, a.cells, z), ...cellsWithDigit(grid, b.cells, z)];
            const eliminations = [];
            for (let cell = 0; cell < 81; cell++) {
              if (a.cells.includes(cell) || b.cells.includes(cell) || !grid.hasCandidate(cell, z)) continue;
              if (zCells.every((zc) => sees(cell, zc))) eliminations.push({ cell, digit: z });
            }
            if (eliminations.length === 0) continue;
            const cells = [...a.cells, ...b.cells];
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: { cells, candidates: candidateHighlights(cells, [rcc, z]), links: [{ from: { cell: aRcc[0]!, digit: rcc }, to: { cell: bRcc[0]!, digit: rcc }, type: 'weak' }] },
              explanation: {
                zh: `${a.cells.map(cellName).join('、')} 与 ${b.cells.map(cellName).join('、')} 构成 ALS-XZ，${rcc} 是受限公共候选，因此可删除共同候选 ${z}。`,
                en: `${a.cells.map(cellName).join(', ')} and ${b.cells.map(cellName).join(', ')} form an ALS-XZ; ${rcc} is the restricted common candidate, so shared candidate ${z} can be removed.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
