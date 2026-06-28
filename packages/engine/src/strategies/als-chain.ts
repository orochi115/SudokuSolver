/**
 * ALS-Chain / AHS (P1)
 *
 * ALS-Chain: A general chain of Almost Locked Sets (ALS) connected by RCCs.
 * Each consecutive ALS pair shares one RCC (Restricted Common Candidate).
 * The endpoints share a common digit Z (not an RCC) that can be eliminated
 * from cells seeing all Z-instances in both endpoints.
 *
 * This subsumes als-xy-wing (len-2 ALS chain) as a special case (E4).
 *
 * AHS: Almost Hidden Set — implemented as a standalone strategy that searches
 * for 2-AHS chains (AHS-XZ rule). AHS of N digits in N+1 cells is the dual of
 * ALS of N+1 cells with N+1 digits... Actually: AHS = N digits in N+1 cells.
 * The AHS-XZ rule: two AHS share a "restricted common digit" (must be true in
 * at least one). Common unlocked digit Z is eliminated from cells that see all Z
 * in both AHS. This is equivalent to the dual ALS-XZ.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

/** An Almost Locked Set: N cells holding N+1 candidate digits. */
interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

/** An Almost Hidden Set: N digits confined to N+1 cells of a house. */
interface AHS {
  house: number;
  cells: number[]; // the N+1 cells containing the N digits
  digits: number[]; // the N digits
  digitMask: number;
}

/** Generate all k-combinations from an array. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

/** Find all ALS of size 1..maxSize from a single house. */
function findALSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): ALS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: ALS[] = [];

  for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
    for (const combo of combinations(emptyCells, size)) {
      let mask = 0;
      for (const c of combo) mask |= grid.candidatesOf(c);
      if (popcount(mask) === size + 1) {
        result.push({ house: houseIndex, cells: combo, digits: digitsOf(mask), digitMask: mask });
      }
    }
  }

  return result;
}

/** Find all ALS (up to size 4) from all houses. */
function findAllALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const als of findALSInHouse(grid, house, houseIndex, 4)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(als);
      }
    }
  }

  return result;
}

/** Find all AHS of size 1..maxSize from a single house. */
function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: AHS[] = [];

  // AHS: N digits confined to N+1 cells of the house
  // i.e. for each subset D of N digits, find all cells in house that have any of D
  // If those cells number N+1 exactly, we have an AHS

  for (let numDigits = 1; numDigits <= maxSize; numDigits++) {
    for (const digitCombo of combinations([1, 2, 3, 4, 5, 6, 7, 8, 9], numDigits)) {
      const digitMask = digitCombo.reduce((acc, d) => acc | maskOf(d), 0);

      // Find cells in the house that have at least one digit from digitCombo
      const cells = emptyCells.filter((c) => (grid.candidatesOf(c) & digitMask) !== 0);

      if (cells.length === numDigits + 1) {
        // Check that ALL instances of all digits in D lie within cells
        // (not just some)
        let allConfined = true;
        for (const d of digitCombo) {
          const bit = maskOf(d);
          const dCells = emptyCells.filter((c) => (grid.candidatesOf(c) & bit) !== 0);
          if (dCells.some((c) => !cells.includes(c))) {
            allConfined = false;
            break;
          }
        }
        if (allConfined) {
          result.push({
            house: houseIndex,
            cells,
            digits: digitCombo,
            digitMask,
          });
        }
      }
    }
  }

  return result;
}

