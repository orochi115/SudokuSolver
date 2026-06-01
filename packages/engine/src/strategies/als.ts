/**
 * Almost Locked Sets (ALS) strategies (T4, difficulty 80).
 *
 * An Almost Locked Set (ALS) is a set of N cells within a single house
 * containing exactly N+1 candidates. Like a naked subset with "one extra" digit.
 *
 * Key definition:
 *   ALS: N cells with N+1 candidate digits, all in one house.
 *
 * Restricted Common Candidate (RCC):
 *   A digit X is an RCC between ALS-A and ALS-B if:
 *   - X appears in both ALS-A and ALS-B
 *   - Every X-candidate in ALS-A sees every X-candidate in ALS-B
 *
 * ALS-XZ Rule:
 *   Two ALS (A and B) share an RCC X and another common digit Z where all
 *   Z-candidates in A see all Z-candidates in B.
 *   → Eliminate Z from any cell outside A∪B that sees all Z-cells in A and B.
 *
 * Doubly Linked ALS:
 *   Two ALS share TWO RCCs. → Eliminate both RCC digits from outside cells
 *   that see any RCC-digit cell in A∪B.
 *
 * ALS-XY-Wing:
 *   Three ALS (A, B, C) with RCC X between A-B and RCC Y between B-C (X≠Y).
 *   Common digit Z in A and C → eliminate Z from cells seeing all Z-cells in A and C.
 *
 * Death Blossom:
 *   A stem cell connects to ALS petals, each covering one stem digit via RCC.
 *   Common digit of all petals → eliminated from cells seeing all petal instances.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const MAX_ALS_SIZE = 4; // maximum cells in an ALS

// ---- ALS data structure ----
interface ALS {
  cells: number[];  // cells in the ALS
  digits: number;   // bitmask of all candidate digits in the ALS
}

/** True if every cell in setA sees every cell in setB. */
function allSeeAll(setA: number[], setB: number[]): boolean {
  for (const a of setA) {
    for (const b of setB) {
      if (a === b) continue;
      if (ROW_OF[a] !== ROW_OF[b] && COL_OF[a] !== COL_OF[b] && BOX_OF[a] !== BOX_OF[b]) {
        return false;
      }
    }
  }
  return true;
}

/** True if cell sees all cells in the given set. */
function seesAll(cell: number, cells: number[]): boolean {
  for (const c of cells) {
    if (c === cell) continue;
    if (ROW_OF[cell] !== ROW_OF[c] && COL_OF[cell] !== COL_OF[c] && BOX_OF[cell] !== BOX_OF[c]) {
      return false;
    }
  }
  return true;
}

/** True if two cells are peers. */
function seePeers(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/** Generate all combinations of size k from array arr. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr.slice()];
  const result: T[][] = [];
  function recurse(start: number, current: T[]): void {
    if (current.length === k) { result.push(current.slice()); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      recurse(i + 1, current);
      current.pop();
    }
  }
  recurse(0, []);
  return result;
}

/**
 * Enumerate all ALS of size 1..maxSize within each house.
 * An ALS is N cells with N+1 candidates, all within a single house.
 */
function enumerateALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seen = new Set<string>();

  for (const house of HOUSES) {
    const emptyCells = house.filter((c) => grid.get(c) === 0);
    if (emptyCells.length < 2) continue;

    const n = emptyCells.length;
    for (let size = 1; size <= Math.min(n - 1, MAX_ALS_SIZE); size++) {
      for (const cells of combinations(emptyCells, size)) {
        let digits = 0;
        for (const c of cells) digits |= grid.candidatesOf(c);
        if (popcount(digits) !== size + 1) continue;

        const key = cells.slice().sort((a, b) => a - b).join(',');
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({ cells, digits });
      }
    }
  }

  return result;
}

/**
 * Find all RCCs between two ALS.
 * An RCC digit X satisfies: every X-candidate in A sees every X-candidate in B.
 */
function findRCCs(alsA: ALS, alsB: ALS, grid: Grid): number[] {
  const common = alsA.digits & alsB.digits;
  if (common === 0) return [];

  // The two ALS must not share cells
  const cellsA = new Set(alsA.cells);
  for (const c of alsB.cells) {
    if (cellsA.has(c)) return [];
  }

  const rccs: number[] = [];
  for (const d of digitsOf(common)) {
    const cellsAd = alsA.cells.filter((c) => (grid.candidatesOf(c) & maskOf(d)) !== 0);
    const cellsBd = alsB.cells.filter((c) => (grid.candidatesOf(c) & maskOf(d)) !== 0);
    if (allSeeAll(cellsAd, cellsBd)) {
      rccs.push(d);
    }
  }
  return rccs;
}

