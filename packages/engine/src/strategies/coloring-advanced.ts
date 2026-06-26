/**
 * Advanced Coloring Strategies (P1) — 进阶染色策略
 *
 * Multi-Coloring and 3D Medusa — extensions of simple coloring to multi-digit
 * and multi-chain reasoning.
 *
 * Multi-Coloring:
 *   Uses two different simple-coloring chains for the same digit. When a cell
 *   sees both a color-A node and a color-B node (from different chains), and
 *   those colors are "linked" (a cell of one chain sees a cell of the other chain
 *   of opposite parity), one of the four color combinations is impossible →
 *   eliminate d from cells seeing both.
 *
 *   Type 1: Two chains share a weak link (a cell sees nodes of both chains).
 *     → Eliminate d from cells outside both chains that see one color from each.
 *   Type 2: A cell in one chain sees both colors of another chain → that chain
 *     is all-false for those colors → other color is true.
 *
 * 3D Medusa (Supercoloring):
 *   Extends simple coloring to ALL candidates across ALL digits. Strong links:
 *     1. Conjugate pair in a house (same digit)
 *     2. Bivalue cell (two digits in same cell)
 *   Coloring propagates across digit boundaries via bivalue cells.
 *   Deductions (6 types, simplified to most-common):
 *     1. Two same-color nodes in same house (contradiction) → eliminate that color
 *     2. Cell has two same-color candidates → cell is wrong color → other color placed
 *     3. Cell outside chain sees both colors of same digit → eliminate that digit
 *     4. Uncolored cell sees both colors → eliminate uncolored digit
 *     5. Two colors of same cell → eliminate that digit
 *     6. Cell outside sees all candidates of one color → eliminate all its digits
 */

import {
  CELLS, HOUSES, ROWS, COLS, ROW_OF, COL_OF, maskOf, PEERS_OF, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Coloring
// ─────────────────────────────────────────────────────────────────────────────

/** Build all connected components of conjugate pairs (strong links) for a digit. */
function buildColorComponents(grid: Grid, d: number): Array<Map<number, 0 | 1>> {
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
      for (const nb of adj.get(cell) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const nc = (1 - color) as 0 | 1;
        comp.set(nb, nc);
        queue.push({ cell: nb, color: nc });
      }
    }
    if (comp.size >= 2) components.push(comp);
  }
  return components;
}