/** Find all AHS (up to size 3) from all houses. */
function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const ahs of findAHSInHouse(grid, house, houseIndex, 3)) {
      const key = `${ahs.house}:${[...ahs.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(ahs);
      }
    }
  }

  return result;
}

/**
 * Check if digit d is a Restricted Common Candidate between ALS A and ALS B.
 */
function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit)) return false;
  if (!(b.digitMask & bit)) return false;

  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);

  if (aCells.length === 0 || bCells.length === 0) return false;

  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc) return false;
      if (!PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

function alsShareCells(a: ALS, b: ALS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

/**
 * General ALS chain of length >= 3.
 * Chain: A₁ -rcc[0]- A₂ -rcc[1]- A₃ ... -rcc[k-1]- A_k
 * Eliminate Z from cells seeing all Z in A₁ and A_k, where Z is a digit in both endpoints.
 * Z must not be any of the RCCs.
 *
 * We search chains up to length MAX_CHAIN_LEN.
 */
// Maximum chain length (3 = ALS-XY-Wing; 4 = one step beyond that)
const MAX_CHAIN_LEN = 4;

function tryALSChain(
  grid: Grid,
  alsList: ALS[],
  strategyId: string,
): Step | null {
  // Optimization: pre-compute RCC pairs to avoid redundant isRCC checks
  // Build adjacency: for each ALS, which other ALS can it link to via RCC?
  const n = alsList.length;
  
  // For each pair, cache available RCCs
  // We cap alsList size to avoid N^2 explosion
  const cappedList = alsList.slice(0, Math.min(n, 60)); // limit for performance
  
  // Try chains of length 2, 3, 4
  for (let startIdx = 0; startIdx < cappedList.length; startIdx++) {
    const first = cappedList[startIdx]!;
    
    // Try length 2 (ALS-XZ equivalent - but als-xz already handles this, skip)
    // Actually als-chain should NOT duplicate als-xz. Start from length 3 (ALS-XY-Wing).
    // But the requirement says als-xy-wing is a special case... Let's include length 2+.
    
    for (let secondIdx = 0; secondIdx < cappedList.length; secondIdx++) {
      if (secondIdx === startIdx) continue;
      const second = cappedList[secondIdx]!;
      if (alsShareCells(first, second)) continue;
      
      // Find RCC between first and second
      const commonD12 = digitsOf(first.digitMask & second.digitMask);
      const rccs12 = commonD12.filter((d) => isRCC(grid, first, second, d));
      if (rccs12.length === 0) continue;
      
      for (const rcc1 of rccs12) {
        // Length 2: check eliminations
        const step2 = checkALSChainElims(grid, [first, second], [rcc1], strategyId);
        if (step2) return step2;
        
        // Extend to length 3
        if (MAX_CHAIN_LEN < 3) continue;
        
        for (let thirdIdx = 0; thirdIdx < cappedList.length; thirdIdx++) {
          if (thirdIdx === startIdx || thirdIdx === secondIdx) continue;
          const third = cappedList[thirdIdx]!;
          if (alsShareCells(third, first) || alsShareCells(third, second)) continue;
          
          const commonD23 = digitsOf(second.digitMask & third.digitMask);
          const rccs23 = commonD23.filter((d) => d !== rcc1 && isRCC(grid, second, third, d));
          if (rccs23.length === 0) continue;
          
          for (const rcc2 of rccs23) {
            const step3 = checkALSChainElims(grid, [first, second, third], [rcc1, rcc2], strategyId);
            if (step3) return step3;
            
            // Extend to length 4
            if (MAX_CHAIN_LEN < 4) continue;
            
            for (let fourthIdx = 0; fourthIdx < cappedList.length; fourthIdx++) {
              if ([startIdx, secondIdx, thirdIdx].includes(fourthIdx)) continue;
              const fourth = cappedList[fourthIdx]!;
              if (alsShareCells(fourth, first) || alsShareCells(fourth, second) || alsShareCells(fourth, third)) continue;
              
              const commonD34 = digitsOf(third.digitMask & fourth.digitMask);
              const rccs34 = commonD34.filter((d) => d !== rcc2 && isRCC(grid, third, fourth, d));
              
              for (const rcc3 of rccs34) {
                const step4 = checkALSChainElims(grid, [first, second, third, fourth], [rcc1, rcc2, rcc3], strategyId);
                if (step4) return step4;
              }
            }
          }
        }
      }
    }
  }

  return null;
}

function checkALSChainElims(
  grid: Grid,
  chain: ALS[],
  rccsUsed: number[],
  strategyId: string,
): Step | null {
  const first = chain[0]!;
  const last = chain[chain.length - 1]!;
  const rccMask = rccsUsed.reduce((acc, d) => acc | maskOf(d), 0);
  const commonZ = digitsOf(first.digitMask & last.digitMask).filter((d) => !(rccMask & maskOf(d)));

  for (const z of commonZ) {
    const zBit = maskOf(z);
    const firstZCells = first.cells.filter((c) => grid.candidatesOf(c) & zBit);
    const lastZCells = last.cells.filter((c) => grid.candidatesOf(c) & zBit);
    if (firstZCells.length === 0 || lastZCells.length === 0) continue;

    const elims: { cell: number; digit: number }[] = [];
    const allChainCells = new Set(chain.flatMap((als) => als.cells));
    
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
      if (allChainCells.has(c)) continue;

      const peers = new Set(PEERS_OF[c]!);
      if (firstZCells.every((fc) => peers.has(fc)) && lastZCells.every((lc) => peers.has(lc))) {
        elims.push({ cell: c, digit: z });
      }
    }

    if (elims.length > 0) {
      const allCells = [...allChainCells];
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
          candidates: allCells.flatMap((c) =>
            digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
          ),
          links: [],
        },
        explanation: {
          zh: `ALS链（长度 ${chain.length}）：${chain.map((als) => `ALS{${als.cells.map(cellLabel).join(',')}}`).join(' → ')}；消去能看到首尾 ALS 所有 ${z} 的格中的 ${z}。`,
          en: `ALS-Chain (length ${chain.length}): ${chain.map((als) => `ALS{${als.cells.map(cellLabel).join(',')}}`).join(' → ')}; eliminate ${z} from cells seeing all ${z} in both endpoints.`,
        },
      };
    }
  }
  return null;
}

/**
 * AHS-XZ rule: two AHS share a "restricted common digit" (must be true in at least one)
 * and a common unlocked digit Z. Eliminate Z from cells seeing all Z in both AHS.
 *
 * For AHS, a "restricted common digit" X means X must be true in at least one of the AHS.
 * This happens when: all cells of AHS₁ that don't have X, AND all cells of AHS₂ that don't have X,
 * see each other — so if X were false in both, the "non-X" cells from both would all be neighbors,
 * and the counting fails.
 *
 * Simpler implementation: AHS-XZ is equivalent to the dual ALS-XZ, so we just use ALS
 * enumeration on the complementary space. But for direct AHS search:
 * - Two AHS in different/same house
 * - Restricted common X: all AHS₁-cells that DON'T have X see all AHS₂-cells that DON'T have X
 *   (or equivalently, the AHS share a common cell's role)
 *
 * Actually the simplest interpretation: AHS-XZ gives the same eliminations as ALS-XZ
 * on the dual sets. We implement it directly as an independent check for Z elimination.
 */
function tryAHS(grid: Grid, ahsList: AHS[], strategyId: string): Step | null {
  for (let i = 0; i < ahsList.length; i++) {
    for (let j = i + 1; j < ahsList.length; j++) {
      const a = ahsList[i]!;
      const b = ahsList[j]!;

      // Common digits
      const commonDigits = digitsOf(a.digitMask & b.digitMask);
      if (commonDigits.length < 2) continue;

      // Find restricted common X: must be true in at least one AHS
      // For AHS, X is restricted if all cells NOT containing X in AHS_a see all cells NOT containing X in AHS_b
      for (const x of commonDigits) {
        const xBit = maskOf(x);

        // Cells that don't have X in each AHS
        const aNonX = a.cells.filter((c) => !(grid.candidatesOf(c) & xBit));
        const bNonX = b.cells.filter((c) => !(grid.candidatesOf(c) & xBit));

        // Restricted: all aNonX see all bNonX (and vice versa)
        // (If X is false in both AHS, these cells have no value → impossibility)
        let restricted = true;
        for (const ac of aNonX) {
          for (const bc of bNonX) {
            if (ac === bc) continue;
            if (!PEERS_OF[ac]!.includes(bc)) {
              restricted = false;
              break;
            }
          }
          if (!restricted) break;
        }
        if (!restricted) continue;

        // Found restricted common X: Z must be in at least one of A, B
        for (const z of commonDigits) {
          if (z === x) continue;
          const zBit = maskOf(z);

          const aZCells = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
          const bZCells = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
          if (aZCells.length === 0 || bZCells.length === 0) continue;

          // Eliminate Z from cells seeing all Z in A and all Z in B
          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
            if (a.cells.includes(c) || b.cells.includes(c)) continue;

            const peers = new Set(PEERS_OF[c]!);
            if (aZCells.every((ac) => peers.has(ac)) && bZCells.every((bc) => peers.has(bc))) {
              elims.push({ cell: c, digit: z });
            }
          }

          if (elims.length > 0) {
            const allCells = [...a.cells, ...b.cells];
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                candidates: allCells.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                ),
                links: [],
              },
              explanation: {
                zh: `AHS-XZ：AHS-A（格 ${a.cells.map(cellLabel).join(',')} 数字 {${a.digits.join(',')}}）与 AHS-B（格 ${b.cells.map(cellLabel).join(',')} 数字 {${b.digits.join(',')}}）通过受限公共数 ${x} 连接；消去能看到两 AHS 中所有 ${z} 的格中的 ${z}。`,
                en: `AHS-XZ: AHS-A (cells ${a.cells.map(cellLabel).join(',')} digits {${a.digits.join(',')}}) and AHS-B (cells ${b.cells.map(cellLabel).join(',')} digits {${b.digits.join(',')}}) linked by restricted common ${x}; eliminate ${z} from cells seeing all ${z} in both AHS.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function makeAlsChainStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  tieBreak: readonly TieBreakKey[],
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,

    apply(grid: Grid): Step | null {
      const alsList = findAllALS(grid);
      return tryALSChain(grid, alsList, id);
    },
  };
}

export const alsChain = makeAlsChainStrategy(
  'als-chain',
  { zh: 'ALS链', en: 'ALS-Chain' },
  880,
  ['house'],
);

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid);
    return tryAHS(grid, ahsList, 'ahs');
  },
};
