import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function sees(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function commonPeerCells(cells: number[]): number[] {
  if (cells.length === 0) return [];
  let result = new Set(PEERS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    result = new Set([...result].filter((c) => PEERS_OF[cells[i]!]!.includes(c)));
  }
  return [...result];
}

function findCommonALSs(grid: Grid, baseCells: number[]): number[][] {
  const commonPeers = commonPeerCells(baseCells);
  const alsCells: number[][] = [];

  for (let n = 1; n <= 3; n++) {
    const seen = new Set(baseCells);
    function* choose(arr: number[], k: number): Generator<number[]> {
      if (k === 0) { yield []; return; }
      if (arr.length < k) return;
      const [first, ...rest] = arr;
      for (const c of choose(rest, k - 1)) yield [first!, ...c];
      yield* choose(rest, k);
    }

    for (const combo of choose(commonPeers, n)) {
      if (combo.some((c) => seen.has(c))) continue;
      let unionMask = 0;
      for (const c of combo) unionMask |= grid.candidatesOf(c);
      const unionDigits = digitsOf(unionMask);
      if (unionDigits.length === n + 1) {
        alsCells.push(combo);
      }
    }
  }

  return alsCells;
}

function tryAPE(grid: Grid, baseSize: number): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) emptyCells.push(c);
  }

  function* combinations(arr: number[], k: number): Generator<number[]> {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    const [first, ...rest] = arr;
    for (const c of combinations(rest, k - 1)) yield [first!, ...c];
    yield* combinations(rest, k);
  }

  for (const base of combinations(emptyCells, baseSize)) {
    const baseCands = base.map((c) => grid.candidatesOf(c));
    const baseDigits = base.map((c) => digitsOf(c));

    const alsSets = findCommonALSs(grid, base);

    function* genCombos(
      idx: number,
      current: number[],
    ): Generator<number[]> {
      if (idx === base.length) {
        yield [...current];
        return;
      }
      for (const d of baseDigits[idx]!) {
        current.push(d);
        yield* genCombos(idx + 1, current);
        current.pop();
      }
    }

    const allowedCombos: number[][] = [];
    let totalCount = 0;

    for (const combo of genCombos(0, [])) {
      totalCount++;
      const aligned = base.some((a) => base.some((b) => a !== b && sees(a, b)));
      if (aligned && new Set(combo).size !== combo.length) continue;

      let kills = false;
      for (const als of alsSets) {
        const alsMask = als.reduce((m, c) => m | grid.candidatesOf(c), 0);
        const alsDigits = digitsOf(alsMask);
        const comboInAls = combo.filter((d) => alsDigits.includes(d));
        const distinctComboInAls = new Set(comboInAls).size;
        if (distinctComboInAls === alsDigits.length) {
          kills = true;
          break;
        }
      }

      if (!kills) allowedCombos.push(combo);
    }

    if (allowedCombos.length === 0 || allowedCombos.length === totalCount) continue;

    const eliminations: { cell: number; digit: number }[] = [];
    for (let i = 0; i < base.length; i++) {
      const cell = base[i]!;
      for (const d of baseDigits[i]!) {
        const neverAssigned = allowedCombos.every((c) => c[i] !== d);
        if (neverAssigned) eliminations.push({ cell, digit: d });
      }
    }

    if (eliminations.length === 0) continue;

    const strategyId = baseSize === 2 ? 'aligned-pair-exclusion' : 'aligned-triple-exclusion';
    const nameZh = baseSize === 2 ? '对齐数对排除' : '对齐三数排除';
    const nameEn = baseSize === 2 ? 'Aligned Pair Exclusion' : 'Aligned Triple Exclusion';

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...base, ...eliminations.map((e) => e.cell)],
        candidates: [
          ...base.flatMap((c) => baseDigits[base.indexOf(c)]!.map((d) => ({ cell: c, digit: d }))),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `${nameZh}：{${base.map((c) => cellLabel(c)).join(',')}} 枚举 ${totalCount} 种组合，{${eliminations.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}} 在允许组合中不出现。`,
        en: `${nameEn}: {${base.map((c) => cellLabel(c)).join(',')}} enumerates ${totalCount} combinations, {${eliminations.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}} never appear in allowed combos.`,
      },
    };
  }

  return null;
}

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryAPE(grid, 2);
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryAPE(grid, 3);
  },
};