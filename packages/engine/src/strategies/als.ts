import { CELLS, SIZE, ROW_OF, COL_OF, PEERS_OF, HOUSES, popcount, digitsOf, maskOf, ALL_CANDIDATES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  cells: number[];
  house: number;
  candidates: number;
  digits: number[];
}

function findALSs(grid: Grid): ALS[] {
  const result: ALS[] = [];
  for (let hi = 0; hi < HOUSES.length; hi++) {
    const house = HOUSES[hi]!;
    const unsolved = house.filter((c) => grid.get(c) === 0);
    if (unsolved.length < 2) continue;

    const n = unsolved.length;
    for (let size = 1; size <= Math.min(3, n - 1); size++) {
      const combos = combinations(unsolved, size);
      for (const cells of combos) {
        let combinedMask = 0;
        for (const c of cells) {
          combinedMask |= grid.candidatesOf(c);
        }
        const digitCount = popcount(combinedMask);
        if (digitCount === size + 1 && digitCount >= 2) {
          result.push({
            cells: [...cells],
            house: hi,
            candidates: combinedMask,
            digits: digitsOf(combinedMask),
          });
        }
      }
    }
  }
  return result;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first!, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function allInstancesSeeAllOthers(grid: Grid, cellsA: number[], cellsB: number[], digit: number): boolean {
  for (const ca of cellsA) {
    for (const cb of cellsB) {
      if (!PEERS_OF[ca]!.includes(cb)) return false;
    }
  }
  return true;
}

function cellsSeeingAllZ(grid: Grid, als1: ALS, als2: ALS, z: number): number[] {
  const zCells1 = als1.cells.filter((c) => grid.hasCandidate(c, z));
  const zCells2 = als2.cells.filter((c) => grid.hasCandidate(c, z));
  if (zCells1.length === 0 || zCells2.length === 0) return [];

  const result: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (als1.cells.includes(c) || als2.cells.includes(c)) continue;
    if (!grid.hasCandidate(c, z)) continue;

    let seesAll1 = true;
    for (const zc of zCells1) {
      if (!PEERS_OF[c]!.includes(zc)) { seesAll1 = false; break; }
    }
    let seesAll2 = true;
    for (const zc of zCells2) {
      if (!PEERS_OF[c]!.includes(zc)) { seesAll2 = false; break; }
    }
    if (seesAll1 && seesAll2) result.push(c);
  }
  return result;
}

function alsXZ(grid: Grid, als1: ALS, als2: ALS): Step | null {
  if (als1.house === als2.house) return null;

  const candidates1Set = new Set(als1.digits);
  const candidates2Set = new Set(als2.digits);

  let rcc: number | null = null;
  for (const d of als1.digits) {
    if (candidates2Set.has(d)) {
      const cells1 = als1.cells.filter((c) => grid.hasCandidate(c, d));
      const cells2 = als2.cells.filter((c) => grid.hasCandidate(c, d));
      if (allInstancesSeeAllOthers(grid, cells1, cells2, d)) {
        if (rcc === null) {
          rcc = d;
        } else {
          return null;
        }
      }
    }
  }

  if (rcc === null) return null;

  let z: number | null = null;
  for (const d of als1.digits) {
    if (d === rcc) continue;
    if (candidates2Set.has(d)) {
      z = d;
      break;
    }
  }

  if (z === null) return null;

  const elimCells = cellsSeeingAllZ(grid, als1, als2, z);
  if (elimCells.length === 0) return null;

  const allCells = [...new Set([...als1.cells, ...als2.cells])];
  const zCandidates = allCells.filter((c) => grid.hasCandidate(c, z)).map((c) => ({ cell: c, digit: z }));

  const fmt = (c: number) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
  const als1Str = als1.cells.map(fmt).join(',');
  const als2Str = als2.cells.map(fmt).join(',');

  return {
    strategyId: 'als',
    placements: [],
    eliminations: elimCells.map((c) => ({ cell: c, digit: z })),
    highlights: {
      cells: allCells,
      candidates: zCandidates,
      links: [],
    },
    explanation: {
      zh: `ALS-XZ：ALS1 {${als1Str}} 与 ALS2 {${als2Str}} 通过 RCC ${rcc} 连接，排除共同影响格中的 ${z}。`,
      en: `ALS-XZ: ALS1 {${als1Str}} and ALS2 {${als2Str}} via RCC ${rcc}, eliminate ${z} from common peers.`,
    },
  };
}

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Sets' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    const allALS = findALSs(grid);
    for (let i = 0; i < allALS.length; i++) {
      for (let j = i + 1; j < allALS.length; j++) {
        const result = alsXZ(grid, allALS[i]!, allALS[j]!);
        if (result) return result;
      }
    }
    return null;
  },
};