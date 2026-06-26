import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function sees(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function commonPeers(cells: number[]): number[] {
  if (cells.length === 0) return [];
  let result = new Set(PEERS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    result = new Set([...result].filter((c) => PEERS_OF[cells[i]!]!.includes(c)));
  }
  return [...result];
}

function trySubsetExclusion(grid: Grid): Step | null {
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

  for (const base of combinations(emptyCells, 3)) {
    const baseCands = base.map((c) => digitsOf(grid.candidatesOf(c)));

    const peerCells = commonPeers(base);
    const witnesses: number[][] = [];

    for (let n = 1; n <= 3; n++) {
      for (const combo of combinations(peerCells, n)) {
        let unionMask = 0;
        for (const c of combo) unionMask |= grid.candidatesOf(c);
        const ud = digitsOf(unionMask);
        if (ud.length === n + 1 || (n === 1 && ud.length === 2)) {
          witnesses.push(combo);
        }
      }
    }

    function* genCombos(
      idx: number,
      current: number[],
    ): Generator<number[]> {
      if (idx === base.length) {
        yield [...current];
        return;
      }
      for (const d of baseCands[idx]!) {
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
      for (const wit of witnesses) {
        const witMask = wit.reduce((m, c) => m | grid.candidatesOf(c), 0);
        const witDigits = digitsOf(witMask);
        const comboInWit = combo.filter((d) => witDigits.includes(d));
        const distinctInWit = new Set(comboInWit).size;
        if (distinctInWit === witDigits.length) {
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
      for (const d of baseCands[i]!) {
        const neverAssigned = allowedCombos.every((c) => c[i] !== d);
        if (neverAssigned) eliminations.push({ cell, digit: d });
      }
    }

    if (eliminations.length === 0) continue;

    return {
      strategyId: 'subset-exclusion',
      placements: [],
      eliminations,
      highlights: {
        cells: [...base, ...eliminations.map((e) => e.cell)],
        candidates: [
          ...base.flatMap((c) => baseCands[base.indexOf(c)]!.map((d) => ({ cell: c, digit: d }))),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `子集排除：{${base.map((c) => cellLabel(c)).join(',')}} 枚举 ${totalCount} 种组合，{${eliminations.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}} 在允许组合中不出现。`,
        en: `Subset Exclusion: {${base.map((c) => cellLabel(c)).join(',')}} enumerates ${totalCount} combos, {${eliminations.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}} not in any allowed combo.`,
      },
    };
  }

  return null;
}

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return trySubsetExclusion(grid);
  },
};