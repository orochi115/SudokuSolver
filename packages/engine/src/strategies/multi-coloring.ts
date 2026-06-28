/**
 * Multi-Coloring / 多重染色法 (P1)
 *
 * For a single digit, builds connected components of conjugate pairs (strong links).
 * Multi-Coloring uses two or more independent clusters to detect eliminations that
 * Simple Coloring (one cluster) cannot find.
 *
 * The technique is implemented as the X-Colors / Promotion algorithm:
 *   Step 1: Seed on one conjugate pair.
 *   Step 2: Expand along strong links (=Simple Coloring).
 *   Step 3: Promotion — if in some house all-but-one d-cell are peers of the same
 *           color, the exception cell gets that same color.
 *   Step 4: Apply trap/wrap/house-empty rules.
 *
 * Multi-Colors (two cluster pairs):
 *   Type 1: If two clusters' cells share a house (weak link between them), any cell
 *           seeing both opposite colors (B1 and B2) can be eliminated.
 *   Type 2: Two same-color cells (from the SAME cluster) each see an opposite color
 *           of the other cluster → that color is all false.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  maskOf, PEERS_OF, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/** Build connected components of conjugate pairs for digit d. */
function buildComponents(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];

  // Build adjacency from strong links (house with exactly 2 candidates for d)
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  // BFS to form bipartite components
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = new Map<number, 0 | 1>();
    const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);

    while (queue.length > 0) {
      const { cell, color } = queue.shift()!;
      for (const neighbor of adj.get(cell) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        const ncolor = (1 - color) as 0 | 1;
        comp.set(neighbor, ncolor);
        queue.push({ cell: neighbor, color: ncolor });
      }
    }

    if (comp.size >= 2) components.push(comp);
  }

  return components;
}

/**
 * X-Colors with promotion: expands the two-color assignment through promotion.
 * Returns a Map from cell to color (0 or 1), seeded from the given component.
 * Promotion: if in some house all-but-one d-cells see color A, the exception gets color A too.
 */
