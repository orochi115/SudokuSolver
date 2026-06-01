import { CELLS, HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

interface ConjugateLink {
  digit: number;
  a: number;
  b: number;
}

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    const bivalueCells = [...Array(CELLS).keys()]
      .filter((cell) => grid.get(cell) === 0)
      .filter((cell) => popcount(grid.candidatesOf(cell)) === 2);

    const strongLinks = buildConjugateLinks(grid);

    for (let i = 0; i < bivalueCells.length; i++) {
      for (let j = i + 1; j < bivalueCells.length; j++) {
        const c1 = bivalueCells[i]!;
        const c2 = bivalueCells[j]!;
        const m1 = grid.candidatesOf(c1);
        const m2 = grid.candidatesOf(c2);
        if (m1 !== m2) continue;
        const [x, y] = digitsOf(m1);
        if (!x || !y) continue;

        for (const link of strongLinks) {
          if (link.digit !== x && link.digit !== y) continue;
          const bridgeDigit = link.digit;
          const elimDigit = bridgeDigit === x ? y : x;

          const seen =
            (PEERS_OF[c1]!.includes(link.a) && PEERS_OF[c2]!.includes(link.b)) ||
            (PEERS_OF[c1]!.includes(link.b) && PEERS_OF[c2]!.includes(link.a));
          if (!seen) continue;

          const eliminations = PEERS_OF[c1]!
            .filter((cell) => PEERS_OF[c2]!.includes(cell))
            .filter((cell) => cell !== c1 && cell !== c2)
            .filter((cell) => grid.hasCandidate(cell, elimDigit))
            .map((cell) => ({ cell, digit: elimDigit }));
          if (eliminations.length === 0) continue;

          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: [c1, c2, link.a, link.b],
              candidates: [
                ...digitsOf(m1).map((digit) => ({ cell: c1, digit })),
                ...digitsOf(m2).map((digit) => ({ cell: c2, digit })),
                { cell: link.a, digit: bridgeDigit },
                { cell: link.b, digit: bridgeDigit },
              ],
              links: [
                {
                  from: { cell: link.a, digit: bridgeDigit },
                  to: { cell: link.b, digit: bridgeDigit },
                  type: 'strong',
                },
              ],
            },
            explanation: {
              zh: `两个相同双值格通过数字 ${bridgeDigit} 的强链接形成 W-Wing，因此可删除它们共同可见处的 ${elimDigit}。`,
              en: `Two identical bivalue cells are connected by a strong link on ${bridgeDigit}, forming a W-Wing; eliminate ${elimDigit} from their common peers.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function buildConjugateLinks(grid: Grid): ConjugateLink[] {
  const out: ConjugateLink[] = [];
  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const cells = house.filter((cell) => grid.hasCandidate(cell, digit));
      if (cells.length === 2) out.push({ digit, a: cells[0]!, b: cells[1]! });
    }
  }
  return out;
}
