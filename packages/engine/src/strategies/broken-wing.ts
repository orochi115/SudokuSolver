import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function findSharedHouse(a: number, b: number): number {
  for (const h of [ROW_OF[a]!, 9 + COL_OF[a]!, 18 + BOX_OF[a]!]) {
    if (HOUSES[h]!.includes(b)) return h;
  }
  return -1;
}

function findOdds(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    const candidates: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
        candidates.push(c);
      }
    }
    const n = candidates.length;
    if (n < 5 || n > 12) continue;

    let budget = 3000;
    for (let a = 0; a < n - 4 && budget > 0; a++) {
      for (let b = a + 1; b < n - 3 && budget > 0; b++) {
        if (!PEERS_OF[candidates[a]!]!.includes(candidates[b]!)) continue;
        for (let c = b + 1; c < n - 2 && budget > 0; c++) {
          if (!PEERS_OF[candidates[b]!]!.includes(candidates[c]!)) continue;
          for (let d2 = c + 1; d2 < n - 1 && budget > 0; d2++) {
            if (!PEERS_OF[candidates[c]!]!.includes(candidates[d2]!)) continue;
            for (let e = d2 + 1; e < n && budget > 0; e++) {
              budget--;
              if (!PEERS_OF[candidates[d2]!]!.includes(candidates[e]!)) continue;
              if (!PEERS_OF[candidates[e]!]!.includes(candidates[a]!)) continue;

              const loop = [candidates[a]!, candidates[b]!, candidates[c]!, candidates[d2]!, candidates[e]!];

              let strongLinks = 0;
              const guardians: number[] = [];
              for (let i = 0; i < 5; i++) {
                const ci = loop[i]!;
                const cj = loop[(i + 1) % 5]!;
                const sh = findSharedHouse(ci, cj);
                if (sh === -1) continue;
                const houseCands = HOUSES[sh]!.filter(
                  (h) => h !== ci && h !== cj && grid.get(h) === 0 && (grid.candidatesOf(h) & bit),
                );
                if (houseCands.length === 0) {
                  strongLinks++;
                } else {
                  for (const g of houseCands) {
                    if (!guardians.includes(g)) guardians.push(g);
                  }
                }
              }

              if (strongLinks < 3 || guardians.length === 0) continue;

              if (guardians.length === 1) {
                const g = guardians[0]!;
                return {
                  strategyId: 'broken-wing',
                  placements: [{ cell: g, digit: d }],
                  eliminations: [],
                  highlights: {
                    cells: [...loop, g],
                    candidates: [
                      ...loop.map((c) => ({ cell: c, digit: d })),
                      { cell: g, digit: d },
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `断翼（单守护者）：数字 ${d} 的5格奇环含4个强链，${cellLabel(g)} 是唯一守护者；必须填入 ${d}。`,
                    en: `Broken Wing (single guardian): digit ${d} 5-cell odd loop has 4 strong links; ${cellLabel(g)} is the sole guardian; must be ${d}.`,
                  },
                };
              }

              const eliminations: { cell: number; digit: number }[] = [];
              for (let ci = 0; ci < CELLS; ci++) {
                if (grid.get(ci) !== 0) continue;
                if (!(grid.candidatesOf(ci) & bit)) continue;
                if (guardians.includes(ci) || loop.includes(ci)) continue;
                const peers = new Set(PEERS_OF[ci]!);
                if (guardians.every((g) => peers.has(g))) {
                  eliminations.push({ cell: ci, digit: d });
                }
              }
              for (const lc of loop) {
                if (eliminations.some((e) => e.cell === lc)) continue;
                const peers = new Set(PEERS_OF[lc]!);
                if (guardians.every((g) => peers.has(g))) {
                  if (grid.hasCandidate(lc, d)) {
                    eliminations.push({ cell: lc, digit: d });
                  }
                }
              }

              if (eliminations.length > 0) {
                return {
                  strategyId: 'broken-wing',
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...new Set([...loop, ...guardians, ...eliminations.map((e) => e.cell)])],
                    candidates: [
                      ...loop.map((c) => ({ cell: c, digit: d })),
                      ...guardians.map((c) => ({ cell: c, digit: d })),
                      ...eliminations,
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `断翼（多守护者）：数字 ${d} 的5格奇环守护者集可同时看见某些格中的 ${d}，消去之。`,
                    en: `Broken Wing (multiple guardians): digit ${d} 5-cell odd loop guardians see cells containing ${d}; eliminate.`,
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
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼（守护者）', en: 'Broken Wing (Guardians)' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    return findOdds(grid);
  },
};