/**
 * 3D Medusa / 三维美杜莎染色法 (P1)
 *
 * Builds one bipartite network of (cell, digit) pairs using both:
 *   - Bi-location strong links: digit d appears in exactly 2 cells of a house
 *   - Bi-value strong links: a cell has exactly 2 candidates (bivalue cell)
 *
 * 2-color the network (Green/Blue). Exactly one color is the solution set.
 * Six rules fire on this network:
 *
 * R1: Two same-color candidates in ONE cell → that color is false → other color placed.
 * R2: Two same-color candidates of SAME digit in ONE house → same as R1.
 * R3: Uncolored candidate in a cell that has BOTH Green and Blue → eliminate it.
 * R4: Uncolored candidate sees a Green and a Blue of the same digit → eliminate it.
 * R5: Uncolored (c,d) sees a colored d in a house AND has the opposite color in its cell → eliminate.
 * R6: Uncolored cell where ALL candidates see the SAME color → that color false, other color placed.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  maskOf, popcount, PEERS_OF, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/** Encode a (cell, digit) pair as a number. */
function encodeCD(cell: number, digit: number): number {
  return cell * 10 + digit;
}

/**
 * Build one connected component of the Medusa strong-link graph,
 * 2-colored. Returns null if a component is not bipartite (should not happen
 * in a valid puzzle, but we skip such components gracefully).
 */
function buildMedusaComponent(
  grid: Grid,
  seed: { cell: number; digit: number },
  visitedCD: Set<number>,
): Map<number, 0 | 1> | null {
  const comp = new Map<number, 0 | 1>(); // encoded CD → color
  const queue: Array<{ cell: number; digit: number; color: 0 | 1 }> = [];

  const seedKey = encodeCD(seed.cell, seed.digit);
  if (visitedCD.has(seedKey)) return null;
  if (!grid.hasCandidate(seed.cell, seed.digit)) return null;

  visitedCD.add(seedKey);
  comp.set(seedKey, 0);
  queue.push({ ...seed, color: 0 });

  while (queue.length > 0) {
    const { cell, digit, color } = queue.shift()!;
    const nextColor = (1 - color) as 0 | 1;

    // Strong neighbors via bi-location (same digit, conjugate pair in house)
    const bit = maskOf(digit);
    for (const house of HOUSES) {
      if (!house.includes(cell)) continue;
      const cands = house.filter(
        (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
      );
      if (cands.length !== 2) continue;
      const other = cands.find((c) => c !== cell);
      if (other === undefined) continue;

      const key = encodeCD(other, digit);
      if (!visitedCD.has(key)) {
        visitedCD.add(key);
        comp.set(key, nextColor);
        queue.push({ cell: other, digit, color: nextColor });
      } else if (comp.get(key) !== nextColor) {
        return null; // Not bipartite
      }
    }

    // Strong neighbors via bi-value (same cell, bivalue cell, switch digit)
    if (popcount(grid.candidatesOf(cell)) === 2) {
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        if (d === digit) continue;
        const key = encodeCD(cell, d);
        if (!visitedCD.has(key)) {
          visitedCD.add(key);
          comp.set(key, nextColor);
          queue.push({ cell, digit: d, color: nextColor });
        } else if (comp.get(key) !== nextColor) {
          return null; // Not bipartite
        }
      }
    }
  }

  return comp.size >= 2 ? comp : null;
}

export const medusa3D: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎染色法', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const visitedCD = new Set<number>();

    // Try each (cell, digit) as a seed for a new component
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        const key = encodeCD(cell, digit);
        if (visitedCD.has(key)) continue;

        // Only seed components that have strong links
        const hasBiLocation = HOUSES.some((h) => {
          if (!h.includes(cell)) return false;
          const bit = maskOf(digit);
          return h.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length === 2;
        });
        const hasBiValue = popcount(grid.candidatesOf(cell)) === 2;
        if (!hasBiLocation && !hasBiValue) {
          visitedCD.add(key);
          continue;
        }

        const comp = buildMedusaComponent(grid, { cell, digit }, visitedCD);
        if (!comp || comp.size < 2) continue;

        const result = applyMedusaRules(grid, comp);
        if (result) return result;
      }
    }
    return null;
  },
};

