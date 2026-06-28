/**
 * Multi-Coloring / X-Colors (T4) — 多重染色 / 单一染色升级.
 *
 * Single-digit coloring on digit d over the conjugate-pair graph G_d. Two
 * presentations implemented together:
 *
 *   (1) Multi-Colors (HoDoKu): two *disjoint* conjugate-pair clusters
 *       2-colored independently (A1/B1 vs A2/B2). A *weak link* between
 *       clusters (A1 and A2 share a house) yields two inference rules:
 *         - Type 1: any cell z holding d that sees a B1 cell and a B2 cell
 *           loses d (since one of B1, B2 must be the true set).
 *         - Type 2: two same-color cells each see an opposite color of the
 *           other pair → all of that color are false (eliminate d from each).
 *
 *   (2) X-Colors (Sudopedia / single-cluster promotion): pick one cluster,
 *       2-color it, then PROMOTION (Step 3): if a house has all-but-one of
 *       its d-cells peered to color A, the lone "Exception Cell" inherits
 *       color A. Iterate to a fixed point. With promotion:
 *         - 4.1 trap: cell with peers of BOTH A and B → drop d.
 *         - 4.2 wrap: ≥2 same-color cells in one house → OTHER color is true
 *           → place d in all cells of the other color.
 *         - 4.3 house-empty: a house has no cell that can take color A
 *           (all its d-cells are peered to A) → OTHER color is true →
 *           place d in all cells of the other color.
 *
 * X-Colors + promotion strictly subsumes Multi-Colors (HoDoKu mc01/mc02 are
 * particular cases; Sudopedia deprecated Multi-Colouring in favor of X-Colors
 * because it covers everything Multi-Colors covers plus more). We implement
 * BOTH and fire under the `multi-coloring` strategy id (consolidated per
 * overlap #9: X-Colors/Weak Colors/Color Wing/Supercoloring all merge here).
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Build connected components of conjugate pairs for digit d.
 *  Returns: array of components; each component is a Map cell -> 0|1
 *  (color). The 2-coloring is forced by the strong-link structure. */
function buildColoringComponents(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
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
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = new Map<number, 0 | 1>();
    const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);
    while (queue.length > 0) {
      const { cell, color } = queue.shift()!;
      for (const nbr of adj.get(cell) ?? []) {
        if (visited.has(nbr)) continue;
        visited.add(nbr);
        const ncolor = (1 - color) as 0 | 1;
        comp.set(nbr, ncolor);
        queue.push({ cell: nbr, color: ncolor });
      }
    }
    if (comp.size >= 2) components.push(comp);
  }
  return components;
}

