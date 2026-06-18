/**
 * W-Wing (T3) — W翼
 *
 * Two bivalue cells P1 and P2 with the SAME pair {X, Y} are connected by a
 * strong link on X: i.e., there exists a house where X appears in exactly two
 * cells, one of which sees P1 and the other sees P2.
 *
 * Logic: at least one of P1 or P2 contains Y, so eliminate Y from cells
 * seeing BOTH P1 and P2.
 *
 * More precisely:
 *   P1 = {X, Y}, P2 = {X, Y}
 *   Strong link A--B on digit X (A sees P1, B sees P2, or vice versa)
 *   If P1 = Y, done. If P1 = X → A ≠ X → B = X → P2 ≠ X → P2 = Y.
 *   So at least one of P1, P2 is Y.
 *   Eliminate Y from cells seeing both P1 and P2.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 56,

  apply(grid: Grid): Step | null {
    // Collect all bivalue cells grouped by their pair mask
    const bivalueByMask = new Map<number, number[]>();
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const mask = grid.candidatesOf(c);
      if (popcount(mask) !== 2) continue;
      if (!bivalueByMask.has(mask)) bivalueByMask.set(mask, []);
      bivalueByMask.get(mask)!.push(c);
    }

    // For each pair {X, Y}, find two bivalue cells with same pair
    for (const [pairMask, cells] of bivalueByMask) {
      if (cells.length < 2) continue;
      const [x, y] = digitsOf(pairMask) as [number, number];

      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const p1 = cells[i]!;
          const p2 = cells[j]!;

          // Try both X and Y as the "bridging" digit
          for (const bridgeDigit of [x, y]) {
            const elimDigit = bridgeDigit === x ? y : x;
            const bridgeBit = maskOf(bridgeDigit);
            const elimBit = maskOf(elimDigit);

            // Find a house with exactly 2 candidates for bridgeDigit,
            // one cell seeing p1 and the other seeing p2
            // (but neither cell is p1 or p2 themselves)
            for (const house of HOUSES) {
              const bridgeCands = house.filter(
                (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bridgeBit) !== 0,
              );
              if (bridgeCands.length !== 2) continue;

              const [a, b] = bridgeCands as [number, number];
              // a and b form a strong link on bridgeDigit

              const aSeesP1 = PEERS_OF[a]!.includes(p1);
              const bSeesP2 = PEERS_OF[b]!.includes(p2);
              const aSeesP2 = PEERS_OF[a]!.includes(p2);
              const bSeesP1 = PEERS_OF[b]!.includes(p1);

              let ok = false;
              if (aSeesP1 && bSeesP2 && a !== p1 && b !== p2) ok = true;
              if (aSeesP2 && bSeesP1 && a !== p2 && b !== p1) ok = true;

              if (!ok) continue;

              // Eliminate elimDigit from cells seeing both p1 and p2
              const peersP1 = new Set(PEERS_OF[p1]!);
              const elims: { cell: number; digit: number }[] = [];
              for (const c of PEERS_OF[p2]!) {
                if (!peersP1.has(c)) continue;
                if (c === p1 || c === p2 || c === a || c === b) continue;
                if (grid.get(c) !== 0) continue;
                if (!(grid.candidatesOf(c) & elimBit)) continue;
                elims.push({ cell: c, digit: elimDigit });
              }

              if (elims.length === 0) continue;

              const p1r = ROW_OF[p1]! + 1;
              const p1c = COL_OF[p1]! + 1;
              const p2r = ROW_OF[p2]! + 1;
              const p2c = COL_OF[p2]! + 1;

              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [p1, p2, a, b, ...elims.map((e) => e.cell)],
                  candidates: [
                    { cell: p1, digit: x }, { cell: p1, digit: y },
                    { cell: p2, digit: x }, { cell: p2, digit: y },
                    { cell: a, digit: bridgeDigit },
                    { cell: b, digit: bridgeDigit },
                    ...elims,
                  ],
                  links: [
                    { from: { cell: a, digit: bridgeDigit }, to: { cell: b, digit: bridgeDigit }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `W翼：两个相同候选对 {${x},${y}} 的双值格 R${p1r}C${p1c} 和 R${p2r}C${p2c} 通过数字 ${bridgeDigit} 的强链相连；消去两个双值格公共可见格中的 ${elimDigit}（W翼）。`,
                  en: `W-Wing: bivalue cells R${p1r}C${p1c} and R${p2r}C${p2c} share pair {${x},${y}} and are bridged by a strong link on ${bridgeDigit}; eliminate ${elimDigit} from cells seeing both (W-Wing).`,
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
