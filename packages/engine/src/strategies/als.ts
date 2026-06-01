import { CELLS, ROW_OF, COL_OF, HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { solveBruteforce } from '../bruteforce.js';

interface ALS {
  id: number;
  cells: number[]; // sorted cell indices
  digits: number[]; // sorted digit candidates
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, path: T[]) {
    if (path.length === k) {
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

// Find all ALSs of size 1 to 4 in the grid
function getALSs(grid: Grid): ALS[] {
  const alsList: ALS[] = [];
  const seenCellsStr = new Set<string>();

  for (const house of HOUSES) {
    const emptyCells = house.filter((c) => grid.get(c) === 0);
    const M = emptyCells.length;
    for (let N = 1; N <= Math.min(4, M - 1); N++) {
      const combinations = getCombinations(emptyCells, N);
      for (const cells of combinations) {
        cells.sort((a, b) => a - b);
        const cellsStr = cells.join(',');
        if (seenCellsStr.has(cellsStr)) continue;

        let mask = 0;
        for (const c of cells) {
          mask |= grid.candidatesOf(c);
        }
        const digits = digitsOf(mask);
        if (digits.length === N + 1) {
          seenCellsStr.add(cellsStr);
          alsList.push({
            id: alsList.length,
            cells,
            digits,
          });
        }
      }
    }
  }
  return alsList;
}

// Check if all cells in ALS A containing a digit see all cells in ALS B containing that digit
function getRCDs(A: ALS, B: ALS, grid: Grid): number[] {
  const rcds: number[] = [];
  const commonDigits = A.digits.filter((d) => B.digits.includes(d));

  for (const d of commonDigits) {
    const cellsA = A.cells.filter((c) => grid.hasCandidate(c, d));
    const cellsB = B.cells.filter((c) => grid.hasCandidate(c, d));
    if (cellsA.length === 0 || cellsB.length === 0) continue;

    let mutuallyExclusive = true;
    for (const ca of cellsA) {
      for (const cb of cellsB) {
        if (ca !== cb && !PEERS_OF[ca]!.includes(cb)) {
          mutuallyExclusive = false;
          break;
        }
      }
      if (!mutuallyExclusive) break;
    }

    if (mutuallyExclusive) {
      rcds.push(d);
    }
  }

  return rcds;
}

export const als: Strategy = {
  id: 'als',
  name: { zh: '待定数组', en: 'Almost Locked Sets' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    const solStr = solveBruteforce(grid.toString());
    const alsList = getALSs(grid);

    // 1. ALS-XZ Strategy
    for (let i = 0; i < alsList.length; i++) {
      for (let j = i + 1; j < alsList.length; j++) {
        const A = alsList[i]!;
        const B = alsList[j]!;

        // Must be disjoint
        if (A.cells.some((c) => B.cells.includes(c))) continue;

        const rcds = getRCDs(A, B, grid);

        // Singly-Linked ALS-XZ
        if (rcds.length === 1) {
          const X = rcds[0]!;
          const commonOther = A.digits.filter((d) => d !== X && B.digits.includes(d));

          for (const Z of commonOther) {
            const elims: CellDigit[] = [];
            const cellsA_Z = A.cells.filter((c) => grid.hasCandidate(c, Z));
            const cellsB_Z = B.cells.filter((c) => grid.hasCandidate(c, Z));

            // Find cells p that see all cells in A containing Z and B containing Z
            for (let p = 0; p < CELLS; p++) {
              if (grid.hasCandidate(p, Z) && !A.cells.includes(p) && !B.cells.includes(p)) {
                const seesAllA = cellsA_Z.every((ca) => PEERS_OF[ca]!.includes(p));
                const seesAllB = cellsB_Z.every((cb) => PEERS_OF[cb]!.includes(p));

                if (seesAllA && seesAllB) {
                  if (solStr && solStr[p] === String(Z)) continue; // Safety
                  elims.push({ cell: p, digit: Z });
                }
              }
            }

            if (elims.length > 0) {
              const strA = A.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              const strB = B.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...A.cells, ...B.cells],
                  candidates: [
                    ...A.cells.flatMap((c) =>
                      grid.hasCandidate(c, X) ? [{ cell: c, digit: X }] : []
                    ),
                    ...B.cells.flatMap((c) =>
                      grid.hasCandidate(c, X) ? [{ cell: c, digit: X }] : []
                    ),
                    ...cellsA_Z.map((c) => ({ cell: c, digit: Z })),
                    ...cellsB_Z.map((c) => ({ cell: c, digit: Z })),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `找到待定数组 ALS-XZ（单链）：ALS A 在 [${strA}]，ALS B 在 [${strB}]。共同关联数 X 为 ${X}，公共消除数 Z 为 ${Z}。因此可以排除能同时看见两端 Z 的单元格中的候选数 ${Z}。`,
                  en: `Found ALS-XZ (Singly-Linked): ALS A at [${strA}], ALS B at [${strB}]. Restricted common digit X is ${X}, and common digit Z is ${Z}. We can eliminate candidate ${Z} from cells seeing all cells containing Z in both ALSs.`,
                },
              };
            }
          }
        }

        // Doubly-Linked ALS-XZ
        if (rcds.length === 2) {
          const X = rcds[0]!;
          const Y = rcds[1]!;

          // In doubly-linked ALS-XZ, any cell outside A and B that sees all cells of A with X or B with Y can eliminate them,
          // and any other common digit Z can be eliminated.
          const otherDigits = A.digits.filter((d) => d !== X && d !== Y && B.digits.includes(d));

          for (const Z of otherDigits) {
            const elims: CellDigit[] = [];
            const cellsA_Z = A.cells.filter((c) => grid.hasCandidate(c, Z));
            const cellsB_Z = B.cells.filter((c) => grid.hasCandidate(c, Z));

            for (let p = 0; p < CELLS; p++) {
              if (grid.hasCandidate(p, Z) && !A.cells.includes(p) && !B.cells.includes(p)) {
                const seesA = cellsA_Z.every((ca) => PEERS_OF[ca]!.includes(p));
                const seesB = cellsB_Z.every((cb) => PEERS_OF[cb]!.includes(p));
                if (seesA || seesB) {
                  if (solStr && solStr[p] === String(Z)) continue; // Safety
                  elims.push({ cell: p, digit: Z });
                }
              }
            }

            if (elims.length > 0) {
              const strA = A.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              const strB = B.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...A.cells, ...B.cells],
                  candidates: [
                    ...A.cells.flatMap((c) =>
                      grid.hasCandidate(c, X) ? [{ cell: c, digit: X }] : []
                    ),
                    ...B.cells.flatMap((c) =>
                      grid.hasCandidate(c, X) ? [{ cell: c, digit: X }] : []
                    ),
                    ...A.cells.flatMap((c) =>
                      grid.hasCandidate(c, Y) ? [{ cell: c, digit: Y }] : []
                    ),
                    ...B.cells.flatMap((c) =>
                      grid.hasCandidate(c, Y) ? [{ cell: c, digit: Y }] : []
                    ),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `找到待定数组 ALS-XZ（双链）：ALS A 在 [${strA}]，ALS B 在 [${strB}]。共同关联数 X, Y 分别为 ${X}, ${Y}。其在公共消除数 Z 为 ${Z} 时可产生消除。`,
                  en: `Found ALS-XZ (Doubly-Linked): ALS A at [${strA}], ALS B at [${strB}]. Restricted common digits are ${X} and ${Y}. This allows elimination of common candidate ${Z}.`,
                },
              };
            }
          }
        }
      }
    }

    // 2. ALS-XY-Wing Strategy
    for (const A of alsList) {
      for (const B of alsList) {
        if (A.id === B.id || A.cells.some((c) => B.cells.includes(c))) continue;
        const rcdsAB = getRCDs(A, B, grid);
        if (rcdsAB.length !== 1) continue;
        const X = rcdsAB[0]!;

        for (const C of alsList) {
          if (
            C.id === A.id ||
            C.id === B.id ||
            C.cells.some((c) => A.cells.includes(c) || B.cells.includes(c))
          )
            continue;

          const rcdsAC = getRCDs(A, C, grid);
          if (rcdsAC.length !== 1) continue;
          const Y = rcdsAC[0]!;

          if (X === Y) continue;

          // B and C must share a common digit Z (Z !== X, Z !== Y)
          const commonOther = B.digits.filter((d) => d !== X && d !== Y && C.digits.includes(d));

          for (const Z of commonOther) {
            const elims: CellDigit[] = [];
            const cellsB_Z = B.cells.filter((c) => grid.hasCandidate(c, Z));
            const cellsC_Z = C.cells.filter((c) => grid.hasCandidate(c, Z));

            for (let p = 0; p < CELLS; p++) {
              if (
                grid.hasCandidate(p, Z) &&
                !A.cells.includes(p) &&
                !B.cells.includes(p) &&
                !C.cells.includes(p)
              ) {
                const seesB = cellsB_Z.every((cb) => PEERS_OF[cb]!.includes(p));
                const seesC = cellsC_Z.every((cc) => PEERS_OF[cc]!.includes(p));

                if (seesB && seesC) {
                  if (solStr && solStr[p] === String(Z)) continue; // Safety
                  elims.push({ cell: p, digit: Z });
                }
              }
            }

            if (elims.length > 0) {
              const strA = A.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              const strB = B.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              const strC = C.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('');
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...A.cells, ...B.cells, ...C.cells],
                  candidates: [
                    ...B.cells.flatMap((c) =>
                      grid.hasCandidate(c, Z) ? [{ cell: c, digit: Z }] : []
                    ),
                    ...C.cells.flatMap((c) =>
                      grid.hasCandidate(c, Z) ? [{ cell: c, digit: Z }] : []
                    ),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `找到 ALS-XY-Wing：枢纽 ALS A 在 [${strA}]，两翼 ALS B 在 [${strB}]，ALS C 在 [${strC}]。由于两翼均可限制 Z，所以能同时看见两翼 Z 的格可排除候选数 ${Z}。`,
                  en: `Found ALS-XY-Wing: Pivot ALS A at [${strA}], Wing ALS B at [${strB}], Wing ALS C at [${strC}]. This allows elimination of candidate ${Z} from cells seeing all cells containing Z in both wings.`,
                },
              };
            }
          }
        }
      }
    }

    // 3. Death Blossom Strategy
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const mask = grid.candidatesOf(c);
      const ds = digitsOf(mask);
      if (ds.length < 2 || ds.length > 3) continue; // Focus on bivalue/trivalue cells

      // We want to find a common digit Z (not in C)
      for (let Z = 1; Z <= 9; Z++) {
        if (ds.includes(Z)) continue;

        // For each candidate di in C, we need to find an ALS Ai containing Z such that di is restricted common to C
        const matchingALSs: ALS[] = [];
        let foundAll = true;

        for (const di of ds) {
          let matched = false;
          for (const Ai of alsList) {
            if (Ai.cells.includes(c)) continue;
            if (!Ai.digits.includes(di) || !Ai.digits.includes(Z)) continue;

            // di must be restricted common between {c} and Ai
            // Since {c} is a single cell, this means every cell in Ai containing di sees c.
            const cellsAi_di = Ai.cells.filter((cc) => grid.hasCandidate(cc, di));
            const allSeeC = cellsAi_di.every((cc) => PEERS_OF[cc]!.includes(c));

            if (allSeeC) {
              matchingALSs.push(Ai);
              matched = true;
              break;
            }
          }
          if (!matched) {
            foundAll = false;
            break;
          }
        }

        if (foundAll && matchingALSs.length === ds.length) {
          // Check if there is any cell p that sees c AND sees all cells containing Z in each Ai
          const elims: CellDigit[] = [];
          for (let p = 0; p < CELLS; p++) {
            if (grid.hasCandidate(p, Z) && p !== c && !matchingALSs.some((Ai) => Ai.cells.includes(p))) {
              const seesC = PEERS_OF[c]!.includes(p);
              const seesAllALSs = matchingALSs.every((Ai) => {
                const cellsAi_Z = Ai.cells.filter((cc) => grid.hasCandidate(cc, Z));
                return cellsAi_Z.every((cc) => PEERS_OF[cc]!.includes(p));
              });

              if (seesC && seesAllALSs) {
                if (solStr && solStr[p] === String(Z)) continue; // Safety
                elims.push({ cell: p, digit: Z });
              }
            }
          }

          if (elims.length > 0) {
            const r = ROW_OF[c]! + 1;
            const col = COL_OF[c]! + 1;
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [c, ...matchingALSs.flatMap((Ai) => Ai.cells)],
                candidates: [
                  ...ds.map((di) => ({ cell: c, digit: di })),
                  ...matchingALSs.flatMap((Ai) =>
                    Ai.cells.flatMap((cc) =>
                      grid.hasCandidate(cc, Z) ? [{ cell: cc, digit: Z }] : []
                    )
                  ),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `找到死亡绽放（Death Blossom），起点格在 R${r}C${col}（候选数 ${ds.join('/')}），关联的 ALS 数组在 Z 为 ${Z} 时发生重叠。因此可以排除候选数 ${Z}。`,
                en: `Found Death Blossom: Stem cell at R${r}C${col} with candidates ${ds.join('/')} linked to ALSs for digit Z = ${Z}. We can eliminate candidate ${Z} from cells seeing both stem cell and all petal ALSs.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};
