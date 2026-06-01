import type { Strategy } from '../strategy.js';
import { bivalueCells, commonPeers, digitsOf, makeEliminationStep, sees, strongLinks } from './helpers.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W 翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid) {
    const bivalue = bivalueCells(grid);
    for (let a = 0; a < bivalue.length; a++) {
      for (let b = a + 1; b < bivalue.length; b++) {
        const wingA = bivalue[a]!;
        const wingB = bivalue[b]!;
        const pair = grid.candidatesOf(wingA);
        if (grid.candidatesOf(wingB) !== pair) continue;
        const [x, y] = digitsOf(pair);
        if (x === undefined || y === undefined) continue;
        for (const linkDigit of [x, y]) {
          const eliminateDigit = linkDigit === x ? y : x;
          for (const [p, q] of strongLinks(grid, linkDigit)) {
            if (p === wingA || p === wingB || q === wingA || q === wingB) continue;
            const oriented = (sees(wingA, p) && sees(wingB, q)) || (sees(wingA, q) && sees(wingB, p));
            if (!oriented) continue;
            const pattern = [wingA, wingB, p, q];
            const eliminations = commonPeers([wingA, wingB]).filter((cell) => !pattern.includes(cell) && grid.hasCandidate(cell, eliminateDigit)).map((cell) => ({ cell, digit: eliminateDigit }));
            if (eliminations.length === 0) continue;
            const step = makeEliminationStep(
              this.id,
              pattern,
              pattern.map((cell) => ({ cell, digit: linkDigit })),
              eliminations,
              `两个相同双值格通过 ${linkDigit} 的强链接形成 W 翼，可删除同时看到两个翼格的 ${eliminateDigit}。`,
              `Two matching bivalue cells are connected by a strong link on ${linkDigit}, forming a W-Wing; remove ${eliminateDigit} from cells seeing both wings.`,
            );
            step.highlights.links = [{ from: { cell: p, digit: linkDigit }, to: { cell: q, digit: linkDigit }, type: 'strong' }];
            return step;
          }
        }
      }
    }
    return null;
  },
};
