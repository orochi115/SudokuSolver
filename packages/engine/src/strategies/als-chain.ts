import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function findALS(grid: Grid, maxSize: number): ALS[] {
  const result: ALS[] = [];
  const seen = new Set<string>();
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const empty = house.filter((c) => grid.get(c) === 0);
    for (let size = 1; size <= Math.min(maxSize, empty.length - 1); size++) {
      for (const combo of combinations(empty, size)) {
        let mask = 0;
        for (const c of combo) mask |= grid.candidatesOf(c);
        if (popcount(mask) === size + 1) {
          const key = `${h}:${[...combo].sort((a, b) => a - b).join(',')}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ house: h, cells: combo, digits: digitsOf(mask), digitMask: mask });
          }
        }
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
      if (ac === bc) return false;
      if (!PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS链', en: 'ALS Chain' },
  difficulty: 880,
  tieBreak: ['chain-length', 'house'],

  apply(grid: Grid): Step | null {
    const alsList = findALS(grid, 4);
    if (alsList.length < 4) return null;

    for (let len = 4; len <= 6; len++) {
      const result = tryALSChain(grid, alsList, len, this.id);
      if (result) return result;
    }
    return null;
  },
};

function tryALSChain(grid: Grid, alsList: ALS[], maxLen: number, strategyId: string): Step | null {
  for (let i = 0; i < alsList.length; i++) {
    const chain: ALS[] = [alsList[i]!];
    const rccs: number[] = [];
    const used = new Set([i]);

    if (extendChain(grid, alsList, chain, rccs, used, maxLen, strategyId)) {
      const result = chainResult(grid, chain, rccs, strategyId);
      if (result) return result;
    }
  }
  return null;
}

function extendChain(
  grid: Grid, alsList: ALS[], chain: ALS[], rccs: number[],
  used: Set<number>, maxLen: number, _strategyId: string,
): boolean {
  if (chain.length >= maxLen) return chain.length >= 4;
  const last = chain[chain.length - 1]!;

  for (let i = 0; i < alsList.length; i++) {
    if (used.has(i)) continue;
    const next = alsList[i]!;
    if (next.cells.some((c) => chain.some((a) => a.cells.includes(c)))) continue;

    const common = digitsOf(last.digitMask & next.digitMask);
    for (const x of common) {
      if (!isRCC(grid, last, next, x)) continue;
      if (rccs.length > 0 && rccs[rccs.length - 1] === x) continue;

      chain.push(next);
      rccs.push(x);
      used.add(i);

      if (extendChain(grid, alsList, chain, rccs, used, maxLen, _strategyId)) return true;

      chain.pop();
      rccs.pop();
      used.delete(i);
    }
  }
  return chain.length >= 4;
}

function chainResult(grid: Grid, chain: ALS[], rccs: number[], strategyId: string): Step | null {
  const first = chain[0]!;
  const last = chain[chain.length - 1]!;
  const rccSet = new Set(rccs);

  const commonZ = digitsOf(first.digitMask & last.digitMask).filter((d) => !rccSet.has(d));
  for (const z of commonZ) {
    const zBit = maskOf(z);
    const firstZ = first.cells.filter((c) => grid.candidatesOf(c) & zBit);
    const lastZ = last.cells.filter((c) => grid.candidatesOf(c) & zBit);
    if (firstZ.length === 0 || lastZ.length === 0) continue;

    const allCells = chain.flatMap((a) => a.cells);
    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
      if (allCells.includes(c)) continue;
      const peers = new Set(PEERS_OF[c]!);
      if (firstZ.every((x) => peers.has(x)) && lastZ.every((x) => peers.has(x))) {
        elims.push({ cell: c, digit: z });
      }
    }

    if (elims.length > 0) {
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
          candidates: [
            ...allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `ALS链：${chain.length}个ALS通过RCC{${rccs.join(',')}}连接；消去能看到首尾ALS中所有${z}的格中的${z}。`,
          en: `ALS Chain: ${chain.length} ALS linked by RCCs {${rccs.join(',')}}; eliminate ${z} from cells seeing all ${z} in first and last ALS.`,
        },
      };
    }
  }
  return null;
}
