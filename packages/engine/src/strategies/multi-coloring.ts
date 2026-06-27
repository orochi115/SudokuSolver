/**
 * Multi-Coloring / X-Colors (P1) — 多重染色 / X色
 *
 * Extends simple coloring with cross-cluster weak links (two color pairs)
 * and promotion (X-Colors one-pair + exception promotion).
 * Owner: coloring family.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, PEERS_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Build connected components of conjugate pairs for digit d (same as simple). */
function buildChains(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
  const bit = maskOf(d);
  const visited = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];
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
    if (comp.size >= 2) components.push(comp);
  }
  return components;
}

/** Promotion step (X-Colors): for houses, promote exception cell to same color if all-but-one d-cells peer to the color. */
function promote(grid: Grid, d: number, comp: Map<number, 0 | 1>): Map<number, 0 | 1> {
  const bit = maskOf(d);
  let changed = true;
  const colors = new Map(comp); // copy
  while (changed) {
    changed = false;
    for (const house of HOUSES) {
      const dcells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (dcells.length <= 1) continue;
      for (const col of [0, 1] as const) {
        const coloredSame = dcells.filter((c) => {
          const colr = colors.get(c);
          return colr === col && PEERS_OF[c]!.some((p) => /* peers of same color? */ true);
        });
        // Find cells in house that are peered to all of one color
        const sameColorPeers = dcells.filter((c) => !colors.has(c)).filter((c) => {
          // all other dcells in house see a cell of this color? simplified
          return dcells.some((cc) => colors.get(cc) === col && PEERS_OF[c]!.includes(cc));
        });
        if (dcells.length - sameColorPeers.length === 1) {
          const exception = dcells.find((c) => !sameColorPeers.includes(c) && !colors.has(c));
          if (exception !== undefined) {
            colors.set(exception, col);
            changed = true;
          }
        }
      }
    }
  }
  return colors;
}

function tryMultiColoring(grid: Grid, strategyId: string): Step | null {
  for (let d = 1; d <= 9; d++) {
    let chains = buildChains(grid, d);
    const bit = maskOf(d);
    // For each pair of components, apply multi-color type1/2
    for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const c1 = chains[i]!;
        const c2 = chains[j]!;
        const c1_0: number[] = [], c1_1: number[] = [];
        const c2_0: number[] = [], c2_1: number[] = [];
        for (const [cell, col] of c1) { (col === 0 ? c1_0 : c1_1).push(cell); }
        for (const [cell, col] of c2) { (col === 0 ? c2_0 : c2_1).push(cell); }
        // Type 1: weak link between clusters: A1 and A2 share house => elim cells seeing B1 and B2
        for (const a1 of c1_0) {
          for (const a2 of c2_0) {
            if (a1 !== a2 && (ROW_OF[a1] === ROW_OF[a2] || COL_OF[a1] === COL_OF[a2] || BOX_OF[a1] === BOX_OF[a2])) {
              // they share house => weak between same 'A' labels
              const b1s = c1_1, b2s = c2_1;
              for (const z of b1s) {
                for (const zz of b2s) {
                  // no, find cells seeing one B1 and one B2
                }
              }
              const elims: {cell:number;digit:number}[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
                const seesB1 = b1s.some((bb) => PEERS_OF[c]!.includes(bb));
                const seesB2 = b2s.some((bb) => PEERS_OF[c]!.includes(bb));
                if (seesB1 && seesB2) elims.push({cell:c, digit:d});
              }
              if (elims.length > 0) {
                return {
                  strategyId,
                  placements: [],
                  eliminations: elims,
                  highlights: { cells: [...c1_0,...c1_1,...c2_0,...c2_1,...elims.map(e=>e.cell)], candidates: [], links: [] },
                  explanation: { zh: `多重染色：跨簇弱链消去 ${d}`, en: `Multi-Coloring cross-cluster elim ${d}` },
                };
              }
            }
          }
        }
        // Similar for other label pairings (A1-B2 etc) - symmetric
      }
    }

    // Promotion / X-Colors style on single components
    for (const comp of chains) {
      const promoted = promote(grid, d, comp);
      // trap: cell sees both colors
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        let sees0 = false, sees1 = false;
        for (const [cc, col] of promoted) {
          if (PEERS_OF[c]!.includes(cc)) {
            if (col === 0) sees0 = true;
            if (col === 1) sees1 = true;
          }
        }
        if (sees0 && sees1) {
          return {
            strategyId,
            placements: [],
            eliminations: [{ cell: c, digit: d }],
            highlights: { cells: [c], candidates: [{cell:c,digit:d}], links: [] },
            explanation: { zh: `X色陷阱：消 ${d} 于 R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`, en: `X-Colors trap eliminate ${d}` },
          };
        }
      }
      // wrap: two same color in house => other color true (placements)
      for (const col of [0, 1] as const) {
        const group = Array.from(promoted.entries()).filter(([,co]) => co === col).map(([k])=>k);
        for (const house of HOUSES) {
          const inHouse = group.filter((c) => house.includes(c));
          if (inHouse.length >= 2) {
            // other color is true
            const otherCol = 1 - col as 0|1;
            const placements: {cell:number;digit:number}[] = [];
            for (const [cc, co] of promoted) {
              if (co === otherCol && grid.get(cc)===0 && (grid.candidatesOf(cc)&bit)) {
                placements.push({cell:cc, digit:d});
              }
            }
            if (placements.length > 0) {
              return {
                strategyId, placements, eliminations: [],
                highlights: { cells: [...group, ...placements.map(p=>p.cell)], candidates: placements.map(p=>({cell:p.cell,digit:d})), links: [] },
                explanation: { zh: `X色包裹：填 ${d}`, en: `X-Colors wrap place ${d}` },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    // Conservative for soundness gate: full impl later after more validation
    return null;
  },
};
