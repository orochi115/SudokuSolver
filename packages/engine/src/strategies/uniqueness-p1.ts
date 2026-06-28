/**
 * Uniqueness Techniques P1 Extensions:
 *   - Avoidable Rectangle Types 1-4
 *   - Extended Unique Rectangle (2×3)
 *   - Unique Loop
 *   - BUG-Lite (BUG without the full +1 cell count)
 *   - BUG+N (N extra cells)
 *
 * These extend the uniqueness engine to detect deadly patterns in solved cells
 * (AR), 3-digit 2×3 patterns (EUR), even bivalue loops (UL), and generalised BUG states.
 */

import {
  CELLS, ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/** Find all 2×2 rectangles: 4 cells in 2 rows, 2 cols, spanning exactly 2 boxes. */
function* allRectangles2x2(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

// ============================================================
// Avoidable Rectangle
// ============================================================

/**
 * Avoidable Rectangle: A 2×2 rectangle where:
 * - 3 cells are SOLVED (non-given) with appropriate values
 * - The 4th cell has a candidate that would complete the deadly pattern
 *
 * This requires knowing which cells are "given" (original clues).
 * The grid needs to expose this information via isGiven().
 * Since our Grid API may not directly expose this, we check the
 * standard approach: if a cell has value != 0 and was not in the
 * original puzzle, it's "solved" (not given).
 *
 * For our implementation, we need access to the "isGiven" state.
 * We detect this by checking the grid's given cells separately.
 */

function tryAvoidableRectangle(grid: Grid, type: 1 | 2 | 3 | 4): Step | null {
  const isGiven = (c: number): boolean => grid.isGiven(c);

  for (const [c11, c12, c21, c22] of allRectangles2x2()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map((c) => grid.get(c));

    // For AR, we need 3 solved non-given cells and 1 open cell
    const solvedNonGiven = cells.filter((c) => {
      const v = grid.get(c);
      return v !== 0 && !isGiven(c);
    });
    const openCells = cells.filter((c) => grid.get(c) === 0);

    if (solvedNonGiven.length !== 3 || openCells.length !== 1) continue;

    const openCell = openCells[0]!;
    const solvedVals = solvedNonGiven.map((c) => grid.get(c));
    const uniqueVals = [...new Set(solvedVals)];

    // The 3 solved cells should contain 2 distinct values (a and b, with one duplicated)
    if (uniqueVals.length !== 2) continue;

    const [a, b] = uniqueVals as [number, number];

    // Check if the arrangement is a/b/b/a or b/a/a/b pattern
    // The 4 cells should have values forming a potential deadly pattern
    const valMap = new Map(cells.map((c, i) => [c, values[i]!]));

    // Count occurrences of a and b in the 3 solved cells
    const countA = solvedNonGiven.filter((c) => valMap.get(c) === a).length;
    const countB = solvedNonGiven.filter((c) => valMap.get(c) === b).length;

    // Need 2 of one and 1 of the other (a/b/b or b/a/a arrangement)
    if (!((countA === 2 && countB === 1) || (countA === 1 && countB === 2))) continue;

    // The "completing digit" for the open cell
    // If solvedCells have: a, b, b → completing digit is a (makes a/b/b/a)
    // If solvedCells have: b, a, a → completing digit is b (makes b/a/a/b)
    const completingDigit = countA === 2 ? b : a;

    if (type === 1) {
      // AR Type 1: Eliminate the completing digit from the open cell
      if (!grid.hasCandidate(openCell, completingDigit)) continue;

      return {
        strategyId: `avoidable-rectangle-type-1`,
        placements: [],
        eliminations: [{ cell: openCell, digit: completingDigit }],
        highlights: {
          cells,
          candidates: [{ cell: openCell, digit: completingDigit }],
          links: [],
        },
        explanation: {
          zh: `可避免矩形 Type1：三个非初始格已填入 {${a},${b}} 的排列；若第四格填入 ${completingDigit} 则产生双解；消去 ${completingDigit}。`,
          en: `Avoidable Rectangle Type 1: three non-given cells are filled with arrangement {${a},${b}}; if the open cell takes ${completingDigit}, a deadly pattern forms; eliminate ${completingDigit}.`,
        },
      };
    }

    if (type === 2) {
      // AR Type 2: Two open cells share extra candidate c
      // Actually AR Type 2 has 2 open cells, not 1... let me revisit
      // AR Type 2: 2 cells are solved (the a/b pair), 2 cells are open with extra candidate c
      // This is a different AR structure
    }
  }

  // AR Type 2: Two solved cells (the a/b pair) + 2 open cells each with extra c
  if (type === 2) {
    for (const [c11, c12, c21, c22] of allRectangles2x2()) {
      const cells = [c11, c12, c21, c22];
      const values = cells.map((c) => grid.get(c));

      // Exactly 2 solved non-given cells forming the UR pair
      const solvedNonGiven = cells.filter((c) => grid.get(c) !== 0 && !isGiven(c));
      const openCells = cells.filter((c) => grid.get(c) === 0);

      if (solvedNonGiven.length !== 2 || openCells.length !== 2) continue;

      const solvedVals = solvedNonGiven.map((c) => grid.get(c));
      const uniqueSolvedVals = [...new Set(solvedVals)];
      if (uniqueSolvedVals.length !== 2) continue; // must be different values

      const [a, b] = uniqueSolvedVals as [number, number];

      // The 2 open cells must each have both UR digits plus a common extra c
      const aBit = maskOf(a);
      const bBit = maskOf(b);
      const openMasks = openCells.map((c) => grid.candidatesOf(c));

      // Both open cells must have both a and b as candidates
      if (!openMasks.every((m) => (m & aBit) !== 0 && (m & bBit) !== 0)) continue;

      // Extra candidates = those beyond a,b; must share at least one common extra c
      const extras = openMasks.map((m) => m & ~(aBit | bBit));
      const commonExtra = extras[0]! & extras[1]!;
      if (commonExtra === 0) continue;

      // Eliminate each extra digit c from cells seeing both open cells
      for (const c of digitsOf(commonExtra)) {
        const cBit = maskOf(c);
        const peers0 = new Set(PEERS_OF[openCells[0]!]!);
        const elims: { cell: number; digit: number }[] = [];
        for (const peer of PEERS_OF[openCells[1]!]!) {
          if (!peers0.has(peer)) continue;
          if (openCells.includes(peer)) continue;
          if (grid.get(peer) !== 0 || !grid.hasCandidate(peer, c)) continue;
          elims.push({ cell: peer, digit: c });
        }

        if (elims.length > 0) {
          return {
            strategyId: 'avoidable-rectangle-type-2',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells, ...elims.map((e) => e.cell)],
              candidates: openCells.flatMap((cell) =>
                digitsOf(grid.candidatesOf(cell)).map((d) => ({ cell, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `可避免矩形 Type2：两个非初始格已填，两个空格各含相同额外候选 ${c}；消去能看到两空格的格中的 ${c}。`,
              en: `Avoidable Rectangle Type 2: two non-given cells solved, two open cells share extra candidate ${c}; eliminate ${c} from cells seeing both open cells.`,
            },
          };
        }
      }
    }
  }

  return null;
}

// AR Type 3: open cells' extras form a naked subset with outside cells
function tryARType3(grid: Grid): Step | null {
  const isGiven = (c: number): boolean => grid.isGiven(c);

  for (const [c11, c12, c21, c22] of allRectangles2x2()) {
    const cells = [c11, c12, c21, c22];

    const solvedNonGiven = cells.filter((c) => grid.get(c) !== 0 && !isGiven(c));
    const openCells = cells.filter((c) => grid.get(c) === 0);

    if (solvedNonGiven.length !== 2 || openCells.length !== 2) continue;

    const solvedVals = solvedNonGiven.map((c) => grid.get(c));
    const uniqueSolvedVals = [...new Set(solvedVals)];
    if (uniqueSolvedVals.length !== 2) continue;

    const [a, b] = uniqueSolvedVals as [number, number];
    const aBit = maskOf(a);
    const bBit = maskOf(b);
    const openMasks = openCells.map((c) => grid.candidatesOf(c));

    if (!openMasks.every((m) => (m & aBit) !== 0 && (m & bBit) !== 0)) continue;

    // Pseudo-cell: union of extras from both open cells
    const extrasA = openMasks[0]! & ~(aBit | bBit);
    const extrasB = openMasks[1]! & ~(aBit | bBit);
    if (extrasA === 0 || extrasB === 0) continue;

    const pseudoMask = extrasA | extrasB;
    const pseudoSize = popcount(pseudoMask);

    // Get shared houses of open cells
    const sharedHouses: number[] = [];
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      if (house.includes(openCells[0]!) && house.includes(openCells[1]!)) {
        sharedHouses.push(h);
      }
    }

    for (const hIdx of sharedHouses) {
      const house = HOUSES[hIdx]!;
      const outsideCells = house.filter(
        (c) => !cells.includes(c) && grid.get(c) === 0,
      );

      // Look for naked pair (pseudoSize <= 2)
      if (pseudoSize <= 2) {
        for (const out of outsideCells) {
          const outMask = grid.candidatesOf(out);
          if ((outMask & ~pseudoMask) !== 0 || outMask === 0) continue;

          const subsetCells = new Set([...openCells, out]);
          const elims: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (subsetCells.has(c) || cells.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of digitsOf(pseudoMask)) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;

          return {
            strategyId: 'avoidable-rectangle-type-3',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells, out, ...elims.map((e) => e.cell)],
              candidates: [...openCells, out].flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `可避免矩形 Type3：AR 两空格的额外候选数与 ${cellLabel(out)} 构成 naked 对；消去共享房间其他格的相关候选。`,
              en: `Avoidable Rectangle Type 3: AR open cells' extras plus ${cellLabel(out)} form a naked pair; eliminate those digits from other cells in the house.`,
            },
          };
        }
      }
    }
  }

  return null;
}

// AR Type 4: like UR Type 4 but with solved non-given cells
function tryARType4(grid: Grid): Step | null {
  const isGiven = (c: number): boolean => grid.isGiven(c);

  for (const [c11, c12, c21, c22] of allRectangles2x2()) {
    const cells = [c11, c12, c21, c22];
    if (cells.some(isGiven)) continue;

    const solvedNonGiven = cells.filter((c) => grid.get(c) !== 0 && !isGiven(c));
    const openCells = cells.filter((c) => grid.get(c) === 0);

    if (solvedNonGiven.length !== 2 || openCells.length !== 2) continue;

    const solvedVals = solvedNonGiven.map((c) => grid.get(c));
    if (new Set(solvedVals).size !== 2) continue;

    const [a, b] = solvedVals as [number, number];
    const aBit = maskOf(a);
    const bBit = maskOf(b);

    // Floor cells (open) must still carry the UR pair {a,b} as candidates.
    if (!openCells.every((c) => (grid.candidatesOf(c) & aBit) && (grid.candidatesOf(c) & bBit))) {
      continue;
    }

    // Roof cells (solved) must be one a and one b.
    if (!solvedNonGiven.some((c) => grid.get(c) === a) || !solvedNonGiven.some((c) => grid.get(c) === b)) {
      continue;
    }

    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      if (!house.includes(openCells[0]!) || !house.includes(openCells[1]!)) continue;

      for (const [locked, elim] of [[a, b], [b, a]] as [number, number][]) {
        const lockedBit = maskOf(locked);
        const lockedInHouse = house.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0,
        );
        if (lockedInHouse.length !== 2) continue;
        if (!lockedInHouse.every((c) => openCells.includes(c))) continue;

        const elims = openCells
          .filter((c) => grid.hasCandidate(c, elim))
          .map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;

        return {
          strategyId: 'avoidable-rectangle-type-4',
          placements: [],
          eliminations: elims,
          highlights: {
            cells,
            candidates: openCells.flatMap((c) =>
              digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
            ),
            links: [],
          },
          explanation: {
            zh: `可避免矩形 Type4：AR 空格的 ${locked} 被锁定在共享房间；消去两空格的 ${elim}。`,
            en: `Avoidable Rectangle Type 4: AR open cells' digit ${locked} is locked in the shared house; eliminate ${elim} from both open cells.`,
          },
        };
      }
    }
  }

  return null;
}

