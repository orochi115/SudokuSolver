/**
 * 3D Medusa (P1) — 三维美杜莎染色法
 *
 * Multi-digit coloring over cell-candidates. Build a graph whose edges are
 * strong links (bi-location and bi-value), 2-color each component, then apply
 * the six standard Medusa rules.
 */

import { CELLS, HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

interface Node {
  cell: number;
  digit: number;
}

function nodeKey(n: Node): string {
  return `${n.cell}:${n.digit}`;
}

/** Build Medusa components: nodes are (cell,digit), edges are strong links. */
function buildMedusaComponents(grid: Grid): Array<Map<string, 0 | 1>> {
  const adj = new Map<string, string[]>();
  const nodes = new Map<string, Node>();

  function ensure(n: Node): string {
    const k = nodeKey(n);
    if (!nodes.has(k)) {
      nodes.set(k, n);
      adj.set(k, []);
    }
    return k;
  }

  function addEdge(a: Node, b: Node): void {
    const ka = ensure(a);
    const kb = ensure(b);
    if (ka === kb) return;
    if (!adj.get(ka)!.includes(kb)) adj.get(ka)!.push(kb);
    if (!adj.get(kb)!.includes(ka)) adj.get(kb)!.push(ka);
  }

  // Bi-location strong links.
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length === 2) {
        addEdge({ cell: cands[0]!, digit: d }, { cell: cands[1]!, digit: d });
      }
    }
  }

  // Bi-value strong links.
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const [d1, d2] = digitsOf(m) as [number, number];
    addEdge({ cell: c, digit: d1 }, { cell: c, digit: d2 });
  }

  const seen = new Set<string>();
  const comps: Array<Map<string, 0 | 1>> = [];
  for (const start of [...nodes.keys()].sort()) {
    if (seen.has(start)) continue;
    const comp = new Map<string, 0 | 1>();
    const queue: Array<{ key: string; color: 0 | 1 }> = [{ key: start, color: 0 }];
    seen.add(start);
    comp.set(start, 0);
    while (queue.length) {
      const { key, color } = queue.shift()!;
      for (const nb of adj.get(key) ?? []) {
        if (seen.has(nb)) continue;
        seen.add(nb);
        const nextColor = (1 - color) as 0 | 1;
        comp.set(nb, nextColor);
        queue.push({ key: nb, color: nextColor });
      }
    }
    if (comp.size >= 2) comps.push(comp);
  }
  return comps;
}

function nodesOf(comp: Map<string, 0 | 1>, nodes: Map<string, Node>): Node[] {
  return [...comp.keys()].map((k) => nodes.get(k)!).filter(Boolean);
}

