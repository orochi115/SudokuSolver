import { digitsOf } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { bivalueCells, candidateHighlights, cellName, commonPeers, hasDigit, link, sees, strongLinks } from './common.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid): Step | null {
    const bivalue = bivalueCells(grid);
    for (let i = 0; i < bivalue.length; i++) {
      const wingA = bivalue[i]!;
      const mask = grid.candidatesOf(wingA);
      const digits = digitsOf(mask);
      for (let j = i + 1; j < bivalue.length; j++) {
        const wingB = bivalue[j]!;
        if (grid.candidatesOf(wingB) !== mask) continue;
        for (const bridgeDigit of digits) {
          const removeDigit = digits.find((digit) => digit !== bridgeDigit);
          if (removeDigit === undefined) continue;
          for (const [a, b] of strongLinks(grid, bridgeDigit)) {
            const bridged = (sees(wingA, a) && sees(wingB, b)) || (sees(wingA, b) && sees(wingB, a));
            if (!bridged) continue;
            if (hasDigit(grid.candidatesOf(wingA), bridgeDigit) && hasDigit(grid.candidatesOf(wingB), bridgeDigit)) {
              const patternCells = [wingA, wingB, a, b];
              const eliminations = commonPeers([wingA, wingB])
                .filter((cell) => !patternCells.includes(cell) && grid.hasCandidate(cell, removeDigit))
                .map((cell) => ({ cell, digit: removeDigit }));
              if (eliminations.length === 0) continue;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: patternCells,
                  candidates: candidateHighlights([wingA, wingB], digits),
                  links: [link(a, b, bridgeDigit, 'strong')],
                },
                explanation: {
                  zh: `${cellName(wingA)} 和 ${cellName(wingB)} 是相同双值格，并由数字 ${bridgeDigit} 的强链桥接，故可从同时看见两翼的格删除 ${removeDigit}（W翼）。`,
                  en: `${cellName(wingA)} and ${cellName(wingB)} are matching bivalue cells bridged by a strong link on ${bridgeDigit}, so remove ${removeDigit} from cells seeing both wings (W-Wing).`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