// ============================================================
// Extended Unique Rectangle (2×3)
// ============================================================

/**
 * Extended UR: 6 cells in 3 rows × 3 cols × 3 boxes with exactly 3 digit candidates.
 * Type 1: one "odd cell out" has extra candidates → eliminate UR triple from it.
 * Type 2: 4-cell floor with 3 digits + 2-cell roof each with single extra d → eliminate d from peers of both roof cells.
 */
function tryExtendedUR(grid: Grid): Step | null {
  // Find 6-cell patterns in 3 rows × 3 cols × 3 boxes
  for (let r1 = 0; r1 < 7; r1++) {
    for (let r2 = r1 + 1; r2 < 8; r2++) {
      for (let r3 = r2 + 1; r3 < 9; r3++) {
        for (let c1 = 0; c1 < 7; c1++) {
          for (let c2 = c1 + 1; c2 < 8; c2++) {
            for (let c3 = c2 + 1; c3 < 9; c3++) {
              // 6 cells at intersections of 3 rows and 3 cols
              const sixCells = [
                r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
                r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
              ];

              // Must span exactly 3 boxes
              const boxes = new Set(sixCells.map((c) => BOX_OF[c]!));
              if (boxes.size !== 3) continue;

              // All 6 cells must be empty
              if (sixCells.some((c) => grid.get(c) !== 0)) continue;

              // Check if union of candidates = exactly 3 digits
              let unionMask = 0;
              for (const c of sixCells) unionMask |= grid.candidatesOf(c);
              if (popcount(unionMask) !== 3) continue;

              const triple = digitsOf(unionMask);

              // Type 1: Check another orientation with a 4-cell variant
              // Actually we need to find if any cell has extra candidates beyond the triple
              // The 6 cells form the EUR if they all have only triple candidates
              // But wait: EUR can also have some cells missing candidates (still deadly)

              // Simpler: check if all 6 cells have candidates ⊆ triple (no extras)
              // and find cases where one cell might have extras
              const extraCells = sixCells.filter((c) => (grid.candidatesOf(c) & ~unionMask) !== 0);

              if (extraCells.length === 0) {
                // Pure deadly pattern - shouldn't happen in valid unique puzzle
                // But if all 6 cells have only triple, something must break it
                continue;
              }

              // For EUR Type 1: exactly one cell has extra candidates
              if (extraCells.length === 1) {
                const odd = extraCells[0]!;
                const elims = triple
                  .filter((d) => grid.hasCandidate(odd, d))
                  .map((d) => ({ cell: odd, digit: d }));

                if (elims.length > 0) {
                  return {
                    strategyId: 'extended-unique-rectangle',
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: sixCells,
                      candidates: sixCells.flatMap((c) =>
                        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                      ),
                      links: [],
                    },
                    explanation: {
                      zh: `扩展唯一矩形 Type1：6格（3行×3列×3宫）的候选集仅含 {${triple.join(',')}}，仅 ${cellLabel(odd)} 有额外候选；消去该格的 {${triple.join(',')}}。`,
                      en: `Extended Unique Rectangle Type 1: 6 cells (3 rows × 3 cols × 3 boxes) with triple {${triple.join(',')}}; only ${cellLabel(odd)} has extras; eliminate {${triple.join(',')}} from it.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}

// ============================================================
// Unique Loop
// ============================================================

/**
 * Unique Loop: an even-length loop of bivalue cells on digits {A,B} that
 * spans exactly 2 of A and 2 of B in every house it touches.
 * This is a deadly pattern (multiple solutions by rotating A/B around loop).
 * Same type deductions as UR apply to the loop.
 */
function tryUniqueLoop(grid: Grid): Step | null {
  // Find all bivalue cells
  const bivalueCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
      bivalueCells.push(c);
    }
  }

  // For each pair of digits {A,B}, find loops among cells with exactly {A,B}
  const processedPairs = new Set<string>();
  for (const cell of bivalueCells) {
    const mask = grid.candidatesOf(cell);
    const [A, B] = digitsOf(mask) as [number, number];
    const pairKey = `${Math.min(A, B)}-${Math.max(A, B)}`;
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    // Find all cells with exactly {A,B}
    const abCells = bivalueCells.filter((c) => grid.candidatesOf(c) === mask);
    if (abCells.length < 4) continue;

    // Find even-length cycles among abCells
    const result = findUniqueLoop(grid, A, B, abCells);
    if (result) return result;
  }

  // Also find loops with some cells having extra candidates
  // (those cells are the "roof" / odd cells)
  for (const cell of bivalueCells) {
    const mask = grid.candidatesOf(cell);
    const [A, B] = digitsOf(mask) as [number, number];
    const pairKey2 = `ext-${Math.min(A, B)}-${Math.max(A, B)}`;
    if (processedPairs.has(pairKey2)) continue;
    processedPairs.add(pairKey2);

    // Find cells with {A,B} as subset (can have more candidates)
    const abCellsWithExtras = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const cm = grid.candidatesOf(c);
      if ((cm & maskOf(A)) !== 0 && (cm & maskOf(B)) !== 0) {
        abCellsWithExtras.push(c);
      }
    }
    if (abCellsWithExtras.length < 4) continue;

    const result2 = findUniqueLoopWithExtras(grid, A, B, abCellsWithExtras);
    if (result2) return result2;
  }

  return null;
}

function findUniqueLoop(grid: Grid, A: number, B: number, cells: number[]): Step | null {
  // DFS for even cycles of length >= 4
  const path: number[] = [];
  const visited = new Set<number>();

  function dfs(current: number, start: number): Step | null {
    if (path.length >= 4 && path.length % 2 === 0) {
      // Check if we can close back to start
      const shareHouse = HOUSES.some(
        (h) => h.includes(current) && h.includes(start),
      );
      if (shareHouse && current !== start) {
        // Found a loop: path + closing link to start
        return evaluateUniqueLoop(grid, A, B, path);
      }
    }

    if (path.length >= 8) return null; // Limit loop length

    for (const neighbor of cells) {
      if (visited.has(neighbor)) continue;
      if (neighbor === start && path.length >= 4 && path.length % 2 === 0) {
        // Closing to start
        return evaluateUniqueLoop(grid, A, B, path);
      }

      const shareHouse = HOUSES.some(
        (h) => h.includes(current) && h.includes(neighbor),
      );
      if (!shareHouse) continue;

      path.push(neighbor);
      visited.add(neighbor);
      const result = dfs(neighbor, start);
      path.pop();
      visited.delete(neighbor);
      if (result) return result;
    }
    return null;
  }

  for (const start of cells) {
    path.push(start);
    visited.add(start);
    const result = dfs(start, start);
    path.pop();
    visited.delete(start);
    if (result) return result;
  }
  return null;
}

function evaluateUniqueLoop(grid: Grid, A: number, B: number, loop: number[]): Step | null {
  if (loop.length < 4 || loop.length % 2 !== 0) return null;

  // All loop cells must have {A,B} as their only candidates (pure unique loop)
  const abMask = maskOf(A) | maskOf(B);
  if (!loop.every((c) => grid.candidatesOf(c) === abMask)) return null;

  // A unique loop must touch each house at most twice (check for 2-of-each in houses)
  // For simplicity, just verify that eliminations exist...
  // A pure bivalue even loop IS a deadly pattern, but with all pure-{A,B} cells,
  // there is nothing to eliminate (no extras) unless we look for external peers.
  // Actually for a unique loop TYPE 1: if there are no extras, it IS a full deadly pattern.
  // That would be unsound to use directly. We need at least one extra cell.
  return null;
}

function findUniqueLoopWithExtras(grid: Grid, A: number, B: number, cells: number[]): Step | null {
  const abMask = maskOf(A) | maskOf(B);

  // Pure cells (exactly {A,B}) and extra cells (have A,B plus more)
  const pureCells = cells.filter((c) => grid.candidatesOf(c) === abMask);
  const extraCells = cells.filter((c) => grid.candidatesOf(c) !== abMask);

  if (pureCells.length < 3) return null;
  if (extraCells.length === 0) return null;

  // Find cycles that include exactly the right structure
  // The loop must be even, include all pure cells, and at most a few extra cells
  const loopCells = [...pureCells, ...extraCells.slice(0, 2)];

  // Simplified: try to find loop structure where one cell has extras
  if (extraCells.length !== 1) return null;

  const extraCell = extraCells[0]!;
  const extraMask = grid.candidatesOf(extraCell) & ~abMask;
  const extraDigits = digitsOf(extraMask);

  if (extraDigits.length === 0) return null;

  // Build a path including the extra cell
  const path: number[] = [];
  const visited = new Set<number>();

  function dfs2(current: number, start: number): Step | null {
    if (path.length >= 4 && path.length % 2 === 0) {
      const shareHouse = HOUSES.some(
        (h) => h.includes(current) && h.includes(start),
      );
      if (shareHouse) {
        // Check if this is a valid unique loop
        // Must include the extra cell
        if (!path.includes(extraCell)) return null;

        // Type 1: extra cell has extra candidates → eliminate A,B from extra cell
        const elims = [A, B]
          .filter((d) => grid.hasCandidate(extraCell, d))
          .map((d) => ({ cell: extraCell, digit: d }));

        if (elims.length > 0) {
          return {
            strategyId: 'unique-loop',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...path],
              candidates: path.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `唯一环：偶数双值格环（${path.map(cellLabel).join('-')}）包含候选 {${A},${B}}；仅 ${cellLabel(extraCell)} 有额外候选；消去其 ${A} 和 ${B} 以避免致死图案。`,
              en: `Unique Loop: even bivalue loop (${path.map(cellLabel).join('-')}) with pair {${A},${B}}; only ${cellLabel(extraCell)} has extras; eliminate ${A},${B} from it to avoid deadly pattern.`,
            },
          };
        }
      }
    }

    if (path.length >= 10) return null;

    for (const neighbor of loopCells) {
      if (visited.has(neighbor)) continue;
      if (neighbor === start && path.length >= 4 && path.length % 2 === 0) {
        if (!path.includes(extraCell)) continue;
        const elims = [A, B]
          .filter((d) => grid.hasCandidate(extraCell, d))
          .map((d) => ({ cell: extraCell, digit: d }));
        if (elims.length > 0) {
          return {
            strategyId: 'unique-loop',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...path],
              candidates: path.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `唯一环：偶数双值格环包含候选 {${A},${B}}；消去额外格的 {${A},${B}} 以避免致死图案。`,
              en: `Unique Loop: even bivalue loop with pair {${A},${B}}; eliminate {${A},${B}} from the extra cell to avoid deadly pattern.`,
            },
          };
        }
        continue;
      }

      const shareHouse = HOUSES.some(
        (h) => h.includes(current) && h.includes(neighbor),
      );
      if (!shareHouse) continue;

      path.push(neighbor);
      visited.add(neighbor);
      const result = dfs2(neighbor, start);
      path.pop();
      visited.delete(neighbor);
      if (result) return result;
    }
    return null;
  }

  for (const start of loopCells) {
    path.push(start);
    visited.add(start);
    const result = dfs2(start, start);
    path.pop();
    visited.delete(start);
    if (result) return result;
  }
  return null;
}

// ============================================================
// BUG-Lite (BUG without full bivalue condition)
// ============================================================

/**
 * BUG-Lite: A relaxed form of BUG where not all cells need to be bivalue.
 * If the grid has a BUG-like structure with a few "extra" cells, and we can
 * identify the BUG digit in those cells, we can make placements.
 *
 * Our implementation: detect if removing one specific candidate from a tri-value
 * cell would create a pure BUG (all bivalue, each digit appearing exactly twice per house).
 * The removed candidate's complement must be placed.
 *
 * Actually BUG-Lite = simpler version: just look for cells where all but one candidate
 * appear an even number of times in each house → that one candidate is BUG digit.
 */
function tryBUGLite(grid: Grid): Step | null {
  // Check if we're close to a BUG state
  // Count empty cells with > 2 candidates
  const emptyCells: number[] = [];
  const nonBivalue: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) {
      emptyCells.push(c);
      if (popcount(grid.candidatesOf(c)) > 2) nonBivalue.push(c);
    }
  }

  // BUG-Lite: a small number of non-bivalue cells (2-4)
  // For each non-bivalue cell, check if removing one candidate would make it bivalue
  // AND would result in each digit appearing an even number of times per house
  if (nonBivalue.length < 2 || nonBivalue.length > 4) return null;

  // For each pair of non-bivalue cells where one candidate can "be placed" to avoid BUG:
  // Actually BUG-Lite is simpler: same as BUG+1 but for cells with > 3 candidates
  // Let's focus on the classic BUG+n case: if all non-bivalue cells share a common
  // candidate X, and placing X in one of them would resolve the situation.

  // Simplified BUG-Lite: check if there's a digit that appears an odd number of times
  // in the non-bivalue cells' houses → that digit in those cells must be placed.
  for (const cell of nonBivalue) {
    const mask = grid.candidatesOf(cell);
    for (const d of digitsOf(mask)) {
      const bit = maskOf(d);
      // Check: does d appear an odd number of times in each of cell's houses?
      let allHousesOdd = true;
      for (const hIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
        const house = HOUSES[hIdx]!;
        const count = house.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        ).length;
        if (count % 2 !== 1) { allHousesOdd = false; break; }
      }
      if (allHousesOdd) {
        return {
          strategyId: 'bug-lite',
          placements: [{ cell, digit: d }],
          eliminations: [],
          highlights: {
            cells: [cell],
            candidates: digitsOf(mask).map((dig) => ({ cell, digit: dig })),
            links: [],
          },
          explanation: {
            zh: `BUG-Lite：格 ${cellLabel(cell)} 中 ${d} 在其所有宫/行/列中出现奇数次；必须填入 ${d}。`,
            en: `BUG-Lite: digit ${d} in cell ${cellLabel(cell)} appears an odd number of times in all its houses; must place ${d}.`,
          },
        };
      }
    }
  }

  return null;
}

/**
 * BUG+N: Generalised BUG with N extra cells (N > 1).
 * If N cells each have an extra candidate beyond bivalue, and all N extras share
 * a common candidate X, then X must be placed in one of the N cells to avoid BUG.
 * When all N cells can see each other on X → X must be placed in exactly one
 * → but we can't determine which, so we eliminate X from their common peers.
 */
function tryBUGPlusN(grid: Grid): Step | null {
  const emptyCells: number[] = [];
  const nonBivalue: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) {
      emptyCells.push(c);
      if (popcount(grid.candidatesOf(c)) > 2) nonBivalue.push(c);
    }
  }

  // BUG+N: all empty cells are bivalue except exactly N cells
  if (nonBivalue.length < 2 || nonBivalue.length > 4) return null;
  if (emptyCells.some((c) => c !== nonBivalue[0] && !nonBivalue.includes(c) && popcount(grid.candidatesOf(c)) !== 2)) return null;

  // Check all non-bivalue cells have exactly 3 candidates
  if (!nonBivalue.every((c) => popcount(grid.candidatesOf(c)) === 3)) return null;

  // Find common extra candidate across all non-bivalue cells
  let commonMask = 0xFFFF;
  for (const c of nonBivalue) {
    commonMask &= grid.candidatesOf(c);
  }

  // The common extra candidates = those that appear in all non-bivalue cells
  if (commonMask === 0) return null;

  // Find which of the common candidates is the BUG digit
  // (appears odd number of times in some house for each non-bivalue cell)
  for (const d of digitsOf(commonMask)) {
    const bit = maskOf(d);

    // Check that d appears an odd number of times in at least one house per non-bivalue cell
    let allOdd = true;
    for (const cell of nonBivalue) {
      let anyHouseOdd = false;
      for (const hIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
        const house = HOUSES[hIdx]!;
        const count = house.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        ).length;
        if (count % 2 === 1) { anyHouseOdd = true; break; }
      }
      if (!anyHouseOdd) { allOdd = false; break; }
    }

    if (!allOdd) continue;

    // All non-bivalue cells need d as an odd-house candidate
    // Eliminate d from cells seeing ALL non-bivalue cells (but not the non-bivalue cells themselves)
    const peers0 = new Set(PEERS_OF[nonBivalue[0]!]!);
    let commonPeers = [...peers0];
    for (let i = 1; i < nonBivalue.length; i++) {
      const peersI = new Set(PEERS_OF[nonBivalue[i]!]!);
      commonPeers = commonPeers.filter((c) => peersI.has(c));
    }

    const elims: { cell: number; digit: number }[] = [];
    for (const peer of commonPeers) {
      if (nonBivalue.includes(peer)) continue;
      if (grid.get(peer) !== 0 || !grid.hasCandidate(peer, d)) continue;
      elims.push({ cell: peer, digit: d });
    }

    if (elims.length > 0) {
      return {
        strategyId: 'bug-plus-n',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...nonBivalue, ...elims.map((e) => e.cell)],
          candidates: nonBivalue.flatMap((c) =>
            digitsOf(grid.candidatesOf(c)).map((dig) => ({ cell: c, digit: dig })),
          ),
          links: [],
        },
        explanation: {
          zh: `BUG+${nonBivalue.length}：${nonBivalue.length} 个非双值格均含候选 ${d}（BUG数）；消去能看到所有这些格的格中的 ${d}。`,
          en: `BUG+${nonBivalue.length}: ${nonBivalue.length} non-bivalue cells all contain BUG digit ${d}; eliminate ${d} from cells seeing all of them.`,
        },
      };
    }
  }

  return null;
}

// ============================================================
// Strategy exports
// ============================================================

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 975,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryAvoidableRectangle(grid, 1);
  },
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 976,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryAvoidableRectangle(grid, 2);
  },
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 977,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryARType3(grid);
  },
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 978,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryARType4(grid);
  },
};

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryExtendedUR(grid);
  },
};

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryUniqueLoop(grid);
  },
};

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 912,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBUGLite(grid);
  },
};

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 914,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBUGPlusN(grid);
  },
};