/** Returns the set of cells in this house holding d (candidates, not solved). */
function houseDCandidates(grid: Grid, house: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

/** For a given base component, promote colors using Sudopedia Step 3 to a
 *  fixed point. Returns a new Map<cell, 0|1> with possibly more cells
 *  colored. (Cells already in the component keep their colors.) */
function promoteColors(grid: Grid, d: number, base: Map<number, 0 | 1>): Map<number, 0 | 1> {
  const out = new Map(base);
  const bit = maskOf(d);
  let changed = true;
  while (changed) {
    changed = false;
    for (const house of HOUSES) {
      const cells = houseDCandidates(grid, house, d);
      if (cells.length < 2) continue;
      // Filter to cells we need to evaluate: either colored, or uncolored but
      // every OTHER cell in the house is a peer of color-A cells.
      for (const color of [0, 1] as const) {
        // Find uncolored candidate cells (in `house`) that are the "exception"
        // for color `color`: every OTHER cell of `cells` is peered to a
        // colored cell of color `color`.
        for (const c of cells) {
          if (out.has(c)) continue;
          let allOthersPeeredToColor = true;
          for (const c2 of cells) {
            if (c2 === c) continue;
            // c2 must be peered to at least one colored cell of color `color`.
            const peersOfC2 = new Set(PEERS_OF[c2]!);
            let hit = false;
            for (const [node, col] of out) {
              if (col !== color) continue;
              if (peersOfC2.has(node)) { hit = true; break; }
            }
            if (!hit) { allOthersPeeredToColor = false; break; }
          }
          if (allOthersPeeredToColor) {
            out.set(c, color);
            changed = true;
          }
        }
      }
      // Suppress unused
      void bit;
    }
  }
  return out;
}

/** Build a strong-link Link[] for visualization from a coloring component
 *  (only conjugate-pair links, which are the strong-link edges). */
function buildColoringLinks(d: number, comp: Map<number, 0 | 1>): Link[] {
  const links: Link[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const cands: number[] = [];
    for (const c of house) if (comp.has(c)) cands.push(c);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' });
  }
  return links;
}

/** Apply X-Colors trap (4.1), wrap (4.2), and house-empty (4.3) rules to a
 *  single promoted component. Returns the first applicable Step or null. */
function tryXColorsForComponent(grid: Grid, d: number, base: Map<number, 0 | 1>): Step | null {
  const comp = promoteColors(grid, d, base);
  const bit = maskOf(d);
  const color0: number[] = [];
  const color1: number[] = [];
  for (const [cell, color] of comp) {
    if (color === 0) color0.push(cell);
    else color1.push(cell);
  }

  // Rule 4.2 — wrap: two same-color cells in the SAME house.
  for (const [group, otherGroup] of [[color0, color1], [color1, color0]] as const) {
    for (const house of HOUSES) {
      const houseSet = new Set(house);
      let sameInHouse = 0;
      for (const c of group) if (houseSet.has(c)) sameInHouse++;
      if (sameInHouse < 2) continue;
      // The other color is the true set; place d in every cell of the other
      // color that still has d as a candidate.
      const placements = otherGroup
        .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
        .map((c) => ({ cell: c, digit: d }));
      if (placements.length === 0) continue;
      return {
        strategyId: 'multi-coloring',
        placements,
        eliminations: [],
        highlights: {
          cells: [...comp.keys()],
          candidates: [...comp.keys()].map((c) => ({ cell: c, digit: d })),
          links: buildColoringLinks(d, comp),
        },
        explanation: {
          zh: `多重染色 X-Colors（环绕）：数字 ${d} 的彩色分量中，相同颜色在某房屋出现两次，故另一色必为 ${d}。`,
          en: `X-Colors (wrap): digit ${d}'s colored component has two same-color cells in one house, so the other color must all be ${d}.`,
        },
      };
    }
  }

  // Rule 4.3 — house-empty: in some house, every d-candidate is peered to a
  // single color. That color cannot be the true set, so the other color is
  // the true set → place d in all cells of the other color.
  for (const [color, otherGroup] of [[0, color1], [1, color0]] as const) {
    for (const house of HOUSES) {
      const cells = houseDCandidates(grid, house, d);
      if (cells.length < 1) continue;
      // Every cell of `cells` is peered to a cell of color `color`.
      let allPeeredToColor = true;
      for (const c of cells) {
        const peers = new Set(PEERS_OF[c]!);
        let hit = false;
        for (const [node, col] of comp) {
          if (col !== color) continue;
          if (peers.has(node)) { hit = true; break; }
        }
        if (!hit) { allPeeredToColor = false; break; }
      }
      if (!allPeeredToColor) continue;
      const placements = otherGroup
        .filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)
        .map((c) => ({ cell: c, digit: d }));
      if (placements.length === 0) continue;
      return {
        strategyId: 'multi-coloring',
        placements,
        eliminations: [],
        highlights: {
          cells: [...comp.keys()],
          candidates: [...comp.keys()].map((c) => ({ cell: c, digit: d })),
          links: buildColoringLinks(d, comp),
        },
        explanation: {
          zh: `多重染色 X-Colors（房屋清空）：数字 ${d} 的某房屋所有候选都同伴到相同颜色，故另一色为 ${d}。`,
          en: `X-Colors (house-empty): every d-candidate in one house peers to the same color, so the other color must all be ${d}.`,
        },
      };
    }
  }

  // Rule 4.1 — trap: a cell holds d and peers both colors.
  const trapElims: { cell: number; digit: number }[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if ((grid.candidatesOf(c) & bit) === 0) continue;
    if (comp.has(c)) continue;
    const peers = new Set(PEERS_OF[c]!);
    let sees0 = false;
    let sees1 = false;
    for (const [node, col] of comp) {
      if (!peers.has(node)) continue;
      if (col === 0) sees0 = true;
      else sees1 = true;
    }
    if (sees0 && sees1) trapElims.push({ cell: c, digit: d });
  }
  if (trapElims.length > 0) {
    return {
      strategyId: 'multi-coloring',
      placements: [],
      eliminations: trapElims,
      highlights: {
        cells: [...comp.keys(), ...trapElims.map((e) => e.cell)],
        candidates: [...comp.keys()].map((c) => ({ cell: c, digit: d })),
        links: buildColoringLinks(d, comp),
      },
      explanation: {
        zh: `多重染色 X-Colors（陷阱）：数字 ${d} 的彩色分量双色，某格同时看到两种颜色，必有一色为真；消去该格的 ${d}。`,
        en: `X-Colors (trap): digit ${d}'s colored component is 2-colored; a cell peers both colors, so one color must be true → eliminate ${d} from that cell.`,
      },
    };
  }

  return null;
}

