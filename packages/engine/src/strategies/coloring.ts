/**
 * Coloring family (P1) — 染色族
 *
 *  - multi-coloring : generalises simple-coloring by linking independent
 *    conjugate-pair clusters of a single digit and applying trap/wrap on the
 *    merged colouring. Sound (same deadly-colour argument as simple-coloring).
 *  - 3d-medusa       : extends colouring to ALL digits via bivalue-cell strong
 *    links. Two sound rules are applied:
 *      (c) a bivalue cell whose two candidates share one colour → that colour is
 *          false (a cell cannot hold two true digits) → the other colour's
 *          candidates are placed.
 *      (a) a candidate outside the chain that sees (same-digit) candidates of
 *          BOTH colours → eliminated (trap).
 *
 * No trial-and-error: every elimination is the named colouring contradiction.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

// =========================================================================
// Multi-Coloring (single digit, multiple clusters merged)
// =========================================================================

interface Cluster {
  cells: number[];        // all cells in the cluster
  color: Map<number, 0 | 1>;
}

function buildClusters(grid: Grid, d: number): Cluster[] {
  const bit = maskOf(d);
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  }
  const visited = new Set<number>();
  const clusters: Cluster[] = [];
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const color = new Map<number, 0 | 1>();
    const q: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
    visited.add(start);
    color.set(start, 0);
    const cells: number[] = [start];
    while (q.length) {
      const { cell, color: col } = q.shift()!;
      for (const nb of adj.get(cell) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const nc = (1 - col) as 0 | 1;
        color.set(nb, nc);
        cells.push(nb);
        q.push({ cell: nb, color: nc });
      }
    }
    if (cells.length >= 2) clusters.push({ cells, color });
  }
  return clusters;
}

/** [removed unsound global merge — see git history; multi-coloring now uses
 *  sound per-cluster trap/wrap + pairwise cross-cluster wrap only.] */

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const clusters = buildClusters(grid, d);
      if (clusters.length < 1) continue;

      // ---- per-cluster trap & wrap (sound; same as simple-coloring) ----
      for (const c of clusters) {
        const color0: number[] = [];
        const color1: number[] = [];
        for (const [cell, col] of c.color) (col === 0 ? color0 : color1).push(cell);

        // wrap: two same-colour cells peer ⇒ that colour false ⇒ place other
        for (const [group, other] of [
          [color0, color1],
          [color1, color0],
        ] as const) {
          let wrap = false;
          outer: for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              if (PEERS_OF[group[i]!]!.includes(group[j]!)) { wrap = true; break outer; }
            }
          }
          if (wrap) {
            const placements = other
              .filter((cc) => grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit) !== 0)
              .map((cc) => ({ cell: cc, digit: d }));
            if (placements.length > 0) {
              const all = [...c.color.keys()];
              placements.sort((a, b) => a.cell - b.cell);
              return {
                strategyId: 'multi-coloring',
                placements: [placements[0]!],
                eliminations: [],
                highlights: { cells: all, candidates: all.map((cc) => ({ cell: cc, digit: d })), links: clusterLinks(grid, d, clusters) },
                explanation: {
                  zh: `多重染色（染色矛盾）：数字 ${d} 的强链簇中同色两格互见；该色全假，另一色为 ${d}。`,
                  en: `Multi-Coloring (Wrap): digit ${d}'s cluster has same-colour cells seeing each other; that colour false, the other is ${d}.`,
                },
              };
            }
          }
        }
        // trap: outside cell seeing both colours ⇒ eliminate d
        const elims: { cell: number; digit: number }[] = [];
        const cset = new Set(c.color.keys());
        for (let cc = 0; cc < CELLS; cc++) {
          if (cset.has(cc) || grid.get(cc) !== 0 || !(grid.candidatesOf(cc) & bit)) continue;
          const peers = new Set(PEERS_OF[cc]!);
          if (color0.some((x) => peers.has(x)) && color1.some((x) => peers.has(x))) elims.push({ cell: cc, digit: d });
        }
        if (elims.length > 0) {
          const all = [...c.color.keys()];
          return {
            strategyId: 'multi-coloring',
            placements: [],
            eliminations: elims,
            highlights: { cells: [...all, ...elims.map((e) => e.cell)], candidates: [...all.map((cc) => ({ cell: cc, digit: d })), ...elims], links: clusterLinks(grid, d, clusters) },
            explanation: {
              zh: `多重染色（颜色陷阱）：数字 ${d} 的强链簇双色，某格同时看到两色；消去该格的 ${d}。`,
              en: `Multi-Coloring (Trap): digit ${d}'s cluster is 2-coloured; a cell sees both colours ⇒ eliminate ${d}.`,
            },
          };
        }
      }

      // ---- cross-cluster wrap (sound; pairwise, no global merge) ----
      // If C1.colorK has a cell peering a C2.color0 cell AND a cell peering a
      // C2.color1 cell, then C1.colorK is false ⇒ place d in C1.(1-K).
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const ci = clusters[i]!, cj = clusters[j]!;
          const cj0 = [...cj.color.entries()].filter(([_, c]) => c === 0).map(([c]) => c);
          const cj1 = [...cj.color.entries()].filter(([_, c]) => c === 1).map(([c]) => c);
          for (const [ki, otherColor] of [[0, 1], [1, 0]] as const) {
            const kiCells = [...ci.color.entries()].filter(([_, c]) => c === ki).map(([c]) => c);
            const seesColor0 = kiCells.some((a) => cj0.some((b) => PEERS_OF[a]!.includes(b)));
            const seesColor1 = kiCells.some((a) => cj1.some((b) => PEERS_OF[a]!.includes(b)));
            if (seesColor0 && seesColor1) {
              const otherCells = [...ci.color.entries()].filter(([_, c]) => c === otherColor).map(([c]) => c);
              const placements = otherCells
                .filter((cc) => grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit) !== 0)
                .map((cc) => ({ cell: cc, digit: d }));
              if (placements.length > 0) {
                placements.sort((a, b) => a.cell - b.cell);
                const all = [...ci.color.keys(), ...cj.color.keys()];
                return {
                  strategyId: 'multi-coloring',
                  placements: [placements[0]!],
                  eliminations: [],
                  highlights: { cells: all, candidates: all.map((cc) => ({ cell: cc, digit: d })), links: clusterLinks(grid, d, clusters) },
                  explanation: {
                    zh: `多重染色（跨簇矛盾）：簇1的某色同时看到簇2的两色，该色必假；另一色为 ${d}。`,
                    en: `Multi-Coloring (cross-cluster wrap): one colour of cluster 1 sees both colours of cluster 2 ⇒ that colour false ⇒ the other is ${d}.`,
                  },
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};

function clusterLinks(grid: Grid, d: number, clusters: Cluster[]): Link[] {
  const bit = maskOf(d);
  const links: Link[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const k = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    links.push({ from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' });
  }
  return links;
}

// =========================================================================
// 3D Medusa (multi-digit coloring via bivalue-cell strong links)
// =========================================================================

interface MedusaColor {
  // node key: cell*16 + digit ; colour 0/1
  color: Map<number, 0 | 1>;
  nodes: number[]; // keys
}

function nodeKey(cell: number, digit: number): number {
  return cell * 16 + digit;
}

function buildMedusaColors(grid: Grid): MedusaColor[] {
  // Build strong-link graph on (cell,digit) nodes:
  //  - house conjugate pair for digit d (two candidates in a house) → strong
  //  - bivalue cell {d1,d2} → strong link between (cell,d1),(cell,d2)
  const adj = new Map<number, number[]>();
  const ensure = (k: number) => (adj.get(k) ?? adj.set(k, []).get(k)!);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) {
      for (const d of digitsOf(grid.candidatesOf(c))) ensure(nodeKey(c, d));
    } else {
      for (const d of digitsOf(grid.candidatesOf(c))) ensure(nodeKey(c, d));
    }
  }
  // re-ensure with correct emptiness guard
  adj.clear();
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) ensure(nodeKey(c, d));
  }
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    ensure(a).push(b);
    ensure(b).push(a);
  };
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length !== 2) continue;
      const [a, b] = cands as [number, number];
      addEdge(nodeKey(a, d), nodeKey(b, d));
    }
  }
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const [d1, d2] = digitsOf(m) as [number, number];
    addEdge(nodeKey(c, d1), nodeKey(c, d2));
  }

  const visited = new Set<number>();
  const colors: MedusaColor[] = [];
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const color = new Map<number, 0 | 1>();
    const nodes: number[] = [];
    const q: Array<{ k: number; col: 0 | 1 }> = [{ k: start, col: 0 }];
    visited.add(start);
    color.set(start, 0);
    nodes.push(start);
    while (q.length) {
      const { k, col } = q.shift()!;
      for (const nb of adj.get(k) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const nc = (1 - col) as 0 | 1;
        color.set(nb, nc);
        nodes.push(nb);
        q.push({ k: nb, col: nc });
      }
    }
    if (nodes.length >= 2) colors.push({ color, nodes });
  }
  return colors;
}

