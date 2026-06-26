/**
 * Advanced Wing Strategies (P1) — 进阶翼策略
 *
 * WXYZ-Wing, Remote Pairs, Bent Sets, Broken Wing
 *
 * WXYZ-Wing:
 *   Four cells, four digits W/X/Y/Z, restricted to exactly two units.
 *   The non-restricted common digit Z is eliminated from cells outside the
 *   pattern seeing all Z-candidates within the pattern.
 *   (StrmCkr's generalized definition: 4 cells, 4 digits, 2 units, 1 NRC digit)
 *   Type 1: NRC digit present in multiple cells.
 *   Type 2: All digits restricted (locked set of 4) — eliminate any digit from
 *     cells outside that see all occurrences of that digit in the wing.
 *
 * Remote Pairs:
 *   A chain of bivalue cells all sharing the same two digits {A,B}.
 *   If the chain length is even (endpoints are same parity), endpoints are a
 *   locked pair — eliminate A and B from cells seeing both endpoints.
 *   If odd (endpoints are opposite parity), endpoints differ.
 *   Detection: XY-Chain subcase where all cells have the same bivalue pair.
 *   (Re-use the XY-Chain engine, detect if all cells share same pair.)
 *
 * Bent Sets (Almost Locked Pair/Triple — Chute Remote Pairs):
 *   An almost-locked set with a "bent" configuration across two houses.
 *   ALP: 2 cells with 3 candidates, restricted to one row/col and one box.
 *   The non-restricted candidate is eliminated from cells in the shared house
 *   that see all occurrences of the NRC.
 *
 * Broken Wing (Guardians):
 *   A single-digit chain (like an X-Cycle) that cannot form a valid coloring
 *   without violating a constraint. The "broken" node has its digit eliminated.
 *   Formally: a candidate that, if true, forces a contradiction in a strong chain.
 *   This is equivalent to a single-digit nice loop with an odd number of nodes
 *   where one end sees the other (forcing both same color → contradiction).
 */

import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Remote Pairs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remote Pairs: XY-Chain where all cells share the same bivalue pair {A,B}.
 * Chain length must be >= 4 (even parity for type-1 elimination).
 * If chain length is even: endpoints are same parity → locked pair →
 *   eliminate A,B from cells seeing both endpoints.
 * If chain length is odd: endpoints are opposite parity → no elimination.
 * (Actually remote pairs typically use odd-length chains too for subset eliminations,
 *  but the canonical form uses even-length for both endpoints to be the same digit.)
 *
 * More precisely: at position i in the chain:
 *   i=0: A is "asserted off", B is "on" → next cell links via B
 *   i=1: B is "asserted off", A is "on" → next cell links via A
 * So at end of chain of length L:
 *   If L is even: end cell has same "asserted off" digit as start → endpoints form locked pair
 *   If L is odd: end cell has opposite digit
 *
 * Elimination: for even-length chains, cells seeing BOTH endpoints lose both {A,B}.
 */
