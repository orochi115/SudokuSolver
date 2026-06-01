/**
 * Forcing Chains (T4, last resort) — 强制链
 *
 * Per the forcing-boundary policy (docs/forcing-boundary.md), we implement
 * ONLY the "human-acceptable" subset:
 *
 *   - Cell forcing chain: assume each candidate in a bivalue/trivalue cell.
 *     Propagate ONLY naked singles (guaranteed, safe). If ALL candidates from
 *     a cell lead to the same value for some other cell, place it.
 *     If one candidate leads to contradiction (cell with 0 candidates), eliminate it.
 *
 *   - House forcing chain: for a digit with exactly 2 positions in a house,
 *     assume each position. If both lead to the same placement, apply it.
 *     If one leads to contradiction, the other must be the true position.
 *
 * We intentionally do NOT run hidden singles during propagation (too complex,
 * hard to verify soundness). Only naked singles (deterministic, safe).
 *
 * Depth limit: MAX_FC_PROPAGATION steps of naked single propagation per branch.
 *
 * FORBIDDEN: full backtracking, contradiction search, multi-branch trees.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const MAX_PROPAGATION = 50; // max naked single steps per branch

/** A consequence: a cell gets a specific value. */
interface Placement {
  cell: number;
  digit: number;
}

/**
 * Starting from an assumption that (cell, digit) is placed,
 * propagate naked singles exhaustively (but safely — no hidden singles).
 *
 * Returns:
 *   - null if contradiction (some cell gets 0 candidates)
 *   - Map<cell, digit> of all forced placements (including the initial assumption)
 */
function propagateNakedSingles(grid: Grid, cell: number, digit: number): Map<number, number> | null {
  const placements = new Map<number, number>();
  const work = grid.clone();

  if (!work.hasCandidate(cell, digit)) return null;
  work.place(cell, digit);
  placements.set(cell, digit);

  let changed = true;
  let steps = 0;
  while (changed && steps < MAX_PROPAGATION) {
    changed = false;
    steps++;

    for (let c = 0; c < CELLS; c++) {
      if (work.get(c) !== 0) continue;
      const mask = work.candidatesOf(c);

      if (mask === 0) return null; // contradiction

      if (popcount(mask) === 1) {
        const d = digitsOf(mask)[0]!;
        if (!placements.has(c)) {
          placements.set(c, d);
        }
        work.place(c, d);
        changed = true;
      }
    }
  }

  // Check for any remaining contradictions
  for (let c = 0; c < CELLS; c++) {
    if (work.get(c) !== 0) continue;
    if (work.candidatesOf(c) === 0) return null;
  }

  return placements;
}

/**
 * Cell Forcing Chain: for a cell with N (2-4) candidates, if ALL branches
 * agree on a placement, apply it. If ONE branch leads to contradiction,
 * eliminate that candidate.
 */
function tryCellForcingChain(grid: Grid): Step | null {
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const cands = digitsOf(grid.candidatesOf(cell));
    if (cands.length < 2 || cands.length > 4) continue;

    const branches: Map<number, number>[] = [];
    const contradictions: number[] = [];

    for (const d of cands) {
      const result = propagateNakedSingles(grid, cell, d);
      if (result === null) {
        contradictions.push(d);
      } else {
        branches.push(result);
      }
    }

    // If any candidate leads to contradiction, eliminate it
    if (contradictions.length > 0) {
      const d = contradictions[0]!;
      if (!grid.hasCandidate(cell, d)) continue;
      return {
        strategyId: 'forcing-chain',
        placements: [],
        eliminations: [{ cell, digit: d }],
        highlights: {
          cells: [cell],
          candidates: cands.map((cd) => ({ cell, digit: cd })),
          links: [],
        },
        explanation: {
          zh: `强制链（格）：假设 R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}=${d} 导致矛盾；消去 ${d}。`,
          en: `Forcing Chain (cell): assuming R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}=${d} leads to contradiction; eliminate ${d}.`,
        },
      };
    }

    // If all branches agree on a placement for some OTHER cell
    if (branches.length < 2) continue;

    // Look for cells (not the pivot) where all branches agree on the same digit
    for (const [targetCell, targetDigit] of branches[0]!) {
      if (targetCell === cell) continue;
      if (grid.get(targetCell) !== 0) continue;
      if (!grid.hasCandidate(targetCell, targetDigit)) continue;

      const allAgree = branches.every((br) => br.get(targetCell) === targetDigit);
      if (!allAgree) continue;

      return {
        strategyId: 'forcing-chain',
        placements: [{ cell: targetCell, digit: targetDigit }],
        eliminations: [],
        highlights: {
          cells: [cell, targetCell],
          candidates: [
            ...cands.map((cd) => ({ cell, digit: cd })),
            { cell: targetCell, digit: targetDigit },
          ],
          links: [
            {
              from: { cell, digit: cands[0]! },
              to: { cell: targetCell, digit: targetDigit },
              type: 'strong' as const,
            },
          ],
        },
        explanation: {
          zh: `强制链（格）：从 R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} 的所有候选数出发，均得到 R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1}=${targetDigit}；故填入 ${targetDigit}。`,
          en: `Forcing Chain (cell): all candidates from R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} lead to R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1}=${targetDigit}; place ${targetDigit}.`,
        },
      };
    }
  }

  return null;
}

