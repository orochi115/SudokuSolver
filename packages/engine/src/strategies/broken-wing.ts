/**
 * Broken Wing / Guardians / Oddagon (T4) — 断翼 / 守护者.
 *
 * For a single digit d, an ODD number of strong links forms a loop that
 * CANNOT close in a valid Sudoku (no consistent 2-coloring of an odd
 * cycle). At least one of the "extra" candidates breaking the loop —
 * the guardians — must be true. Eliminations:
 *
 *   (a) Single guardian: place d in that cell.
 *   (b) Multiple guardians, common peer: eliminate d from every cell
 *       seeing every guardian.
 *   (c) Multiple guardians, target on the loop: eliminate d from any
 *       loop cell that sees all guardians.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Build the conjugate-pair graph for digit d: nodes are d-cells, edges
 *  are conjugate-pair (strong) links. */
function buildStrongLinkGraph(grid: Grid, d: number): { adj: Map<number, number[]> } {
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
  return { adj };
}

/** Enumerate odd simple cycles of length 5 (canonical Broken Wing) in the
 *  strong-link graph. We do not enumerate larger odd cycles for runtime
 *  reasons. */
function findOddLoop5(grid: Grid, d: number, adj: Map<number, number[]>): number[][] {
  const bit = maskOf(d);
  const allCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) allCells.push(c);
  }
  const cycles: number[][] = [];
  // 5-cycle enumeration: pick 5 cells, check all consecutive peers.
  function* combos5(arr: number[]): Generator<number[]> {
    function* gen(prefix: number[], start: number, k: number): Generator<number[]> {
      if (k === 0) { yield [...prefix]; return; }
      for (let i = start; i <= arr.length - k; i++) {
        prefix.push(arr[i]!);
        yield* gen(prefix, i + 1, k - 1);
        prefix.pop();
      }
    }
    yield* gen([], 0, 5);
  }
  for (const combo of combos5(allCells)) {
    // Verify: consecutive cells see each other, AND the link is a strong
    // link (i.e. the pair forms a conjugate pair on d, OR the pair itself
    // forms a "perfect pair" of only d).
    let ok = true;
    for (let i = 0; i < 5; i++) {
      const u = combo[i]!;
      const v = combo[(i + 1) % 5]!;
      if (!PEERS_OF[u]!.includes(v)) { ok = false; break; }
      // Check the link is a conjugate pair (exactly 2 d-holders in their
      // shared house)
      const sharedHouses = HOUSES.filter((h) => h.includes(u) && h.includes(v));
      let isStrong = false;
      for (const h of sharedHouses) {
        const count = h.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
        if (count === 2) { isStrong = true; break; }
      }
      if (!isStrong) { ok = false; break; }
    }
    if (!ok) continue;
    // The "imperfect" links: those whose house has ≥3 d-holders. Their
    // extra holders (outside the loop) are the guardians.
    const cellSet = new Set(combo);
    const guardianSet = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const u = combo[i]!;
      const v = combo[(i + 1) % 5]!;
      const sharedHouses = HOUSES.filter((h) => h.includes(u) && h.includes(v));
      let isPerfect = false;
      for (const h of sharedHouses) {
        const holders = h.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (holders.length === 2) { isPerfect = true; break; }
      }
      if (isPerfect) continue;
      // Imperfect: collect extra d-holders in shared houses outside the loop.
      for (const h of sharedHouses) {
        for (const c of h) {
          if (cellSet.has(c)) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) guardianSet.add(c);
        }
      }
    }
    if (guardianSet.size === 0) continue;
    cycles.push([...combo, ...guardianSet]);
  }
  return cycles;
}

function tryBrokenWing(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const { adj } = buildStrongLinkGraph(grid, d);
    const cycles = findOddLoop5(grid, d, adj);
    for (const cyc of cycles) {
      const loopLen = 5;
      const loop = cyc.slice(0, loopLen);
      const guardians = cyc.slice(loopLen);
      const loopSet = new Set(loop);
      const bit = maskOf(d);

      if (guardians.length === 1) {
        const g = guardians[0]!;
        if (grid.hasCandidate(g, d)) {
          return {
            strategyId: 'broken-wing',
            placements: [{ cell: g, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...loop, g],
              candidates: [...loop.map((c) => ({ cell: c, digit: d })), { cell: g, digit: d }],
              links: [],
            },
            explanation: {
              zh: `断翼（守护者）：数字 ${d} 的 5 格奇环 ${loop.map(cellLabel).join('、')} 不能闭合；唯一守护者 ${cellLabel(g)} 必为 ${d}，故填入 ${d}。`,
              en: `Broken Wing (Guardian): the 5-cell odd loop ${loop.map(cellLabel).join(', ')} of digit ${d} cannot close; the sole guardian ${cellLabel(g)} must be ${d} → place ${d}.`,
            },
          };
        }
      }

      if (guardians.length >= 2) {
        // Eliminate d from cells seeing ALL guardians
        const elims: { cell: number; digit: number }[] = [];
        for (let z = 0; z < CELLS; z++) {
          if (grid.get(z) !== 0) continue;
          if (!(grid.candidatesOf(z) & bit)) continue;
          const peers = new Set(PEERS_OF[z]!);
          if (guardians.every((g) => peers.has(g))) elims.push({ cell: z, digit: d });
        }
        if (elims.length > 0) {
          return {
            strategyId: 'broken-wing',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...loop, ...guardians, ...elims.map((e) => e.cell)],
              candidates: [...loop.map((c) => ({ cell: c, digit: d })), ...guardians.map((c) => ({ cell: c, digit: d }))],
              links: [],
            },
            explanation: {
              zh: `断翼（多守护者）：数字 ${d} 的 5 格奇环 ${loop.map(cellLabel).join('、')} 不能闭合；守护者 ${guardians.map(cellLabel).join('、')} 至少一格为 ${d}，故可见所有守护者的格消去 ${d}。`,
              en: `Broken Wing (multiple guardians): the 5-cell odd loop ${loop.map(cellLabel).join(', ')} cannot close; at least one of the guardians ${guardians.map(cellLabel).join(', ')} is ${d}, so eliminate ${d} from cells seeing all guardians.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryBrokenWing(grid);
  },
};

// Suppress unused
void popcount;
void digitsOf;