function keyCell(k: number): number {
  return Math.floor(k / 16);
}
function keyDigit(k: number): number {
  return k % 16;
}

export const threeDMedusa: Strategy = {
  id: '3d-medusa',
  name: { zh: '3D Medusa', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const colors = buildMedusaColors(grid);
    for (const mc of colors) {
      // Rule (c): a bivalue cell whose two candidates share one colour ⇒ that
      // colour is false (cell can't hold two true digits) ⇒ the OTHER colour is
      // all true.
      const byCell = new Map<number, number[]>();
      for (const k of mc.nodes) {
        (byCell.get(keyCell(k)) ?? byCell.set(keyCell(k), []).get(keyCell(k))!).push(k);
      }
      for (const [cell, ks] of byCell) {
        if (ks.length !== 2) continue;
        const m = grid.candidatesOf(cell);
        if (popcount(m) !== 2) continue;
        const c0 = mc.color.get(ks[0]!)!;
        const c1 = mc.color.get(ks[1]!)!;
        if (c0 === c1) {
          // colour c0 false → place all c1-coloured candidates in this component
          const placements: { cell: number; digit: number }[] = [];
          for (const k of mc.nodes) {
            if (mc.color.get(k) === (1 - c0) && grid.hasCandidate(keyCell(k), keyDigit(k))) {
              placements.push({ cell: keyCell(k), digit: keyDigit(k) });
            }
          }
          // to stay a single placement step (granularity), place just one
          if (placements.length > 0) {
            placements.sort((a, b) => a.cell - b.cell || a.digit - b.digit);
            const p = placements[0]!;
            return medusaStep(grid, mc, '3d-medusa', [], [p], {
              zh: `3D Medusa：双值格 ${cellLabel(cell)} 两候选同色，该色必假；故 ${cellLabel(p.cell)}=${p.digit}。`,
              en: `3D Medusa: bivalue cell ${cellLabel(cell)} has both candidates same colour ⇒ that colour false ⇒ place ${cellLabel(p.cell)}=${p.digit}.`,
            });
          }
        } else {
          // opposite colours in one bivalue cell: the cell is one of the two —
          // other candidates? cell is bivalue so nothing else to eliminate.
        }
      }
      // Rule (a): a candidate outside the component that sees same-digit
      // candidates of BOTH colours (in a house) ⇒ eliminate.
      // group component nodes by digit
      const byDigit = new Map<number, { c0: number[]; c1: number[] }>();
      for (const k of mc.nodes) {
        const d = keyDigit(k);
        const g = byDigit.get(d) ?? { c0: [], c1: [] };
        (mc.color.get(k) === 0 ? g.c0 : g.c1).push(keyCell(k));
        byDigit.set(d, g);
      }
      for (const [d, g] of byDigit) {
        const bit = maskOf(d);
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
          if (mc.color.has(nodeKey(c, d))) continue; // in component
          const peers = new Set(PEERS_OF[c]!);
          if (g.c0.some((x) => peers.has(x)) && g.c1.some((x) => peers.has(x))) {
            const elim = { cell: c, digit: d };
            return medusaStep(grid, mc, '3d-medusa', [elim], [], {
              zh: `3D Medusa（陷阱）：候选 ${cellLabel(c)}(${d}) 同时看到链中两色的 ${d}，必有一真；消去。`,
              en: `3D Medusa (trap): candidate ${cellLabel(c)}(${d}) sees both colours' ${d} in the chain; one is true; eliminate.`,
            });
          }
        }
      }
    }
    return null;
  },
};