/**
 * Apply the 6 Medusa rules to a colored component.
 */
function applyMedusaRules(
  grid: Grid,
  comp: Map<number, 0 | 1>,
): Step | null {
  // Build reverse index: color → list of (cell, digit)
  const green: Array<{ cell: number; digit: number }> = [];
  const blue: Array<{ cell: number; digit: number }> = [];
  for (const [key, color] of comp) {
    const cell = Math.floor(key / 10);
    const digit = key % 10;
    if (color === 0) green.push({ cell, digit });
    else blue.push({ cell, digit });
  }

  // Build per-cell color maps
  const cellColoredDigits = new Map<number, Array<{ digit: number; color: 0 | 1 }>>();
  for (const [key, color] of comp) {
    const cell = Math.floor(key / 10);
    const digit = key % 10;
    if (!cellColoredDigits.has(cell)) cellColoredDigits.set(cell, []);
    cellColoredDigits.get(cell)!.push({ digit, color });
  }

  const allCompCells = [...new Set([...green.map((n) => n.cell), ...blue.map((n) => n.cell)])];

  // R1: Two same-color candidates in one cell
  for (const [cell, coloredDigits] of cellColoredDigits) {
    const g = coloredDigits.filter((x) => x.color === 0);
    const b = coloredDigits.filter((x) => x.color === 1);

    for (const [sameColorList, otherColorList, colorName, otherColorName] of [
      [g, b, 'Green' as const, 'Blue' as const],
      [b, g, 'Blue' as const, 'Green' as const],
    ] as [Array<{ digit: number; color: 0 | 1 }>, Array<{ digit: number; color: 0 | 1 }>, string, string][]) {
      if (sameColorList.length >= 2) {
        // sameColor is false → otherColor is all true → place

        // Actually all cells of otherColor are placements
        const otherColorGroup = otherColorName === 'Blue' ? blue : green;
        const allPlacements = otherColorGroup.filter(
          (n) => grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit),
        );

        if (allPlacements.length > 0) {
          return {
            strategyId: '3d-medusa',
            placements: allPlacements,
            eliminations: [],
            highlights: {
              cells: allCompCells,
              candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
              links: [],
            },
            explanation: {
              zh: `三维美杜莎 R1：格 ${cellLabel(cell)} 中有两个同色（${colorName}）候选数；${colorName} 全为假，${otherColorName} 全为解。`,
              en: `3D Medusa R1: Cell ${cellLabel(cell)} has two same-color (${colorName}) candidates; ${colorName} is false, ${otherColorName} are all solutions.`,
            },
          };
        }
      }
    }
  }

  // R2: Two same-color candidates of same digit in one house
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const greenInHouse = green.filter(
        (n) => n.digit === d && house.includes(n.cell) && grid.get(n.cell) === 0 && (grid.candidatesOf(n.cell) & bit) !== 0,
      );
      const blueInHouse = blue.filter(
        (n) => n.digit === d && house.includes(n.cell) && grid.get(n.cell) === 0 && (grid.candidatesOf(n.cell) & bit) !== 0,
      );

      for (const [sameColorInHouse, otherGroup, colorName] of [
        [greenInHouse, blue, 'Green'],
        [blueInHouse, green, 'Blue'],
      ] as [typeof greenInHouse, typeof greenInHouse, string][]) {
        if (sameColorInHouse.length >= 2) {
          // sameColor is false → otherColor is all true
          const allPlacements = otherGroup.filter(
            (n) => grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit),
          );
          if (allPlacements.length > 0) {
            return {
              strategyId: '3d-medusa',
              placements: allPlacements,
              eliminations: [],
              highlights: {
                cells: allCompCells,
                candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
                links: [],
              },
              explanation: {
                zh: `三维美杜莎 R2：一个房间内有两个同色（${colorName}）的候选数 ${d}；${colorName} 全为假，对色全为解。`,
                en: `3D Medusa R2: Two same-color (${colorName}) digit ${d} in one house; ${colorName} is false, opposite color are all solutions.`,
              },
            };
          }
        }
      }
    }
  }

  // R3: Uncolored candidate in a cell that has BOTH Green and Blue
  for (const [cell, coloredDigits] of cellColoredDigits) {
    if (grid.get(cell) !== 0) continue;
    const hasGreen = coloredDigits.some((x) => x.color === 0);
    const hasBlue = coloredDigits.some((x) => x.color === 1);
    if (!hasGreen || !hasBlue) continue;

    const coloredDigitSet = new Set(coloredDigits.map((x) => x.digit));
    const cellCands = digitsOf(grid.candidatesOf(cell));
    const elims = cellCands
      .filter((d) => !coloredDigitSet.has(d))
      .map((d) => ({ cell, digit: d }));

    if (elims.length > 0) {
      return {
        strategyId: '3d-medusa',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...allCompCells, ...elims.map((e) => e.cell)],
          candidates: [
            ...coloredDigits.map((x) => ({ cell, digit: x.digit })),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `三维美杜莎 R3：格 ${cellLabel(cell)} 同时有绿色和蓝色候选数；无论哪色为真，未染色候选数必为假；消去。`,
          en: `3D Medusa R3: Cell ${cellLabel(cell)} has both Green and Blue candidates; the uncolored candidates are eliminated regardless of which color is true.`,
        },
      };
    }
  }

  // R4: Uncolored (c,d) sees a Green d AND a Blue d → eliminate
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    const greenCellsD = green.filter((n) => n.digit === d).map((n) => n.cell);
    const blueCellsD = blue.filter((n) => n.digit === d).map((n) => n.cell);
    if (greenCellsD.length === 0 || blueCellsD.length === 0) continue;

    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (comp.has(encodeCD(c, d))) continue;
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
      const peers = new Set(PEERS_OF[c]!);
      const seesGreen = greenCellsD.some((gc) => peers.has(gc));
      const seesBlue = blueCellsD.some((bc) => peers.has(bc));
      if (seesGreen && seesBlue) {
        elims.push({ cell: c, digit: d });
      }
    }
    if (elims.length > 0) {
      return {
        strategyId: '3d-medusa',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...allCompCells, ...elims.map((e) => e.cell)],
          candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
          links: [],
        },
        explanation: {
          zh: `三维美杜莎 R4：数字 ${d} 的未染色格同时看到绿色和蓝色的 ${d}；必有一真，消去。`,
          en: `3D Medusa R4: Uncolored digit ${d} cells see both Green and Blue ${d}; one must be true → eliminate.`,
        },
      };
    }
  }

  // R5: Uncolored (c,d) sees a colored d along a house AND has opposite color in its cell
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);

    for (let c = 0; c < CELLS; c++) {
      if (comp.has(encodeCD(c, d))) continue;
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;

      // Does (c,d) see any Green d or Blue d in houses?
      const peers = new Set(PEERS_OF[c]!);
      const seenGreenD = green.filter((n) => n.digit === d && peers.has(n.cell));
      const seenBlueD = blue.filter((n) => n.digit === d && peers.has(n.cell));

      // Does cell c have a colored candidate of the OPPOSITE color?
      const cColoredDigits = cellColoredDigits.get(c) ?? [];
      const cHasGreen = cColoredDigits.some((x) => x.color === 0);
      const cHasBlue = cColoredDigits.some((x) => x.color === 1);

      // Rule 5: sees colored d of one color in house + opposite color in own cell → eliminate
      if (seenGreenD.length > 0 && cHasBlue) {
        // Sees Green d along house, has Blue in own cell → either Green is true (d seen) or Blue is true (own cell occupied) → (c,d) eliminated
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: [{ cell: c, digit: d }],
          highlights: {
            cells: [...allCompCells, c],
            candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
            links: [],
          },
          explanation: {
            zh: `三维美杜莎 R5：格 ${cellLabel(c)} 的候选数 ${d} 沿房间看到绿色 ${d}，且格内有蓝色；无论哪色为真，${d} 在此格都为假；消去。`,
            en: `3D Medusa R5: Cell ${cellLabel(c)} candidate ${d} sees Green ${d} in a house, and has Blue in its cell; in either color case, ${d} here is false → eliminate.`,
          },
        };
      }
      if (seenBlueD.length > 0 && cHasGreen) {
        // Sees Blue d along house, has Green in own cell → eliminate
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: [{ cell: c, digit: d }],
          highlights: {
            cells: [...allCompCells, c],
            candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
            links: [],
          },
          explanation: {
            zh: `三维美杜莎 R5：格 ${cellLabel(c)} 的候选数 ${d} 沿房间看到蓝色 ${d}，且格内有绿色；无论哪色为真，${d} 在此格都为假；消去。`,
            en: `3D Medusa R5: Cell ${cellLabel(c)} candidate ${d} sees Blue ${d} in a house, and has Green in its cell; in either color case, ${d} here is false → eliminate.`,
          },
        };
      }
    }
  }

  // R6: Uncolored cell where ALL candidates see the SAME color → that color is false
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const coloredInCell = cellColoredDigits.get(c) ?? [];
    if (coloredInCell.length > 0) continue; // cell has colored candidates → skip (handled by R3)

    const cands = digitsOf(grid.candidatesOf(c));
    if (cands.length === 0) continue;

    // Check if all candidates in this cell see only Green d-cells (or only Blue d-cells)
    const peers = new Set(PEERS_OF[c]!);
    let allSeeGreen = true, allSeeBlue = true;

    for (const d of cands) {
      const bit = maskOf(d);
      const seesGreenD = green.some((n) => n.digit === d && peers.has(n.cell));
      const seesBlueD = blue.some((n) => n.digit === d && peers.has(n.cell));
      if (!seesGreenD) allSeeGreen = false;
      if (!seesBlueD) allSeeBlue = false;
    }

    if (allSeeGreen) {
      // Green is false → Blue is true → place all blue candidates
      const placements = blue.filter(
        (n) => grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit),
      );
      if (placements.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements,
          eliminations: [],
          highlights: {
            cells: allCompCells,
            candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
            links: [],
          },
          explanation: {
            zh: `三维美杜莎 R6：未染色格 ${cellLabel(c)} 的所有候选数都看到绿色；若绿色为真则该格无解；绿色为假，蓝色为解。`,
            en: `3D Medusa R6: Uncolored cell ${cellLabel(c)} has all candidates seeing Green; Green would empty this cell; Green is false, Blue are all solutions.`,
          },
        };
      }
    }
    if (allSeeBlue) {
      // Blue is false → Green is true
      const placements = green.filter(
        (n) => grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit),
      );
      if (placements.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements,
          eliminations: [],
          highlights: {
            cells: allCompCells,
            candidates: [...comp.entries()].map(([k]) => ({ cell: Math.floor(k / 10), digit: k % 10 })),
            links: [],
          },
          explanation: {
            zh: `三维美杜莎 R6：未染色格 ${cellLabel(c)} 的所有候选数都看到蓝色；若蓝色为真则该格无解；蓝色为假，绿色为解。`,
            en: `3D Medusa R6: Uncolored cell ${cellLabel(c)} has all candidates seeing Blue; Blue would empty this cell; Blue is false, Green are all solutions.`,
          },
        };
      }
    }
  }

  return null;
}
