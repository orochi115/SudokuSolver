/**
 * Advanced AIC Strategies (P1) — 进阶 AIC 策略
 *
 * AIC with ALS nodes and AIC with UR nodes.
 *
 * AIC with ALS (aic-with-als):
 *   Extend the standard AIC (Alternating Inference Chain) to use Almost Locked
 *   Sets as chain nodes. An ALS acts as a "super-node" in the chain:
 *   - Entry digit X (restricted): coming in on digit X turns the ALS "ON" for
 *     a specific exit digit Y.
 *   - Exit digit Y: leaving the ALS on digit Y (because if X is off, all cells
 *     of the ALS are "restricted" and Y must be in one specific cell to avoid
 *     a deadly pattern).
 *   This allows chains that pass through ALS sets to find eliminations not
 *   possible with single-cell nodes alone.
 *
 *   Simplified implementation: a chain of the form:
 *   [single-cell node] --weak-- [ALS entry X] ==strong== [ALS exit Y] --weak-- ...
 *   where ALS provides a strong link between X-entry and Y-exit.
 *
 * AIC with UR (aic-with-ur):
 *   A Unique Rectangle can provide a strong link within a chain:
 *   If a UR has only one "escape" (an extra candidate in one corner), then
 *   the absence of that escape candidate forces the UR to be deadly.
 *   This means the escape candidate sees a chain endpoint as a strong link.
 *   - UR Type 1 provides: if extra candidate E in roof cell is removed, deadly
 *     pattern → E must be true → strong link between E-absent and UR-intact.
 *   Chain: ... --weak-- [UR extra candidate OFF] ==strong(UR)== [UR escape ON] --weak-- ...
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
// ALS definitions (duplicated from als-advanced to avoid circular imports)
// ─────────────────────────────────────────────────────────────────────────────

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}

function findAllALS(grid: Grid, maxSize = 3): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();
  for (let hi = 0; hi < HOUSES.length; hi++) {
    const house = HOUSES[hi]!;
    const emptyCells = house.filter((c) => grid.get(c) === 0);
    for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
      for (const combo of combinations(emptyCells, size)) {
        let mask = 0;
        for (const c of combo) mask |= grid.candidatesOf(c);
        if (popcount(mask) === size + 1) {
          const key = `${hi}:${[...combo].sort((a, b) => a - b).join(',')}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            result.push({ house: hi, cells: combo, digits: digitsOf(mask), digitMask: mask });
          }
        }
      }
    }
  }
  return result;
}

function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc || !PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// AIC with ALS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AIC with ALS nodes.
 * An ALS provides a "strong link" between its entry digit and exit digit:
 * If entry digit X is NOT in any cell outside the ALS (in the ALS's house),
 * and digit X is an RCC (all X cells in ALS see the "source" node),
 * then the ALS acts as: source-(weak)-ALS-entry-X ==(ALS-strong)== ALS-exit-Y-(weak)-...
 *
 * Simplified approach:
 * Find pairs of single-cell candidates (start, end) connected through an ALS:
 * start has digit X (weak from start's context) → X enters ALS →
 * ALS provides strong link to Y → Y weak-links to end node.
 *
 * For each ALS, find all pairs (entryDigit, exitDigit) where entryDigit is RCC
 * with some external candidate, and exitDigit weak-links to another external candidate.
 *
 * Implementation: 3-node AIC: [start_cand] -weak- [ALS_entry] ==ALS_strong== [ALS_exit] -weak- [end_cand]
 * This gives: if start is ON → ALS_entry X is OFF → (via ALS strong) ALS_exit Y is ON → end is OFF.
 * Or: if end is ON → ALS_exit Y is OFF → (via ALS strong reverse) ALS_entry X is ON → start is OFF.
 * Elimination: cells seeing both start and end lose the digit connecting start→ALS→end.
 *
 * More complete: full AIC with ALS nodes mixed with cell nodes, depth-limited.
 */