function sameHouse(a: number, b: number): boolean {
  const ra = Math.floor(a / 9), ca = a % 9;
  const rb = Math.floor(b / 9), cb = b % 9;
  return ra === rb || ca === cb || (Math.floor(ra / 3) * 3 + Math.floor(ca / 3)) === (Math.floor(rb / 3) * 3 + Math.floor(cb / 3));
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎染色法', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const comps = buildMedusaComponents(grid);
    if (comps.length === 0) return null;

    const allNodes = new Map<string, Node>();
    for (const c of grid.candidates) {
      // unused placeholder to satisfy type
    }

    for (const comp of comps) {
      const color0 = [...comp.entries()].filter(([, col]) => col === 0).map(([k]) => k);
      const color1 = [...comp.entries()].filter(([, col]) => col === 1).map(([k]) => k);

      const nodeMap = new Map<string, Node>();
      for (const k of comp.keys()) {
        const [cell, digit] = k.split(':').map(Number) as [number, number];
        nodeMap.set(k, { cell, digit });
      }

      const c0nodes = color0.map((k) => nodeMap.get(k)!);
      const c1nodes = color1.map((k) => nodeMap.get(k)!);

      // R1: two candidates of same color in one cell => opposite color is true.
      for (const colorKeys of [color0, color1]) {
        const byCell = new Map<number, number[]>();
        for (const k of colorKeys) {
          const n = nodeMap.get(k)!;
          byCell.set(n.cell, [...(byCell.get(n.cell) ?? []), n.digit]);
        }
        for (const [cell, ds] of byCell) {
          if (ds.length >= 2) {
            const trueColor = colorKeys === color0 ? 1 : 0;
            const trueKeys = trueColor === 0 ? color0 : color1;
            const placements = trueKeys
              .map((k) => nodeMap.get(k)!)
              .filter((n) => grid.hasCandidate(n.cell, n.digit))
              .map((n) => ({ cell: n.cell, digit: n.digit }));
            const allCells = [...comp.keys()].map((k) => nodeMap.get(k)!.cell);
            return {
              strategyId: this.id,
              placements,
              eliminations: [],
              highlights: {
                cells: [...new Set([...allCells])],
                candidates: [...comp.keys()].map((k) => {
                  const n = nodeMap.get(k)!;
                  return { cell: n.cell, digit: n.digit };
                }),
                links: [],
              },
              explanation: {
                zh: `3D Medusa（同色同格矛盾）：格 ${cellLabel(cell)} 出现两个同色候选数，该色为假，异色全部为真。`,
                en: `3D Medusa (same color twice in a cell): cell ${cellLabel(cell)} holds two candidates of the same color, so that color is false and the opposite color is true.`,
              },
            };
          }
        }
      }

      // R2: two same-color same-digit cells in one house => opposite color true.
      for (const colorKeys of [color0, color1]) {
        for (const house of HOUSES) {
          const seen = new Map<number, number[]>();
          for (const k of colorKeys) {
            const n = nodeMap.get(k)!;
            if (!house.includes(n.cell)) continue;
            seen.set(n.digit, [...(seen.get(n.digit) ?? []), n.cell]);
          }
          for (const [digit, cells] of seen) {
            if (cells.length >= 2) {
              const trueColor = colorKeys === color0 ? 1 : 0;
              const trueKeys = trueColor === 0 ? color0 : color1;
              const placements = trueKeys
                .map((k) => nodeMap.get(k)!)
                .filter((n) => grid.hasCandidate(n.cell, n.digit))
                .map((n) => ({ cell: n.cell, digit: n.digit }));
              const allCells = [...comp.keys()].map((k) => nodeMap.get(k)!.cell);
              return {
                strategyId: this.id,
                placements,
                eliminations: [],
                highlights: {
                  cells: [...new Set([...allCells])],
                  candidates: [...comp.keys()].map((k) => {
                    const n = nodeMap.get(k)!;
                    return { cell: n.cell, digit: n.digit };
                  }),
                  links: [],
                },
                explanation: {
                  zh: `3D Medusa（同色同数同宫矛盾）：数字 ${digit} 在某 ${house.length === 9 ? '宫/行/列' : 'house'} 出现两个同色候选格，该色为假，异色全部为真。`,
                  en: `3D Medusa (same color same digit in a house): digit ${digit} appears twice with the same color in a house, so that color is false and the opposite color is true.`,
                },
              };
            }
          }
        }
      }

      // R3 & R5/R4 combined: uncolored candidate in a cell that holds both colors, or sees both colors.
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const m = grid.candidatesOf(c);
        const cands = digitsOf(m);
        if (cands.length < 2) continue;

        const colorsHere = new Set([...comp.keys()].filter((k) => nodeMap.get(k)!.cell === c).map((k) => comp.get(k)!));
        if (colorsHere.size === 2) {
          // R3: cell has both colors, any other candidate here is eliminated.
          const elims = cands
            .filter((d) => ![...comp.keys()].some((k) => nodeMap.get(k)!.cell === c && nodeMap.get(k)!.digit === d))
            .map((d) => ({ cell: c, digit: d }));
          if (elims.length > 0) {
            return medusaStep(grid, comp, nodeMap, elims, `格 ${cellLabel(c)} 同时含两种颜色`, `cell ${cellLabel(c)} contains both colors`);
          }
        }

        // R4/R5: candidate sees both colors of same digit, or sees one color and cell has opposite.
        const peers = new Set(PEERS_OF[c]!);
        for (const d of cands) {
          const c0d = c0nodes.filter((n) => n.digit === d && peers.has(n.cell));
          const c1d = c1nodes.filter((n) => n.digit === d && peers.has(n.cell));
          if (c0d.length > 0 && c1d.length > 0) {
            return medusaStep(grid, comp, nodeMap, [{ cell: c, digit: d }], `候选数 ${d} 在 ${cellLabel(c)} 看到两种颜色`, `candidate ${d} at ${cellLabel(c)} sees both colors`);
          }
          // R5: candidate (c,d) sees a colored d of one color and cell c holds the
          // opposite color on a *different* digit.
          const otherColorInCell = [...comp.keys()]
            .filter((k) => nodeMap.get(k)!.cell === c)
            .map((k) => nodeMap.get(k)!)
            .filter((n) => n.digit !== d);
          const hasBlueOther = otherColorInCell.some((n) => comp.get(nodeKey(n)) === 1);
          const hasGreenOther = otherColorInCell.some((n) => comp.get(nodeKey(n)) === 0);
          if ((c0d.length > 0 && hasBlueOther) || (c1d.length > 0 && hasGreenOther)) {
            return medusaStep(grid, comp, nodeMap, [{ cell: c, digit: d }], `候选数 ${d} 在 ${cellLabel(c)} 看到一色且本格含异色候选数`, `candidate ${d} at ${cellLabel(c)} sees one color and its cell holds the opposite color on another digit`);
          }
        }
      }
    }
    return null;
  },
};

function medusaStep(
  grid: Grid,
  comp: Map<string, 0 | 1>,
  nodeMap: Map<string, Node>,
  eliminations: { cell: number; digit: number }[],
  reasonZh: string,
  reasonEn: string,
): Step {
  const allCells = [...new Set([...comp.keys()].map((k) => nodeMap.get(k)!.cell))];
  const links: Link[] = [];
  // Reconstruct bi-location/bi-value strong links for highlights.
  const seenPairs = new Set<string>();
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const pair = house.filter((c) => comp.has(`${c}:${d}`)).sort((a, b) => a - b);
      if (pair.length === 2) {
        const key = `${Math.min(pair[0]!, pair[1]!)}:${Math.max(pair[0]!, pair[1]!)}:${d}`;
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          links.push({ from: { cell: pair[0]!, digit: d }, to: { cell: pair[1]!, digit: d }, type: 'strong' });
        }
      }
    }
  }
  for (let c = 0; c < CELLS; c++) {
    const ds = [...comp.keys()].filter((k) => nodeMap.get(k)!.cell === c).map((k) => nodeMap.get(k)!.digit);
    if (ds.length === 2) {
      links.push({ from: { cell: c, digit: ds[0]! }, to: { cell: c, digit: ds[1]! }, type: 'strong' });
    }
  }
  return {
    strategyId: '3d-medusa',
    placements: [],
    eliminations,
    highlights: {
      cells: [...allCells, ...eliminations.map((e) => e.cell)],
      candidates: [
        ...[...comp.keys()].map((k) => {
          const n = nodeMap.get(k)!;
          return { cell: n.cell, digit: n.digit };
        }),
        ...eliminations,
      ],
      links,
    },
    explanation: {
      zh: `3D Medusa：${reasonZh}，消去相应候选数。`,
      en: `3D Medusa: ${reasonEn}, eliminating the candidate.`,
    },
  };
}