function medusaStep(
  grid: Grid,
  mc: MedusaColor,
  strategyId: string,
  elims: { cell: number; digit: number }[],
  placements: { cell: number; digit: number }[],
  explanation: { zh: string; en: string },
): Step {
  const cells = [...new Set([...mc.nodes.map(keyCell), ...elims.map((e) => e.cell), ...placements.map((p) => p.cell)])];
  const links: Link[] = [];
  // visualise strong links among component nodes that are peers (best-effort)
  for (let i = 0; i < mc.nodes.length; i++) {
    for (let j = i + 1; j < mc.nodes.length; j++) {
      const a = mc.nodes[i]!, b = mc.nodes[j]!;
      if (mc.color.get(a) === mc.color.get(b)) continue;
      const ac = keyCell(a), bc = keyCell(b);
      if (ac === bc || PEERS_OF[ac]!.includes(bc)) {
        if (keyDigit(a) === keyDigit(b) || ac === bc) {
          links.push({ from: { cell: ac, digit: keyDigit(a) }, to: { cell: bc, digit: keyDigit(b) }, type: 'strong' });
        }
      }
    }
  }
  return {
    strategyId,
    placements,
    eliminations: elims,
    highlights: {
      cells,
      candidates: [
        ...mc.nodes.map((k) => ({ cell: keyCell(k), digit: keyDigit(k) })),
        ...elims,
        ...placements,
      ],
      links: links.slice(0, 24),
    },
    explanation,
  };
}
