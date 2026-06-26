/**
 * XY-Chain (T4) — XY 链
 *
 * A chain of bivalue cells where consecutive cells share exactly one candidate
 * (the "hop" digit). If both terminal free-digits equal Z, then at least one
 * endpoint must be Z, so any cell seeing both endpoints can have Z eliminated.
 *
 * Formally: all strong links are in-cell (bivalue), all between-cell links are
 * weak. This is a strict sub-family of AIC (bivalue-only strong links).
 *
 * Remote Pairs ⊂ XY-Chain (when every cell in the chain shares the same bivalue pair).
 *
 * Research card: research/sudoku-human-solving/local-library/techniques/08-chains-aic/xy-chain.md
 */

import {
  CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface XYNode {
  cell: number;
  digit: number; // the "active" (asserted-off) digit at this cell
}

/**
 * Build adjacency for XY-Chain: bivalue cells linked by shared candidate.
 * Returns map: cell -> [peer cells sharing a digit with this cell].
 */
function buildBivalueAdjacency(grid: Grid): Map<number, number[]> {
  const bivals: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivals.push(c);
  }

  const adj = new Map<number, number[]>();
  for (const c of bivals) adj.set(c, []);

  const bivalSet = new Set(bivals);
  for (let i = 0; i < bivals.length; i++) {
    const a = bivals[i]!;
    const ma = grid.candidatesOf(a);
    for (const peer of PEERS_OF[a]!) {
      if (!bivalSet.has(peer)) continue;
      const mb = grid.candidatesOf(peer);
      // They must share at least one digit (hop digit)
      if ((ma & mb) !== 0) {
        adj.get(a)!.push(peer);
      }
    }
  }
  return adj;
}

/**
 * DFS to find an XY-Chain from startCell with startDigit asserted OFF.
 * path: cells visited so far
 * active[i]: the digit asserted OFF at path[i] (i.e. the "current" digit at each step)
 * Returns the chain if found with valid eliminations, else null.
 */
function searchXYChain(
  grid: Grid,
  adj: Map<number, number[]>,
): Step | null {
  const bivals: number[] = [...adj.keys()];
  const MAX_DEPTH = 14;

  // For each bivalue starting cell and starting "asserted-off" digit
  for (const startCell of bivals) {
    const startMask = grid.candidatesOf(startCell);
    const startDigits = digitsOf(startMask);

    for (const startDigit of startDigits) {
      // The DFS starts from C1 with startDigit "asserted OFF".
      // XY-Chain type-1: Z is OFF at C1 → propagates → Z is ON at Cn.
      // Elimination: any cell seeing both C1 and Cn can lose Z.
      // Both end-digits must be startDigit (Z).
      // Actually: at C1, startDigit is OFF → the chain fires.
      // If startDigit were ON, there's no deduction from the chain start.
      // Either C1=startDigit (Z) directly, or C1 ≠ Z and the chain makes Cn=Z.

      // DFS
      const path: number[] = [startCell];
      const activeDigit: number[] = [startDigit]; // digit asserted OFF at each cell
      const visited = new Set<number>([startCell]);

      function dfs(): Step | null {
        const curr = path[path.length - 1]!;
        const currActive = activeDigit[activeDigit.length - 1]!;
        // The digit that will propagate to next cell (the other digit of curr = asserted ON)
        const currOtherDigits = digitsOf(grid.candidatesOf(curr)).filter((d) => d !== currActive);
        if (currOtherDigits.length !== 1) return null;
        const hopDigit = currOtherDigits[0]!; // ON at curr, will be asserted OFF at next cell

        if (path.length >= 3) {
          // XY-Chain type-1: end-digit at start = startDigit (the digit that is "live" at C1
          // in the branch where C1 IS startDigit). End-digit at Cn = hopDigit.
          // Elimination: if startDigit === hopDigit = Z, cells seeing both endpoints lose Z.
          const Z = startDigit;
          if (hopDigit === Z) {
            // Find cells seeing both startCell and curr that have Z as candidate
            const peersStart = new Set(PEERS_OF[startCell]!);
            const elims: { cell: number; digit: number }[] = [];
            for (const peer of PEERS_OF[curr]!) {
              if (!peersStart.has(peer)) continue;
              if (peer === startCell || peer === curr) continue;
              if (!path.includes(peer) && grid.get(peer) === 0 && grid.hasCandidate(peer, Z)) {
                elims.push({ cell: peer, digit: Z });
              }
            }
            if (elims.length > 0) {
              // Build the step
              const links: Link[] = [];
              for (let i = 0; i + 1 < path.length; i++) {
                const cellA = path[i]!;
                const cellB = path[i + 1]!;
                const dA = activeDigit[i]!;
                const dAother = digitsOf(grid.candidatesOf(cellA)).find((d) => d !== dA)!;
                // Strong link: dA[cellA] <-> dAother[cellA] (in-cell)
                links.push({ from: { cell: cellA, digit: dA }, to: { cell: cellA, digit: dAother }, type: 'strong' });
                // Weak link: dAother[cellA] -- dAother[cellB]
                links.push({ from: { cell: cellA, digit: dAother }, to: { cell: cellB, digit: dAother }, type: 'weak' });
              }

              const pathDesc = path.map((c, i) => {
                const d = activeDigit[i]!;
                const other = digitsOf(grid.candidatesOf(c)).find((x) => x !== d)!;
                return `{${d},${other}}[${cellLabel(c)}]`;
              }).join('–');

              return {
                strategyId: 'xy-chain',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...path, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...path.flatMap((c, i) => {
                      const d1 = activeDigit[i]!;
                      const d2 = digitsOf(grid.candidatesOf(c)).find((d) => d !== d1)!;
                      return [{ cell: c, digit: d1 }, { cell: c, digit: d2 }];
                    }),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `XY 链：${pathDesc}，两端候选数均为 ${Z}；消去同时能看到两端点的格中的 ${Z}。`,
                  en: `XY-Chain: ${pathDesc}, both end-digits are ${Z}; eliminate ${Z} from cells seeing both endpoints ${cellLabel(startCell)} and ${cellLabel(curr)}.`,
                },
              };
            }
          }
        }

        if (path.length >= MAX_DEPTH) return null;

        // Extend to a peer bivalue cell that shares the hopDigit
        for (const nextCell of adj.get(curr)!) {
          if (visited.has(nextCell)) continue;
          const nextMask = grid.candidatesOf(nextCell);
          if (!(nextMask & maskOf(hopDigit))) continue; // must share hop digit
          // nextCell has hopDigit asserted OFF (it came in as the hop)
          visited.add(nextCell);
          path.push(nextCell);
          activeDigit.push(hopDigit);

          const result = dfs();
          path.pop();
          activeDigit.pop();
          visited.delete(nextCell);

          if (result) return result;
        }

        return null;
      }

      const result = dfs();
      if (result) return result;
    }
  }

  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const adj = buildBivalueAdjacency(grid);
    return searchXYChain(grid, adj);
  },
};
