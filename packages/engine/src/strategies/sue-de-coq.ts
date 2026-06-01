import { HOUSES, ROW_OF, COL_OF, SIZE, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: '双区域不交数组', en: 'Sue de Coq' },
  difficulty: 95, // Suggested difficulty: 95 Sue de Coq

  apply(grid: Grid): Step | null {
    // There are 18 lines: 9 rows (0..8) and 9 columns (9..17)
    for (let lIdx = 0; lIdx < 18; lIdx++) {
      const L = HOUSES[lIdx]!;

      for (let bIdx = 0; bIdx < 9; bIdx++) {
        const B = HOUSES[18 + bIdx]!;

        // Intersection I of line L and box B (always 3 cells)
        const I = L.filter(cell => B.includes(cell));
        if (I.length === 0) continue;

        const IE = I.filter(cell => grid.get(cell) === 0);
        if (IE.length < 2) continue;

        // Try subsets of IE of size 2 or 3
        const isSubsets = getSubsets(IE, 2).concat(getSubsets(IE, 3));

        for (const IS of isSubsets) {
          const C_IS = new Set<number>();
          for (const cell of IS) {
            const digits = digitsOf(grid.candidatesOf(cell));
            for (const d of digits) {
              C_IS.add(d);
            }
          }

          // Line empty cells outside box B
          const L_out = L.filter(cell => !B.includes(cell) && grid.get(cell) === 0);
          // Box empty cells outside line L
          const B_out = B.filter(cell => !L.includes(cell) && grid.get(cell) === 0);

          // We can choose subsets S_L from L_out of size 0, 1, 2
          const s_lSubsets = [[] as number[]]
            .concat(getSubsets(L_out, 1))
            .concat(getSubsets(L_out, 2));

          // We can choose subsets S_B from B_out of size 0, 1, 2
          const s_bSubsets = [[] as number[]]
            .concat(getSubsets(B_out, 1))
            .concat(getSubsets(B_out, 2));

          for (const S_L of s_lSubsets) {
            for (const S_B of s_bSubsets) {
              const C_L = new Set<number>();
              for (const cell of S_L) {
                const digits = digitsOf(grid.candidatesOf(cell));
                for (const d of digits) {
                  C_L.add(d);
                }
              }

              const C_B = new Set<number>();
              for (const cell of S_B) {
                const digits = digitsOf(grid.candidatesOf(cell));
                for (const d of digits) {
                  C_B.add(d);
                }
              }

              // Check condition 1: C_L candidates must be subset of C_IS
              let allLInIS = true;
              for (const d of C_L) {
                if (!C_IS.has(d)) {
                  allLInIS = false;
                  break;
                }
              }
              if (!allLInIS) continue;

              // Check condition 2: C_B candidates must be subset of C_IS
              let allBInIS = true;
              for (const d of C_B) {
                if (!C_IS.has(d)) {
                  allBInIS = false;
                  break;
                }
              }
              if (!allBInIS) continue;

              // Check condition 3: C_L and C_B must be disjoint
              let disjoint = true;
              for (const d of C_L) {
                if (C_B.has(d)) {
                  disjoint = false;
                  break;
                }
              }
              if (!disjoint) continue;

              // Check condition 4: |C_L U C_B U C_IS| === S_L.length + S_B.length + IS.length
              const C_all = new Set([...C_L, ...C_B, ...C_IS]);
              const totalCells = S_L.length + S_B.length + IS.length;

              if (C_all.size === totalCells) {
                // Found a valid Sue de Coq!
                const eliminations: CellDigit[] = [];

                // 1. Eliminate candidates of C_L in line L outside S_L U IS
                const lKeep = [...S_L, ...IS];
                for (const cell of L) {
                  if (grid.get(cell) === 0 && !lKeep.includes(cell)) {
                    for (const d of C_L) {
                      if (grid.hasCandidate(cell, d)) {
                        eliminations.push({ cell, digit: d });
                      }
                    }
                  }
                }

                // 2. Eliminate candidates of C_B in box B outside S_B U IS
                const bKeep = [...S_B, ...IS];
                for (const cell of B) {
                  if (grid.get(cell) === 0 && !bKeep.includes(cell)) {
                    for (const d of C_B) {
                      if (grid.hasCandidate(cell, d)) {
                        eliminations.push({ cell, digit: d });
                      }
                    }
                  }
                }

                if (eliminations.length > 0) {
                  const involvedCells = Array.from(new Set([...IS, ...S_L, ...S_B]));
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations,
                    highlights: {
                      cells: involvedCells,
                      candidates: involvedCells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
                      links: [],
                    },
                    explanation: {
                      zh: `在行/列与宫的交叉区域发现 Sue de Coq 双区域不交数组。交叉格子为 {${IS.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}}。可通过其独立排除所在区域的其他候选数。`,
                      en: `Found Sue de Coq at a line-box intersection. Intersection cells are {${IS.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}}. This allows elimination of candidates from the line and box.`,
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
  },
};

function getSubsets<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}
