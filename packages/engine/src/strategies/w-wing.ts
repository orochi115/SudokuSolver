import { digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidatesFor, cellsSeeingBoth, createEliminationStep, sees, strongLinksForDigit } from './utils.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 57,
  apply(grid: Grid): Step | null {
    for (let a = 0; a < 81; a++) {
      if (grid.get(a) !== 0 || popcount(grid.candidatesOf(a)) !== 2) continue;
      for (let b = a + 1; b < 81; b++) {
        if (grid.get(b) !== 0 || grid.candidatesOf(a) !== grid.candidatesOf(b) || sees(a, b)) continue;
        const digits = digitsOf(grid.candidatesOf(a));
        for (const bridgeDigit of digits) {
          const otherDigit = digits.find((digit) => digit !== bridgeDigit)!;
          for (const link of strongLinksForDigit(grid, bridgeDigit)) {
            if ([link.a, link.b].includes(a) || [link.a, link.b].includes(b)) continue;
            const orientations: Array<[number, number]> = [[link.a, link.b], [link.b, link.a]];
            for (const [left, right] of orientations) {
              if (!sees(a, left) || !sees(b, right)) continue;
              const eliminations: CellDigit[] = cellsSeeingBoth(a, b).filter((cell) => ![a, b, left, right].includes(cell) && grid.hasCandidate(cell, otherDigit)).map((cell) => ({ cell, digit: otherDigit }));
              if (eliminations.length === 0) continue;
              const links: Link[] = [
                { from: { cell: a, digit: otherDigit }, to: { cell: a, digit: bridgeDigit }, type: 'strong' },
                { from: { cell: a, digit: bridgeDigit }, to: { cell: left, digit: bridgeDigit }, type: 'weak' },
                { from: { cell: left, digit: bridgeDigit }, to: { cell: right, digit: bridgeDigit }, type: 'strong' },
                { from: { cell: right, digit: bridgeDigit }, to: { cell: b, digit: bridgeDigit }, type: 'weak' },
                { from: { cell: b, digit: bridgeDigit }, to: { cell: b, digit: otherDigit }, type: 'strong' },
              ];
              return createEliminationStep({ strategy: this, cells: [a, b, left, right], candidates: [...candidatesFor([a, b], otherDigit), ...candidatesFor([left, right], bridgeDigit)], eliminations, links, zh: `两个相同双值格由数字 ${bridgeDigit} 的强链桥接，形成 W翼，可从同时看见双值格的格中删除 ${otherDigit}。`, en: `Two matching bivalue cells are bridged by a strong link on ${bridgeDigit}, forming a W-Wing; ${otherDigit} is removed from cells seeing both bivalue cells.` });
            }
          }
        }
      }
    }
    return null;
  },
};
