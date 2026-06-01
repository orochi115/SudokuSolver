import { PEERS_OF, HOUSES, ROW_OF, COL_OF, BOX_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  cells: number[];
  digits: number[];
  house: number;
}

// Helper to find all subsets of an array of a specific size
function getSubsets<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, path: T[]) {
    if (path.length === size) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]!);
      helper(i + 1, path);
      path.pop();
    }
  }
  helper(0, []);
  return result;
}

export const alsXZ: Strategy = {
  id: 'als-xz',
  name: { zh: '几乎锁定集双雄会', en: 'ALS-XZ' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    // 1. Find all ALS in the grid
    const alsList: ALS[] = [];

    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      const emptyCells = house.filter(c => grid.get(c) === 0);
      if (emptyCells.length < 2) continue;

      // We look for ALS of size N = 1..4
      const maxN = Math.min(4, emptyCells.length - 1);
      for (let n = 1; n <= maxN; n++) {
        const cellSubsets = getSubsets(emptyCells, n);
        for (const subset of cellSubsets) {
          // Collect all candidates in this subset
          let mask = 0;
          for (const cell of subset) {
            mask |= grid.candidatesOf(cell);
          }
          const digits = digitsOf(mask);
          if (digits.length === n + 1) {
            alsList.push({
              cells: subset,
              digits,
              house: h,
            });
          }
        }
      }
    }

    // 2. Compare pairs of ALS
    for (let i = 0; i < alsList.length; i++) {
      for (let j = i + 1; j < alsList.length; j++) {
        const alsA = alsList[i]!;
        const alsB = alsList[j]!;

        // Must not share cells
        if (alsA.cells.some(c => alsB.cells.includes(c))) continue;

        // Find common digits
        const commonDigits = alsA.digits.filter(d => alsB.digits.includes(d));
        if (commonDigits.length < 2) continue;

        // Find Restricted Common Candidates (RCC)
        // An RCC is a common digit d such that all instances of d in A see all instances of d in B
        const rccs: number[] = [];
        for (const d of commonDigits) {
          const cellsA = alsA.cells.filter(c => grid.hasCandidate(c, d));
          const cellsB = alsB.cells.filter(c => grid.hasCandidate(c, d));

          let isRCC = true;
          for (const ca of cellsA) {
            for (const cb of cellsB) {
              if (!PEERS_OF[ca]!.includes(cb)) {
                isRCC = false;
                break;
              }
            }
            if (!isRCC) break;
          }

          if (isRCC && cellsA.length > 0 && cellsB.length > 0) {
            rccs.push(d);
          }
        }

        // --- Singly-linked ALS-XZ (Rule 1) ---
        if (rccs.length === 1) {
          const X = rccs[0]!;
          // For each other common digit Z, try to eliminate it
          for (const Z of commonDigits) {
            if (Z === X) continue;

            const cellsA_Z = alsA.cells.filter(c => grid.hasCandidate(c, Z));
            const cellsB_Z = alsB.cells.filter(c => grid.hasCandidate(c, Z));
            if (cellsA_Z.length === 0 || cellsB_Z.length === 0) continue;

            // Find cells outside both ALS that contain candidate Z and see all cells containing Z in A and B
            const eliminations: CellDigit[] = [];
            for (let c = 0; c < 81; c++) {
              if (grid.get(c) !== 0 || alsA.cells.includes(c) || alsB.cells.includes(c)) continue;
              if (!grid.hasCandidate(c, Z)) continue;

              const seesAllA = cellsA_Z.every(ca => PEERS_OF[c]!.includes(ca));
              const seesAllB = cellsB_Z.every(cb => PEERS_OF[c]!.includes(cb));

              if (seesAllA && seesAllB) {
                eliminations.push({ cell: c, digit: Z });
              }
            }

            if (eliminations.length > 0) {
              // Construct nice highlights and links
              // Highlight all cells in ALS A and B
              const highlightCells = [...alsA.cells, ...alsB.cells];
              const highlightCandidates: CellDigit[] = [];
              for (const cell of alsA.cells) {
                for (const d of alsA.digits) {
                  if (grid.hasCandidate(cell, d)) {
                    highlightCandidates.push({ cell, digit: d });
                  }
                }
              }
              for (const cell of alsB.cells) {
                for (const d of alsB.digits) {
                  if (grid.hasCandidate(cell, d)) {
                    highlightCandidates.push({ cell, digit: d });
                  }
                }
              }

              // Build links to visualize the ALS-XZ:
              // Strong links inside ALS-A and ALS-B on X and Z
              const links: Link[] = [];
              // Draw a weak link between some X instance in A and some X instance in B to show the connection
              const cellsA_X = alsA.cells.filter(c => grid.hasCandidate(c, X));
              const cellsB_X = alsB.cells.filter(c => grid.hasCandidate(c, X));
              if (cellsA_X[0] !== undefined && cellsB_X[0] !== undefined) {
                links.push({
                  from: { cell: cellsA_X[0]!, digit: X },
                  to: { cell: cellsB_X[0]!, digit: X },
                  type: 'weak',
                });
              }

              return {
                strategyId: 'als-xz',
                placements: [],
                eliminations,
                highlights: {
                  cells: highlightCells,
                  candidates: highlightCandidates,
                  links,
                },
                explanation: {
                  zh: `找到 ALS-XZ 双雄会：ALS 1（包含格子 [${alsA.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]，候选数为 ${alsA.digits.join(',') || ''}）和 ALS 2（包含格子 [${alsB.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]，候选数为 ${alsB.digits.join(',') || ''}），它们通过数字 ${X} 强关联。由此可以排除能同时看到两组中数字 ${Z} 的格子中的候选数 ${Z}。`,
                  en: `Found ALS-XZ: ALS 1 ([${alsA.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}] with ${alsA.digits.join(',') || ''}) and ALS 2 ([${alsB.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}] with ${alsB.digits.join(',') || ''}), connected by restricted common candidate ${X}. We can eliminate candidate ${Z} from cells seeing all ${Z} cells in both ALSs.`,
                },
              };
            }
          }
        }

        // --- Doubly-linked ALS-XZ (Rule 2) ---
        if (rccs.length === 2) {
          const [X, Y] = rccs;
          // In doubly-linked ALS-XZ, X and Y can be eliminated from other cells in any house that contains all instances of X or Y in A or B
          // We can also eliminate other candidates in ALS cells, but here let's find if we can eliminate X or Y from other cells in their houses
          const eliminations: CellDigit[] = [];

          for (const d of [X!, Y!]) {
            // Find other cells in A's house (or B's house) that contain candidate d
            const cellsA_d = alsA.cells.filter(c => grid.hasCandidate(c, d));
            const cellsB_d = alsB.cells.filter(c => grid.hasCandidate(c, d));

            // If all cells containing d in A and B share a house, we can eliminate d from other cells in that house
            for (const house of HOUSES) {
              const allInHouse = [...cellsA_d, ...cellsB_d].every(c => house.includes(c));
              if (allInHouse && [...cellsA_d, ...cellsB_d].length > 0) {
                for (const c of house) {
                  if (!alsA.cells.includes(c) && !alsB.cells.includes(c) && grid.hasCandidate(c, d)) {
                    if (!eliminations.some(e => e.cell === c && e.digit === d)) {
                      eliminations.push({ cell: c, digit: d });
                    }
                  }
                }
              }
            }
          }

          if (eliminations.length > 0) {
            const highlightCells = [...alsA.cells, ...alsB.cells];
            const highlightCandidates: CellDigit[] = [];
            for (const cell of alsA.cells) {
              for (const d of alsA.digits) {
                if (grid.hasCandidate(cell, d)) {
                  highlightCandidates.push({ cell, digit: d });
                }
              }
            }
            for (const cell of alsB.cells) {
              for (const d of alsB.digits) {
                if (grid.hasCandidate(cell, d)) {
                  highlightCandidates.push({ cell, digit: d });
                }
              }
            }

            return {
              strategyId: 'als-xz-double',
              placements: [],
              eliminations,
              highlights: {
                cells: highlightCells,
                candidates: highlightCandidates,
                links: [],
              },
              explanation: {
                zh: `找到双重连接的 ALS-XZ：ALS 1（[${alsA.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]）和 ALS 2（[${alsB.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]），它们通过 ${X} 和 ${Y} 双重关联。由此可以排除它们所在区域中其它的候选数 ${X} 或 ${Y}。`,
                en: `Found Doubly-Linked ALS-XZ: ALS 1 ([${alsA.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]) and ALS 2 ([${alsB.cells.map(c => `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}`).join(', ')}]), doubly connected by RCC ${X} and ${Y}. We can eliminate ${X} and ${Y} from other cells in their shared houses.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};
