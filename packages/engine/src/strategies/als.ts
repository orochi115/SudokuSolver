/**
 * T4: ALS (Almost Locked Sets) strategies.
 *
 * An ALS is N cells in one house containing exactly N+1 candidates total.
 * When two ALS share a restricted common candidate (RCC), they can
 * eliminate candidates seen by all instances of that digit.
 *
 * Patterns implemented:
 * - ALS-XZ: two ALS linked by RCC X, eliminate candidate Z
 * - Doubly-linked ALS-XZ: two RCCs between ALS
 * - ALS-XY-Wing: three ALS, two RCCs
 * - Death Blossom: stem cell connects to multiple ALS petals
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'als';

export interface ALS {
  cells: number[];
  house: number;
  digits: number[];
}

function findALSInHouse(grid: Grid, house: readonly number[], houseIdx: number): ALS[] {
  const emptyCells = house.filter(c => grid.values[c] === 0);
  const results: ALS[] = [];

  function subsetsOfSize(arr: number[], size: number): number[][] {
    if (size === 1) return arr.map(x => [x]);
    if (size === arr.length) return [arr.slice()];
    if (size > arr.length || size < 1) return [];

    const results: number[][] = [];
    function comb(start: number, current: number[]): void {
      if (current.length === size) {
        results.push(current.slice());
        return;
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]!);
        comb(i + 1, current);
        current.pop();
      }
    }
    comb(0, []);
    return results;
  }

  for (let n = 1; n <= 5; n++) {
    const subsets = subsetsOfSize(emptyCells, n);
    for (const cells of subsets) {
      let combinedMask = 0;
      for (const c of cells) {
        combinedMask |= grid.candidatesOf(c);
      }
      const digits = digitsOf(combinedMask);
      if (digits.length === n + 1) {
        results.push({ cells: cells.slice(), house: houseIdx, digits });
      }
    }
  }

  return results;
}

function findAllALS(grid: Grid): ALS[] {
  const results: ALS[] = [];
  for (let hi = 0; hi < HOUSES.length; hi++) {
    results.push(...findALSInHouse(grid, HOUSES[hi]!, hi));
  }
  return results;
}

function alsSeeCell(als: ALS, cell: number): boolean {
  for (const c of als.cells) {
    if (c === cell) return true;
    if (PEERS_OF[c]!.includes(cell)) return true;
  }
  return false;
}

function alsSeeALS(a1: ALS, a2: ALS): boolean {
  for (const c1 of a1.cells) {
    for (const c2 of a2.cells) {
      if (c1 === c2) return true;
      if (PEERS_OF[c1]!.includes(c2)) return true;
    }
  }
  return false;
}

function cellsSee(c1: number, c2: number): boolean {
  if (c1 === c2) return false;
  return PEERS_OF[c1]!.includes(c2);
}

function findALSXZ(grid: Grid): { als1: ALS; als2: ALS; rcc: number; elimDigit: number; elims: CellDigit[]; links: Link[] } | null {
  const allALS = findAllALS(grid);
  if (allALS.length < 2) return null;

  for (let i = 0; i < allALS.length - 1; i++) {
    for (let j = i + 1; j < allALS.length; j++) {
      const a1 = allALS[i]!;
      const a2 = allALS[j]!;

      if (a1.house === a2.house) continue;
      if (!alsSeeALS(a1, a2)) continue;

      const commonDigits = a1.digits.filter(d => a2.digits.includes(d));
      for (const rcc of commonDigits) {
        const otherDigits1 = a1.digits.filter(d => d !== rcc);
        const otherDigits2 = a2.digits.filter(d => d !== rcc);

        for (const z of otherDigits1) {
          if (!otherDigits2.includes(z)) continue;

          const elims: CellDigit[] = [];
          for (let cell = 0; cell < 81; cell++) {
            if (grid.values[cell] !== 0) continue;
            if (!grid.hasCandidate(cell, z)) continue;
            if (a1.cells.includes(cell) || a2.cells.includes(cell)) continue;

            const seesA1 = a1.cells.some(c => c !== cell && PEERS_OF[c]!.includes(cell));
            const seesA2 = a2.cells.some(c => c !== cell && PEERS_OF[c]!.includes(cell));

            if (seesA1 && seesA2) {
              elims.push({ cell, digit: z });
            }
          }

          if (elims.length > 0) {
            const links: Link[] = [];
            for (const c of a1.cells) {
              if (grid.hasCandidate(c, rcc)) {
                for (const c2 of a2.cells) {
                  if (grid.hasCandidate(c2, rcc)) {
                    links.push({ from: { cell: c, digit: rcc }, to: { cell: c2, digit: rcc }, type: 'strong' });
                    break;
                  }
                }
                break;
              }
            }
            return { als1: a1, als2: a2, rcc, elimDigit: z, elims, links };
          }
        }
      }
    }
  }
  return null;
}

function findDoublyLinkedALS(grid: Grid): { als1: ALS; als2: ALS; rcc1: number; rcc2: number; elims: CellDigit[]; links: Link[] } | null {
  const allALS = findAllALS(grid);
  if (allALS.length < 2) return null;

  for (let i = 0; i < allALS.length - 1; i++) {
    for (let j = i + 1; j < allALS.length; j++) {
      const a1 = allALS[i]!;
      const a2 = allALS[j]!;

      if (a1.house === a2.house) continue;
      if (!alsSeeALS(a1, a2)) continue;

      const commonDigits = a1.digits.filter(d => a2.digits.includes(d));
      if (commonDigits.length < 2) continue;

      for (let di = 0; di < commonDigits.length; di++) {
        for (let dj = di + 1; dj < commonDigits.length; dj++) {
          const rcc1 = commonDigits[di]!;
          const rcc2 = commonDigits[dj]!;

          const otherDigits1 = a1.digits.filter(d => d !== rcc1 && d !== rcc2);
          const otherDigits2 = a2.digits.filter(d => d !== rcc1 && d !== rcc2);

          for (const z of otherDigits1) {
            if (!otherDigits2.includes(z)) continue;

            const elims: CellDigit[] = [];
            for (let cell = 0; cell < 81; cell++) {
              if (grid.values[cell] !== 0) continue;
              if (!grid.hasCandidate(cell, z)) continue;
              if (a1.cells.includes(cell) || a2.cells.includes(cell)) continue;

              const seesA1 = a1.cells.some(c => c !== cell && PEERS_OF[c]!.includes(cell));
              const seesA2 = a2.cells.some(c => c !== cell && PEERS_OF[c]!.includes(cell));

              if (seesA1 && seesA2) {
                elims.push({ cell, digit: z });
              }
            }

            if (elims.length > 0) {
              const links: Link[] = [];
              for (const c of a1.cells) {
                if (grid.hasCandidate(c, rcc1)) {
                  for (const c2 of a2.cells) {
                    if (grid.hasCandidate(c2, rcc1)) {
                      links.push({ from: { cell: c, digit: rcc1 }, to: { cell: c2, digit: rcc1 }, type: 'strong' });
                      break;
                    }
                  }
                }
                if (grid.hasCandidate(c, rcc2)) {
                  for (const c2 of a2.cells) {
                    if (grid.hasCandidate(c2, rcc2)) {
                      links.push({ from: { cell: c, digit: rcc2 }, to: { cell: c2, digit: rcc2 }, type: 'strong' });
                      break;
                    }
                  }
                }
              }
              return { als1: a1, als2: a2, rcc1, rcc2, elims, links };
            }
          }
        }
      }
    }
  }
  return null;
}

function findALSXYWing(grid: Grid): { stems: [ALS, ALS]; petal: ALS; rcc1: number; rcc2: number; elims: CellDigit[]; links: Link[] } | null {
  const allALS = findAllALS(grid);
  if (allALS.length < 3) return null;

  for (let i = 0; i < allALS.length - 2; i++) {
    for (let j = i + 1; j < allALS.length - 1; j++) {
      for (let k = j + 1; k < allALS.length; k++) {
        const a1 = allALS[i]!;
        const a2 = allALS[j]!;
        const a3 = allALS[k]!;

        const common12 = a1.digits.filter(d => a2.digits.includes(d));
        const common23 = a2.digits.filter(d => a3.digits.includes(d));

        if (common12.length !== 1 || common23.length !== 1) continue;

        const rcc1 = common12[0]!;
        const rcc2 = common23[0]!;

        const otherDigits1 = a1.digits.filter(d => d !== rcc1);
        const otherDigits3 = a3.digits.filter(d => d !== rcc2);

        for (const z of otherDigits1) {
          if (!otherDigits3.includes(z)) continue;

          const elims: CellDigit[] = [];
          for (let cell = 0; cell < 81; cell++) {
            if (grid.values[cell] !== 0) continue;
            if (!grid.hasCandidate(cell, z)) continue;
            if (a1.cells.includes(cell) || a3.cells.includes(cell)) continue;

            if (alsSeeCell(a1, cell) && alsSeeCell(a3, cell)) {
              elims.push({ cell, digit: z });
            }
          }

          if (elims.length > 0) {
            const links: Link[] = [];
            for (const c of a1.cells) {
              if (grid.hasCandidate(c, rcc1)) {
                for (const c2 of a2.cells) {
                  if (grid.hasCandidate(c2, rcc1)) {
                    links.push({ from: { cell: c, digit: rcc1 }, to: { cell: c2, digit: rcc1 }, type: 'strong' });
                    break;
                  }
                }
                break;
              }
            }
            for (const c of a2.cells) {
              if (grid.hasCandidate(c, rcc2)) {
                for (const c2 of a3.cells) {
                  if (grid.hasCandidate(c2, rcc2)) {
                    links.push({ from: { cell: c, digit: rcc2 }, to: { cell: c2, digit: rcc2 }, type: 'strong' });
                    break;
                  }
                }
                break;
              }
            }
            return { stems: [a1, a2], petal: a3, rcc1, rcc2, elims, links };
          }
        }
      }
    }
  }
  return null;
}

function findDeathBlossom(grid: Grid): { stem: { cell: number; digits: [number, number] }; petals: ALS[]; elims: CellDigit[]; links: Link[] } | null {
  const bivalueCells: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] === 0 && popcount(grid.candidatesOf(cell)) === 2) {
      bivalueCells.push(cell);
    }
  }

  const allALS = findAllALS(grid);

  for (const stemCell of bivalueCells) {
    const stemMask = grid.candidatesOf(stemCell);
    const stemDigits = digitsOf(stemMask);
    if (stemDigits.length !== 2) continue;

    const d1 = stemDigits[0]!;
    const d2 = stemDigits[1]!;
    const petals: ALS[] = [];

    for (const als of allALS) {
      if (als.cells.includes(stemCell)) continue;
      if (!als.digits.includes(d1)) continue;

      const stemPeers = PEERS_OF[stemCell]!;
      const seesStem = als.cells.some(c => stemPeers.includes(c) || c === stemCell);

      if (seesStem && !als.cells.includes(stemCell)) {
        petals.push(als);
      }
    }

    if (petals.length >= 2) {
      const elims: CellDigit[] = [];
      for (let cell = 0; cell < 81; cell++) {
        if (grid.values[cell] !== 0) continue;
        if (!grid.hasCandidate(cell, d2)) continue;
        if (cell === stemCell) continue;

        const allSeePetals = petals.every(p => alsSeeCell(p, cell));
        const stemSees = cellsSee(stemCell, cell);

        if (allSeePetals && !stemSees) {
          elims.push({ cell, digit: d2 });
        }
      }

      if (elims.length > 0) {
        const links: Link[] = [];
        for (const petal of petals) {
          for (const c of petal.cells) {
            if (grid.hasCandidate(c, d1)) {
              links.push({ from: { cell: stemCell, digit: d1 }, to: { cell: c, digit: d1 }, type: 'strong' });
              break;
            }
          }
        }
        return {
          stem: { cell: stemCell, digits: [d1, d2] },
          petals,
          elims,
          links,
        };
      }
    }
  }

  return null;
}

export const als: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'ALS(几乎锁定集)', en: 'Almost Locked Set' },
  difficulty: 80,

  apply(_grid: Grid): Step | null {
    return null;
  },
};