function tryMultiColoring(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    const comps = buildColorComponents(grid, d);
    if (comps.length < 2) continue;

    // For each pair of components, check for multi-coloring eliminations
    for (let ci = 0; ci < comps.length; ci++) {
      for (let cj = ci + 1; cj < comps.length; cj++) {
        const A = comps[ci]!;
        const B = comps[cj]!;

        const A0 = [...A.entries()].filter(([, c]) => c === 0).map(([cell]) => cell);
        const A1 = [...A.entries()].filter(([, c]) => c === 1).map(([cell]) => cell);
        const B0 = [...B.entries()].filter(([, c]) => c === 0).map(([cell]) => cell);
        const B1 = [...B.entries()].filter(([, c]) => c === 1).map(([cell]) => cell);

        // Multi-Coloring Type 1:
        // If a cell in A-color-0 sees a cell in B-color-0 (same parity link),
        // then both can't be true at the same time while being same color.
        // Actually: rule is that A0 sees B0 → one of A1 or B1 is all-true.
        // A cell seeing both A1 and B1 must be eliminated.
        // Simplified: if any cell of A0 sees any cell of B0,
        // then eliminate d from cells seeing both A1 and B1.
        // Similarly if A0 sees B1, eliminate from cells seeing A1 and B0.

        const colorPairs: [number[], number[], number[], number[]][] = [
          [A0, B0, A1, B1],  // A0-B0 link → A1 or B1 true
          [A0, B1, A1, B0],  // A0-B1 link → A1 or B0 true
          [A1, B0, A0, B1],  // A1-B0 link → A0 or B1 true
          [A1, B1, A0, B0],  // A1-B1 link → A0 or B0 true
        ];

        for (const [linkColor1, linkColor2, elim1, elim2] of colorPairs) {
          // Check if any cell in linkColor1 sees any cell in linkColor2
          let hasLink = false;
          for (const a of linkColor1) {
            for (const b of linkColor2) {
              if (a !== b && PEERS_OF[a]!.includes(b)) { hasLink = true; break; }
            }
            if (hasLink) break;
          }
          if (!hasLink) continue;

          // Eliminate d from cells seeing both elim1 and elim2
          const elims: { cell: number; digit: number }[] = [];
          const elim1Set = new Set(elim1);
          const elim2Set = new Set(elim2);

          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & bit)) continue;
            if (A.has(c) || B.has(c)) continue;
            const peers = new Set(PEERS_OF[c]!);
            const sees1 = elim1.some((x) => peers.has(x));
            const sees2 = elim2.some((x) => peers.has(x));
            if (sees1 && sees2) elims.push({ cell: c, digit: d });
          }

          if (elims.length === 0) continue;

          const allCells = [...A.keys(), ...B.keys()];
          const links: Link[] = [];
          // Build strong links for both chains
          for (const house of HOUSES) {
            const cands = house.filter((c) => (A.has(c) || B.has(c)) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
            if (cands.length !== 2) continue;
            const [x, y] = cands as [number, number];
            links.push({ from: { cell: x, digit: d }, to: { cell: y, digit: d }, type: 'strong' });
          }

          return {
            strategyId: 'multi-coloring',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
              candidates: [...allCells.map((c) => ({ cell: c, digit: d })), ...elims],
              links,
            },
            explanation: {
              zh: `多重染色：数字 ${d} 的两条强链通过公共可见格连接，其中一链的某色必为真；消去能同时看到两链对应颜色节点的格中的 ${d}。`,
              en: `Multi-Coloring: digit ${d}'s two strong chains are connected via a shared visibility; one color from each chain must be true; eliminate ${d} from cells seeing one color from each chain.`,
            },
          };
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
    return tryMultiColoring(grid);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D Medusa
// ─────────────────────────────────────────────────────────────────────────────

interface MedusaNode {
  cell: number;
  digit: number;
}

function encodeMedusa(cell: number, digit: number): number {
  return cell * 10 + digit;
}

/**
 * Build 3D Medusa coloring component.
 * Strong links:
 *   1. House with exactly 2 candidates for a digit (conjugate pair)
 *   2. Bivalue cell (exactly 2 candidates, strong link between both digits)
 */
function buildMedusaComponents(grid: Grid): Array<Map<number, 0 | 1>> {
  const components: Array<Map<number, 0 | 1>> = [];
  const visited = new Set<number>();

  // Build adjacency (strong links only)
  const adj = new Map<number, number[]>(); // key = encodeMedusa(cell, digit)

  const ensure = (key: number) => { if (!adj.has(key)) adj.set(key, []); };
  const addEdge = (a: number, b: number) => {
    ensure(a); ensure(b);
    if (!adj.get(a)!.includes(b)) adj.get(a)!.push(b);
    if (!adj.get(b)!.includes(a)) adj.get(b)!.push(a);
  };

  // Type 1: conjugate pair strong links (single digit, house)
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    for (const house of HOUSES) {
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length !== 2) continue;
      const [a, b] = cands as [number, number];
      addEdge(encodeMedusa(a, d), encodeMedusa(b, d));
    }
  }

  // Type 2: bivalue cell strong links (two digits, same cell)
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const mask = grid.candidatesOf(c);
    if (popcount(mask) !== 2) continue;
    const [d1, d2] = digitsOf(mask) as [number, number];
    addEdge(encodeMedusa(c, d1), encodeMedusa(c, d2));
  }

  // BFS to build components
  for (const startKey of adj.keys()) {
    if (visited.has(startKey)) continue;
    const comp = new Map<number, 0 | 1>();
    const queue: Array<{ key: number; color: 0 | 1 }> = [{ key: startKey, color: 0 }];
    visited.add(startKey);
    comp.set(startKey, 0);
    while (queue.length > 0) {
      const { key, color } = queue.shift()!;
      for (const nb of adj.get(key) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const nc = (1 - color) as 0 | 1;
        comp.set(nb, nc);
        queue.push({ key: nb, color: nc });
      }
    }
    if (comp.size >= 2) components.push(comp);
  }
  return components;
}

function decode(key: number): MedusaNode {
  return { cell: Math.floor(key / 10), digit: key % 10 };
}

