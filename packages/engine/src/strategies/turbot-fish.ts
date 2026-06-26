/**
 * Turbot Fish (T4) — 多宝鱼
 *
 * The generic single-digit 4-cell (3-link) alternating chain:
 *   strong – weak – strong
 * This covers: Skyscraper, 2-String Kite, and Empty Rectangle when the base
 * cell count is exactly 4 (two strong links + one weak link). It is the unified
 * presentation of all short single-digit strong-link patterns.
 *
 * Since Skyscraper / 2-String Kite / Empty Rectangle are already registered at
 * lower difficulties and fire first, Turbot-Fish acts as the general fallback
 * for 4-cell single-digit chains not caught by those named patterns. It reuses
 * the x-chain engine (same ownership family).
 *
 * E2: The overlap family for 'single-digit-strong-link' now records turbot-fish
 * as a member (not futureMembers). The existing skyscraper/kite/ER strategies
 * remain distinct; turbot-fish catches any remaining 4-cell shape.
 *
 * Research card: research/sudoku-human-solving/local-library/techniques/05-single-digit-patterns/turbot-family.md
 */

import {
  ROWS, COLS, BOXES, HOUSES, PEERS_OF, ROW_OF, COL_OF, BOX_OF, maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidatesWithDigit(grid: Grid, cells: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

/**
 * Find all conjugate pairs (strong links) for digit d:
 * any house where d appears in exactly 2 cells.
 * Returns an array of [cell1, cell2] pairs.
 */
function conjugatePairs(grid: Grid, d: number): [number, number][] {
  const pairs: [number, number][] = [];
  const bit = maskOf(d);
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length === 2) {
      pairs.push([cands[0]!, cands[1]!]);
    }
  }
  // Deduplicate (same pair may appear multiple times for cells sharing row+box etc.)
  const seen = new Set<string>();
  const unique: [number, number][] = [];
  for (const [a, b] of pairs) {
    const key = `${Math.min(a, b)},${Math.max(a, b)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push([a, b]);
    }
  }
  return unique;
}

/**
 * Generic Turbot Fish search:
 *   strong(a,b) – weak(b,c) – strong(c,d)
 *   where b and c see each other (weak link) but (a,b) are in different houses from (c,d).
 * Endpoints a and d: at least one must hold d, so eliminate d from cells seeing both.
 *
 * We already have Skyscraper / 2-String Kite / ER at lower difficulties.
 * Turbot-Fish is the generic fallback that catches any 4-node strong-weak-strong shape
 * not already emitted by those strategies.
 */
function tryTurbotFish(grid: Grid, d: number, strategyId: string): Step | null {
  const pairs = conjugatePairs(grid, d);
  const bit = maskOf(d);

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const [a1, b1] = pairs[i]!;
      const [a2, b2] = pairs[j]!;

      // Try all 4 combinations of endpoints between the two strong links
      const combos: [number, number, number, number][] = [
        [a1, b1, a2, b2],
        [a1, b1, b2, a2],
        [b1, a1, a2, b2],
        [b1, a1, b2, a2],
      ];

      for (const [endA, base1, base2, endB] of combos) {
        // base1 and base2 must see each other (weak link)
        if (base1 === base2) continue;
        if (!PEERS_OF[base1]!.includes(base2)) continue;
        // endA must be different from endB
        if (endA === endB) continue;
        // Avoid degenerate cases where endpoints share a house with each other
        // (those are basic X-Wings or will degenerate to simpler patterns)

        // Find eliminations: cells seeing both endA and endB
        const elims = commonPeers(endA, endB).filter(
          (c) =>
            c !== endA &&
            c !== endB &&
            c !== base1 &&
            c !== base2 &&
            grid.get(c) === 0 &&
            (grid.candidatesOf(c) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const links: Link[] = [
          { from: { cell: endA, digit: d }, to: { cell: base1, digit: d }, type: 'strong' },
          { from: { cell: base1, digit: d }, to: { cell: base2, digit: d }, type: 'weak' },
          { from: { cell: base2, digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
        ];

        return {
          strategyId,
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: d })),
          highlights: {
            cells: [...new Set([endA, base1, base2, endB, ...elims])],
            candidates: [
              { cell: endA, digit: d },
              { cell: base1, digit: d },
              { cell: base2, digit: d },
              { cell: endB, digit: d },
              ...elims.map((c) => ({ cell: c, digit: d })),
            ],
            links,
          },
          explanation: {
            zh: `多宝鱼（数字 ${d}）：强链 ${cellLabel(endA)}=${cellLabel(base1)}，弱链 ${cellLabel(base1)}-${cellLabel(base2)}，强链 ${cellLabel(base2)}=${cellLabel(endB)}；两端至少其一为 ${d}，消去能看到两端的格中的 ${d}。`,
            en: `Turbot Fish (digit ${d}): strong ${cellLabel(endA)}=${cellLabel(base1)}, weak ${cellLabel(base1)}-${cellLabel(base2)}, strong ${cellLabel(base2)}=${cellLabel(endB)}; at least one endpoint holds ${d}, eliminate ${d} from cells seeing both endpoints.`,
          },
        };
      }
    }
  }

  return null;
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryTurbotFish(grid, d, this.id);
      if (step) return step;
    }
    return null;
  },
};