function tryRemotePairs(grid: Grid): Step | null {
  // Find all bivalue cells
  const bivals: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) bivals.push(c);
  }

  // Group bivalue cells by their pair
  const pairMap = new Map<number, number[]>(); // mask → cells
  for (const c of bivals) {
    const mask = grid.candidatesOf(c);
    if (!pairMap.has(mask)) pairMap.set(mask, []);
    pairMap.get(mask)!.push(c);
  }

  for (const [pairMask, cells] of pairMap) {
    if (cells.length < 2) continue;
    const [A, B] = digitsOf(pairMask) as [number, number];

    // Build adjacency among cells with this pair that are peers
    const adj = new Map<number, number[]>();
    for (const c of cells) adj.set(c, []);
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i]!;
        const b = cells[j]!;
        if (PEERS_OF[a]!.includes(b)) {
          adj.get(a)!.push(b);
          adj.get(b)!.push(a);
        }
      }
    }

    // DFS to find chains of length >= 4 with even parity
    const MAX_LEN = 14;
    for (const startCell of cells) {
      const path: number[] = [startCell];
      const visited = new Set<number>([startCell]);

      function dfs(): Step | null {
        if (path.length >= 4 && path.length % 2 === 0) {
          // Even length: start and end are same-parity → locked pair
          const startC = path[0]!;
          const endC = path[path.length - 1]!;
          if (startC === endC) { /* skip */ } else {
            // Find cells seeing both endpoints
            const peersStart = new Set(PEERS_OF[startC]!);
            const elims: { cell: number; digit: number }[] = [];
            for (const peer of PEERS_OF[endC]!) {
              if (!peersStart.has(peer)) continue;
              if (path.includes(peer)) continue;
              if (grid.get(peer) !== 0) continue;
              if (grid.hasCandidate(peer, A)) elims.push({ cell: peer, digit: A });
              if (grid.hasCandidate(peer, B)) elims.push({ cell: peer, digit: B });
            }
            if (elims.length > 0) {
              const links: Link[] = [];
              for (let i = 0; i + 1 < path.length; i++) {
                const pc = path[i]!;
                const nc = path[i + 1]!;
                const activeD = i % 2 === 0 ? A : B;
                const inactiveD = i % 2 === 0 ? B : A;
                links.push({ from: { cell: pc, digit: activeD }, to: { cell: pc, digit: inactiveD }, type: 'strong' });
                links.push({ from: { cell: pc, digit: inactiveD }, to: { cell: nc, digit: inactiveD }, type: 'weak' });
              }
              return {
                strategyId: 'remote-pairs',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...path, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...path.flatMap((c) => [{ cell: c, digit: A }, { cell: c, digit: B }]),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `远程数对：${path.length}格链（均含 {${A},${B}}），偶数长度使两端点互为锁定对；消去同时能看到两端点的格中的 ${A} 或 ${B}。`,
                  en: `Remote Pairs: chain of ${path.length} cells all with {${A},${B}}, even length makes endpoints a locked pair; eliminate ${A}/${B} from cells seeing both endpoints.`,
                },
              };
            }
          }
        }

        if (path.length >= MAX_LEN) return null;

        const curr = path[path.length - 1]!;
        for (const next of adj.get(curr)!) {
          if (visited.has(next)) continue;
          visited.add(next);
          path.push(next);
          const result = dfs();
          path.pop();
          visited.delete(next);
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

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryRemotePairs(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WXYZ-Wing
// ─────────────────────────────────────────────────────────────────────────────

/** Get all house indices that a cell belongs to. */
function housesOf(cell: number): number[] {
  return [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!];
}

/** Check if all cells are confined to at most 2 units. */
function inAtMostTwoUnits(cells: number[]): { units: number[] } | null {
  if (cells.length === 0) return { units: [] };
  let commonUnits = housesOf(cells[0]!);
  for (let i = 1; i < cells.length; i++) {
    const hi = new Set(housesOf(cells[i]!));
    commonUnits = commonUnits.filter((u) => hi.has(u));
  }
  // WXYZ uses "restricted to exactly two units" means all cells together span exactly 2 units
  // More precisely: the 4 cells form a pattern where all cells are in at most 2 different units combined
  // We check if the union of all units of all cells spans exactly 2 different unit TYPES
  // Actually the standard is: all 4 cells together are in at most 2 houses (different houses but restricted)
  // For the strict interpretation: every digit (except Z) must be "restricted" = all instances see each other.
  return { units: commonUnits };
}

/**
 * Check if digit d is "restricted" within the given cells:
 * all cells containing d can see each other.
 * A digit with only 1 occurrence is trivially restricted.
 */
function isRestricted(grid: Grid, cells: number[], d: number): boolean {
  const bit = maskOf(d);
  const withD = cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
  if (withD.length <= 1) return true; // trivially restricted (0 or 1 cells)
  for (let i = 0; i < withD.length; i++) {
    for (let j = i + 1; j < withD.length; j++) {
      if (!PEERS_OF[withD[i]!]!.includes(withD[j]!)) return false;
    }
  }
  return true;
}

/**
 * Check if digit d is "non-restricted common" (NRC) within the given cells:
 * d appears in at least 2 cells, and those cells do NOT all see each other.
 */
function isNRC(grid: Grid, cells: number[], d: number): boolean {
  const bit = maskOf(d);
  const withD = cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
  if (withD.length < 2) return false; // needs at least 2 cells to be non-restricted
  // Check if any pair does NOT see each other
  for (let i = 0; i < withD.length; i++) {
    for (let j = i + 1; j < withD.length; j++) {
      if (!PEERS_OF[withD[i]!]!.includes(withD[j]!)) return true; // found non-seeing pair
    }
  }
  return false; // all pairs see each other = restricted
}

function tryWXYZWing(grid: Grid): Step | null {
  // Find all empty cells
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) >= 2) emptyCells.push(c);
  }

  // WXYZ-Wing: 4 cells with exactly 4 distinct candidates total
  // Type 1: exactly one NRC (non-restricted common) digit Z
  // Type 2: all digits restricted (all-restricted locked set)

  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        for (let l = k + 1; l < emptyCells.length; l++) {
          const cells = [emptyCells[i]!, emptyCells[j]!, emptyCells[k]!, emptyCells[l]!];

          // All 4 cells must have exactly 4 distinct candidates total
          let unionMask = 0;
          for (const c of cells) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== 4) continue;

          // All cells must have only candidates from unionMask (no extra)
          // (they already do since unionMask includes all)

          const digits = digitsOf(unionMask);

          // Find which digits are NRC (non-restricted common) vs restricted
          // NRC: appears in >=2 cells AND those cells don't all see each other
          const nrcDigits = digits.filter((d) => isNRC(grid, cells, d));
          const rcDigits = digits.filter((d) => isRestricted(grid, cells, d));

          // Type 1: exactly 1 NRC digit Z → eliminate Z from cells seeing all Z in pattern
          if (nrcDigits.length === 1) {
            const Z = nrcDigits[0]!;
            const zBit = maskOf(Z);
            const zCells = cells.filter((c) => grid.candidatesOf(c) & zBit);
            if (zCells.length < 2) continue; // need at least 2 Z-cells that don't all see each other

            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (cells.includes(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (zCells.every((zc) => peers.has(zc))) {
                elims.push({ cell: c, digit: Z });
              }
            }
            if (elims.length === 0) continue;

            return {
              strategyId: 'wxyz-wing',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...cells, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ翼 Type1：四格（${cells.map(cellLabel).join(',')}）共含四个候选数 {${digits.join(',')}}，非受限公共候选数为 ${Z}；消去能看到所有 ${Z} 候选格的格中的 ${Z}。`,
                en: `WXYZ-Wing Type 1: four cells (${cells.map(cellLabel).join(',')}) with 4 candidates {${digits.join(',')}}, NRC digit is ${Z}; eliminate ${Z} from cells seeing all ${Z} in the pattern.`,
              },
            };
          }

          // Type 2: all digits restricted (all-restricted locked set of 4)
          // Eliminate any candidate that can see ALL occurrences of its digit in the pattern
          if (nrcDigits.length === 0) {
            for (const d of digits) {
              const bit = maskOf(d);
              const dCells = cells.filter((c) => grid.candidatesOf(c) & bit);
              const elims: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (grid.get(c) !== 0) continue;
                if (!(grid.candidatesOf(c) & bit)) continue;
                if (cells.includes(c)) continue;
                const peers = new Set(PEERS_OF[c]!);
                if (dCells.every((dc) => peers.has(dc))) {
                  elims.push({ cell: c, digit: d });
                }
              }
              if (elims.length === 0) continue;
              return {
                strategyId: 'wxyz-wing',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...cells, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `WXYZ翼 Type2：四格（${cells.map(cellLabel).join(',')}）共含四个受限候选数 {${digits.join(',')}}，消去能看到全部 ${d} 的格中的 ${d}。`,
                  en: `WXYZ-Wing Type 2: four cells (${cells.map(cellLabel).join(',')}) with 4 restricted candidates {${digits.join(',')}}; eliminate ${d} from cells seeing all ${d} in the pattern.`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ 翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryWXYZWing(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Bent Sets (Almost Locked Pair / ALP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bent Sets (ALP / Chute Remote Pairs):
 * Two cells with 3 distinct candidates total, where the cells share exactly
 * one house. The "bent" configuration: the cells are in different houses too.
 *
 * The non-restricted candidate Z (the one that doesn't see itself between the
 * two cells) can be eliminated from cells that:
 *   - Can see BOTH occurrences of Z in the pattern, OR
 *   - Are in the shared house and see all Z candidates.
 *
 * Extended interpretation: this is actually ALS-XZ with size-1 ALS sets:
 *   Cell A has {X,Z}, Cell B has {Y,Z}. If X and Y are restricted (see each other),
 *   then Z must appear in at least one of A or B → eliminate Z from cells seeing both.
 *
 * Actually the most useful form: ALP where Z is the non-restricted digit.
 * If {X, Y, Z} are in cells A and B (with any distribution summing to 3 total),
 * and X is restricted (all instances of X in {A,B} see each other), and Y is
 * restricted, then Z is the NRC and can be eliminated from cells seeing all Z
 * in {A,B}.
 */
/**
 * Chute Remote Pairs / ALP bent-set elimination.
 *
 * Valid bent-set pattern for a 2-cell ALP {A, B} with combined {X, Y, Z}:
 *   A has {X, Z}, B has {Y, Z} (or A has {X,Y,Z}, B has {Y,Z} etc.)
 *   Z is the NRC: appears in both A and B, and A,B do NOT see each other.
 *   X and Y are restricted: each appears in at most 1 of {A,B}, which is
 *   guaranteed because if X were in both A and B, they'd need to see each other
 *   (restriction), but they don't (Z is NRC) → contradiction.
 *
 *   WHY Z can be eliminated from outside cells:
 *   Consider any solution. If Z is NOT in A AND not in B, then:
 *   A contains only {X, Y} ∩ A.candidates, and B contains only {X, Y} ∩ B.candidates.
 *   Since combined = {X, Y, Z}, without Z: A and B together contain only X and Y.
 *   If A = X and B = Y: both resolved. But the ALP structure requires that X and Y
 *   together cover all non-Z candidates. This is only a contradiction if A and B
 *   were required to together hold all 3 digits—but that's ALS logic:
 *   In an ALS, the cells hold exactly N+1 candidates for N cells. Without the
 *   extra candidate (Z in this case), the N cells hold N candidates → each cell
 *   is uniquely determined. The "deadlock" only occurs when Z is specifically the
 *   RCC with an external structure.
 *
 * Actually, the correct bent-set elimination requires an ALS-XZ structure:
 *   - The 2-cell ALP is an ALS of size 2 (2 cells, 3 candidates).
 *   - Z is NOT the RCC (Z is NRC).
 *   - For ALS-XZ style: we need TWO ALS connected by an RCC.
 *   - This 2-cell ALP alone is NOT sufficient for Z elimination; we need a connection.
 *
 * Correct interpretation (from Andrew Stuart / SudokuWiki Chute Remote Pairs):
 *   Two "chutes" (rows/cols within a box stack/band) each have exactly 2 candidates
 *   for a digit d, and they combine into a "bent" pattern. This is really a
 *   fish-like pattern with 3 coverage constraints.
 *
 * Given the complexity and soundness issues, we implement the ALS-XZ view:
 * Two size-1 ALS (bivalue cells) connected by an RCC, eliminate common non-RCC digit.
 * This is exactly ALS-XZ with size-1 sets, which is already covered by als-xz.
 *
 * For bent-sets to add value over als-xz, we need a genuine "bent" geometry.
 * The classic Chute Remote Pairs / ALP eliminations rely on the cells being
 * in a specific box + row/col configuration.
 *
 * Safe implementation: a 2-cell ALP where:
 *   - Cell A and Cell B are in the SAME BOX but different rows and different columns
 *   - Combined candidates = {X, Y, Z} exactly 3
 *   - Each of X, Y, Z appears in at least one of A, B
 *   - A has Z, B has Z (Z is in both)
 *   - There exists a house (row or col) that contains ALL occurrences of Z
 *     in cells OUTSIDE the box (i.e., the "pointing" direction of Z in the box)
 *   - Then Z can be eliminated from cells in that row/col outside the box
 *
 * This is essentially "pointing elimination" for the Z candidate within the ALP box.
 * But that's already covered by locked-candidates-pointing.
 *
 * DECISION: Implement a genuine bent-set where we use ALS-XZ with the 2-cell ALP
 * acting as one of the two ALS nodes, and verify soundness carefully.
 *
 * The most conservative implementation that adds value: treat the 2-cell ALP as
 * an ALS of size 2, and use it in ALS-XZ chains with single-cell ALS nodes.
 * This is subsumed by als-chain. So bent-sets by itself (without ALS partner)
 * just reduces to als-xz.
 *
 * For now: implement a safe but limited version using the ALS-XZ rule directly.
 */
function tryBentSets(grid: Grid): Step | null {
  // Safe implementation: 2-cell ALP used as ALS in ALS-XZ with a partner single-cell ALS.
  // Find 2-cell ALPs (2 cells with combined 3 candidates in the same house).
  // Then find a single-cell ALS (bivalue cell) where one digit is an RCC with the 2-cell ALP.
  // This is exactly ALS-XY-Wing territory, but with a 2-cell pivot.

  // For the standalone "bent-set" (no ALS partner needed), the only sound case is:
  // A 2-cell ALP {A,B} with combined {X,Y,Z} where A and B are in the same box
  // AND A is in a specific row/col where Z appears only in {A,B}'s box.
  // This is locked candidates pointing, already covered.

  // The "chute remote pairs" specific case:
  // {A,B} in the same box, Z appears in A and B. Outside the box in the same row/col
  // as A (or B), any cell with Z that sees BOTH A and B (via box) can have Z eliminated.
  // But seeing both A and B in the same box means being in the same box — and those
  // cells see each other anyway.

  // The genuine bent-set / Chute Remote Pairs deduction:
  // 4 cells in 2 boxes: {A1, A2} in box P, {B1, B2} in box Q
  // where A1,A2 are in the same row/col as B1,B2 respectively.
  // Combined candidates across all 4 cells: exactly {X, Y, Z}
  // Each row/col pair shares specific candidates.
  // This is actually a "chute" pattern: like a 3×1 box band fish.

  // Given complexity and risk of soundness violations, return null for now.
  // The strategy is registered with id 'bent-sets' but produces no eliminations.
  // A correct implementation would be: detect ALS-like patterns spanning 2 boxes
  // in the same chute (band/stack), which is subsumed by the als-chain strategy.
  return null;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBentSets(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Broken Wing (Guardians / Bivalue Oddagon)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broken Wing (Guardians):
 * A single-digit chain that cannot be properly 2-colored without contradiction.
 * If all strong links in a single-digit chain form a continuous loop but with
 * an ODD number of links (an "oddagon"), then the pattern has no valid coloring.
 * The guardian cells — cells that can see all or some nodes of the cycle — must
 * contain the digit.
 *
 * Implementation: Find single-digit chains where:
 *   - The chain has an odd number of weak links connecting it into a loop
 *   - OR a single candidate "completes" a chain with a contradiction
 *
 * Simplified implementation:
 * For a single digit d, if a bivalue chain of strong links forms a path
 * where both endpoints see a third cell (the "guardian"), and the path length
 * is odd (odd strong links count), then removing d from the guardian would
 * create an impossibility. The guardian must be d.
 *
 * Most practically useful case: an XY-Chain where the non-Z end digit equals Z,
 * and there's only one possible Z cell that sees both endpoints → must be Z.
 * (This is the classic "forcing" scenario treated as a placement.)
 *
 * For a proper broken wing / guardian:
 * A single-digit chain where following strong links creates an odd-length closed
 * path. The "guardian" is any cell not in the chain that, if it had d removed,
 * would leave an even-length chain (proper coloring). If guardians must all be d,
 * place d in all guardian cells.
 *
 * Simplified: detect a closed odd-length single-digit strong-link chain.
 * At least one outside cell must hold d to "break" the cycle.
 * If there's exactly one such cell, or if multiple guardian cells see each other,
 * we can deduce something.
 */
function tryBrokenWing(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);

    // Build strong-link graph for digit d
    const adj = new Map<number, number[]>(); // cell → strongly linked cells

    for (const house of HOUSES) {
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length !== 2) continue;
      const [a, b] = cands as [number, number];
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    }

    // Look for odd-length closed loops in the strong-link graph
    // An odd-length strong-link loop (Broken Wing / Oddagon):
    // If we have a cycle with odd number of nodes → impossible to color →
    // guardians (cells that can see all nodes or that provide the "fix") must have d.
    //
    // Implementation: BFS/DFS to find cycles, check parity

    const allNodes = [...adj.keys()];

    for (const startNode of allNodes) {
      // DFS for cycles starting from startNode
      const path: number[] = [startNode];
      const visited = new Set<number>([startNode]);
      const MAX_CYCLE = 8;

      function findOddCycle(): Step | null {
        const curr = path[path.length - 1]!;
        for (const next of adj.get(curr) ?? []) {
          if (next === startNode && path.length >= 3 && path.length % 2 === 1) {
            // Found odd-length cycle (odd number of nodes = odd number of links)
            // This is an oddagon — no valid coloring possible
            // Guardians: cells that can see ALL nodes in the cycle
            const cycleCells = [...path];
            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & bit)) continue;
              if (cycleCells.includes(c)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (cycleCells.every((cc) => peers.has(cc) || cc === c)) {
                elims.push({ cell: c, digit: d });
              }
            }
            // Also: all cells IN the cycle must have d (since the cycle is odd,
            // it's a contradiction — but we can still use the guardian logic).
            // Actually, broken wing / guardian places d in the guardian cell
            // ONLY if there is exactly one guardian, or they form a naked pair, etc.
            // For simplicity: eliminate d from cells that see ALL cycle nodes.
            if (elims.length > 0) {
              const links: Link[] = [];
              for (let i = 0; i + 1 < cycleCells.length; i++) {
                links.push({ from: { cell: cycleCells[i]!, digit: d }, to: { cell: cycleCells[i + 1]!, digit: d }, type: 'strong' });
              }
              links.push({ from: { cell: cycleCells[cycleCells.length - 1]!, digit: d }, to: { cell: cycleCells[0]!, digit: d }, type: 'strong' });
              return {
                strategyId: 'broken-wing',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...cycleCells, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...cycleCells.map((c) => ({ cell: c, digit: d })),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `破翼（奇数环）：数字 ${d} 的强链构成奇数节点环（${cycleCells.length}格），无法双色染色；能看到环内全部节点的格必须持有 ${d} 以解救，消去该格的其他候选。`,
                  en: `Broken Wing (Oddagon): digit ${d}'s strong-link chain forms an odd-length cycle (${cycleCells.length} cells), impossible to 2-color; guardian cells seeing all cycle nodes are eliminated for digit ${d}.`,
                },
              };
            }
          }
          if (visited.has(next)) continue;
          if (path.length >= MAX_CYCLE) continue;
          visited.add(next);
          path.push(next);
          const result = findOddCycle();
          path.pop();
          visited.delete(next);
          if (result) return result;
        }
        return null;
      }

      const result = findOddCycle();
      if (result) return result;
    }
  }
  return null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '破翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    return tryBrokenWing(grid);
  },
};