function tryMedusa(grid: Grid): Step | null {
  const components = buildMedusaComponents(grid);

  for (const comp of components) {
    const color0: MedusaNode[] = [];
    const color1: MedusaNode[] = [];
    for (const [key, color] of comp) {
      const node = decode(key);
      if (color === 0) color0.push(node);
      else color1.push(node);
    }

    // Rule 1: Two same-color candidates in the same house for same digit (Wrap)
    // → that color is all false, other color is all placed
    for (const [colorGroup, otherGroup] of [[color0, color1], [color1, color0]] as const) {
      let wrapCell = -1;
      let wrapDigit = -1;
      let wrapFound = false;
      outer1:
      for (let i = 0; i < colorGroup.length && !wrapFound; i++) {
        for (let j = i + 1; j < colorGroup.length && !wrapFound; j++) {
          const a = colorGroup[i]!;
          const b = colorGroup[j]!;
          if (a.digit !== b.digit) continue;
          if (PEERS_OF[a.cell]!.includes(b.cell)) {
            wrapCell = a.cell;
            wrapDigit = a.digit;
            wrapFound = true;
          }
        }
      }
      if (wrapFound) {
        // otherGroup's nodes are all true
        const placements: { cell: number; digit: number }[] = [];
        const eliminations: { cell: number; digit: number }[] = [];
        // Place all from otherGroup
        for (const n of otherGroup) {
          if (grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit)) {
            placements.push({ cell: n.cell, digit: n.digit });
          }
        }
        if (placements.length === 0) {
          // Generate eliminations instead — all nodes of wrapColor are false
          const wrapCells = new Set(colorGroup.map((n) => n.cell * 10 + n.digit));
          for (const n of colorGroup) {
            if (grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit)) {
              eliminations.push({ cell: n.cell, digit: n.digit });
            }
          }
          if (eliminations.length === 0) continue;
        }

        const allCells = [...new Set([...comp.keys()].map((k) => decode(k).cell))];
        return {
          strategyId: '3d-medusa',
          placements,
          eliminations,
          highlights: {
            cells: allCells,
            candidates: [...comp.keys()].map((k) => decode(k)),
            links: [],
          },
          explanation: {
            zh: `3D Medusa（颜色矛盾）：同色节点 ${cellLabel(wrapCell)}(${wrapDigit}) 在同一房间出现冲突；该色全部为假，另一色为真。`,
            en: `3D Medusa (Wrap): same-color nodes for digit ${wrapDigit} in ${cellLabel(wrapCell)} conflict in the same house; that color is false, the other is true.`,
          },
        };
      }
    }

    // Rule 2: A cell has two same-color candidates (that cell can only be one → both must be wrong)
    for (const [colorGroup, otherGroup] of [[color0, color1], [color1, color0]] as const) {
      const cellDigits = new Map<number, number[]>();
      for (const n of colorGroup) {
        if (!cellDigits.has(n.cell)) cellDigits.set(n.cell, []);
        cellDigits.get(n.cell)!.push(n.digit);
      }
      for (const [cell, digits] of cellDigits) {
        if (digits.length < 2) continue;
        // This cell has 2+ same-color candidates → that color is false
        const eliminations: { cell: number; digit: number }[] = [];
        for (const n of colorGroup) {
          if (grid.get(n.cell) === 0 && grid.hasCandidate(n.cell, n.digit)) {
            eliminations.push({ cell: n.cell, digit: n.digit });
          }
        }
        if (eliminations.length === 0) continue;
        const allCells = [...new Set([...comp.keys()].map((k) => decode(k).cell))];
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations,
          highlights: {
            cells: allCells,
            candidates: [...comp.keys()].map((k) => decode(k)),
            links: [],
          },
          explanation: {
            zh: `3D Medusa（同格双色）：格 ${cellLabel(cell)} 含两个同色候选数 ${digits.join(',')}，该色为假，消去该色全部节点。`,
            en: `3D Medusa (Two in a cell): cell ${cellLabel(cell)} has two same-color candidates ${digits.join(',')}; that color is false; eliminate all nodes of that color.`,
          },
        };
      }
    }

    // Rule 3: An uncolored cell sees both colors of the same digit → eliminate that digit
    const color0ByDigit = new Map<number, number[]>(); // digit → cells of color0
    const color1ByDigit = new Map<number, number[]>();
    for (const n of color0) { if (!color0ByDigit.has(n.digit)) color0ByDigit.set(n.digit, []); color0ByDigit.get(n.digit)!.push(n.cell); }
    for (const n of color1) { if (!color1ByDigit.has(n.digit)) color1ByDigit.set(n.digit, []); color1ByDigit.get(n.digit)!.push(n.cell); }

    const compCells = new Set([...comp.keys()].map((k) => decode(k).cell));
    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (compCells.has(c)) continue;
      const peers = new Set(PEERS_OF[c]!);
      for (const d of digitsOf(grid.candidatesOf(c))) {
        const c0cells = color0ByDigit.get(d) ?? [];
        const c1cells = color1ByDigit.get(d) ?? [];
        const sees0 = c0cells.some((x) => peers.has(x));
        const sees1 = c1cells.some((x) => peers.has(x));
        if (sees0 && sees1) elims.push({ cell: c, digit: d });
      }
    }

    if (elims.length > 0) {
      const allCells = [...new Set([...comp.keys()].map((k) => decode(k).cell))];
      return {
        strategyId: '3d-medusa',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
          candidates: [
            ...[...comp.keys()].map((k) => decode(k)),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `3D Medusa（颜色陷阱）：某格同时能看到同一数字的两种颜色节点；消去该格的对应候选数。`,
          en: `3D Medusa (Color Trap): a cell sees both colors of the same digit; eliminate that digit from the cell.`,
        },
      };
    }
  }
  return null;
}

export const medusa3D: Strategy = {
  id: '3d-medusa',
  name: { zh: '3D Medusa', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    return tryMedusa(grid);
  },
};
