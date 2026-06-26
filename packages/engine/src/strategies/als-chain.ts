import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  function go(start: number, chosen: T[]): void {
    if (chosen.length === k) { result.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      go(i + 1, chosen);
      chosen.pop();
    }
  }
  go(0, []);
  return result;
}

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

function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit) || !(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc || !PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

function alsShareCells(a: ALS, b: ALS): boolean {
  const setA = new Set(a.cells);
  return b.cells.some((c) => setA.has(c));
}

function tryALSChain(grid: Grid, alsList: ALS[], strategyId: string): Step | null {
  const MAX_CHAIN = 6;

  for (let startIdx = 0; startIdx < alsList.length; startIdx++) {
    interface SearchState {
      alsIndices: number[];
      rccDigits: number[];
    }

    const stack: SearchState[] = [{ alsIndices: [startIdx], rccDigits: [] }];

    while (stack.length > 0) {
      const state = stack.pop()!;
      const lastAls = alsList[state.alsIndices[state.alsIndices.length - 1]!]!;

      if (state.alsIndices.length >= 3) {
        const firstAls = alsList[state.alsIndices[0]!]!;
        const commonDigits = digitsOf(firstAls.digitMask & lastAls.digitMask);
        for (const z of commonDigits) {
          const lastRCC = state.rccDigits[state.rccDigits.length - 1]!;
          if (z === lastRCC) continue;
          const zBit = maskOf(z);
          const firstZCells = firstAls.cells.filter((c) => grid.candidatesOf(c) & zBit);
          const lastZCells = lastAls.cells.filter((c) => grid.candidatesOf(c) & zBit);
          if (firstZCells.length === 0 || lastZCells.length === 0) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
            const chainCells = new Set(state.alsIndices.flatMap((ai) => alsList[ai]!.cells));
            if (chainCells.has(c)) continue;
            const peers = new Set(PEERS_OF[c]!);
            if (firstZCells.every((fc) => peers.has(fc)) && lastZCells.every((lc) => peers.has(lc))) {
              elims.push({ cell: c, digit: z });
            }
          }

          if (elims.length > 0) {
            const chainAls = state.alsIndices.map((i) => alsList[i]!);
            const allCells = [...new Set(chainAls.flatMap((a) => a.cells))];
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...chainAls.flatMap((a) => a.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `ALS 链：${chainAls.length} 个 ALS 通过 RCC 连接，消去两端共有候选 ${z} 的公共可见格。`,
                en: `ALS Chain: ${chainAls.length} ALS linked by RCCs; eliminate shared candidate ${z} from cells seeing both endpoints.`,
              },
            };
          }
        }
      }

      if (state.alsIndices.length >= MAX_CHAIN) continue;

      for (let nextIdx = 0; nextIdx < alsList.length; nextIdx++) {
        if (state.alsIndices.includes(nextIdx)) continue;
        const nextAls = alsList[nextIdx]!;
        if (alsShareCells(lastAls, nextAls)) continue;

        const commonDigits = digitsOf(lastAls.digitMask & nextAls.digitMask);
        for (const rcc of commonDigits) {
          if (state.rccDigits.length > 0 && rcc === state.rccDigits[state.rccDigits.length - 1]!) continue;
          if (!isRCC(grid, lastAls, nextAls, rcc)) continue;

          stack.push({
            alsIndices: [...state.alsIndices, nextIdx],
            rccDigits: [...state.rccDigits, rcc],
          });
        }
      }
    }
  }
  return null;
}

function makeAlsStrategy(difficulty: number, strategyId: string): Strategy {
  return {
    id: strategyId,
    difficulty,
    name: { zh: 'ALS 链', en: 'ALS Chain' },
    tieBreak: ['house'],
    apply(grid: Grid): Step | null {
      const alsList = findAllALS(grid);
      return tryALSChain(grid, alsList, strategyId);
    },
  };
}

export const alsChain: Strategy = makeAlsStrategy(880, 'als-chain');