/**
 * House Forcing Chain: for a digit d with exactly 2 positions in a house,
 * try each. If one leads to contradiction, the other must be true (place it).
 * If both lead to the same placement elsewhere, apply it.
 */
function tryHouseForcingChain(grid: Grid): Step | null {
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const positions = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);

      // Only handle exactly 2 positions (safer, more predictable)
      if (positions.length !== 2) continue;

      const [pos0, pos1] = positions as [number, number];
      const branch0 = propagateNakedSingles(grid, pos0, d);
      const branch1 = propagateNakedSingles(grid, pos1, d);

      // If branch0 is contradiction → pos0 is impossible → pos1 must be d
      if (branch0 === null && branch1 !== null) {
        if (grid.hasCandidate(pos1, d)) {
          return {
            strategyId: 'forcing-chain',
            placements: [{ cell: pos1, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...positions],
              candidates: positions.map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `强制链（宫/行/列）：假设 R${ROW_OF[pos0]! + 1}C${COL_OF[pos0]! + 1}=${d} 导致矛盾；故 R${ROW_OF[pos1]! + 1}C${COL_OF[pos1]! + 1}=${d}。`,
              en: `Forcing Chain (house): assuming R${ROW_OF[pos0]! + 1}C${COL_OF[pos0]! + 1}=${d} leads to contradiction; therefore R${ROW_OF[pos1]! + 1}C${COL_OF[pos1]! + 1}=${d}.`,
            },
          };
        }
      }

      // If branch1 is contradiction → pos1 is impossible → pos0 must be d
      if (branch1 === null && branch0 !== null) {
        if (grid.hasCandidate(pos0, d)) {
          return {
            strategyId: 'forcing-chain',
            placements: [{ cell: pos0, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...positions],
              candidates: positions.map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `强制链（宫/行/列）：假设 R${ROW_OF[pos1]! + 1}C${COL_OF[pos1]! + 1}=${d} 导致矛盾；故 R${ROW_OF[pos0]! + 1}C${COL_OF[pos0]! + 1}=${d}。`,
              en: `Forcing Chain (house): assuming R${ROW_OF[pos1]! + 1}C${COL_OF[pos1]! + 1}=${d} leads to contradiction; therefore R${ROW_OF[pos0]! + 1}C${COL_OF[pos0]! + 1}=${d}.`,
            },
          };
        }
      }

      // Both valid: look for agreed placements
      if (branch0 === null || branch1 === null) continue;

      for (const [targetCell, targetDigit] of branch0) {
        if (targetCell === pos0 || targetCell === pos1) continue;
        if (grid.get(targetCell) !== 0) continue;
        if (!grid.hasCandidate(targetCell, targetDigit)) continue;
        if (branch1.get(targetCell) !== targetDigit) continue;

        return {
          strategyId: 'forcing-chain',
          placements: [{ cell: targetCell, digit: targetDigit }],
          eliminations: [],
          highlights: {
            cells: [...positions, targetCell],
            candidates: [
              ...positions.map((c) => ({ cell: c, digit: d })),
              { cell: targetCell, digit: targetDigit },
            ],
            links: [],
          },
          explanation: {
            zh: `强制链（宫/行/列）：数字 ${d} 在宫/行/列的两个位置均导致 R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1}=${targetDigit}；故填入 ${targetDigit}。`,
            en: `Forcing Chain (house): both positions of digit ${d} in the house lead to R${ROW_OF[targetCell]! + 1}C${COL_OF[targetCell]! + 1}=${targetDigit}; place ${targetDigit}.`,
          },
        };
      }
    }
  }

  return null;
}

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid: Grid): Step | null {
    const cellFC = tryCellForcingChain(grid);
    if (cellFC) return cellFC;

    const houseFC = tryHouseForcingChain(grid);
    if (houseFC) return houseFC;

    return null;
  },
};