/** Multi-Colors (HoDoKu) — two disjoint conjugate-pair clusters with a
 *  weak link between them. */
function tryMultiColorsType1or2(grid: Grid, d: number): Step | null {
  const components = buildColoringComponents(grid, d);
  if (components.length < 2) return null;
  const bit = maskOf(d);

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const c1 = components[i]!;
      const c2 = components[j]!;
      const c1A: number[] = [];
      const c1B: number[] = [];
      const c2A: number[] = [];
      const c2B: number[] = [];
      for (const [cell, col] of c1) (col === 0 ? c1A : c1B).push(cell);
      for (const [cell, col] of c2) (col === 0 ? c2A : c2B).push(cell);

      // Weak link: same color (A1, A2) cells in the same house (not conjugate
      // because they're from different clusters). Find such a pair.
      let weakLinkPair: [number, number] | null = null;
      for (const a1 of c1A) {
        for (const a2 of c2A) {
          if (PEERS_OF[a1]!.includes(a2)) { weakLinkPair = [a1, a2]; break; }
        }
        if (weakLinkPair) break;
      }
      if (!weakLinkPair) continue;

      // Type 1: cell z holding d that peers a B1 cell AND a B2 cell loses d.
      const type1Elims: { cell: number; digit: number }[] = [];
      const c1BSet = new Set(c1B);
      const c2BSet = new Set(c2B);
      for (let z = 0; z < CELLS; z++) {
        if (grid.get(z) !== 0) continue;
        if ((grid.candidatesOf(z) & bit) === 0) continue;
        if (c1.has(z) || c2.has(z)) continue;
        const peers = new Set(PEERS_OF[z]!);
        let seesB1 = false;
        for (const x of c1BSet) if (peers.has(x)) { seesB1 = true; break; }
        if (!seesB1) continue;
        let seesB2 = false;
        for (const x of c2BSet) if (peers.has(x)) { seesB2 = true; break; }
        if (seesB2) type1Elims.push({ cell: z, digit: d });
      }
      if (type1Elims.length > 0) {
        const allCells = [...c1.keys(), ...c2.keys()];
        return {
          strategyId: 'multi-coloring',
          placements: [],
          eliminations: type1Elims,
          highlights: {
            cells: [...allCells, ...type1Elims.map((e) => e.cell)],
            candidates: allCells.map((c) => ({ cell: c, digit: d })),
            links: [
              ...buildColoringLinks(d, c1),
              ...buildColoringLinks(d, c2),
              { from: { cell: weakLinkPair[0], digit: d }, to: { cell: weakLinkPair[1], digit: d }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `多重染色 Type 1：数字 ${d} 两个分量同色格 ${cellLabel(weakLinkPair[0])} 与 ${cellLabel(weakLinkPair[1])} 在同房屋内（弱链）；至少一组的反色必为 ${d}，可见两组反色的格消去 ${d}。`,
            en: `Multi-Colors Type 1: digit ${d}'s two components share same-color cells ${cellLabel(weakLinkPair[0])}, ${cellLabel(weakLinkPair[1])} in a house (weak link); at least one of the opposite colors is true → drop ${d} from cells seeing both.`,
          },
        };
      }

      // Type 2: two same-color (say 1b) cells each see an opposite color of
      // the OTHER pair. Then 1b is all false (one of 2a/2b is true; whichever
      // one is true makes the corresponding 1b cell false, and same-color
      // means all 1b are false). Eliminate d from every 1b cell.
      for (const [sameColor, oppositePair, oppositeOtherColor] of [
        [c1B, c2A, c2B] as const,
        [c1B, c2B, c2A] as const,
        [c2B, c1A, c1B] as const,
        [c2B, c1B, c1A] as const,
      ]) {
        // Need two same-color cells, one peeing an `oppositePair[0]` cell,
        // the other peeing the complementary `oppositeOtherColor` cell.
        if (oppositePair.length === 0 || oppositeOtherColor.length === 0) continue;
        const opA = oppositePair[0]!;
        const opB = oppositeOtherColor[0]!;
        let sawOppositePair = false;
        let sawOppositeOther = false;
        for (const x of sameColor) {
          const peers = new Set(PEERS_OF[x]!);
          if (peers.has(opA)) sawOppositePair = true;
          if (peers.has(opB)) sawOppositeOther = true;
          if (sawOppositePair && sawOppositeOther) break;
        }
        if (!(sawOppositePair && sawOppositeOther)) continue;

        const type2Elims: { cell: number; digit: number }[] = [];
        for (const x of sameColor) {
          if (grid.hasCandidate(x, d)) type2Elims.push({ cell: x, digit: d });
        }
        if (type2Elims.length === 0) continue;
        const allCells = [...c1.keys(), ...c2.keys()];
        return {
          strategyId: 'multi-coloring',
          placements: [],
          eliminations: type2Elims,
          highlights: {
            cells: [...allCells],
            candidates: allCells.map((c) => ({ cell: c, digit: d })),
            links: [
              ...buildColoringLinks(d, c1),
              ...buildColoringLinks(d, c2),
              { from: { cell: weakLinkPair[0], digit: d }, to: { cell: weakLinkPair[1], digit: d }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `多重染色 Type 2：数字 ${d} 两个分量中，相同色的格分别见到另一分量的两个反色，必有一反色为真，该色全假，消去该色所有格的 ${d}。`,
            en: `Multi-Colors Type 2: same-color cells of digit ${d} in two components each peer opposite colors of the other pair; one opposite is true → all same-color cells are false → eliminate ${d}.`,
          },
        };
      }
    }
  }
  return null;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      // (1) Try X-Colors (single-cluster + promotion). This subsumes Multi-Colors
      // for HoDoKu's limited form but is sound on its own.
      const components = buildColoringComponents(grid, d);
      for (const comp of components) {
        const step = tryXColorsForComponent(grid, d, comp);
        if (step) return step;
      }

      // (2) Try Multi-Colors (HoDoKu two-cluster). Fire only if X-Colors
      // didn't (so we don't double-report).
      const mcStep = tryMultiColorsType1or2(grid, d);
      if (mcStep) return mcStep;
    }
    return null;
  },
};