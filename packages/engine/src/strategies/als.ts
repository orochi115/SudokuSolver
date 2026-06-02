/**
 * T4: ALS (Almost Locked Set) Strategies.
 *
 * An ALS is N cells with N+1 candidates in one house.
 * Patterns:
 * - ALS-XZ: two ALS share RCC X, eliminate common candidate Z
 * - Doubly-linked ALS-XZ: two RCCs create stronger locking
 * - ALS-XY-Wing: three ALS linked through two RCCs
 * - ALS Chain: sequence of ALS nodes connected by RCCs
 * - Death Blossom: stem cell connects to ALS petals
 */

import { PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Set' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid);
    if (alsList.length < 2) return null;

    const result = tryALSXZ(grid, alsList);
    if (result) return result;

    const doublyResult = tryDoublyLinkedALS(grid, alsList);
    if (doublyResult) return doublyResult;

    const xyWingResult = tryALSXYWing(grid, alsList);
    if (xyWingResult) return xyWingResult;

    const chainResult = tryALSChain(grid, alsList);
    if (chainResult) return chainResult;

    const blossomResult = tryDeathBlossom(grid, alsList);
    if (blossomResult) return blossomResult;

    return null;
  },
};

interface ALS {
  cells: number[];
  digits: number[];
  houseIndex: number;
}

function findAllALS(grid: Grid): ALS[] {
  const alsList: ALS[] = [];

  for (const house of HOUSES) {
    const houseCells = house.filter((c) => grid.get(c) === 0);
    if (houseCells.length < 2) continue;

    for (let size = 2; size <= houseCells.length && size <= 5; size++) {
      const subsets = getSubsets(houseCells, size);
      for (const subset of subsets) {
        const candidates = new Set<number>();
        for (const c of subset) {
          for (const d of digitsOf(grid.candidatesOf(c))) {
            candidates.add(d);
          }
        }
        if (candidates.size === size + 1) {
          alsList.push({
            cells: subset,
            digits: [...candidates],
            houseIndex: HOUSES.indexOf(house),
          });
        }
      }
    }
  }

  return alsList;
}

function getSubsets(arr: number[], size: number): number[][] {
  if (size === 1) return arr.map((x) => [x]);
  if (size === arr.length) return [arr];

  const results: number[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const first = arr[i]!;
    const rest = arr.slice(i + 1);
    const subSubsets = getSubsets(rest, size - 1);
    for (const sub of subSubsets) {
      results.push([first, ...sub]);
    }
  }
  return results;
}

function tryALSXZ(grid: Grid, alsList: ALS[]): Step | null {
  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      const als1 = alsList[i]!;
      const als2 = alsList[j]!;

      const rcc = findRestrictedCommonCandidate(grid, als1, als2);
      if (!rcc) continue;

      for (const z of rcc.unrestrictedDigits) {
        const eliminations = findALSXZEliminations(grid, als1, als2, z);
        if (eliminations.length > 0) {
          return makeALSStep(als1, als2, eliminations, 'ALS-XZ', z);
        }
      }
    }
  }
  return null;
}

function findRestrictedCommonCandidate(grid: Grid, als1: ALS, als2: ALS): {
  restrictedDigits: number[];
  unrestrictedDigits: Set<number>;
} | null {
  const digits1 = new Set(als1.digits);
  const digits2 = new Set(als2.digits);
  const common: number[] = [];

  for (const d of digits1) {
    if (digits2.has(d)) common.push(d);
  }

  if (common.length === 0) return null;

  const als1SeesAls2 = als1.cells.some((c1) => als2.cells.some((c2) => PEERS_OF[c1]!.includes(c2)));

  if (!als1SeesAls2) return null;

  const restrictedDigits: number[] = [];
  const unrestrictedDigits = new Set<number>();

  for (const d of common) {
    const dInAls1 = als1.cells.filter((c) => grid.hasCandidate(c, d));
    const dInAls2 = als2.cells.filter((c) => grid.hasCandidate(c, d));

    if (dInAls1.length === 1 && dInAls2.length === 1) {
      restrictedDigits.push(d);
    } else {
      unrestrictedDigits.add(d);
    }
  }

  if (restrictedDigits.length === 0) return null;

  return { restrictedDigits, unrestrictedDigits };
}

