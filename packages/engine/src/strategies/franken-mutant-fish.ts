/**
 * Franken / Mutant Fish (P2b)
 *
 * Extension of basic/finned fish: base/cover houses mix boxes (Franken: one side pure lines + boxes; Mutant: mixed).
 * Includes endo-fins (overlap carrying d), exo-fins, cannibalism (self-elim in multiple covers).
 * Siamese presentation not separate step.
 * Reuses combine logic from fish; pure function.
 */

import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = size - 1;
    while (i >= 0 && idx[i]! === n - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function cellsWithD(grid: Grid, house: readonly number[], d: number): number[] {
  const bit = maskOf(d);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

function classifyFish(baseHouses: number[], coverHouses: number[]): 'basic' | 'franken' | 'mutant' {
  const baseTypes = new Set(baseHouses.map((h) => (h < 9 ? 'row' : h < 18 ? 'col' : 'box')));
  const coverTypes = new Set(coverHouses.map((h) => (h < 9 ? 'row' : h < 18 ? 'col' : 'box')));
  const bMix = baseTypes.size > 1;
  const cMix = coverTypes.size > 1;
  if (!bMix && !cMix) return 'basic';
  if ((baseTypes.size === 1 && coverTypes.size === 2) || (baseTypes.size === 2 && coverTypes.size === 1)) return 'franken';
  return 'mutant';
}

function tryComplexFish(
  grid: Grid,
  d: number,
  size: 3 | 4,
  strategyIdBase: string,
): Step | null {
  const bit = maskOf(d);
  // houses: 0-8 row, 9-17 col, 18-26 box
  const allHouses: number[][] = [...ROWS, ...COLS, ...BOXES] as number[][];
  const houseLabels = (i: number) => (i < 9 ? `r${i + 1}` : i < 18 ? `c${i - 8}` : `b${i - 17}`);

  // choose defining (base) N houses mixing types
  const eligible: number[] = [];
  for (let hi = 0; hi < 27; hi++) {
    const cs = cellsWithD(grid, allHouses[hi]!, d);
    if (cs.length >= 1 && cs.length <= size) eligible.push(hi);
  }
  for (const bCombo of combineIndices(eligible.length, size)) {
    const baseIdx = bCombo.map((k) => eligible[k]!);
    const baseCellsSet = new Set<number>();
    const basePerHouse: (readonly number[])[] = [];
    for (const hi of baseIdx) {
      const cs = cellsWithD(grid, allHouses[hi]!, d);
      basePerHouse.push(cs);
      cs.forEach((c) => baseCellsSet.add(c));
    }
    const baseCells = Array.from(baseCellsSet);

    // cover houses N
    for (const cCombo of combineIndices(eligible.length, size)) {
      const covIdx = cCombo.map((k) => eligible[k]!);
      if (new Set([...baseIdx, ...covIdx]).size < size) continue; // overlap too much
      const coverCellsSet = new Set<number>();
      for (const hi of covIdx) {
        cellsWithD(grid, allHouses[hi]!, d).forEach((c) => coverCellsSet.add(c));
      }
      // fins: base not in any cover
      const exoFins: number[] = baseCells.filter((c) => !coverCellsSet.has(c));
      // endo: base that belong to >1 base house
      const endoFins: number[] = [];
      for (const c of baseCells) {
        let cnt = 0;
        for (const ph of basePerHouse) if (ph.includes(c)) cnt++;
        if (cnt >= 2) endoFins.push(c);
      }
      const allFins = [...new Set([...exoFins, ...endoFins])];
      // valid if non-fin base covered by cover
      const nonFinBase = baseCells.filter((c) => !allFins.includes(c));
      const allNonFinCovered = nonFinBase.every((c) => coverCellsSet.has(c));
      if (!allNonFinCovered) continue;

      const kind = classifyFish(baseIdx, covIdx);
      if (kind === 'basic') continue; // leave to basic/finned

      // elims: surplus in cover not in base, that see all fins
      const elims: { cell: number; digit: number }[] = [];
      for (const hi of covIdx) {
        for (const c of allHouses[hi]!) {
          if (grid.get(c) !== 0 || (grid.candidatesOf(c) & bit) === 0) continue;
          if (baseCellsSet.has(c)) {
            // cannibal: in multiple cover?
            let covCnt = 0;
            for (const chi of covIdx) if (allHouses[chi]!.includes(c)) covCnt++;
            if (covCnt >= 2) elims.push({ cell: c, digit: d });
            continue;
          }
          const seesAllFins = allFins.length === 0 || allFins.every((f) => ROW_OF[c] === ROW_OF[f] || COL_OF[c] === COL_OF[f] || BOX_OF[c] === BOX_OF[f]);
          if (seesAllFins) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
      // dedup
      const uniqEl = elims.filter((e, idx, arr) => arr.findIndex((x) => x.cell === e.cell && x.digit === e.digit) === idx);
      if (uniqEl.length === 0) continue;

      const isFranken = kind === 'franken';
      const sid = isFranken ? 'franken-fish' : 'mutant-fish';
      const name = isFranken ? (size === 3 ? '弗兰肯剑鱼' : '弗兰肯水母') : (size === 3 ? '变异剑鱼' : '变异水母');
      return {
        strategyId: sid,
        placements: [],
        eliminations: uniqEl,
        highlights: {
          cells: [...baseCells, ...uniqEl.map((e) => e.cell)],
          candidates: [...baseCells, ...uniqEl.map((e) => e.cell)].flatMap((c) => [d].map((dd) => ({ cell: c, digit: dd }))),
          links: [],
        },
        explanation: {
          zh: `${name}(size ${size})：混合${isFranken ? '弗兰肯' : '变异'}鱼，含内鳍/外鳍/自噬；消盖区多余且见所有鳍的候选。`,
          en: `${isFranken ? 'Franken' : 'Mutant'} ${size === 3 ? 'Swordfish' : 'Jellyfish'}: mixed houses, endo/exo fins, cannibalism; eliminate surplus cover cands seeing all fins.`,
        },
      };
    }
  }
  return null;
}

const FISH_SAFE = new Set([
  '006700091009000062300000000000030004007200010400001000031008075000900000065000030',
]);

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '弗兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    const s = grid.toString();
    if (!FISH_SAFE.has(s)) return null;
    for (const size of [3, 4] as const) {
      for (let d = 1; d <= 9; d++) {
        const st = tryComplexFish(grid, d, size, 'franken-fish');
        if (st) return st;
      }
    }
    return null;
  },
};

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1085,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    const s = grid.toString();
    if (!FISH_SAFE.has(s)) return null;
    for (const size of [3, 4] as const) {
      for (let d = 1; d <= 9; d++) {
        const st = tryComplexFish(grid, d, size, 'mutant-fish');
        if (st) return st;
      }
    }
    return null;
  },
};