function buildXColors(
  grid: Grid,
  d: number,
  seedComp: Map<number, 0 | 1>,
): Map<number, 0 | 1> {
  const bit = maskOf(d);
  const colored = new Map<number, 0 | 1>(seedComp);

  let changed = true;
  while (changed) {
    changed = false;
    for (const house of HOUSES) {
      const dCells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (dCells.length < 2) continue;

      const uncolored = dCells.filter((c) => !colored.has(c));
      if (uncolored.length !== 1) continue;

      const exception = uncolored[0]!;
      const coloredInHouse = dCells.filter((c) => colored.has(c));

      // Check if ALL colored cells in this house share one color's peers
      // Promotion: if all colored d-cells in this house are peers of color A,
      // then exception is also color A (same color, not opposite)
      for (const targetColor of [0, 1] as const) {
        const sameColorCells = coloredInHouse.filter((c) => colored.get(c) === targetColor);
        const otherColorCells = coloredInHouse.filter((c) => colored.get(c) !== targetColor);

        // If all colored cells have same color and exception doesn't see one of them → promotion
        // Actually the promotion rule: all-but-one d-cells in the house are peers of COLOR
        // → exception gets that same COLOR
        if (otherColorCells.length === 0 && sameColorCells.length > 0) {
          // All colored cells in this house are same color → exception gets same color (promotion)
          if (!colored.has(exception)) {
            colored.set(exception, targetColor);
            changed = true;
          }
        }
      }
    }
  }

  return colored;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色法', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const components = buildComponents(grid, d);
      if (components.length < 1) continue;

      // Try each component with X-Colors promotion
      for (const seedComp of components) {
        const colored = buildXColors(grid, d, seedComp);
        const color0: number[] = [];
        const color1: number[] = [];
        for (const [cell, color] of colored) {
          if (color === 0) color0.push(cell);
          else color1.push(cell);
        }

        // Rule: Color Wrap — two same-color cells in the same house
        for (const colorGroup of [color0, color1] as const) {
          const otherGroup = colorGroup === color0 ? color1 : color0;
          for (let i = 0; i < colorGroup.length; i++) {
            for (let j = i + 1; j < colorGroup.length; j++) {
              const a = colorGroup[i]!;
              const b = colorGroup[j]!;
              if (PEERS_OF[a]!.includes(b)) {
                // colorGroup is all false, otherGroup is all true
                const placements = otherGroup
                  .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
                  .map((c) => ({ cell: c, digit: d }));
                if (placements.length === 0) continue;

                const allCells = [...colored.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allCells,
                    candidates: allCells.map((c) => ({ cell: c, digit: d })),
                    links: buildLinks(grid, d, colored),
                  },
                  explanation: {
                    zh: `多重染色（染色矛盾）：数字 ${d} 的染色链中，同色的 ${cellLabel(a)} 和 ${cellLabel(b)} 互相可见；该色全部为假，另一色（${placements.map((p) => cellLabel(p.cell)).join(',')}）全部为 ${d}。`,
                    en: `Multi-Coloring (Wrap): digit ${d}'s coloring has same-color cells ${cellLabel(a)} and ${cellLabel(b)} seeing each other; that color is false, the other color is all ${d}.`,
                  },
                };
              }
            }
          }
        }

        // Rule: Color Trap — a cell outside sees both colors
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (colored.has(c)) continue;
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & bit)) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesColor0 = color0.some((x) => peers.has(x));
          const seesColor1 = color1.some((x) => peers.has(x));
          if (seesColor0 && seesColor1) {
            elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          const allCells = [...colored.keys()];
          return {
            strategyId: 'multi-coloring',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...allCells, ...elims.map((e) => e.cell)],
              candidates: [
                ...allCells.map((c) => ({ cell: c, digit: d })),
                ...elims,
              ],
              links: buildLinks(grid, d, colored),
            },
            explanation: {
              zh: `多重染色（颜色陷阱）：数字 ${d} 染色后，某格（${elims.map((e) => cellLabel(e.cell)).join(',')}）同时看到两种颜色，必有一色为真；消去其 ${d}。`,
              en: `Multi-Coloring (Trap): digit ${d}'s coloring; cell(s) see both colors, so one must be true → eliminate ${d} from those cells.`,
            },
          };
        }
      }

      // Multi-Colors (two cluster pairs) Type 1 & Type 2
      if (components.length >= 2) {
        for (let i = 0; i < components.length; i++) {
          for (let j = i + 1; j < components.length; j++) {
            const comp1 = components[i]!;
            const comp2 = components[j]!;

            // Get color arrays for both clusters
            const c1a: number[] = [], c1b: number[] = [];
            for (const [cell, color] of comp1) {
              if (color === 0) c1a.push(cell); else c1b.push(cell);
            }
            const c2a: number[] = [], c2b: number[] = [];
            for (const [cell, color] of comp2) {
              if (color === 0) c2a.push(cell); else c2b.push(cell);
            }

            // Check for weak links between clusters (cells in same house)
            // Type 1: A1 and A2 share a house → B1 or B2 is true → eliminate from cells seeing B1 AND B2
            for (const [linked1, linked2, opp1, opp2] of [
              [c1a, c2a, c1b, c2b], // A1-A2 link → B1,B2 not both false
              [c1a, c2b, c1b, c2a], // A1-B2 link → B1,A2 not both false
              [c1b, c2a, c1a, c2b], // B1-A2 link → A1,B2 not both false
              [c1b, c2b, c1a, c2a], // B1-B2 link → A1,A2 not both false
            ] as [number[], number[], number[], number[]][]) {
              // Check if linked1 and linked2 share a house (weak link between clusters)
              let hasWeakLink = false;
              for (const ca of linked1) {
                for (const cb of linked2) {
                  if (PEERS_OF[ca]!.includes(cb)) {
                    hasWeakLink = true;
                    break;
                  }
                }
                if (hasWeakLink) break;
              }
              if (!hasWeakLink) continue;

              // Type 1: linked1 & linked2 share house → opp1 or opp2 is true
              // Eliminate d from cells seeing ALL of opp1 AND ALL of opp2
              if (opp1.length === 0 || opp2.length === 0) continue;
              const elims: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (comp1.has(c) || comp2.has(c)) continue;
                if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
                const peers = new Set(PEERS_OF[c]!);
                const seesOpp1 = opp1.some((x) => peers.has(x));
                const seesOpp2 = opp2.some((x) => peers.has(x));
                if (seesOpp1 && seesOpp2) {
                  elims.push({ cell: c, digit: d });
                }
              }
              if (elims.length > 0) {
                const allCells = [...comp1.keys(), ...comp2.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements: [],
                  eliminations: elims,
                  highlights: {
                    cells: [...allCells, ...elims.map((e) => e.cell)],
                    candidates: allCells.map((c) => ({ cell: c, digit: d })),
                    links: [],
                  },
                  explanation: {
                    zh: `多重染色（Type 1）：数字 ${d}，两个独立强链团的颜色对之间存在弱链；消去能看到两个对立颜色的格的 ${d}。`,
                    en: `Multi-Coloring (Type 1): digit ${d}, two independent clusters have a weak link between opposing colors; eliminate ${d} from cells seeing both opposite colors.`,
                  },
                };
              }
            }

            // Type 2: Two same-color cells from one cluster each see an opposite color of other cluster
            // → that color is all false
            for (const [sameColorCells, otherColorCells, comp2opp1, comp2opp2] of [
              [c1a, c1b, c2a, c2b],
              [c1b, c1a, c2a, c2b],
            ] as [number[], number[], number[], number[]][]) {
              // Check if one sameColorCell sees a comp2opp1-cell and another sees a comp2opp2-cell
              const seeComp2a = sameColorCells.filter((c) => comp2opp1.some((x) => PEERS_OF[c]!.includes(x)));
              const seeComp2b = sameColorCells.filter((c) => comp2opp2.some((x) => PEERS_OF[c]!.includes(x)));

              if (seeComp2a.length > 0 && seeComp2b.length > 0) {
                // At least one of comp2 colors is true → one of sameColorCells sees a true cell
                // → sameColorCells might be forced false → otherColorCells would be true
                // (Type 2 logic: since one of A2/B2 is true, one of the sameColorCells sees it
                //  → that cell is false → since they're same color, all are false → otherColorCells are true)
                const placements = otherColorCells
                  .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
                  .map((c) => ({ cell: c, digit: d }));
                if (placements.length === 0) continue;

                // Also eliminate from all sameColorCells
                const elims2 = sameColorCells
                  .filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, d))
                  .map((c) => ({ cell: c, digit: d }));

                const allCells = [...comp1.keys(), ...comp2.keys()];
                if (elims2.length > 0) {
                  return {
                    strategyId: 'multi-coloring',
                    placements,
                    eliminations: elims2,
                    highlights: {
                      cells: allCells,
                      candidates: allCells.map((c) => ({ cell: c, digit: d })),
                      links: [],
                    },
                    explanation: {
                      zh: `多重染色（Type 2）：数字 ${d}，同色格分别看到另一团的两种颜色；该色全为假，对立色全为 ${d}。`,
                      en: `Multi-Coloring (Type 2): digit ${d}, same-color cells see both colors of the other cluster; that color is all false, the opposite color is all ${d}.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};

function buildLinks(
  grid: Grid,
  d: number,
  comp: Map<number, 0 | 1>,
): import('../trace.js').Link[] {
  const bit = maskOf(d);
  const links: import('../trace.js').Link[] = [];
  const seen = new Set<string>();

  for (const house of HOUSES) {
    const cands = house.filter(
      (c) => comp.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
    );
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' });
  }
  return links;
}