function findALSXZEliminations(
  grid: Grid,
  als1: ALS,
  als2: ALS,
  z: number
): CellDigit[] {
  const eliminations: CellDigit[] = [];
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  const seeingAls1 = new Set<number>();
  for (const c of als1.cells) {
    for (const p of PEERS_OF[c]!) seeingAls1.add(p);
  }

  const seeingAls2 = new Set<number>();
  for (const c of als2.cells) {
    for (const p of PEERS_OF[c]!) seeingAls2.add(p);
  }

  for (const cell of emptyCells) {
    if (als1.cells.includes(cell) || als2.cells.includes(cell)) continue;
    if (seeingAls1.has(cell) && seeingAls2.has(cell)) {
      if (grid.hasCandidate(cell, z)) {
        eliminations.push({ cell, digit: z });
      }
    }
  }

  return eliminations;
}

function tryDoublyLinkedALS(grid: Grid, alsList: ALS[]): Step | null {
  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      const als1 = alsList[i]!;
      const als2 = alsList[j]!;

      const rccResult = findRestrictedCommonCandidate(grid, als1, als2);
      if (!rccResult || rccResult.restrictedDigits.length < 2) continue;

      const restrictedDigits = rccResult.restrictedDigits;
      if (restrictedDigits.length < 2) continue;

      for (const z of rccResult.unrestrictedDigits) {
        const elims = findALSXZEliminations(grid, als1, als2, z);
        if (elims.length > 0) {
          return makeALSStep(als1, als2, elims, 'Doubly-linked ALS-XZ', z);
        }
      }
    }
  }
  return null;
}

function tryALSXYWing(grid: Grid, alsList: ALS[]): Step | null {
  if (alsList.length < 3) return null;

  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      for (let k = j + 1; k < alsList.length; k++) {
        const als1 = alsList[i]!;
        const als2 = alsList[j]!;
        const als3 = alsList[k]!;

        const result = tryThreeALSXYWing(grid, als1, als2, als3);
        if (result) return result;
      }
    }
  }

  return null;
}

function tryThreeALSXYWing(
  grid: Grid,
  als1: ALS,
  als2: ALS,
  als3: ALS
): Step | null {
  const common12 = als1.digits.filter((d) => als2.digits.includes(d));
  const common23 = als2.digits.filter((d) => als3.digits.includes(d));

  if (common12.length === 0 || common23.length === 0) return null;

  for (const d1 of common12) {
    for (const d2 of common23) {
      if (d1 === d2) continue;

      const inAls1Not2 = als1.digits.filter((d) => d !== d1 && !als2.digits.includes(d));
      const inAls3Not2 = als3.digits.filter((d) => d !== d2 && !als2.digits.includes(d));

      for (const endpoint of inAls1Not2) {
        for (const endpoint3 of inAls3Not2) {
          if (endpoint === endpoint3) {
            const elims = findALSXYWingEliminations(grid, als1, als2, als3, endpoint);
            if (elims.length > 0) {
              return makeALSStep(als1, als3, elims, 'ALS-XY-Wing', endpoint);
            }
          }
        }
      }
    }
  }

  return null;
}

function findALSXYWingEliminations(
  grid: Grid,
  als1: ALS,
  als2: ALS,
  als3: ALS,
  digit: number
): CellDigit[] {
  const eliminations: CellDigit[] = [];
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  const seeingAls1 = new Set<number>();
  for (const c of als1.cells) {
    for (const p of PEERS_OF[c]!) seeingAls1.add(p);
  }

  const seeingAls3 = new Set<number>();
  for (const c of als3.cells) {
    for (const p of PEERS_OF[c]!) seeingAls3.add(p);
  }

  for (const cell of emptyCells) {
    if (als1.cells.includes(cell) || als2.cells.includes(cell) || als3.cells.includes(cell)) continue;
    if (seeingAls1.has(cell) && seeingAls3.has(cell)) {
      if (grid.hasCandidate(cell, digit)) {
        eliminations.push({ cell, digit });
      }
    }
  }

  return eliminations;
}