function tryAICwithALS(grid: Grid): Step | null {
  // TODO: The simplified 3-node AIC-with-ALS has proven unsound in practice.
  // The correct implementation requires full AIC search with ALS nodes integrated
  // into the chain graph (each ALS provides a strong link between entry/exit digits
  // when the entry digit is weakly eliminated from outside).
  // Returning null until a sound implementation is verified.
  return null;

  /* eslint-disable-next-line no-unreachable */
  const alsList = findAllALS(grid, 3);

  // For each ALS, precompute strong links it provides:
  // For digits X, Y in the ALS: if X is "entering" the ALS (constrained via RCC),
  // the ALS provides a strong link out on digit Y.
  // This is valid when X and Y are different and both are in the ALS's digit set.

  interface ALSLink {
    als: ALS;
    entryDigit: number;  // digit coming in (weakly eliminates X from ALS's cells)
    exitDigit: number;   // digit going out (strongly asserted)
    entryCells: number[]; // cells of ALS that have entryDigit
    exitCells: number[];  // cells of ALS that have exitDigit
  }

  // Build ALS strong links
  const alsLinks: ALSLink[] = [];
  for (const als of alsList) {
    for (let i = 0; i < als.digits.length; i++) {
      for (let j = 0; j < als.digits.length; j++) {
        if (i === j) continue;
        const X = als.digits[i]!;
        const Y = als.digits[j]!;
        const xBit = maskOf(X);
        const yBit = maskOf(Y);
        const xCells = als.cells.filter((c) => grid.candidatesOf(c) & xBit);
        const yCells = als.cells.filter((c) => grid.candidatesOf(c) & yBit);
        if (xCells.length === 0 || yCells.length === 0) continue;
        alsLinks.push({ als, entryDigit: X, exitDigit: Y, entryCells: xCells, exitCells: yCells });
      }
    }
  }

  // For each ALS strong link, find a "chain": external_start -weak- ALS_entry ==strong== ALS_exit -weak- external_end
  // Then check for eliminations

  for (const link of alsLinks) {
    const { als, entryDigit, exitDigit, entryCells, exitCells } = link;
    const entryBit = maskOf(entryDigit);
    const exitBit = maskOf(exitDigit);

    // External candidates that weakly link to entry cells (can "turn off" entry)
    // External candidate C for digit X: C is in a house with at least one entryCell
    const externalEntries: { cell: number; digit: number }[] = [];
    for (const entryCell of entryCells) {
      for (const peer of PEERS_OF[entryCell]!) {
        if (als.cells.includes(peer)) continue;
        if (grid.get(peer) === 0 && grid.hasCandidate(peer, entryDigit)) {
          externalEntries.push({ cell: peer, digit: entryDigit });
        }
      }
    }

    // External candidates that weakly link FROM exit cells
    const externalExits: { cell: number; digit: number }[] = [];
    for (const exitCell of exitCells) {
      for (const peer of PEERS_OF[exitCell]!) {
        if (als.cells.includes(peer)) continue;
        if (grid.get(peer) === 0 && grid.hasCandidate(peer, exitDigit)) {
          externalExits.push({ cell: peer, digit: exitDigit });
        }
      }
    }

    // For each (entry_external, exit_external) pair:
    // Logic: if entry_external is ON → weakly links to ALS entry → X eliminated from ALS →
    //   ALS "fires" on Y (ALS strong link) → Y must be in ALS → exit_external (Y) is OFF.
    // Reverse: if exit_external is ON → ALS exit Y is OFF → ALS "fires" → entry X must be in ALS →
    //   entry_external is OFF.
    // Result: entry_external and exit_external are in a strong/weak chain.
    // If they see each other with the same digit → eliminate that digit.
    // More usefully: cells seeing both can have entry_external's digit (if same) eliminated.

    // Deduplicate externals
    const seenEntry = new Set<number>();
    const uniqueEntries = externalEntries.filter((e) => {
      const k = e.cell * 10 + e.digit;
      if (seenEntry.has(k)) return false;
      seenEntry.add(k);
      return true;
    });

    const seenExit = new Set<number>();
    const uniqueExits = externalExits.filter((e) => {
      const k = e.cell * 10 + e.digit;
      if (seenExit.has(k)) return false;
      seenExit.add(k);
      return true;
    });

    // Case 1: entryDigit === exitDigit (same digit chain through ALS)
    if (entryDigit === exitDigit) continue; // ALS internal strong link requires distinct digits

    // Case 2: Different digits — this is an AIC node
    // Chain: entry_ext(X) -weak(cell X)- ALS(X→Y strong) -weak(cell Y)- exit_ext(Y)
    // This is a useful 3-node AIC. We look for eliminations from cells outside
    // that see entry_ext AND are exit_ext (classic AIC Type 1/2).

    // Type 1: entry and exit have same digit (both need to be same digit for AIC Type 1 elim)
    // → Not applicable here since entryDigit ≠ exitDigit
    // Type 2: entry_ext.cell === exit_ext.cell (same cell, different digits → place the third)
    for (const extEntry of uniqueEntries) {
      for (const extExit of uniqueExits) {
        if (extEntry.cell === als.cells[0] || extExit.cell === als.cells[0]) continue; // overlap

        // Type 2 (same cell): extEntry.cell === extExit.cell, different digits
        if (extEntry.cell === extExit.cell && extEntry.digit !== extExit.digit) {
          // The cell has both entry and exit digit as candidates
          // Chain: extEntry.cell(X) -weak- ALS -strong- extExit.cell(Y)
          // This means: X at this cell and Y at this cell can't both be false
          // → The cell must be either X or Y → eliminate all other candidates from this cell
          const cell = extEntry.cell;
          const keepMask = maskOf(extEntry.digit) | maskOf(extExit.digit);
          const elims: { cell: number; digit: number }[] = [];
          for (const d of digitsOf(grid.candidatesOf(cell))) {
            if ((maskOf(d) & keepMask) === 0) elims.push({ cell, digit: d });
          }
          if (elims.length > 0) {
            return {
              strategyId: 'aic-with-als',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...als.cells, cell, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...als.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  { cell, digit: extEntry.digit },
                  { cell, digit: extExit.digit },
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `含 ALS 节点的 AIC（Type2）：格 ${cellLabel(cell)} 通过 ALS（${als.cells.map(cellLabel).join(',')}）以 ${extEntry.digit}→${exitDigit} 强连；该格必为 ${extEntry.digit} 或 ${extExit.digit}，消去其他候选数。`,
                en: `AIC with ALS (Type 2): cell ${cellLabel(cell)} connects through ALS (${als.cells.map(cellLabel).join(',')}) via ${entryDigit}→${exitDigit} strong link; cell must be ${extEntry.digit} or ${extExit.digit}; eliminate other candidates.`,
              },
            };
          }
        }

        // Type 1: same digit, different cells — eliminate from cells seeing both
        if (extEntry.digit === extExit.digit && extEntry.cell !== extExit.cell) {
          const Z = extEntry.digit;
          const zBit = maskOf(Z);
          const peersA = new Set(PEERS_OF[extEntry.cell]!);
          const elims: { cell: number; digit: number }[] = [];
          for (const peer of PEERS_OF[extExit.cell]!) {
            if (!peersA.has(peer)) continue;
            if (peer === extEntry.cell || peer === extExit.cell) continue;
            if (als.cells.includes(peer)) continue;
            if (grid.get(peer) === 0 && grid.hasCandidate(peer, Z)) {
              elims.push({ cell: peer, digit: Z });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: 'aic-with-als',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...als.cells, extEntry.cell, extExit.cell, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...als.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  { cell: extEntry.cell, digit: Z },
                  { cell: extExit.cell, digit: Z },
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `含 ALS 节点的 AIC（Type1）：通过 ALS（${als.cells.map(cellLabel).join(',')}）的链两端均为 ${Z}；消去同时能看到两端的格中的 ${Z}。`,
                en: `AIC with ALS (Type 1): chain through ALS (${als.cells.map(cellLabel).join(',')}) with both ends digit ${Z}; eliminate ${Z} from cells seeing both endpoints.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的 AIC', en: 'AIC with ALS' },
  difficulty: 760,
  tieBreak: ['house', 'cell-index'],

  apply(grid: Grid): Step | null {
    return tryAICwithALS(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AIC with UR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AIC with UR nodes.
 * A Unique Rectangle provides a strong link in an AIC chain:
 * UR Type 1: If the "extra" candidate in the one non-floor cell is removed,
 *   the UR becomes a deadly pattern → extra candidate must be true.
 *   This means: [extra_candidate = OFF] is STRONGLY linked to [extra_candidate = ON].
 *   In chain terms: -E[roof] ==(UR strong)== +E[roof]
 *   Which means: we can build chains that pass through this UR node.
 *
 * Chain pattern:
 *   [start] -weak- [UR_escape_OFF] ==(UR_strong)== [UR_escape_ON] -weak- [end]
 *
 * This is equivalent to: if start is ON → (via weak link) UR escape is OFF → (UR constraint) impossible → start must be OFF.
 *
 * More practically: find URs where the roof cell has exactly one extra candidate E.
 *   The UR provides: "E is strongly linked to itself (must be true)."
 *   Any chain that can weakly link to E can use UR as a strong link.
 *
 * Implementation: Find UR Type 1 patterns (as in uniqueness.ts). For each one,
 * treat the extra candidate in the roof cell as a "must-be-true" node. Use it
 * in conjunction with an AIC to find eliminations.
 */

function findURType1Patterns(grid: Grid): Array<{ roofCell: number; extraDigit: number; urCells: number[] }> {
  const patterns: Array<{ roofCell: number; extraDigit: number; urCells: number[] }> = [];

  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cells = [
            r1 * 9 + c1, r1 * 9 + c2,
            r2 * 9 + c1, r2 * 9 + c2,
          ];
          const boxes = new Set(cells.map((c) => BOX_OF[c]!));
          if (boxes.size !== 2) continue;

          const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
          if (masks.some((m) => m === 0)) continue;

          const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
          if (popcount(intersect) !== 2) continue;
          if (masks.some((m) => (m & intersect) !== intersect)) continue;

          // Exactly 3 floor cells (exactly the UR pair), 1 roof cell (extra)
          const floorCells = cells.filter((_, i) => masks[i] === intersect);
          const roofCells = cells.filter((_, i) => masks[i] !== intersect);
          if (floorCells.length !== 3 || roofCells.length !== 1) continue;

          const roofCell = roofCells[0]!;
          const extraMask = grid.candidatesOf(roofCell) & ~intersect;
          if (popcount(extraMask) !== 1) continue; // only 1 extra candidate for Type 1

          const extraDigit = digitsOf(extraMask)[0]!;
          patterns.push({ roofCell, extraDigit, urCells: cells });
        }
      }
    }
  }
  return patterns;
}

function tryAICwithUR(grid: Grid): Step | null {
  const urPatterns = findURType1Patterns(grid);
  if (urPatterns.length === 0) return null;

  // For each UR pattern, the extra candidate E is "strongly linked to itself" (must be true).
  // We can use this in two ways:
  // 1. If a candidate C sees E (weak link) and C is strongly linked elsewhere to another C':
  //    If C' sees E → both can't be false (since E is forced) → E must be true → C is false.
  //    More precisely: build a chain [E] == [C] - [via chain] - [C'] == [E] → E must be true.
  //
  // Simplified: E (the UR escape digit in the roof cell) acts as a strong-link anchor.
  // Any candidate that sees E (i.e., is weakly linked to E) participates in the chain.
  // If there's a chain of strong/weak links from E back to itself via another candidate,
  // then cells outside can be eliminated.
  //
  // Practical implementation: for each UR pattern, treat E as a "virtual strong" node.
  // Find other candidates X that see E. If X has a strong link to Y, and Y sees E,
  // then E must be true (the chain E→X→Y→E is a discontinuous nice loop for E).
  // Eliminate anything else in roofCell.

  for (const { roofCell, extraDigit, urCells } of urPatterns) {
    const eBit = maskOf(extraDigit);

    // UR strong: if E is removed from roofCell → UR becomes deadly → E must stay.
    // This means E in roofCell is strongly linked to itself (always on).
    // If E is ON: any candidate seeing E (in same house) can have E removed. ← already handled by UR Type 1
    // For AIC: use E as a chain node.

    // Find candidates that see E (weak link to E)
    const weakToE: { cell: number; digit: number }[] = [];
    for (const peer of PEERS_OF[roofCell]!) {
      if (urCells.includes(peer)) continue;
      if (grid.get(peer) === 0 && grid.hasCandidate(peer, extraDigit)) {
        weakToE.push({ cell: peer, digit: extraDigit });
      }
    }

    // For each candidate weakly linked to E:
    // If that candidate is strongly linked to another candidate Y that also sees E →
    // We have a chain: E -weak- X ==strong== Y -weak- E
    // This is a "Nice Loop" using UR. Y's digit can be eliminated from roofCell... wait
    // Actually for AIC with UR, the key deduction is:
    // If a candidate C weakly links to E, and C is falsifiable via a strong link C→D,
    // and D weakly links back to E → the cycle puts E in a contradiction if E is false.
    // Therefore E is true (roofCell must be the extra digit → eliminate UR triple from roofCell).
    // But that's just UR Type 1 again.

    // The more useful form: cells NOT in the UR can be eliminated via the chain.
    // Pattern: strong_start -weak- E[roof] ==(UR)== E[roof] is always on
    // So: any chain that goes through E[roof] can treat E as "always-on".

    // Useful case: AIC using UR as a "bi-location" for the extra digit in the chain.
    // Find a chain: X(d1) -strong- Y(d1) -weak- E(extra) ==(UR forced)== ... -weak- X(d1)
    // This means: X must be d1 (loop closes).
    // More generally: discontinuous AIC using UR as a forced-true node.

    // For simplicity, check if any bivalue cell in a house with roofCell can use UR:
    // bivalue cell {extra, d2} in same house as roofCell:
    //   if bivalue cell is not extra → extra must be in roofCell (via UR) → place extra in roofCell
    //   This is essentially UR Type 1 deduction already.

    // More useful: "extended" chains that use UR as a forcing node.
    // Implementing full AIC with UR requires integrating into the AIC search engine.
    // For now, implement a simple 3-node chain:
    // [external_cand X] -weak- [E_in_roofCell] ==(UR strong)== [E_forced_on_in_roofCell]
    // Since E is forced on, X must be off.
    // But X just sees E, so this is equivalent to: if E is in roofCell (which it must be),
    // then X (which sees roofCell) cannot be E.
    // That's already captured by UR Type 1.

    // Let's do a more useful case: 
    // The UR escape E can be used as a strong anchor in a longer chain.
    // Find: -E(roofCell) ==UR_strong== +E(roofCell) -weak- [D(peer)] ==strong== [D(peer2)] -weak- ...
    // If the chain eventually leads back to -E(roofCell), then E must be placed.

    // Practical: find cells with candidates that, when combined with UR's forced-E logic,
    // allow elimination of candidates outside the UR.

    // Simplified approach: 
    // For each candidate D ≠ extraDigit in roofCell:
    //   Chain: roofCell(D) -cell_strong_link- roofCell(extra=E) 
    //   [Because roofCell is a (N>2)-value cell, there's a "virtual" strong link: 
    //    if D is false, then E or other candidates are true. Not a pure strong link.]
    // This doesn't give us a clean AIC.

    // Best practical implementation for aic-with-ur:
    // When building AIC chains, after a weak link that "turns off" the extra candidate E
    // in a UR Type 1 roof cell, the UR provides a strong link: if E is false → deadly pattern.
    // So: -E(roofCell) is an impossible state → forces the chain to be "wrong" at E.
    // Use this to eliminate start node if chain returns there.

    // For this implementation, detect the pattern:
    // [some candidate] -strong- [peer of roofCell with same digit as E] -weak- [E in roofCell]
    //                                     => contradiction => [some candidate] is false
    // Where the contradiction comes from: turning off E in roofCell would require the UR
    // to be deadly (since E is the only escape).

    // Most useful for the solver: if there exists a chain via strong/weak links starting at
    // roofCell(E) that ends at another candidate also strongly linked to roofCell(E),
    // then roofCell(E) is confirmed.

    // Let's just find the simple pattern where the UR's strong link connects two cell nodes:
    // If candidate C (digit D) has a strong link to roofCell(D) (conjugate pair in a house),
    // and roofCell(D) via UR forces E to be ON → and E weakly links to C → C is eliminated.

    for (const peer of PEERS_OF[roofCell]!) {
      if (urCells.includes(peer)) continue;
      if (grid.get(peer) !== 0) continue;

      // Look for a strong link: peer(extraDigit) -- strong -- roofCell(extraDigit)
      // In a house where both peer and roofCell have extraDigit and only those two
      let hasStrongLink = false;
      for (const house of HOUSES) {
        if (!house.includes(peer) || !house.includes(roofCell)) continue;
        const candsD = house.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, extraDigit));
        if (candsD.length === 2 && candsD.includes(peer) && candsD.includes(roofCell)) {
          hasStrongLink = true;
          break;
        }
      }

      if (hasStrongLink) {
        // peer(extraDigit) ==strong== roofCell(extraDigit)
        // roofCell(extraDigit) ==(UR forced on)== roofCell(extraDigit) [always true]
        // → peer(extraDigit) is in a chain that confirms the strong link is "backwards"
        // Actually: if peer must have extraDigit (strong link) AND roofCell must have extraDigit (UR),
        // that's a contradiction if peer == roofCell... but they're different cells.
        // This is: peer has extraDigit OR roofCell has extraDigit (strong link in house).
        // AND roofCell must have extraDigit (UR).
        // → roofCell has extraDigit → peer does NOT have extraDigit (from strong link).
        // This gives: eliminate extraDigit from peer.
        if (grid.hasCandidate(peer, extraDigit)) {
          return {
            strategyId: 'aic-with-ur',
            placements: [],
            eliminations: [{ cell: peer, digit: extraDigit }],
            highlights: {
              cells: [...new Set([...urCells, peer])],
              candidates: [
                ...urCells.map((c) => ({ cell: c, digit: extraDigit })).filter((cd) => grid.hasCandidate(cd.cell, cd.digit)),
                { cell: peer, digit: extraDigit },
              ],
              links: [
                { from: { cell: peer, digit: extraDigit }, to: { cell: roofCell, digit: extraDigit }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `含 UR 节点的 AIC：格 ${cellLabel(peer)} 与 UR 顶格 ${cellLabel(roofCell)} 在某房间形成强链，同时 UR 约束迫使 ${cellLabel(roofCell)} 必须含 ${extraDigit}（UR 逃跑格）；因此 ${cellLabel(peer)} 不能为 ${extraDigit}，消去之。`,
              en: `AIC with UR: cell ${cellLabel(peer)} and UR roof cell ${cellLabel(roofCell)} form a strong link in a house; UR forces ${cellLabel(roofCell)} must have ${extraDigit} (escape); therefore ${cellLabel(peer)} cannot be ${extraDigit}; eliminate it.`,
            },
          };
        }
      }
    }

    // Additional case: chain type where UR provides a "bi-value bridge"
    // If roofCell has candidates {E, D} and UR forces E:
    // → D cannot be in roofCell → eliminate D from roofCell
    // But that's UR Type 1 (eliminate UR pair digits).
    // For a genuine AIC contribution: find a longer chain using UR as a node.
    // Leaving more complex cases for later; the above covers the basic useful case.
  }

  return null;
}

export const aicWithUR: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含 UR 节点的 AIC', en: 'AIC with UR' },
  difficulty: 770,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryAICwithUR(grid);
  },
};
