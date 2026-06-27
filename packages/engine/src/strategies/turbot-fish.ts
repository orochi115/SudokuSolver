/**
 * Turbot Fish (T4) — 多宝鱼
 *
 * Presentation alias for the generic single-digit strong-link chain family:
 * strong–weak–strong (4 nodes, 3 links). This covers:
 *   - Skyscraper (two rows/cols with conjugate pairs sharing a line)
 *   - 2-String Kite (row + col conjugate pairs sharing a box)
 *   - Empty Rectangle (grouped node variant)
 *   - Generic turbot fish (any 4-node strong-weak-strong)
 *
 * According to the turbot-family card: "A Turbot Fish is an X-Chain that is
 * exactly four candidates long". This strategy fires when x-chain's own
 * presentation strategies (skyscraper/kite/ER) don't match but the generic
 * 4-cell strong-weak-strong pattern does.
 *
 * Per overlap.ts (E2): turbot-fish is in the single-digit-strong-link family,
 * canonically owned by x-chain. We implement it as a separate strategy that
 * detects the generic 4-cell pattern not already covered by skyscraper/kite/ER,
 * then also detects patterns those cover (since they fire first by difficulty).
 *
 * Implementation:
 *   For each digit d, find 4 cells forming strong-weak-strong:
 *     s1a =d= s1b   (strong link 1: conjugate pair in some house)
 *     s1b -d- s2a   (weak link: s1b and s2a are peers on d, d may appear elsewhere)
 *     s2a =d= s2b   (strong link 2: conjugate pair in some house)
 *   Endpoints {s1a, s2b}: at least one holds d
 *   Eliminate d from all cells seeing both s1a and s2b.
 *
 * Note: skyscraper/kite/ER fire first (lower difficulty), so turbot-fish catches
 * remaining 4-cell patterns not geometrically special enough for those names.
 */

import {
  CELLS, ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function cellsWithCandidate(grid: Grid, house: readonly number[], digit: number): number[] {
  const bit = maskOf(digit);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

/**
 * Find all conjugate pairs for digit d (strong links):
 * houses where d appears in exactly 2 cells.
 */
function getConjugatePairs(grid: Grid, d: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const seen = new Set<string>();

  for (const house of HOUSES) {
    const cands = cellsWithCandidate(grid, house, d);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)},${Math.max(a, b)}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push([a, b]);
    }
  }
  return pairs;
}

/**
 * Two cells are weakly linked on d if they are peers and both have d as candidate.
 * (They may have other cells with d in their shared house.)
 */
function isWeakLink(grid: Grid, a: number, b: number, d: number): boolean {
  if (a === b) return false;
  if (!grid.hasCandidate(a, d) || !grid.hasCandidate(b, d)) return false;
  return PEERS_OF[a]!.includes(b);
}

function tryTurbotFish(grid: Grid, d: number, strategyId: string): Step | null {
  const pairs = getConjugatePairs(grid, d);

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const [s1a, s1b] = pairs[i]!;
      const [s2a, s2b] = pairs[j]!;

      // Try all 4 ways to connect pairs via weak link
      for (const [link1, link2, end1, end2] of [
        [s1b, s2a, s1a, s2b],
        [s1b, s2b, s1a, s2a],
        [s1a, s2a, s1b, s2b],
        [s1a, s2b, s1b, s2a],
      ] as Array<[number, number, number, number]>) {
        if (!isWeakLink(grid, link1, link2, d)) continue;
        if (end1 === end2) continue;

        // Endpoints: end1 and end2; at least one holds d
        const elims = commonPeers(end1, end2).filter(
          (c) => grid.get(c) === 0 && grid.hasCandidate(c, d),
        );
        if (elims.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: d })),
          highlights: {
            cells: [s1a, s1b, s2a, s2b, ...elims],
            candidates: [
              { cell: s1a, digit: d },
              { cell: s1b, digit: d },
              { cell: s2a, digit: d },
              { cell: s2b, digit: d },
              ...elims.map((c) => ({ cell: c, digit: d })),
            ],
            links: [
              { from: { cell: end1, digit: d }, to: { cell: link1, digit: d }, type: 'strong' },
              { from: { cell: link1, digit: d }, to: { cell: link2, digit: d }, type: 'weak' },
              { from: { cell: link2, digit: d }, to: { cell: end2, digit: d }, type: 'strong' },
            ],
          },
          explanation: {
            zh: `多宝鱼（Turbot Fish）：数字 ${d} 经强-弱-强链 ${cellLabel(end1)}-${cellLabel(link1)}-${cellLabel(link2)}-${cellLabel(end2)}；两端点 ${cellLabel(end1)} 与 ${cellLabel(end2)} 至少一个为 ${d}，故消去公共可见格的 ${d}。`,
            en: `Turbot Fish: digit ${d} forms a strong-weak-strong chain ${cellLabel(end1)}-${cellLabel(link1)}-${cellLabel(link2)}-${cellLabel(end2)}; one of the endpoints must be ${d}; eliminate ${d} from cells seeing both endpoints.`,
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
