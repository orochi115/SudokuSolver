/**
 * 3D Medusa (T4) — 三维美杜莎染色法.
 *
 * Multi-digit coloring: build one bipartite 2-colored network of
 * cell-candidates (cell, digit), using BOTH bi-location strong links
 * (same digit d in exactly two cells of a house) AND bi-value strong links
 * (a cell with exactly two candidate digits). The connected components
 * are 2-colored (Green/Blue); exactly one color is the solution set.
 *
 * Six rules (per SudokuWiki canon):
 *   R1 — Twice in a Cell: two same-color candidates in one cell → that
 *        color is false → remove ALL Green candidates; all BLUE cells
 *        are solutions.
 *   R2 — Twice in a Unit: two same-color candidates of the same digit in
 *        one house → color is false → remove all Green; all Blue are
 *        solutions.
 *   R3 — Two colors in a cell: uncolored (c, x) sits in a cell that has
 *        BOTH a Green and a Blue colored candidate → x can't be true in
 *        either case → eliminate x from c.
 *   R4 — Two colors in a unit: uncolored (c, d) sees a Green d and a
 *        Blue d → eliminate d from c.
 *   R5 — Two colors, unit + cell: uncolored (c, d) sees a colored d of
 *        one color AND the opposite color is present inside cell c → d
 *        can't be true in c → eliminate d from c.
 *   R6 — Cell Emptied by Color: an uncolored cell c whose EVERY
 *        candidate peers the same color → if that color were true c
 *        would be empty → color is false → all opposite-color cells
 *        are solutions.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface ColoredCandidate {
  cell: number;
  digit: number;
  color: 0 | 1;
}

function buildMedusaComponents(grid: Grid): Array<{ color: Map<string, 0 | 1>; nodes: Map<string, ColoredCandidate> }> {
  // Each node is a (cell, digit) candidate. Build adjacency via strong links.
  const nodeKey = (cell: number, digit: number) => `${cell}:${digit}`;
  const nodes = new Map<string, ColoredCandidate>();
  // Use simple integer keys for graph storage.
  const intKey = (cell: number, digit: number) => cell * 10 + digit;
  const intToReal = new Map<number, ColoredCandidate>();
  const realToInt = new Map<string, number>();

  function addNode(cell: number, digit: number): number | undefined {
    if (!grid.hasCandidate(cell, digit)) return undefined;
    const key = nodeKey(cell, digit);
    if (realToInt.has(key)) return realToInt.get(key);
    const idx = intKey(cell, digit);
    const node: ColoredCandidate = { cell, digit, color: 0 };
    nodes.set(key, node);
    intToReal.set(idx, node);
    realToInt.set(key, idx);
    return idx;
  }

  // Create all candidate nodes
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (let d = 1; d <= 9; d++) {
      if (grid.hasCandidate(c, d)) addNode(c, d);
    }
  }

  // Build strong-link edges
  const adj = new Map<number, number[]>();
  function addEdge(i: number, j: number): void {
    if (!adj.has(i)) adj.set(i, []);
    if (!adj.has(j)) adj.set(j, []);
    adj.get(i)!.push(j);
    adj.get(j)!.push(i);
  }

  // Bi-location links: digit d in exactly two cells of a house
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cells.length !== 2) continue;
      const a = addNode(cells[0]!, d);
      const b = addNode(cells[1]!, d);
      if (a !== undefined && b !== undefined) addEdge(a, b);
    }
  }

  // Bi-value links: cell with exactly two candidates
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const ds = digitsOf(m);
    const a = addNode(c, ds[0]!);
    const b = addNode(c, ds[1]!);
    if (a !== undefined && b !== undefined) addEdge(a, b);
  }

  // BFS color each component
  const visited = new Set<number>();
  const components: Array<{ color: Map<string, 0 | 1>; nodes: Map<string, ColoredCandidate> }> = [];
  for (const start of intToReal.keys()) {
    if (visited.has(start)) continue;
    const queue: Array<{ idx: number; color: 0 | 1 }> = [{ idx: start, color: 0 }];
    visited.add(start);
    const compColor = new Map<string, 0 | 1>();
    const compNodes = new Map<string, ColoredCandidate>();
    let conflicted = false;
    while (queue.length > 0) {
      const { idx, color } = queue.shift()!;
      const node = intToReal.get(idx)!;
      const k = nodeKey(node.cell, node.digit);
      compNodes.set(k, node);
      const prev = compColor.get(k);
      if (prev !== undefined && prev !== color) { conflicted = true; }
      compColor.set(k, color);
      node.color = color;
      for (const nbr of adj.get(idx) ?? []) {
        if (visited.has(nbr)) continue;
        visited.add(nbr);
        queue.push({ idx: nbr, color: (1 - color) as 0 | 1 });
      }
    }
    if (!conflicted && compNodes.size >= 2) {
      components.push({ color: compColor, nodes: compNodes });
    }
  }
  return components;
}

function buildMedusaLinks(comp: { nodes: Map<string, ColoredCandidate> }): Link[] {
  // The graph adjacency in Medusa is the strong-link structure. We rebuild
  // for highlights using a snapshot of the color assignment.
  const cellOfDigit = new Map<string, number[]>();
  for (const node of comp.nodes.values()) {
    const k = `${node.digit}`;
    if (!cellOfDigit.has(k)) cellOfDigit.set(k, []);
    cellOfDigit.get(k)!.push(node.cell);
  }
  const links: Link[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    for (const [digit, cells] of cellOfDigit) {
      const inHouse: number[] = [];
      for (const c of cells) if (house.includes(c)) inHouse.push(c);
      if (inHouse.length !== 2) continue;
      const [a, b] = inHouse as [number, number];
      const key = `${Math.min(a, b)}-${Math.max(a, b)}-${digit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ from: { cell: a, digit: Number(digit) }, to: { cell: b, digit: Number(digit) }, type: 'strong' });
    }
  }
  // Bi-value links
  const seenBV = new Set<string>();
  for (const c of HOUSES[0]!) void c;
  for (const node of comp.nodes.values()) {
    const cellMask = (() => {
      // Look up bivalue cells from the colored nodes: a bivalue cell has two
      // (cell, digit) entries of different digits with different colors.
      // For visualization, add an in-cell weak link between the two digits.
      return null;
    })();
    void cellMask;
    // Pair up same-cell, different-digit nodes for visualization
  }
  // Simpler approach: collect all colored candidates by cell
  const byCell = new Map<number, ColoredCandidate[]>();
  for (const node of comp.nodes.values()) {
    if (!byCell.has(node.cell)) byCell.set(node.cell, []);
    byCell.get(node.cell)!.push(node);
  }
  for (const list of byCell.values()) {
    if (list.length !== 2) continue;
    const [a, b] = list as [ColoredCandidate, ColoredCandidate];
    if (a.digit === b.digit) continue;
    const key = `${Math.min(a.digit, b.digit)}-${Math.max(a.digit, b.digit)}-${a.cell}`;
    if (seenBV.has(key)) continue;
    seenBV.add(key);
    links.push({ from: { cell: a.cell, digit: a.digit }, to: { cell: b.cell, digit: b.digit }, type: 'strong' });
  }
  return links;
}

export const threeDMedusa: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎染色', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const components = buildMedusaComponents(grid);

    for (const comp of components) {
      // Build auxiliary views.
      const colored = [...comp.nodes.values()];
      const coloredCells = new Set(colored.map((n) => n.cell));
      const byCell = new Map<number, ColoredCandidate[]>();
      const byCellDigit = new Map<number, Map<number, 0 | 1>>();
      for (const n of colored) {
        if (!byCell.has(n.cell)) byCell.set(n.cell, []);
        byCell.get(n.cell)!.push(n);
        if (!byCellDigit.has(n.cell)) byCellDigit.set(n.cell, new Map());
        byCellDigit.get(n.cell)!.set(n.digit, n.color);
      }

      // R1 — Twice in a Cell: same cell, two same-color colored digits → color false.
      for (const [cell, list] of byCell) {
        if (list.length < 2) continue;
        // Find if any two share the same color.
        const seenColors: Array<{ color: 0 | 1; digits: number[] }> = [{ color: 0, digits: [] }, { color: 1, digits: [] }];
        for (const n of list) seenColors[n.color]!.digits.push(n.digit);
        for (const g of seenColors) {
          if (g.digits.length < 2) continue;
          // This color is false → remove all same-color candidates in this component.
          const elims: { cell: number; digit: number }[] = [];
          for (const n of colored) {
            if (n.color === g.color) elims.push({ cell: n.cell, digit: n.digit });
          }
          // Compute per-cell surviving opposite-color candidates for placements.
          // A cell becomes a "naked single" iff after eliminating same-color
          // candidates it has exactly one candidate left.
          const placements: { cell: number; digit: number }[] = [];
          for (let cc = 0; cc < CELLS; cc++) {
            if (grid.get(cc) !== 0) continue;
            const cellMask = grid.candidatesOf(cc);
            // Eliminate same-color candidates from this cell.
            let surviving = cellMask;
            for (const n of colored) {
              if (n.cell === cc && n.color === g.color) {
                surviving &= ~maskOf(n.digit);
              }
            }
            if (popcount(surviving) === 1) {
              const d = digitsOf(surviving)[0]!;
              placements.push({ cell: cc, digit: d });
            }
          }
          if (placements.length === 0 && elims.length === 0) continue;
          return {
            strategyId: '3d-medusa',
            placements,
            eliminations: elims,
            highlights: {
              cells: [...coloredCells],
              candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit }))],
              links: buildMedusaLinks(comp),
            },
            explanation: {
              zh: `三维美杜莎 R1（双同色同格）：${cellLabel(cell)} 同时含两个相同颜色的候选；该颜色为假，消除该色所有候选。`,
              en: `3D Medusa R1 (twice in cell): ${cellLabel(cell)} carries two same-color candidates; that color is false → eliminate all candidates of that color.`,
            },
          };
        }
      }

      // R2 — Twice in a Unit: two same-color candidates of the SAME digit in a house.
      for (const house of HOUSES) {
        for (const color of [0, 1] as const) {
          // For each digit, check if two cells of this house share color `color`.
          const digitColorCount = new Map<number, number[]>();
          for (const n of colored) {
            if (!house.includes(n.cell)) continue;
            if (n.color !== color) continue;
            if (!digitColorCount.has(n.digit)) digitColorCount.set(n.digit, []);
            digitColorCount.get(n.digit)!.push(n.cell);
          }
          for (const [digit, cells] of digitColorCount) {
            if (cells.length < 2) continue;
            // Color false → remove all same-color candidates.
            const elims: { cell: number; digit: number }[] = [];
            for (const n of colored) {
              if (n.color === color) elims.push({ cell: n.cell, digit: n.digit });
            }
            // Per-cell naked single detection (only emit placements that are
            // forced).
            const placements: { cell: number; digit: number }[] = [];
            for (let cc = 0; cc < CELLS; cc++) {
              if (grid.get(cc) !== 0) continue;
              let surviving = grid.candidatesOf(cc);
              for (const n of colored) {
                if (n.cell === cc && n.color === color) {
                  surviving &= ~maskOf(n.digit);
                }
              }
              if (popcount(surviving) === 1) {
                placements.push({ cell: cc, digit: digitsOf(surviving)[0]! });
              }
            }
            if (placements.length === 0 && elims.length === 0) continue;
            return {
              strategyId: '3d-medusa',
              placements,
              eliminations: elims,
              highlights: {
                cells: [...coloredCells],
                candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit }))],
                links: buildMedusaLinks(comp),
              },
              explanation: {
                zh: `三维美杜莎 R2（双同色同房屋同数字）：某房屋内数字 ${digit} 同色出现两次；该色为假，消除该色所有候选。`,
                en: `3D Medusa R2 (twice in unit): digit ${digit} appears twice in one house with the same color; that color is false → eliminate all candidates of that color.`,
              },
            };
          }
        }
      }

      // R3 — Two colors in a cell: uncolored (c, x) where cell c has both
      // Green and Blue colored candidates → eliminate x.
      {
        let found = false;
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          const cMap = byCellDigit.get(c);
          if (!cMap) continue;
          const colors = new Set(cMap.values());
          if (colors.size < 2) continue;
          // Uncolored candidates of c
          const mask = grid.candidatesOf(c);
          for (let d = 1; d <= 9; d++) {
            if (!(mask & maskOf(d))) continue;
            if (cMap.has(d)) continue; // colored candidate
            elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          found = true;
          if (found) {
            return {
              strategyId: '3d-medusa',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...coloredCells, ...elims.map((e) => e.cell)],
                candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit })), ...elims],
                links: buildMedusaLinks(comp),
              },
              explanation: {
                zh: `三维美杜莎 R3（格内双色）：该格同时含两种颜色的候选；未染色的候选无论哪种颜色为真都不能为该值。`,
                en: `3D Medusa R3 (two colors in cell): a cell holds both Green and Blue candidates; uncolored candidates of that cell cannot be true in either case.`,
              },
            };
          }
        }
      }

      // R4 — Two colors in a unit: uncolored (c, d) sees a Green d and a Blue d.
      {
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          const mask = grid.candidatesOf(c);
          for (let d = 1; d <= 9; d++) {
            if (!(mask & maskOf(d))) continue;
            if (byCellDigit.get(c)?.has(d)) continue; // colored candidate
            const peers = new Set(PEERS_OF[c]!);
            let seesGreen = false;
            let seesBlue = false;
            for (const n of colored) {
              if (n.digit !== d) continue;
              if (!peers.has(n.cell)) continue;
              if (n.color === 0) seesGreen = true;
              else seesBlue = true;
              if (seesGreen && seesBlue) break;
            }
            if (seesGreen && seesBlue) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...coloredCells, ...elims.map((e) => e.cell)],
              candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit })), ...elims],
              links: buildMedusaLinks(comp),
            },
            explanation: {
              zh: `三维美杜莎 R4（房屋内双色）：某格的未染色候选看到同房屋内两个不同颜色的候选，必有一色为真；消去该候选。`,
              en: `3D Medusa R4 (two colors in unit): an uncolored candidate sees both colors of the same digit in a house; one color is true → eliminate that candidate.`,
            },
          };
        }
      }

      // R5 — Two colors, unit + cell: uncolored (c, d) sees a colored d of one
      // color in a house, AND the opposite color is present in cell c
      // (in the SAME component — strict requirement).
      {
        const elims: { cell: number; digit: number }[] = [];
        // For each (c, d), look at colored (peer, d) in this component.
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          const mask = grid.candidatesOf(c);
          for (let d = 1; d <= 9; d++) {
            if (!(mask & maskOf(d))) continue;
            // (c, d) must be uncolored in this component.
            if (comp.color.has(`${c}:${d}`)) continue;
            const peers = new Set(PEERS_OF[c]!);
            // Find any colored (peer, d) in this component.
            let coloredDigit: number | null = null;
            for (const n of colored) {
              if (n.digit !== d) continue;
              if (!peers.has(n.cell)) continue;
              coloredDigit = n.color;
              break;
            }
            if (coloredDigit === null) continue;
            // Check if the OPPOSITE color is present inside cell c IN THIS COMPONENT.
            const opposite = (1 - coloredDigit) as 0 | 1;
            let oppositeInCell = false;
            for (const [key, col] of comp.color) {
              const [cell2, digit2] = key.split(':').map(Number) as [number, number];
              if (cell2 === c && col === opposite) { oppositeInCell = true; break; }
              void digit2;
            }
            if (oppositeInCell) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...coloredCells, ...elims.map((e) => e.cell)],
              candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit })), ...elims],
              links: buildMedusaLinks(comp),
            },
            explanation: {
              zh: `三维美杜莎 R5（房屋 + 格内异色）：某格的未染色候选在某房屋内见到某种颜色、且格内（同分量）存在另一种颜色；该候选必为假。`,
              en: `3D Medusa R5 (unit + cell colors): uncolored candidate sees a colored d of one color in a house, and the opposite color is present in its cell (same component) → eliminate.`,
            },
          };
        }
      }

// R6 — Cell Emptied by Color: an uncolored cell c whose EVERY
      // candidate peers the same color → that color is false → opposite color
      // is the true set. Emits: ELIMINATIONS of all same-color candidates in
      // the component. Naked singles emitted ONLY for cells where eliminating
      // same-color candidates leaves exactly one candidate.
      for (const color of [0, 1] as const) {
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (byCellDigit.has(c)) continue; // not "uncolored" if it has any
          const mask = grid.candidatesOf(c);
          if (mask === 0) continue;
          const peers = new Set(PEERS_OF[c]!);
          let allPeeredToColor = true;
          for (let d = 1; d <= 9; d++) {
            if (!(mask & maskOf(d))) continue;
            // Must see at least one colored (cell, d) of color `color` — same digit.
            let hit = false;
            for (const n of colored) {
              if (n.digit !== d) continue;
              if (n.color !== color) continue;
              if (peers.has(n.cell)) { hit = true; break; }
            }
            if (!hit) { allPeeredToColor = false; break; }
          }
          if (!allPeeredToColor) continue;
          // Color false → eliminate all same-color candidates in this component.
          const elims: { cell: number; digit: number }[] = [];
          for (const n of colored) {
            if (n.color === color) elims.push({ cell: n.cell, digit: n.digit });
          }
          // Per-cell naked single detection
          const placements: { cell: number; digit: number }[] = [];
          for (let cc = 0; cc < CELLS; cc++) {
            if (grid.get(cc) !== 0) continue;
            let surviving = grid.candidatesOf(cc);
            for (const n of colored) {
              if (n.cell === cc && n.color === color) {
                surviving &= ~maskOf(n.digit);
              }
            }
            if (popcount(surviving) === 1) {
              placements.push({ cell: cc, digit: digitsOf(surviving)[0]! });
            }
          }
          if (placements.length === 0 && elims.length === 0) continue;
          return {
            strategyId: '3d-medusa',
            placements,
            eliminations: elims,
            highlights: {
              cells: [...coloredCells, c],
              candidates: [...colored.map((n) => ({ cell: n.cell, digit: n.digit }))],
              links: buildMedusaLinks(comp),
            },
            explanation: {
              zh: `三维美杜莎 R6（格被色清空）：${cellLabel(c)} 的所有候选都同伴到同一颜色的同数候选；该色为假，消除该色所有候选。`,
              en: `3D Medusa R6 (cell emptied by color): every candidate of ${cellLabel(c)} peers a same-digit colored candidate of the same color; that color is false → eliminate all candidates of that color.`,
            },
          };
        }
      }
    }
    return null;
  },
};