function tryALSChain(grid: Grid, alsList: ALS[]): Step | null {
  return null;
}

function tryDeathBlossom(grid: Grid, alsList: ALS[]): Step | null {
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  for (const cell of emptyCells) {
    if (popcount(grid.candidatesOf(cell)) < 2) continue;

    const digits = digitsOf(grid.candidatesOf(cell));
    const petals: ALS[] = [];

    for (const als of alsList) {
      if (als.cells.includes(cell)) continue;
      const shared = als.digits.filter((d) => digits.includes(d));
      if (shared.length > 0) {
        petals.push(als);
      }
    }

    if (petals.length < 2) continue;

    for (let i = 0; i < petals.length; i++) {
      for (let j = i + 1; j < petals.length; j++) {
        const petal1 = petals[i]!;
        const petal2 = petals[j]!;

        const rcc = findRestrictedCommonCandidate(grid, petal1, petal2);
        if (!rcc || rcc.restrictedDigits.length === 0) continue;

        for (const z of rcc.unrestrictedDigits) {
          const elims = findDeathBlossomEliminations(grid, cell, petal1, petal2, z);
          if (elims.length > 0) {
            return {
              strategyId: 'als',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [cell, ...petal1.cells, ...petal2.cells],
                candidates: [
                  ...digits.map((d) => ({ cell, digit: d })),
                  ...petal1.cells.flatMap((c) =>
                    petal1.digits.map((d) => ({ cell: c, digit: d }))
                  ),
                  ...petal2.cells.flatMap((c) =>
                    petal2.digits.map((d) => ({ cell: c, digit: d }))
                  ),
                ],
                links: [],
              },
              explanation: {
                zh: `格 R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1} 为茎，连接到两个ALS花瓣，${z} 可从共同视野格消除（Death Blossom）。`,
                en: `Cell R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1} is the stem connecting to two ALS petals; ${z} eliminated from cells seeing both (Death Blossom).`,
              },
            };
          }
        }
      }
    }
  }

  return null;
}

function findDeathBlossomEliminations(
  grid: Grid,
  stemCell: number,
  petal1: ALS,
  petal2: ALS,
  z: number
): CellDigit[] {
  const eliminations: CellDigit[] = [];
  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  const seeingPetals = new Set<number>();
  for (const c of petal1.cells) {
    for (const p of PEERS_OF[c]!) seeingPetals.add(p);
  }
  for (const c of petal2.cells) {
    for (const p of PEERS_OF[c]!) seeingPetals.add(p);
  }

  for (const cell of emptyCells) {
    if (cell === stemCell) continue;
    if (petal1.cells.includes(cell) || petal2.cells.includes(cell)) continue;
    if (seeingPetals.has(cell)) {
      if (grid.hasCandidate(cell, z)) {
        eliminations.push({ cell, digit: z });
      }
    }
  }

  return eliminations;
}

function makeALSStep(
  als1: ALS,
  als2: ALS,
  eliminations: CellDigit[],
  pattern: string,
  digit: number
): Step {
  const cells = [...als1.cells, ...als2.cells];
  const candidates = [
    ...als1.cells.flatMap((c) => als1.digits.map((d) => ({ cell: c, digit: d }))),
    ...als2.cells.flatMap((c) => als2.digits.map((d) => ({ cell: c, digit: d }))),
  ];

  const als1r = Math.floor(als1.cells[0]! / 9) + 1;
  const als1c = (als1.cells[0]! % 9) + 1;
  const als2r = Math.floor(als2.cells[0]! / 9) + 1;
  const als2c = (als2.cells[0]! % 9) + 1;

  return {
    strategyId: 'als',
    placements: [],
    eliminations,
    highlights: { cells, candidates, links: [] },
    explanation: {
      zh: `两个 ALS (首格 R${als1r}C${als1c} 与 R${als2r}C${als2c}) 通过受限候选 ${digit} 链接，可从共同视野格消除（${pattern}）。`,
      en: `Two ALS (first cells R${als1r}C${als1c} and R${als2r}C${als2c}) linked via restricted candidate ${digit}; eliminate from cells seeing both (${pattern}).`,
    },
  };
}
