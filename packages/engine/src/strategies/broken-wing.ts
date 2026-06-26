/**
 * Broken Wing (P1) — 破翼 / Oddagon
 *
 * Detects odd-length single-digit cycles in the strong-link (conjugate pair)
 * graph. In such a cycle the digit cannot be placed consistently on every
 * strong link; at least one "guardian" cell that sees two non-consecutive
 * cycle cells must hold the digit. The guardians' peers can be eliminated.
 */

import { CELLS, HOUSES, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function buildStrongLinks(grid: Grid, d: number): Map<number, number[]> {
  const bit = maskOf(d);
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length === 2) {
      const [a, b] = cands as [number, number];
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      if (!adj.get(a)!.includes(b)) adj.get(a)!.push(b);
      if (!adj.get(b)!.includes(a)) adj.get(b)!.push(a);
    }
  }
  return adj;
}

/** Find shortest odd cycle of length 5 or 7 starting from s. */
function findOddCycle(adj: Map<number, number[]>, start: number, maxLen = 7): number[] | null {
  interface QItem { cell: number; path: number[] }
  const queue: QItem[] = [{ cell: start, path: [start] }];
  const seen = new Set<string>();
  seen.add(`${start}:${start}`);
  while (queue.length) {
    const { cell, path } = queue.shift()!;
    if (path.length >= 3 && path.length % 2 === 1 && adj.get(cell)!.includes(start)) {
      return [...path, start];
    }
    if (path.length >= maxLen) continue;
    for (const nb of adj.get(cell) ?? []) {
      if (path.includes(nb)) continue;
      const key = `${start}:${nb}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ cell: nb, path: [...path, nb] });
    }
  }
  return null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '破翼 / 奇环', en: 'Broken Wing / Oddagon' },
  difficulty: 560,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const adj = buildStrongLinks(grid, d);
      if (adj.size < 3) continue;

      const starts = [...adj.keys()].sort((a, b) => a - b);
      for (const start of starts) {
        const cycle = findOddCycle(adj, start);
        if (!cycle) continue;
        const cycleCells = cycle.slice(0, -1);

        // Find guardian cells: cells (not on cycle, holding d) that see two
        // non-consecutive cycle cells. A digit d guardian must be true somewhere;
        // eliminate d from common peers of all guardians if possible.
        const guardians: number[] = [];
        const cycleSet = new Set(cycleCells);
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (!grid.hasCandidate(c, d)) continue;
          if (cycleSet.has(c)) continue;
          const peers = new Set(PEERS_OF[c]!);
          let seesNonConsecutive = false;
          for (let i = 0; i < cycleCells.length; i++) {
            const a = cycleCells[i]!;
            const b = cycleCells[(i + 2) % cycleCells.length]!;
            if (peers.has(a) && peers.has(b)) { seesNonConsecutive = true; break; }
          }
          if (seesNonConsecutive) guardians.push(c);
        }

        if (guardians.length === 0) continue;

        // Eliminate d from cells outside that see all guardians.
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (!grid.hasCandidate(c, d)) continue;
          if (cycleSet.has(c) || guardians.includes(c)) continue;
          const peers = new Set(PEERS_OF[c]!);
          if (guardians.every((g) => peers.has(g))) elims.push({ cell: c, digit: d });
        }
        if (elims.length === 0) {
          // Fallback: eliminate d from cells seeing all cycle cells? Rare.
          continue;
        }

        return {
          strategyId: this.id,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cycleCells, ...guardians, ...elims.map((e) => e.cell)],
            candidates: [
              ...cycleCells.map((c) => ({ cell: c, digit: d })),
              ...guardians.map((c) => ({ cell: c, digit: d })),
              ...elims,
            ],
            links: cycleCells.map((c, i) => ({
              from: { cell: c, digit: d },
              to: { cell: cycleCells[(i + 1) % cycleCells.length]!, digit: d },
              type: 'strong' as const,
            })),
          },
          explanation: {
            zh: `破翼：数字 ${d} 的奇环 ${cycleCells.map(cellLabel).join('→')} 无法自洽；守护格 ${guardians.map(cellLabel).join(',')} 中至少一格必须为 ${d}，消去能看到全部守护格的格中的 ${d}。`,
            en: `Broken Wing: odd cycle of digit ${d} through ${cycleCells.map(cellLabel).join('→')} is inconsistent; at least one guardian ${guardians.map(cellLabel).join(',')} must be ${d}, eliminating ${d} from cells seeing all guardians.`,
          },
        };
      }
    }
    return null;
  },
};
