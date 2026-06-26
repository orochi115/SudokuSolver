/**
 * Advanced Coloring Strategies: Multi-Coloring (X-Colors) and 3D Medusa
 *
 * Multi-Coloring (multi-coloring):
 *   X-Colors algorithm: seed on one conjugate pair, expand via strong links,
 *   then augment by promotion. Three evaluation rules:
 *   4.1 Trap: a cell sees both color A and color B → eliminate.
 *   4.2 Wrap: two same-color cells in one house → other color is true.
 *   4.3 House empty: a house's d-cells all see one single color → that color
 *       cannot be true → other color is true.
 *
 * 3D Medusa (3d-medusa):
 *   Multi-digit coloring using both bi-location (house conjugate pair) and
 *   bi-value (bivalue cell) strong links. Six elimination rules R1–R6.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf, PEERS_OF, BOX_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ============================================================
// Multi-Coloring (X-Colors)
// ============================================================

/**
 * Build connected components of single-digit conjugate pairs (strong links),
 * then extend by promotion: if all but one cell of a house's d-candidates
 * see the same color, that remaining cell is also colored (same color).
 *
 * Returns an array of Maps: cell → 0 (color A) or 1 (color B)
 */
function buildXColorsComponent(grid: Grid, d: number): Map<number, 0 | 1>[] {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Map<number, 0 | 1>[] = [];

  // Build adjacency from strong links only (conjugate pairs)
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

    if (comp.size >= 2) {
      // Promotion step: expand via X-Colors promotion
      // In some house, if all d-cells except one are peers of color A,
      // the remaining cell is also colored A.
      let changed = true;
      while (changed) {
        changed = false;
        for (const house of HOUSES) {
          const hCells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          if (hCells.length < 2) continue;

          const colored = hCells.filter((c) => comp.has(c));
          const uncolored = hCells.filter((c) => !comp.has(c));
          if (uncolored.length !== 1) continue;

          const exception = uncolored[0]!;
          // Check if all colored cells see the exception (they are its peers)
          // — that would mean if that color were true, the exception is false,
          // so the exception carries the SAME color (promotion).
          for (const targetColor of [0, 1] as const) {
            const sameColorCells = colored.filter((c) => comp.get(c) === targetColor);
            if (sameColorCells.length === 0) continue;
            // All d-candidates in the house except the exception are colored targetColor?
            // And all see the exception? (Promotion condition)
            const allColoredSeeException = sameColorCells.every((c) => PEERS_OF[c]!.includes(exception));
            if (allColoredSeeException && sameColorCells.length === colored.length) {
              // Promotion: exception gets same color
              if (!comp.has(exception)) {
                comp.set(exception, targetColor);
                changed = true;
              }
            }
          }
        }
      }

      components.push(comp);
    }
  }

  return components;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring (X-Colors)' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const components = buildXColorsComponent(grid, d);

      for (const comp of components) {
        const color0: number[] = [];
        const color1: number[] = [];
        for (const [cell, color] of comp) {
          if (color === 0) color0.push(cell);
          else color1.push(cell);
        }

        // Rule 4.2 (Wrap): two same-color cells in one house → other color is true
        for (const [colorGroup, otherGroup] of [[color0, color1], [color1, color0]] as [number[], number[]][]) {
          for (let i = 0; i < colorGroup.length; i++) {
            for (let j = i + 1; j < colorGroup.length; j++) {
              const a = colorGroup[i]!;
              const b = colorGroup[j]!;
              if (PEERS_OF[a]!.includes(b)) {
                // colorGroup is all false, otherGroup is all true
                const placements = otherGroup
                  .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
                  .map((c) => ({ cell: c, digit: d }));

                if (placements.length === 0) break;

                const allChainCells = [...comp.keys()];
                const links = buildColorLinks(grid, d, comp);
                return {
                  strategyId: 'multi-coloring',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allChainCells,
                    candidates: allChainCells.map((c) => ({ cell: c, digit: d })),
                    links,
                  },
                  explanation: {
                    zh: `多重染色（颜色矛盾）：数字 ${d} 同色格 ${cellLabel(a)} 和 ${cellLabel(b)} 互相可见；该色全为假，另一色全为 ${d}。`,
                    en: `Multi-Coloring (Wrap): digit ${d} — same-color cells ${cellLabel(a)} and ${cellLabel(b)} see each other; that color is all false, the other color is all ${d}.`,
                  },
                };
              }
            }
          }
        }

        // Rule 4.3 (House empty): a house's d-cells all see one single color → that color cannot be true
        for (const house of HOUSES) {
          const hCells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          if (hCells.length === 0) continue;

          for (const [targetColor, trueColor] of [[0, 1], [1, 0]] as [number, number][]) {
            const colorGroup = targetColor === 0 ? color0 : color1;
            const trueGroup = targetColor === 0 ? color1 : color0;
            // All d-cells in the house that are uncolored or not in comp see a cell of targetColor?
            const allSeeColor = hCells.filter((c) => !comp.has(c)).every((c) => {
              return colorGroup.some((cc) => PEERS_OF[c]!.includes(cc));
            });
            const inHouseColored = hCells.filter((c) => comp.get(c) === targetColor);
            if (allSeeColor && hCells.every((c) => {
              const cc = comp.get(c);
              return cc === targetColor || (cc === undefined && colorGroup.some((cg) => PEERS_OF[c]!.includes(cg)));
            })) {
              // All d-cells in house see targetColor or ARE targetColor → targetColor can't be true → trueGroup is true
              const placements = trueGroup
                .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
                .map((c) => ({ cell: c, digit: d }));
              if (placements.length > 0) {
                const allChainCells = [...comp.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements,
                  eliminations: [],
                  highlights: {
                    cells: allChainCells,
                    candidates: allChainCells.map((c) => ({ cell: c, digit: d })),
                    links: buildColorLinks(grid, d, comp),
                  },
                  explanation: {
                    zh: `多重染色（宫满）：数字 ${d} 某行/列/宫中所有候选数均被一种颜色覆盖；该色为假，另一色全为 ${d}。`,
                    en: `Multi-Coloring (House-Empty): digit ${d} — all candidates in a house see one color; that color must be false, the other color is all ${d}.`,
                  },
                };
              }
            }
          }
        }

        // Rule 4.1 (Trap): cell sees both colors → eliminate d
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (comp.has(c)) continue;
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
          const allChainCells = [...comp.keys()];
          return {
            strategyId: 'multi-coloring',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...allChainCells, ...elims.map((e) => e.cell)],
              candidates: [
                ...allChainCells.map((c) => ({ cell: c, digit: d })),
                ...elims,
              ],
              links: buildColorLinks(grid, d, comp),
            },
            explanation: {
              zh: `多重染色（颜色陷阱）：数字 ${d} 染色链，某格同时可见两种颜色（含晋升后），必有一色为真；消去该格的 ${d}。`,
              en: `Multi-Coloring (Trap): digit ${d} — a cell sees both colors (including promoted); one color must be true, so eliminate ${d} from that cell.`,
            },
          };
        }
      }
    }

    return null;
  },
};

