import { PEERS_OF, HOUSES, ROW_OF, COL_OF, SIZE, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  house: number;
  cells: number[];
  candidates: number[];
}

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Set (ALS)' },
  difficulty: 80, // Suggested difficulty: 80 ALS

  apply(grid: Grid): Step | null {
    // 1. Find all Almost Locked Sets (ALS) in the current grid
    const alsList: ALS[] = [];

    for (let hIdx = 0; hIdx < HOUSES.length; hIdx++) {
      const house = HOUSES[hIdx]!;
      const emptyCells = house.filter(cell => grid.get(cell) === 0);
      if (emptyCells.length < 2) continue;

      // We only search for ALS of size N = 1 to 4 (since N >= 5 is very rare)
      const maxN = Math.min(4, emptyCells.length - 1);
      for (let n = 1; n <= maxN; n++) {
        // Generate subsets of emptyCells of size n
        const subsets = getSubsets(emptyCells, n);
        for (const S of subsets) {
          const unionCandidates = new Set<number>();
          for (const cell of S) {
            const digits = digitsOf(grid.candidatesOf(cell));
            for (const d of digits) {
              unionCandidates.add(d);
            }
          }

          if (unionCandidates.size === n + 1) {
            alsList.push({
              house: hIdx,
              cells: S.sort((a, b) => a - b),
              candidates: Array.from(unionCandidates).sort((a, b) => a - b),
            });
          }
        }
      }
    }

    // 2. Compare pairs of ALSs
    for (let i = 0; i < alsList.length; i++) {
      const als1 = alsList[i]!;
      for (let j = i + 1; j < alsList.length; j++) {
        const als2 = alsList[j]!;

        // Must be disjoint (no shared cells)
        if (als1.cells.some(c => als2.cells.includes(c))) continue;

        // Find Restricted Common Candidates (RCC)
        // A common candidate X is an RCC if all instances of X in als1 see all instances of X in als2
        const rccs: number[] = [];
        for (const x of als1.candidates) {
          if (als2.candidates.includes(x)) {
            const cells1 = als1.cells.filter(c => grid.hasCandidate(c, x));
            const cells2 = als2.cells.filter(c => grid.hasCandidate(c, x));

            let isRCC = true;
            for (const c1 of cells1) {
              for (const c2 of cells2) {
                if (!PEERS_OF[c1]!.includes(c2)) {
                  isRCC = false;
                  break;
                }
              }
              if (!isRCC) break;
            }

            if (isRCC) {
              rccs.push(x);
            }
          }
        }

        // --- Singly Linked ALS-XZ ---
        if (rccs.length === 1) {
          const X = rccs[0]!;
          // Look for any other candidate Z in both ALSs (Z != X)
          for (const Z of als1.candidates) {
            if (Z !== X && als2.candidates.includes(Z)) {
              // Find cells containing candidate Z that see ALL Z cells in als1 and ALL Z cells in als2
              const zCells1 = als1.cells.filter(c => grid.hasCandidate(c, Z));
              const zCells2 = als2.cells.filter(c => grid.hasCandidate(c, Z));

              const eliminations: CellDigit[] = [];
              for (let cell = 0; cell < 81; cell++) {
                if (
                  grid.get(cell) === 0 &&
                  grid.hasCandidate(cell, Z) &&
                  !als1.cells.includes(cell) &&
                  !als2.cells.includes(cell)
                ) {
                  const seesAll1 = zCells1.every(c => PEERS_OF[cell]!.includes(c));
                  const seesAll2 = zCells2.every(c => PEERS_OF[cell]!.includes(c));
                  if (seesAll1 && seesAll2) {
                    eliminations.push({ cell, digit: Z });
                  }
                }
              }

              if (eliminations.length > 0) {
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...als1.cells, ...als2.cells, ...eliminations.map(e => e.cell)],
                    candidates: [
                      ...als1.cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
                      ...als2.cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
                    ],
                    links: [],
                  },
                  explanation: {
                    zh: `发现几乎锁定集（ALS-XZ）。ALS1（包含 ${als1.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}）与 ALS2（包含 ${als2.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}）共享桥梁候选数 ${X}。因此可以排除它们共同看见的候选数 ${Z}。`,
                    en: `Found Almost Locked Set (ALS-XZ). ALS1 at {${als1.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}} and ALS2 at {${als2.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(',')}} are linked by RCC ${X}. Thus, candidate ${Z} can be eliminated from cells seeing all instances of ${Z} in both sets.`,
                  },
                };
              }
            }
          }
        }

        // --- Doubly Linked ALS-XZ ---
        if (rccs.length === 2) {
          const [X, Y] = rccs;
          // In doubly-linked ALS-XZ, both RCCs X and Y are locked inside the ALSs.
          // This means both ALSs become naked subsets.
          // We can eliminate any other candidates of ALS1 from other cells in ALS1's house,
          // and any other candidates of ALS2 from other cells in ALS2's house.
          const eliminations: CellDigit[] = [];

          // For ALS1
          const nonRCC1 = als1.candidates.filter(d => d !== X && d !== Y);
          for (const d of nonRCC1) {
            const houseCells = HOUSES[als1.house]!;
            for (const cell of houseCells) {
              if (grid.get(cell) === 0 && !als1.cells.includes(cell) && grid.hasCandidate(cell, d)) {
                eliminations.push({ cell, digit: d });
              }
            }
          }

          // For ALS2
          const nonRCC2 = als2.candidates.filter(d => d !== X && d !== Y);
          for (const d of nonRCC2) {
            const houseCells = HOUSES[als2.house]!;
            for (const cell of houseCells) {
              if (grid.get(cell) === 0 && !als2.cells.includes(cell) && grid.hasCandidate(cell, d)) {
                eliminations.push({ cell, digit: d });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: [...als1.cells, ...als2.cells, ...eliminations.map(e => e.cell)],
                candidates: [
                  ...als1.cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
                  ...als2.cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d => ({ cell, digit: d }))),
                ],
                links: [],
              },
              explanation: {
                zh: `发现双重链接几乎锁定集（Doubly-Linked ALS-XZ）。ALS1 和 ALS2 共享两个桥梁候选数 ${X} 和 ${Y}。它们彼此互相锁定，可排除它们各自宫/行/列中的其他候选数。`,
                en: `Found Doubly-Linked ALS-XZ. ALS1 and ALS2 share two RCCs ${X} and ${Y}. They mutually lock each other, so other candidates can be eliminated from their respective houses.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};

// Generate all subsets of size k from an array
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
