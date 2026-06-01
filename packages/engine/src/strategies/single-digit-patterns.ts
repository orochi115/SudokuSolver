import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { popcount } from '../grid.js';
import { candidateHighlights, cellName, commonPeers, link, sees, strongLinks } from './common.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 45,

  apply(grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const links = strongLinks(grid, digit);
      for (let i = 0; i < links.length; i++) {
        const [a, b] = links[i]!;
        for (let j = i + 1; j < links.length; j++) {
          const [c, d] = links[j]!;
          const orientations: Array<[number, number, number, number]> = [
            [a, b, c, d],
            [a, b, d, c],
            [b, a, c, d],
            [b, a, d, c],
          ];
          for (const [end1, bridge1, bridge2, end2] of orientations) {
            if (new Set([end1, bridge1, bridge2, end2]).size !== 4) continue;
            if (!sees(bridge1, bridge2)) continue;
            const patternCells = [end1, bridge1, bridge2, end2];
            const eliminations = commonPeers([end1, end2])
              .filter((cell) => !patternCells.includes(cell) && grid.hasCandidate(cell, digit) && popcount(grid.candidatesOf(cell)) > 1)
              .map((cell) => ({ cell, digit }));
            if (eliminations.length === 0) continue;
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: patternCells,
                candidates: candidateHighlights(patternCells, [digit]),
                links: [link(end1, bridge1, digit, 'strong'), link(bridge1, bridge2, digit, 'weak'), link(bridge2, end2, digit, 'strong')],
              },
              explanation: {
                zh: `${patternCells.map(cellName).join('、')} 对数字 ${digit} 构成摩天楼/双线风筝/空矩形一类的短单数字链，两端至少一端为真，可从同时看见两端的格删除 ${digit}。`,
                en: `${patternCells.map(cellName).join(', ')} form a short single-digit chain for ${digit} (Skyscraper / 2-String Kite / Empty Rectangle family). At least one endpoint is true, so remove ${digit} from cells seeing both endpoints.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