function buildColorLinks(grid: Grid, d: number, comp: Map<number, 0 | 1>): Link[] {
  const bit = maskOf(d);
  const links: Link[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => comp.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' });
  }
  return links;
}

// ============================================================
// 3D Medusa
// ============================================================

interface MedusaNode {
  cell: number;
  digit: number;
}

/**
 * Build a 3D Medusa network: connected component using both bi-location
 * (house conjugate pair on same digit) and bi-value (bivalue cell, both digits)
 * strong links.
 */
function buildMedusaComponents(grid: Grid): Array<Map<string, 0 | 1>> {
  // Node key: "cell:digit"
  function nodeKey(cell: number, digit: number): string {
    return `${cell}:${digit}`;
  }

  // Build adjacency for all strong links
  const adj = new Map<string, string[]>();

  function ensureNode(key: string): void {
    if (!adj.has(key)) adj.set(key, []);
  }

  function addEdge(k1: string, k2: string): void {
    ensureNode(k1);
    ensureNode(k2);
    adj.get(k1)!.push(k2);
    adj.get(k2)!.push(k1);
  }

  // Bi-location: conjugate pairs in each house
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length !== 2) continue;
      const k1 = nodeKey(cands[0]!, d);
      const k2 = nodeKey(cands[1]!, d);
      addEdge(k1, k2);
    }
  }

  // Bi-value: bivalue cells
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const mask = grid.candidatesOf(c);
    if (popcount(mask) !== 2) continue;
    const [d1, d2] = digitsOf(mask) as [number, number];
    const k1 = nodeKey(c, d1);
    const k2 = nodeKey(c, d2);
    addEdge(k1, k2);
  }

  // BFS to form components
  const visited = new Set<string>();
  const components: Array<Map<string, 0 | 1>> = [];

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = new Map<string, 0 | 1>();
    const queue: Array<{ key: string; color: 0 | 1 }> = [{ key: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);

    while (queue.length > 0) {
      const { key, color } = queue.shift()!;
      for (const neighbor of adj.get(key) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        const ncolor = (1 - color) as 0 | 1;
        comp.set(neighbor, ncolor);
        queue.push({ key: neighbor, color: ncolor });
      }
    }

    if (comp.size >= 2) components.push(comp);
  }

  return components;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const components = buildMedusaComponents(grid);

    for (const comp of components) {
      // Parse nodes
      const parseKey = (k: string): { cell: number; digit: number } => {
        const [c, d] = k.split(':').map(Number) as [number, number];
        return { cell: c, digit: d };
      };

      const green: MedusaNode[] = []; // color 0
      const blue: MedusaNode[] = [];  // color 1
      for (const [key, color] of comp) {
        const { cell, digit } = parseKey(key);
        if (color === 0) green.push({ cell, digit });
        else blue.push({ cell, digit });
      }

      // R1: Two same-color candidates in one cell → other color is true
      for (const colorGroup of [green, blue] as const) {
        const otherGroup = colorGroup === green ? blue : green;
        const byCell = new Map<number, number[]>();
        for (const { cell, digit } of colorGroup) {
          if (!byCell.has(cell)) byCell.set(cell, []);
          byCell.get(cell)!.push(digit);
        }
        for (const [cell, digits] of byCell) {
          if (digits.length >= 2) {
            // Same-color group has two digits in one cell → impossible → other color is true
            // Place all other-color candidates
            const placements: { cell: number; digit: number }[] = [];
            for (const { cell: c, digit: d } of otherGroup) {
              if (grid.get(c) === 0 && grid.hasCandidate(c, d)) {
                placements.push({ cell: c, digit: d });
              }
            }
            if (placements.length === 0) continue;

            return {
              strategyId: '3d-medusa',
              placements,
              eliminations: [],
              highlights: buildMedusaHighlights(grid, comp, parseKey, []),
              explanation: {
                zh: `三维美杜莎 R1：单元格 ${cellLabel(cell)} 有两个同色候选数（${digits.join(',')}）→ 该色为假，另一色全为解。`,
                en: `3D Medusa R1: cell ${cellLabel(cell)} has two same-color candidates (${digits.join(',')}) → that color is false; all opposite-color candidates are solutions.`,
              },
            };
          }
        }
      }

      // R2: Two same-color candidates of same digit in one house → other color is true
      for (const colorGroup of [green, blue] as const) {
        const otherGroup = colorGroup === green ? blue : green;
        for (const house of HOUSES) {
          for (let d = 1; d <= 9; d++) {
            const sameColorInHouse = colorGroup.filter(({ cell, digit }) =>
              digit === d && house.includes(cell),
            );
            if (sameColorInHouse.length >= 2) {
              const placements: { cell: number; digit: number }[] = [];
              for (const { cell: c, digit: dg } of otherGroup) {
                if (grid.get(c) === 0 && grid.hasCandidate(c, dg)) placements.push({ cell: c, digit: dg });
              }
              if (placements.length === 0) continue;

              return {
                strategyId: '3d-medusa',
                placements,
                eliminations: [],
                highlights: buildMedusaHighlights(grid, comp, parseKey, []),
                explanation: {
                  zh: `三维美杜莎 R2：某宫/行/列中有两个同色的数字 ${d} → 该色为假，另一色全为解。`,
                  en: `3D Medusa R2: two same-color ${d}s in one house → that color is false; all opposite-color candidates are solutions.`,
                },
              };
            }
          }
        }
      }

      // R3: Uncolored candidate in cell with both Green and Blue → eliminate it
      const elims: { cell: number; digit: number }[] = [];
      const greenCells = new Set(green.map((n) => n.cell));
      const blueCells = new Set(blue.map((n) => n.cell));
      const compCells = new Set([...green, ...blue].map((n) => n.cell));

      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        if (mask === 0) continue;

        const hasGreen = green.some((n) => n.cell === c);
        const hasBlue = blue.some((n) => n.cell === c);

        if (hasGreen && hasBlue) {
          // R3: cell has both colors → uncolored digits in this cell can be eliminated
          const coloredDigits = new Set([
            ...green.filter((n) => n.cell === c).map((n) => n.digit),
            ...blue.filter((n) => n.cell === c).map((n) => n.digit),
          ]);
          for (const d of digitsOf(mask)) {
            if (!coloredDigits.has(d)) {
              elims.push({ cell: c, digit: d });
            }
          }
        }
      }

      // R4: Uncolored candidate sees both Green d and Blue d → eliminate
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        for (const d of digitsOf(mask)) {
          const compKey = `${c}:${d}`;
          if (comp.has(compKey)) continue; // colored

          const peers = new Set(PEERS_OF[c]!);
          const seesGreen = green.some((n) => n.digit === d && peers.has(n.cell));
          const seesBlue = blue.some((n) => n.digit === d && peers.has(n.cell));
          if (seesGreen && seesBlue) {
            elims.push({ cell: c, digit: d });
          }
        }
      }

      // R5: Uncolored (c,d): sees colored d of one color in house, AND opposite color present in cell
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        for (const d of digitsOf(mask)) {
          const compKey = `${c}:${d}`;
          if (comp.has(compKey)) continue;

          const peers = new Set(PEERS_OF[c]!);
          for (const [colorD, colorOpp] of [[green, blue], [blue, green]] as [MedusaNode[], MedusaNode[]][]) {
            // Sees a colored d of colorD in a house
            const seesColorD = colorD.some((n) => n.digit === d && peers.has(n.cell));
            if (!seesColorD) continue;
            // Has opposite color in cell (on any digit)
            const hasOppInCell = colorOpp.some((n) => n.cell === c);
            if (hasOppInCell) {
              elims.push({ cell: c, digit: d });
              break;
            }
          }
        }
      }

      // Deduplicate
      const seenElim = new Set<string>();
      const uniqueElims = elims.filter((e) => {
        const k = `${e.cell}:${e.digit}`;
        if (seenElim.has(k)) return false;
        seenElim.add(k);
        return grid.hasCandidate(e.cell, e.digit);
      });

      if (uniqueElims.length > 0) {
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: uniqueElims,
          highlights: buildMedusaHighlights(grid, comp, parseKey, uniqueElims),
          explanation: {
            zh: `三维美杜莎（R3/R4/R5）：双色网络中，某格/宫同时看到两种颜色，候选数被消去。`,
            en: `3D Medusa (R3/R4/R5): coloring network yields candidates that see both colors — eliminated.`,
          },
        };
      }

      // R6: Uncolored cell where every candidate sees the same single color → that color false
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        if (mask === 0) continue;

        // Skip if cell has any colored candidate
        const hasAnyColored = [...green, ...blue].some((n) => n.cell === c);
        if (hasAnyColored) continue;

        const peers = new Set(PEERS_OF[c]!);

        for (const [badColor, goodGroup] of [[green, blue], [blue, green]] as [MedusaNode[], MedusaNode[]][]) {
          // Every candidate in this cell sees a badColor cell
          const allSee = digitsOf(mask).every((d) => {
            return badColor.some((n) => n.digit === d && peers.has(n.cell));
          });
          if (allSee) {
            // badColor cannot be true → goodGroup is true
            const placements: { cell: number; digit: number }[] = [];
            for (const { cell: gc, digit: gd } of goodGroup) {
              if (grid.get(gc) === 0 && grid.hasCandidate(gc, gd)) placements.push({ cell: gc, digit: gd });
            }
            if (placements.length > 0) {
              return {
                strategyId: '3d-medusa',
                placements,
                eliminations: [],
                highlights: buildMedusaHighlights(grid, comp, parseKey, []),
                explanation: {
                  zh: `三维美杜莎 R6：格 ${cellLabel(c)} 所有候选数均看到同一颜色 → 该色为假，另一色全为解。`,
                  en: `3D Medusa R6: cell ${cellLabel(c)} all candidates see one color → that color is false; opposite color is solutions.`,
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

function buildMedusaHighlights(
  grid: Grid,
  comp: Map<string, 0 | 1>,
  parseKey: (k: string) => { cell: number; digit: number },
  elims: { cell: number; digit: number }[],
): import('../trace.js').Highlights {
  const cells: number[] = [];
  const candidates: { cell: number; digit: number }[] = [];
  const links: Link[] = [];
  const seen = new Set<string>();

  for (const [key] of comp) {
    const { cell, digit } = parseKey(key);
    if (!cells.includes(cell)) cells.push(cell);
    candidates.push({ cell, digit });
  }
  cells.push(...elims.map((e) => e.cell));
  candidates.push(...elims);

  return { cells: [...new Set(cells)], candidates, links };
}
