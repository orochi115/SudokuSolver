import { BOXES, CELLS, COLS, ROWS, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { peersIntersection, sees, uniqueCells, uniqueEliminations } from './common.js';

interface StrongLink {
  readonly digit: number;
  readonly a: number;
  readonly b: number;
}

function strongLinksForDigit(grid: Grid, digit: number): StrongLink[] {
  const out: StrongLink[] = [];
  for (const house of [...ROWS, ...COLS, ...BOXES]) {
    const cells = house.filter((cell) => grid.hasCandidate(cell, digit));
    if (cells.length === 2) out.push({ digit, a: cells[0]!, b: cells[1]! });
  }
  return out;
}

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid) {
    const bivals = Array.from({ length: CELLS }, (_, c) => c).filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2);

    for (let i = 0; i < bivals.length; i++) {
      for (let j = i + 1; j < bivals.length; j++) {
        const p = bivals[i]!;
        const q = bivals[j]!;
        const pairP = digitsOf(grid.candidatesOf(p));
        const pairQ = digitsOf(grid.candidatesOf(q));
        if (pairP.length !== 2 || pairQ.length !== 2) continue;
        if (!(pairP[0] === pairQ[0] && pairP[1] === pairQ[1])) continue;

        const [d1, d2] = pairP;
        if (d1 === undefined || d2 === undefined) continue;

        for (const bridgeDigit of [d1, d2]) {
          const elimDigit = bridgeDigit === d1 ? d2 : d1;
          const strongLinks = strongLinksForDigit(grid, bridgeDigit);
          for (const link of strongLinks) {
            const orientations: [number, number][] = [
              [link.a, link.b],
              [link.b, link.a],
            ];
            for (const [left, right] of orientations) {
              if (!sees(p, left)) continue;
              if (!sees(q, right)) continue;

              const elimCells = peersIntersection(p, q).filter((cell) => grid.hasCandidate(cell, elimDigit));
              if (elimCells.length === 0) continue;

              const eliminations = uniqueEliminations(elimCells.map((cell) => ({ cell, digit: elimDigit })));
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: uniqueCells([p, q, left, right, ...elimCells]),
                  candidates: [
                    { cell: p, digit: d1 },
                    { cell: p, digit: d2 },
                    { cell: q, digit: d1 },
                    { cell: q, digit: d2 },
                    { cell: left, digit: bridgeDigit },
                    { cell: right, digit: bridgeDigit },
                    ...eliminations,
                  ],
                  links: [
                    {
                      from: { cell: left, digit: bridgeDigit },
                      to: { cell: right, digit: bridgeDigit },
                      type: 'strong',
                    },
                  ],
                },
                explanation: {
                  zh: `W翼：两端双值格同为 {${d1},${d2}}，并由数字 ${bridgeDigit} 的强链连接，因此可在同时看见两端的格子删除 ${elimDigit}。`,
                  en: `W-Wing: two bivalue cells {${d1},${d2}} are bridged by a strong link on ${bridgeDigit}, so ${elimDigit} can be removed from cells seeing both bivalue endpoints.`,
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
