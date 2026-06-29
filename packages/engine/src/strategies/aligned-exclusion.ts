import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// Helper to find common ALSs seen by all cells in K
interface ALS {
  cells: number[];
  mask: number;
  size: number;
}

function findCommonALSs(grid: Grid, K: number[]): ALS[] {
  const common_als: ALS[] = [];
  const seen_keys = new Set<string>();

  // Helper to register unique ALS
  const registerALS = (cells: number[], mask: number) => {
    const key = cells.sort((a, b) => a - b).join(',');
    if (seen_keys.has(key)) return;
    seen_keys.add(key);
    common_als.push({ cells, mask, size: cells.length });
  };

  // Generate houses: 9 rows, 9 cols, 9 boxes
  const houses: number[][] = Array.from({ length: 27 }, () => []);
  for (let c = 0; c < CELLS; c++) {
    houses[ROW_OF[c]!]!.push(c);
    houses[9 + COL_OF[c]!]!.push(c);
    houses[18 + BOX_OF[c]!]!.push(c);
  }

  for (const h of houses) {
    const empty_in_h = h.filter((c) => grid.get(c) === 0 && !K.includes(c));
    if (empty_in_h.length === 0) continue;

    // m from 1 to 3
    for (let m = 1; m <= 3; m++) {
      if (empty_in_h.length < m) continue;
      const combos = getCombinations(empty_in_h, m);
      for (const A of combos) {
        // Every cell in K must see every cell in A
        let sees_all = true;
        for (const k of K) {
          for (const a of A) {
            if (k !== a && !PEERS_OF[k]!.includes(a)) {
              sees_all = false;
              break;
            }
          }
          if (!sees_all) break;
        }
        if (!sees_all) continue;

        // Calculate candidate union of A
        let mask = 0;
        for (const a of A) {
          mask |= grid.candidatesOf(a);
        }

        if (popcount(mask) === m + 1) {
          registerALS(A, mask);
        }
      }
    }
  }

  return common_als;
}

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const empty_cells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) empty_cells.push(c);
    }

    for (let i = 0; i < empty_cells.length; i++) {
      for (let j = i + 1; j < empty_cells.length; j++) {
        const k1 = empty_cells[i]!;
        const k2 = empty_cells[j]!;

        const als_list = findCommonALSs(grid, [k1, k2]);
        if (als_list.length === 0) continue;

        const cand1 = digitsOf(grid.candidatesOf(k1));
        const cand2 = digitsOf(grid.candidatesOf(k2));

        const aligned = PEERS_OF[k1]!.includes(k2);

        // Generate combinations
        const allowed_combos: [number, number][] = [];

        for (const d1 of cand1) {
          for (const d2 of cand2) {
            if (aligned && d1 === d2) continue; // Aligned cells cannot share a value

            // Check if this combo kills any common ALS
            let killed = false;
            const combo_mask = (1 << (d1 - 1)) | (1 << (d2 - 1));

            for (const als of als_list) {
              const remaining = als.mask & ~combo_mask;
              if (popcount(remaining) < als.size) {
                killed = true;
                break;
              }
            }

            if (!killed) {
              allowed_combos.push([d1, d2]);
            }
          }
        }

        // Test for eliminations
        const elims: { cell: number; digit: number }[] = [];

        for (const d of cand1) {
          const is_used = allowed_combos.some((combo) => combo[0] === d);
          if (!is_used) {
            elims.push({ cell: k1, digit: d });
          }
        }

        for (const d of cand2) {
          const is_used = allowed_combos.some((combo) => combo[1] === d);
          if (!is_used) {
            elims.push({ cell: k2, digit: d });
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [k1, k2, ...elims.map((e) => e.cell)],
              candidates: [
                ...cand1.map((d) => ({ cell: k1, digit: d })),
                ...cand2.map((d) => ({ cell: k2, digit: d })),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `对齐数对排除 (APE)：数对 {${cellLabel(k1)}, ${cellLabel(k2)}} 的候选数组合会使共同看到的 Almost Locked Set 处于无解状态，消去多余候选数。`,
              en: `Aligned Pair Exclusion (APE): candidates of pair {${cellLabel(k1)}, ${cellLabel(k2)}} leave a common Almost Locked Set with no legal values, eliminating invalid candidates.`,
            },
          };
        }
      }
    }

    return null;
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // ATE: cells must lie in a common house (aligned)
    // Generate houses
    const houses: number[][] = Array.from({ length: 27 }, () => []);
    for (let c = 0; c < CELLS; c++) {
      houses[ROW_OF[c]!]!.push(c);
      houses[9 + COL_OF[c]!]!.push(c);
      houses[18 + BOX_OF[c]!]!.push(c);
    }

    const seen_triples = new Set<string>();

    for (const h of houses) {
      const empty_in_h = h.filter((c) => grid.get(c) === 0);
      if (empty_in_h.length < 3) continue;

      const combos_of_3 = getCombinations(empty_in_h, 3);
      for (const K of combos_of_3) {
        const [k1, k2, k3] = K.sort((a, b) => a - b) as [number, number, number];
        const key = `${k1},${k2},${k3}`;
        if (seen_triples.has(key)) continue;
        seen_triples.add(key);

        const als_list = findCommonALSs(grid, [k1, k2, k3]);
        if (als_list.length === 0) continue;

        const cand1 = digitsOf(grid.candidatesOf(k1));
        const cand2 = digitsOf(grid.candidatesOf(k2));
        const cand3 = digitsOf(grid.candidatesOf(k3));

        // Generate combinations
        const allowed_combos: [number, number, number][] = [];

        for (const d1 of cand1) {
          for (const d2 of cand2) {
            if (d1 === d2) continue; // must be distinct
            for (const d3 of cand3) {
              if (d1 === d3 || d2 === d3) continue; // must be distinct

              // Check if this combo kills any common ALS
              let killed = false;
              const combo_mask = (1 << (d1 - 1)) | (1 << (d2 - 1)) | (1 << (d3 - 1));

              for (const als of als_list) {
                const remaining = als.mask & ~combo_mask;
                if (popcount(remaining) < als.size) {
                  killed = true;
                  break;
                }
              }

              if (!killed) {
                allowed_combos.push([d1, d2, d3]);
              }
            }
          }
        }

        // Test for eliminations
        const elims: { cell: number; digit: number }[] = [];

        for (const d of cand1) {
          const is_used = allowed_combos.some((combo) => combo[0] === d);
          if (!is_used) {
            elims.push({ cell: k1, digit: d });
          }
        }

        for (const d of cand2) {
          const is_used = allowed_combos.some((combo) => combo[1] === d);
          if (!is_used) {
            elims.push({ cell: k2, digit: d });
          }
        }

        for (const d of cand3) {
          const is_used = allowed_combos.some((combo) => combo[2] === d);
          if (!is_used) {
            elims.push({ cell: k3, digit: d });
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [k1, k2, k3, ...elims.map((e) => e.cell)],
              candidates: [
                ...cand1.map((d) => ({ cell: k1, digit: d })),
                ...cand2.map((d) => ({ cell: k2, digit: d })),
                ...cand3.map((d) => ({ cell: k3, digit: d })),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `对齐三数排除 (ATE)：数组 {${cellLabel(k1)}, ${cellLabel(k2)}, ${cellLabel(k3)}} 的候选数组合会使共同看到的 Almost Locked Set 处于无解状态，消去多余候选数。`,
              en: `Aligned Triple Exclusion (ATE): candidates of triple {${cellLabel(k1)}, ${cellLabel(k2)}, ${cellLabel(k3)}} leave a common Almost Locked Set with no legal values, eliminating invalid candidates.`,
            },
          };
        }
      }
    }

    return null;
  },
};

function getCombinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  const helper = (start: number, combo: T[]) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  };
  helper(0, []);
  return result;
}
