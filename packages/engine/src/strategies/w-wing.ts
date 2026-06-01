/**
 * W-Wing (T3) — W翼.
 *
 * Two non-seeing bivalue cells with the SAME pair {X,Y}, bridged by a strong
 * link on one digit (say X): a house in which X has only two candidate cells,
 * one seeing the first bivalue cell and the other seeing the second.
 *
 * Logic: if either bivalue cell were X, the strong link forces the other to be
 * Y... more precisely, one of the two bivalue cells must be Y. So any cell
 * seeing BOTH bivalue cells cannot be Y.
 */

import {
  CELLS,
  HOUSES,
  popcount,
  digitsOf,
  sees,
  commonPeers,
  cellsWithCandidate,
  cellLabel,
  houseLabel,
} from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    // Bivalue cells grouped by their candidate mask.
    const bivalue: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivalue.push(c);
    }

    for (let i = 0; i < bivalue.length; i++) {
      for (let j = i + 1; j < bivalue.length; j++) {
        const a = bivalue[i]!;
        const b = bivalue[j]!;
        const mask = grid.candidatesOf(a);
        if (grid.candidatesOf(b) !== mask) continue; // same pair {X,Y}
        if (sees(a, b)) continue; // must not see each other
        const [x, y] = digitsOf(mask) as [number, number];

        // For each digit acting as the strong-link digit, find a house where
        // that digit has exactly two spots, one seeing a and the other seeing b.
        for (const linkDigit of [x, y] as const) {
          const elimDigit = linkDigit === x ? y : x;
          for (let h = 0; h < HOUSES.length; h++) {
            const spots = cellsWithCandidate(grid, HOUSES[h]!, linkDigit);
            if (spots.length !== 2) continue;
            const [s1, s2] = spots as [number, number];
            if (s1 === a || s1 === b || s2 === a || s2 === b) continue;

            const linksA1 = sees(s1, a);
            const linksB2 = sees(s2, b);
            const linksA2 = sees(s2, a);
            const linksB1 = sees(s1, b);
            const ok = (linksA1 && linksB2) || (linksA2 && linksB1);
            if (!ok) continue;

            // Eliminate elimDigit from cells seeing both a and b.
            const targets = commonPeers([a, b]);
            const elims: CellDigit[] = [];
            for (const t of targets) {
              if (grid.get(t) === 0 && grid.hasCandidate(t, elimDigit)) elims.push({ cell: t, digit: elimDigit });
            }
            if (elims.length === 0) continue;

            const hl = houseLabel(h);
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [a, b, s1, s2],
                candidates: [
                  { cell: a, digit: x },
                  { cell: a, digit: y },
                  { cell: b, digit: x },
                  { cell: b, digit: y },
                  { cell: s1, digit: linkDigit },
                  { cell: s2, digit: linkDigit },
                ],
                links: [],
              },
              explanation: {
                zh: `W翼：${cellLabel(a)} 与 ${cellLabel(b)} 同为 {${x},${y}}，经${hl.zh}中数字 ${linkDigit} 的强链（${cellLabel(s1)}、${cellLabel(s2)}）连接；故两者必有一格为 ${elimDigit}，可见两者的格中可排除 ${elimDigit}。`,
                en: `W-Wing: ${cellLabel(a)} and ${cellLabel(b)} are both {${x},${y}}, bridged by a strong link on ${linkDigit} in ${hl.en} (${cellLabel(s1)}, ${cellLabel(s2)}); one of them must be ${elimDigit}, so cells seeing both can drop ${elimDigit}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
