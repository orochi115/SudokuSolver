import type { Strategy } from '../strategy.js';
import { COLS, ROWS, candidateCellsIn, commonPeers, makeEliminationStep } from './helpers.js';

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 50,

  apply(grid) {
    const houses = [...ROWS, ...COLS];
    for (let digit = 1; digit <= 9; digit++) {
      for (let a = 0; a < houses.length; a++) {
        const first = candidateCellsIn(houses[a]!, grid, digit);
        if (first.length !== 2) continue;
        for (let b = a + 1; b < houses.length; b++) {
          if ((a < 9) !== (b < 9)) continue;
          const second = candidateCellsIn(houses[b]!, grid, digit);
          if (second.length !== 2) continue;
          const sharedPositions = a < 9
            ? first.map((cell) => cell % 9).filter((col) => second.some((cell) => cell % 9 === col))
            : first.map((cell) => Math.floor(cell / 9)).filter((row) => second.some((cell) => Math.floor(cell / 9) === row));
          if (sharedPositions.length !== 1) continue;
          const shared = sharedPositions[0]!;
          const endA = first.find((cell) => (a < 9 ? cell % 9 : Math.floor(cell / 9)) !== shared);
          const endB = second.find((cell) => (a < 9 ? cell % 9 : Math.floor(cell / 9)) !== shared);
          if (endA === undefined || endB === undefined) continue;
          const pattern = [...first, ...second];
          const eliminations = commonPeers([endA, endB]).filter((cell) => !pattern.includes(cell) && grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
          if (eliminations.length === 0) continue;
          return makeEliminationStep(
            this.id,
            pattern,
            pattern.map((cell) => ({ cell, digit })),
            eliminations,
            `${digit} 的两条共轭线共享一侧，另一侧形成摩天楼，可删除同时看到两个楼顶的 ${digit}。`,
            `Two conjugate lines for ${digit} share one side; the other ends form a Skyscraper, so any candidate seeing both roofs can be removed.`,
          );
        }
      }
    }
    return null;
  },
};