function dedupElims(elims: Array<{ cell: number; digit: number }>): Array<{ cell: number; digit: number }> {
  const seen = new Set<number>();
  return elims.filter((e) => {
    const key = e.cell * 10 + e.digit;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---- ALS-XZ (including Doubly Linked ALS) ----
function tryALSXZ(grid: Grid): Step | null {
  const alsList = enumerateALS(grid);

  for (let i = 0; i < alsList.length; i++) {
    const alsA = alsList[i]!;
    for (let j = i + 1; j < alsList.length; j++) {
      const alsB = alsList[j]!;

      const rccs = findRCCs(alsA, alsB, grid);
      if (rccs.length === 0) continue;

      const allCellsArr = [...alsA.cells, ...alsB.cells];
      const allCellsSet = new Set(allCellsArr);

      // ---- ALS-XZ (for each RCC individually) ----
      for (const x of rccs) {
        const commonZ = alsA.digits & alsB.digits & ~maskOf(x);
        for (const z of digitsOf(commonZ)) {
          const zBit = maskOf(z);
          const cellsAZ = alsA.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);
          const cellsBZ = alsB.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);

          if (cellsAZ.length === 0 || cellsBZ.length === 0) continue;

          const elims: Array<{ cell: number; digit: number }> = [];
          for (let cell = 0; cell < 81; cell++) {
            if (allCellsSet.has(cell)) continue;
            if (!grid.hasCandidate(cell, z)) continue;
            if (seesAll(cell, cellsAZ) && seesAll(cell, cellsBZ)) {
              elims.push({ cell, digit: z });
            }
          }

          if (elims.length === 0) continue;

          const elimStr = elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join('、');
          const alsACells = alsA.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',');
          const alsBCells = alsB.cells.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(',');

          return {
            strategyId: 'als-xz',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: allCellsArr,
              candidates: allCellsArr.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [
                ...cellsAZ.flatMap((ca) =>
                  cellsBZ.map((cb) => ({
                    from: { cell: ca, digit: z },
                    to: { cell: cb, digit: z },
                    type: 'weak' as const,
                  }))
                ),
              ],
            },
            explanation: {
              zh: `ALS-XZ：ALS-A=[${alsACells}](${digitsOf(alsA.digits).join('')})，ALS-B=[${alsBCells}](${digitsOf(alsB.digits).join('')})，RCC X=${x}，共享Z=${z}。消除：${elimStr}。`,
              en: `ALS-XZ: ALS-A=[${alsACells}](${digitsOf(alsA.digits).join('')}), ALS-B=[${alsBCells}](${digitsOf(alsB.digits).join('')}), RCC X=${x}, shared Z=${z}. Eliminations: ${elimStr}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

// ---- ALS-XY-Wing ----
function tryALSXYWing(grid: Grid): Step | null {
  const alsList = enumerateALS(grid);

  for (let ai = 0; ai < alsList.length; ai++) {
    const alsA = alsList[ai]!;

    for (let bi = 0; bi < alsList.length; bi++) {
      if (bi === ai) continue;
      const alsB = alsList[bi]!;

      const rccsAB = findRCCs(alsA, alsB, grid);
      if (rccsAB.length === 0) continue;

      for (let ci = 0; ci < alsList.length; ci++) {
        if (ci === ai || ci === bi) continue;
        const alsC = alsList[ci]!;

        const rccsBC = findRCCs(alsB, alsC, grid);
        if (rccsBC.length === 0) continue;

        // No overlap between ALS cells
        const cellCount = alsA.cells.length + alsB.cells.length + alsC.cells.length;
        const allCellsSet = new Set([...alsA.cells, ...alsB.cells, ...alsC.cells]);
        if (allCellsSet.size !== cellCount) continue;

        for (const x of rccsAB) {
          for (const y of rccsBC) {
            if (x === y) continue;

            // Find Z: digit in both A and C, not X or Y
            const commonAC = alsA.digits & alsC.digits & ~maskOf(x) & ~maskOf(y);
            for (const z of digitsOf(commonAC)) {
              const zBit = maskOf(z);
              const cellsAZ = alsA.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);
              const cellsCZ = alsC.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);

              if (cellsAZ.length === 0 || cellsCZ.length === 0) continue;

              const elims: Array<{ cell: number; digit: number }> = [];
              for (let cell = 0; cell < 81; cell++) {
                if (allCellsSet.has(cell)) continue;
                if (!grid.hasCandidate(cell, z)) continue;
                if (seesAll(cell, cellsAZ) && seesAll(cell, cellsCZ)) {
                  elims.push({ cell, digit: z });
                }
              }

              if (elims.length === 0) continue;

              const elimStr = elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join('、');
              return {
                strategyId: 'als-xy-wing',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...allCellsSet],
                  candidates: [...allCellsSet].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  links: [],
                },
                explanation: {
                  zh: `ALS-XY翼：三ALS通过RCC X=${x}和Y=${y}连接，共享Z=${z}。消除：${elimStr}。`,
                  en: `ALS-XY-Wing: Three ALS via RCCs X=${x} and Y=${y}, shared digit Z=${z}. Eliminations: ${elimStr}.`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

// ---- Death Blossom ----
function tryDeathBlossom(grid: Grid): Step | null {
  const alsList = enumerateALS(grid);

  for (let stem = 0; stem < 81; stem++) {
    if (grid.get(stem) !== 0) continue;
    const stemMask = grid.candidatesOf(stem);
    const stemDigits = digitsOf(stemMask);
    if (stemDigits.length < 2 || stemDigits.length > 4) continue;

    // For each stem digit, find ALS petals where all petal d-cells see stem
    const petalsByDigit = new Map<number, ALS[]>();
    for (const d of stemDigits) {
      const petals: ALS[] = [];
      for (const als of alsList) {
        if (als.cells.includes(stem)) continue;
        if (!(als.digits & maskOf(d))) continue;
        const dCells = als.cells.filter((c) => (grid.candidatesOf(c) & maskOf(d)) !== 0);
        if (dCells.every((c) => seePeers(c, stem))) {
          petals.push(als);
        }
      }
      if (petals.length > 0) petalsByDigit.set(d, petals);
    }

    // Check if we have petals for each stem digit
    if (petalsByDigit.size < stemDigits.length) continue;

    // For 2-digit stem: try each pair of petals
    if (stemDigits.length === 2) {
      const [d1, d2] = stemDigits as [number, number];
      const petals1 = petalsByDigit.get(d1) ?? [];
      const petals2 = petalsByDigit.get(d2) ?? [];

      for (const p1 of petals1) {
        for (const p2 of petals2) {
          // No overlap between petals
          const allCellsArr = [stem, ...p1.cells, ...p2.cells];
          const allCellsSet = new Set(allCellsArr);
          if (allCellsSet.size !== allCellsArr.length) continue;

          // Find common digits in both petals (excluding stem digits)
          const commonDigits = p1.digits & p2.digits & ~maskOf(d1) & ~maskOf(d2);
          for (const z of digitsOf(commonDigits)) {
            const zBit = maskOf(z);
            const p1ZCells = p1.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);
            const p2ZCells = p2.cells.filter((c) => (grid.candidatesOf(c) & zBit) !== 0);

            const elims: Array<{ cell: number; digit: number }> = [];
            for (let cell = 0; cell < 81; cell++) {
              if (allCellsSet.has(cell)) continue;
              if (!grid.hasCandidate(cell, z)) continue;
              if (seesAll(cell, p1ZCells) && seesAll(cell, p2ZCells)) {
                elims.push({ cell, digit: z });
              }
            }

            if (elims.length === 0) continue;

            const elimStr = elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join('、');
            return {
              strategyId: 'death-blossom',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: allCellsArr,
                candidates: allCellsArr.flatMap((c) =>
                  c === stem
                    ? stemDigits.map((d) => ({ cell: c, digit: d }))
                    : digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))
                ),
                links: [],
              },
              explanation: {
                zh: `死亡花：茎格 R${ROW_OF[stem]! + 1}C${COL_OF[stem]! + 1}(${d1},${d2}) 通过两个ALS花瓣，共享Z=${z}可被消除。消除：${elimStr}。`,
                en: `Death Blossom: Stem R${ROW_OF[stem]! + 1}C${COL_OF[stem]! + 1}(${d1},${d2}) connects two ALS petals, shared Z=${z} eliminated. Eliminations: ${elimStr}.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const alsXZ: Strategy = {
  id: 'als-xz',
  name: { zh: 'ALS-XZ', en: 'ALS-XZ' },
  difficulty: 80,
  apply: tryALSXZ,
};

export const alsXYWing: Strategy = {
  id: 'als-xy-wing',
  name: { zh: 'ALS-XY翼', en: 'ALS-XY-Wing' },
  difficulty: 80,
  apply: tryALSXYWing,
};

export const deathBlossom: Strategy = {
  id: 'death-blossom',
  name: { zh: '死亡花', en: 'Death Blossom' },
  difficulty: 82,
  apply: tryDeathBlossom,
};
